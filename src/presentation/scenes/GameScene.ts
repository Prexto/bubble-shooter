import Phaser from 'phaser';
import { ACTIVE_GAME_COLORS, BubbleColor } from '../../core/domain/models/BubbleColor';
import { Bubble } from '../../core/domain/models/Bubble';
import { HexGrid } from '../../core/domain/models/HexGrid';
import { HexMath, HexMetrics } from '../../core/domain/algorithms/HexMath';
import { ThreatManager } from '../../core/domain/rules/ThreatManager';
import { SnapBubbleUseCase } from '../../core/usecases/SnapBubbleUseCase';
import { ProcessGridMatchesUseCase } from '../../core/usecases/ProcessGridMatchesUseCase';
import { AimGuide } from '../ui/AimGuide';
import { CannonView } from '../ui/CannonView';
import { ParticleFactory } from '../effects/ParticleFactory';
import { FloatingTextPool } from '../effects/FloatingTextPool';
import { ScreenJuice } from '../effects/ScreenJuice';
import { HapticsAdapter } from '../../infrastructure/haptics/HapticsAdapter';
import { AuthRepository } from '../../infrastructure/auth/AuthRepository';
import { GAME_MODES, GameModeConfig, GameModeType } from '../../core/domain/models/GameMode';
import { MultiplierBucketsView } from '../ui/MultiplierBucketsView';
import { PauseModal } from '../ui/PauseModal';

export class GameScene extends Phaser.Scene {
  // Mode & Config
  public modeType: GameModeType = GameModeType.CLASSIC_ARCADE;
  private modeConfig!: GameModeConfig;

  // Domain State
  private grid!: HexGrid;
  private threatManager!: ThreatManager;
  private metrics!: HexMetrics;

  // Visual Entities
  private bubbleSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private fallingBubblesGroup!: Phaser.Physics.Arcade.Group;
  private aimGuide!: AimGuide;
  private cannon!: CannonView;
  private multiplierBuckets!: MultiplierBucketsView;
  private pauseModal!: PauseModal;

  // Active Projectile
  private activeProjectile: Phaser.Types.Physics.Arcade.ImageWithDynamicBody | null = null;
  private activeProjectileColor: BubbleColor | null = null;
  private projectileTrail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  // Colors & Queue
  private currentBubbleColor!: BubbleColor;
  private nextBubbleColor!: BubbleColor;

  // Gameplay State
  private isProcessingShot = false;
  private isAiming = false;
  private isPaused = false;
  private score = 0;
  private highScore = 0;
  private highestMultiplierAchieved = 1;

  // Mode Specific Trackers
  private timeRemaining = 60;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private shotsRemaining = 15;

  // HUD Elements
  private scoreText!: Phaser.GameObjects.Text;
  private modeSpecialText!: Phaser.GameObjects.Text;
  private deathLineSprite!: Phaser.GameObjects.Image;
  private ceilingGlow!: Phaser.GameObjects.Graphics;

  // Layout Constants
  private readonly CEILING_Y = 70;
  private readonly PLAY_WIDTH = 480;
  private readonly CANNON_Y = 735;

  constructor() {
    super({ key: 'GameScene' });
  }

  public init(data?: { mode?: GameModeType }): void {
    this.modeType = data?.mode ?? GameModeType.CLASSIC_ARCADE;
    this.modeConfig = GAME_MODES[this.modeType];
    this.isPaused = false;
    this.isProcessingShot = false;
    this.score = 0;
    this.highestMultiplierAchieved = 1;
    this.timeRemaining = this.modeConfig.timeLimitSec ?? 60;
    this.shotsRemaining = this.modeConfig.maxShots ?? 15;
  }

  public create(): void {
    // 1. Initialize Domain Entities & Metrics
    this.grid = new HexGrid({ evenCols: 8, oddCols: 7, maxRows: 13, deathLineRow: 11 });
    this.threatManager = new ThreatManager({ maxMisses: this.modeConfig.maxMissesBeforeDescent ?? 5 });
    this.metrics = HexMath.calculateMetrics(this.PLAY_WIDTH, 8, this.CEILING_Y + 28);

    // 2. Setup Physics World Bounds
    this.physics.world.setBounds(0, this.CEILING_Y, this.PLAY_WIDTH, 854 - this.CEILING_Y);
    this.physics.world.checkCollision.down = false; // Allow falling bubbles to exit bottom

    // 3. Falling Bubbles Physics Group (for Peggle gravity drops)
    this.fallingBubblesGroup = this.physics.add.group({
      bounceX: 0.7,
      bounceY: 0.6,
      collideWorldBounds: true,
    });
    this.physics.add.collider(this.fallingBubblesGroup, this.fallingBubblesGroup);

    // 4. Create Multiplier Buckets with Mode-Specific Configuration
    this.multiplierBuckets = new MultiplierBucketsView(
      this,
      (event) => {
        if (event.bucket.multiplier > this.highestMultiplierAchieved) {
          this.highestMultiplierAchieved = event.bucket.multiplier;
        }
        this.addScore(event.scoreAwarded);
      },
      this.modeConfig.buckets
    );
    this.multiplierBuckets.registerFallingOverlap(this.fallingBubblesGroup, (event) => {
      if (event.bucket.multiplier > this.highestMultiplierAchieved) {
        this.highestMultiplierAchieved = event.bucket.multiplier;
      }
      this.addScore(event.scoreAwarded);
    });

    // 5. Create Background, Walls & Header HUD
    this.createEnvironment();

    // 6. Create Aim Guide & Cannon
    this.aimGuide = new AimGuide(this);
    this.cannon = new CannonView(this, this.PLAY_WIDTH / 2, this.CANNON_Y);

    // 7. Queue Initial Colors
    this.currentBubbleColor = this.getRandomActiveColor();
    this.nextBubbleColor = this.getRandomActiveColor();
    this.cannon.setActiveColor(this.currentBubbleColor);
    this.cannon.setNextColor(this.nextBubbleColor);

    // 8. Populate Initial Grid
    this.generateInitialGrid(5);

    // 9. Register Touch / Pointer Input Listeners
    this.setupInputHandlers();

    // 10. Pause Modal
    this.pauseModal = new PauseModal(this, {
      onResume: () => {
        this.isPaused = false;
        this.physics.resume();
      },
      onRestart: () => {
        this.scene.restart({ mode: this.modeType });
      },
      onQuit: () => {
        this.scene.start('HomeScene');
      },
    });

    // 11. Mode Specific Timers
    if (this.modeType === GameModeType.TIME_ATTACK) {
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        repeat: 60,
        callback: () => {
          if (this.isPaused) return;
          this.timeRemaining -= 1;
          if (this.modeSpecialText) {
            this.modeSpecialText.setText(`${this.timeRemaining}s`);
          }
          if (this.timeRemaining <= 0) {
            this.handleGameOver();
          }
        },
      });
    }
  }

  private createEnvironment(): void {
    const user = AuthRepository.getCurrentUser();
    if (user) {
      if (this.modeType === GameModeType.CLASSIC_ARCADE) this.highScore = user.stats.classicHighScore;
      else if (this.modeType === GameModeType.TIME_ATTACK) this.highScore = user.stats.timeAttackHighScore;
      else if (this.modeType === GameModeType.PEGGLE_FEVER) this.highScore = user.stats.peggleFeverHighScore;
    }

    // Ceiling Warning Glow
    this.ceilingGlow = this.add.graphics();
    this.ceilingGlow.setDepth(29);

    // Top HUD Bar Background
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a0c0f, 0.96);
    headerBg.fillRect(0, 0, this.PLAY_WIDTH, this.CEILING_Y);
    headerBg.lineStyle(2, 0x1f242d, 1);
    headerBg.lineBetween(0, this.CEILING_Y, this.PLAY_WIDTH, this.CEILING_Y);
    headerBg.setDepth(30);

    // Current Score Section (Left)
    this.add.text(18, 14, 'SCORE', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#00F0FF',
    }).setDepth(31);

    this.scoreText = this.add.text(18, 28, '000000', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setDepth(31);

    // Center Display (Time, Shots or Best)
    if (this.modeType === GameModeType.TIME_ATTACK) {
      this.add.text(this.PLAY_WIDTH / 2, 14, 'TIME', {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#FFE600',
      }).setOrigin(0.5, 0).setDepth(31);

      this.modeSpecialText = this.add.text(this.PLAY_WIDTH / 2, 28, `${this.timeRemaining}s`, {
        fontFamily: 'Space Grotesk, Outfit, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#FFE600',
      }).setOrigin(0.5, 0).setDepth(31);
    } else if (this.modeType === GameModeType.PEGGLE_FEVER) {
      this.add.text(this.PLAY_WIDTH / 2, 14, 'SHOTS', {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#B026FF',
      }).setOrigin(0.5, 0).setDepth(31);

      this.modeSpecialText = this.add.text(this.PLAY_WIDTH / 2, 28, `${this.shotsRemaining}`, {
        fontFamily: 'Space Grotesk, Outfit, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#B026FF',
      }).setOrigin(0.5, 0).setDepth(31);
    } else {
      this.add.text(this.PLAY_WIDTH / 2, 14, 'BEST RECORD', {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#FFE600',
      }).setOrigin(0.5, 0).setDepth(31);

      this.add.text(this.PLAY_WIDTH / 2, 28, this.highScore.toString().padStart(6, '0'), {
        fontFamily: 'Space Grotesk, Outfit, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setOrigin(0.5, 0).setDepth(31);
    }

    // Top-Right Pause Button (⏸)
    const pauseBtn = this.add.container(this.PLAY_WIDTH - 28, 35);
    const pauseBg = this.add.graphics();
    pauseBg.fillStyle(0x1a212d, 1);
    pauseBg.fillRoundedRect(-18, -18, 36, 36, 8);
    pauseBg.lineStyle(1.5, 0x2d3748, 1);
    pauseBg.strokeRoundedRect(-18, -18, 36, 36, 8);

    const pauseIcon = this.add.text(0, 0, '❚❚', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    pauseBtn.add([pauseBg, pauseIcon]);
    pauseBtn.setSize(36, 36);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.setDepth(35);

    pauseBtn.on('pointerdown', () => {
      HapticsAdapter.impactLight();
      this.isPaused = true;
      this.physics.pause();
      this.pauseModal.show();
    });

    // Death Line Indicator
    const deathY = this.metrics.startY + this.grid.config.deathLineRow * this.metrics.rowHeight;
    this.deathLineSprite = this.add.image(this.PLAY_WIDTH / 2, deathY, 'death_line');
    this.deathLineSprite.setDepth(10);
    this.deathLineSprite.setAlpha(0.6);

    this.tweens.add({
      targets: this.deathLineSprite,
      alpha: 0.9,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private setupInputHandlers(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused || this.isProcessingShot || pointer.y < this.CEILING_Y) return;
      this.isAiming = true;
      this.handleAim(pointer);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming || this.isProcessingShot || this.isPaused) return;
      this.handleAim(pointer);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming || this.isProcessingShot || this.isPaused) {
        this.isAiming = false;
        this.aimGuide.hide();
        return;
      }
      this.isAiming = false;
      this.aimGuide.hide();
      this.fireBubble(pointer);
    });
  }

  private handleAim(pointer: Phaser.Input.Pointer): void {
    const angle = Phaser.Math.Angle.Between(this.cannon.x, this.cannon.y, pointer.x, pointer.y);
    const normalizedAngle = Phaser.Math.Angle.Normalize(angle);
    const deg = Phaser.Math.RadToDeg(normalizedAngle);

    if (deg < 190 || deg > 350) {
      this.aimGuide.hide();
      return;
    }

    this.cannon.setRotation(angle);

    const obstacles = Array.from(this.bubbleSprites.entries()).map(([key, _sprite]) => {
      const [r, c] = key.split(',').map(Number);
      const cellPos = HexMath.hexToPixel({ row: r ?? 0, col: c ?? 0 }, this.metrics, this.grid.topParity);
      return {
        x: cellPos.x,
        y: cellPos.y,
        radius: this.metrics.bubbleRadius,
      };
    });

    const muzzle = this.cannon.getMuzzlePosition();
    this.aimGuide.updateTrajectory(
      muzzle.x,
      muzzle.y,
      angle,
      0,
      this.PLAY_WIDTH,
      this.CEILING_Y,
      this.metrics.bubbleRadius,
      obstacles
    );
  }

  private fireBubble(pointer: Phaser.Input.Pointer): void {
    const angle = Phaser.Math.Angle.Between(this.cannon.x, this.cannon.y, pointer.x, pointer.y);
    const normalizedAngle = Phaser.Math.Angle.Normalize(angle);
    const deg = Phaser.Math.RadToDeg(normalizedAngle);

    if (deg < 190 || deg > 350) return;

    if (this.modeType === GameModeType.PEGGLE_FEVER) {
      this.shotsRemaining -= 1;
      if (this.modeSpecialText) {
        this.modeSpecialText.setText(`${this.shotsRemaining}`);
      }
    }

    this.isProcessingShot = true;
    this.cannon.fireRecoil();

    const muzzle = this.cannon.getMuzzlePosition();
    this.activeProjectileColor = this.currentBubbleColor;

    this.activeProjectile = this.physics.add.image(
      muzzle.x,
      muzzle.y,
      `bubble_${this.activeProjectileColor}`
    );
    this.activeProjectile.setCircle(this.metrics.bubbleRadius);
    this.activeProjectile.setBounce(1, 1);
    this.activeProjectile.setCollideWorldBounds(true);
    this.activeProjectile.setDepth(24);

    this.activeProjectile.body.onWorldBounds = true;
    this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
      if (body.gameObject === this.activeProjectile) {
        HapticsAdapter.impactLight();
      }
    });

    const speed = 1300;
    this.activeProjectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    this.projectileTrail = ParticleFactory.createProjectileTrail(this, this.activeProjectileColor);
    this.projectileTrail.startFollow(this.activeProjectile);

    const oldNext = this.nextBubbleColor;
    this.currentBubbleColor = oldNext;
    this.nextBubbleColor = this.getRandomActiveColor();
    this.cannon.animateReload(this.currentBubbleColor, this.nextBubbleColor);
  }

  public update(): void {
    if (this.isPaused || !this.activeProjectile || !this.activeProjectileColor) return;

    const proj = this.activeProjectile;
    const projX = proj.x;
    const projY = proj.y;

    if (projY <= this.CEILING_Y + this.metrics.bubbleRadius + 2) {
      this.snapAndResolveProjectile(null);
      return;
    }

    for (const [key, sprite] of this.bubbleSprites.entries()) {
      const dx = projX - sprite.x;
      const dy = projY - sprite.y;
      const distSq = dx * dx + dy * dy;
      const minDist = this.metrics.bubbleRadius * 2 - 4;

      if (distSq <= minDist * minDist) {
        const [r, c] = key.split(',').map(Number);
        this.snapAndResolveProjectile({ row: r ?? 0, col: c ?? 0 });
        return;
      }
    }
  }

  private snapAndResolveProjectile(hitCoord: { row: number; col: number } | null): void {
    if (!this.activeProjectile || !this.activeProjectileColor) return;

    const impactPoint = { x: this.activeProjectile.x, y: this.activeProjectile.y };
    const bubbleColor = this.activeProjectileColor;

    this.projectileTrail?.stop();
    this.projectileTrail?.destroy();
    this.projectileTrail = null;
    this.activeProjectile.destroy();
    this.activeProjectile = null;
    this.activeProjectileColor = null;

    const snapCoord = SnapBubbleUseCase.execute(
      impactPoint,
      hitCoord,
      this.metrics,
      this.grid
    );

    if (!snapCoord) {
      this.isProcessingShot = false;
      return;
    }

    const newBubble = new Bubble({
      id: `b_${Date.now()}_${Math.random()}`,
      row: snapCoord.row,
      col: snapCoord.col,
      color: bubbleColor,
    });

    const targetPos = HexMath.hexToPixel(snapCoord, this.metrics, this.grid.topParity);
    const sprite = this.add.image(targetPos.x, targetPos.y, `bubble_${bubbleColor}`);
    sprite.setDepth(10);
    sprite.setScale(0.2);

    this.tweens.add({
      targets: sprite,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: 'Back.easeOut',
    });

    const key = HexGrid.getCoordKey(snapCoord.row, snapCoord.col);
    this.bubbleSprites.set(key, sprite);

    const result = ProcessGridMatchesUseCase.execute(
      newBubble,
      this.grid,
      this.threatManager,
      (cols) => this.generateRandomRow(cols)
    );

    this.handleMatchResolution(result);
  }

  private handleMatchResolution(result: ReturnType<typeof ProcessGridMatchesUseCase.execute>): void {
    if (result.wasMatch) {
      if (result.matchedBubbles.length >= 5 || result.orphanBubbles.length >= 3) {
        HapticsAdapter.impactHeavy();
        ScreenJuice.shake(this, 0.012, 120);
      } else {
        HapticsAdapter.impactMedium();
        ScreenJuice.shake(this, 0.006, 80);
      }

      for (const matched of result.matchedBubbles) {
        const key = HexGrid.getCoordKey(matched.row, matched.col);
        const sp = this.bubbleSprites.get(key);
        if (sp) {
          ParticleFactory.emitBubblePop(this, sp.x, sp.y, matched.color, 1.2);
          sp.destroy();
          this.bubbleSprites.delete(key);
        }
      }

      const matchScore = result.matchedBubbles.length * 100;
      this.addScore(matchScore);
      const centerMatched = result.matchedBubbles[0];
      if (centerMatched) {
        const pos = HexMath.hexToPixel(centerMatched, this.metrics, this.grid.topParity);
        FloatingTextPool.show(this, pos.x, pos.y, `+${matchScore}`, '#00F0FF', 22);
      }

      for (const orphan of result.orphanBubbles) {
        const key = HexGrid.getCoordKey(orphan.row, orphan.col);
        const sp = this.bubbleSprites.get(key);
        if (sp) {
          this.bubbleSprites.delete(key);
          this.triggerPeggleFall(sp, orphan.color);
        }
      }
    } else {
      HapticsAdapter.impactLight();
    }

    // Silent descent trigger on misses in Classic mode
    if (this.modeType === GameModeType.CLASSIC_ARCADE && result.threatStatus.shouldShiftDown && result.shiftData) {
      this.animateGridShiftDown(result.shiftData);
    } else {
      this.isProcessingShot = false;
    }

    // Check End Game conditions
    if (result.dangerStatus.isGameOver) {
      this.handleGameOver();
    } else if (this.modeType === GameModeType.PEGGLE_FEVER && this.shotsRemaining <= 0) {
      this.time.delayedCall(1200, () => {
        this.handleGameOver();
      });
    }
  }

  private animateGridShiftDown(shiftData: { shifted: Bubble[]; newRow: Bubble[] }): void {
    ScreenJuice.shake(this, 0.012, 160);
    HapticsAdapter.impactHeavy();

    // Ceiling Warning Strobe Effect
    this.ceilingGlow.clear();
    this.ceilingGlow.fillStyle(0xff0055, 0.35);
    this.ceilingGlow.fillRect(0, this.CEILING_Y - 4, this.PLAY_WIDTH, 12);

    this.tweens.add({
      targets: this.ceilingGlow,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => {
        this.ceilingGlow.clear();
        this.ceilingGlow.setAlpha(1);
      },
    });

    const newSpriteMap = new Map<string, Phaser.GameObjects.Image>();

    // 1. Shift existing sprites down by rowHeight smoothly
    for (const b of shiftData.shifted) {
      const prevKey = HexGrid.getCoordKey(b.row - 1, b.col);
      const sp = this.bubbleSprites.get(prevKey);
      const newKey = HexGrid.getCoordKey(b.row, b.col);
      const targetPos = HexMath.hexToPixel({ row: b.row, col: b.col }, this.metrics, this.grid.topParity);

      if (sp) {
        this.tweens.add({
          targets: sp,
          x: targetPos.x,
          y: targetPos.y,
          duration: 260,
          ease: 'Cubic.easeOut',
        });
        newSpriteMap.set(newKey, sp);
      } else {
        const newSp = this.add.image(targetPos.x, targetPos.y - this.metrics.rowHeight, `bubble_${b.color}`);
        newSp.setDepth(10);
        this.tweens.add({
          targets: newSp,
          y: targetPos.y,
          duration: 260,
          ease: 'Cubic.easeOut',
        });
        newSpriteMap.set(newKey, newSp);
      }
    }

    // 2. Animate new top row sliding down from behind the header banner
    for (const b of shiftData.newRow) {
      const newKey = HexGrid.getCoordKey(b.row, b.col);
      const targetPos = HexMath.hexToPixel({ row: b.row, col: b.col }, this.metrics, this.grid.topParity);

      const sp = this.add.image(targetPos.x, targetPos.y - this.metrics.rowHeight, `bubble_${b.color}`);
      sp.setDepth(10);
      sp.setAlpha(0);
      sp.setScale(0.7);

      this.tweens.add({
        targets: sp,
        y: targetPos.y,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 280,
        ease: 'Back.easeOut',
      });

      newSpriteMap.set(newKey, sp);
    }

    this.bubbleSprites = newSpriteMap;

    this.time.delayedCall(300, () => {
      this.isProcessingShot = false;
    });
  }

  private triggerPeggleFall(sprite: Phaser.GameObjects.Image, color: BubbleColor): void {
    const x = sprite.x;
    const y = sprite.y;
    sprite.destroy();

    const falling = this.fallingBubblesGroup.create(x, y, `bubble_${color}`) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    falling.setCircle(this.metrics.bubbleRadius);
    falling.setDepth(18);
    falling.setGravityY(1100);
    falling.setVelocity(
      Phaser.Math.Between(-140, 140),
      Phaser.Math.Between(-180, -60)
    );
    falling.setAngularVelocity(Phaser.Math.Between(-300, 300));
    falling.setBounce(0.6, 0.5);

    this.time.addEvent({
      delay: 100,
      repeat: 40,
      callback: () => {
        if (falling.active && falling.y > 880) {
          falling.destroy();
        }
      },
    });
  }

  private addScore(amount: number): void {
    this.score += amount;
    this.scoreText.setText(this.score.toString().padStart(6, '0'));
  }

  private generateInitialGrid(rows: number): void {
    for (let r = 0; r < rows; r++) {
      const cols = this.grid.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        const color = this.getRandomActiveColor();
        const bubble = new Bubble({
          id: `init_${r}_${c}`,
          row: r,
          col: c,
          color,
        });

        this.grid.setBubble(bubble);
        const pos = HexMath.hexToPixel({ row: r, col: c }, this.metrics, this.grid.topParity);
        const sp = this.add.image(pos.x, pos.y, `bubble_${color}`);
        sp.setDepth(10);
        this.bubbleSprites.set(HexGrid.getCoordKey(r, c), sp);
      }
    }
  }

  private generateRandomRow(cols: number): Bubble[] {
    const row: Bubble[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(
        new Bubble({
          id: `row_${Date.now()}_${c}`,
          row: 0,
          col: c,
          color: this.getRandomActiveColor(),
        })
      );
    }
    return row;
  }

  private getRandomActiveColor(): BubbleColor {
    const idx = Phaser.Math.Between(0, ACTIVE_GAME_COLORS.length - 1);
    return ACTIVE_GAME_COLORS[idx] ?? BubbleColor.CYAN;
  }

  private handleGameOver(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = null;
    }

    ScreenJuice.shake(this, 0.02, 300);
    HapticsAdapter.notificationWarning();
    this.isProcessingShot = true;

    // Save Game Result to User Profile
    const user = AuthRepository.getCurrentUser();
    let isNewRecord = false;
    let modeHighScore = this.score;

    if (user) {
      isNewRecord = user.recordGameResult(this.modeType, this.score, this.highestMultiplierAchieved);
      AuthRepository.saveUser(user);
      if (this.modeType === GameModeType.CLASSIC_ARCADE) modeHighScore = user.stats.classicHighScore;
      else if (this.modeType === GameModeType.TIME_ATTACK) modeHighScore = user.stats.timeAttackHighScore;
      else if (this.modeType === GameModeType.PEGGLE_FEVER) modeHighScore = user.stats.peggleFeverHighScore;
    }

    this.time.delayedCall(500, () => {
      this.scene.launch('GameOverScene', {
        score: this.score,
        highScore: modeHighScore,
        isNewRecord,
        mode: this.modeType,
      });
    });
  }
}
