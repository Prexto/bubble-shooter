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

export class GameScene extends Phaser.Scene {
  // Domain State
  private grid!: HexGrid;
  private threatManager!: ThreatManager;
  private metrics!: HexMetrics;

  // Visual Entities
  private bubbleSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private fallingBubblesGroup!: Phaser.Physics.Arcade.Group;
  private aimGuide!: AimGuide;
  private cannon!: CannonView;

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
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private threatDots: Phaser.GameObjects.Image[] = [];
  private deathLineSprite!: Phaser.GameObjects.Image;

  // Layout Constants
  private readonly CEILING_Y = 70;
  private readonly PLAY_WIDTH = 480;
  private readonly CANNON_Y = 735;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create(): void {
    // 1. Initialize Domain Entities & Metrics
    this.grid = new HexGrid({ evenCols: 8, oddCols: 7, maxRows: 13, deathLineRow: 11 });
    this.threatManager = new ThreatManager({ maxMisses: 5 });
    this.metrics = HexMath.calculateMetrics(this.PLAY_WIDTH, 8, this.CEILING_Y + 28);

    // 2. Setup Physics World Bounds
    this.physics.world.setBounds(0, this.CEILING_Y, this.PLAY_WIDTH, 854 - this.CEILING_Y);
    this.physics.world.checkCollision.down = false; // Allow falling bubbles to exit through bottom

    // 3. Falling Bubbles Physics Group (for Peggle gravity drops)
    this.fallingBubblesGroup = this.physics.add.group({
      bounceX: 0.6,
      bounceY: 0.5,
      collideWorldBounds: true,
    });

    // 4. Create Background, Walls & Header HUD
    this.createEnvironment();

    // 5. Create Aim Guide & Cannon
    this.aimGuide = new AimGuide(this);
    this.cannon = new CannonView(this, this.PLAY_WIDTH / 2, this.CANNON_Y);

    // 6. Queue Initial Colors
    this.currentBubbleColor = this.getRandomActiveColor();
    this.nextBubbleColor = this.getRandomActiveColor();
    this.cannon.setActiveColor(this.currentBubbleColor);
    this.cannon.setNextColor(this.nextBubbleColor);

    // 7. Populate Initial Grid (First 5 Rows)
    this.generateInitialGrid(5);

    // 8. Register Touch / Pointer Input Listeners
    this.setupInputHandlers();
  }

  private createEnvironment(): void {
    // Top HUD Bar Background
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a0c0f, 0.95);
    headerBg.fillRect(0, 0, this.PLAY_WIDTH, this.CEILING_Y);
    headerBg.lineStyle(2, 0x1f242d, 1);
    headerBg.lineBetween(0, this.CEILING_Y, this.PLAY_WIDTH, this.CEILING_Y);
    headerBg.setDepth(30);

    // Score Label & Value
    this.add.text(24, 16, 'SCORE', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#00F0FF',
    }).setDepth(31);

    this.scoreText = this.add.text(24, 32, '000000', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setDepth(31);

    // Threat / Miss Indicator (Right Header)
    this.add.text(this.PLAY_WIDTH - 24, 16, 'THREAT', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FF0055',
    }).setOrigin(1, 0).setDepth(31);

    this.threatDots = [];
    const maxMisses = this.threatManager.getMaxMisses();
    for (let i = 0; i < maxMisses; i++) {
      const dot = this.add.image(this.PLAY_WIDTH - 24 - (maxMisses - 1 - i) * 16, 42, 'aim_dot');
      dot.setScale(0.7);
      dot.setDepth(31);
      this.threatDots.push(dot);
    }
    this.updateThreatUI();

    // Death Line Indicator
    const deathY = this.metrics.startY + this.grid.config.deathLineRow * this.metrics.rowHeight;
    this.deathLineSprite = this.add.image(this.PLAY_WIDTH / 2, deathY, 'death_line');
    this.deathLineSprite.setDepth(10);
    this.deathLineSprite.setAlpha(0.6);

    // Pulse animation on death line
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
      if (this.isProcessingShot || pointer.y < this.CEILING_Y) return;
      this.isAiming = true;
      this.handleAim(pointer);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming || this.isProcessingShot) return;
      this.handleAim(pointer);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming || this.isProcessingShot) {
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

    // Restrict shooting to upwards cone (-170 deg to -10 deg)
    const normalizedAngle = Phaser.Math.Angle.Normalize(angle);
    const deg = Phaser.Math.RadToDeg(normalizedAngle);

    if (deg < 190 || deg > 350) {
      this.aimGuide.hide();
      return;
    }

    this.cannon.setRotation(angle);

    // Build obstacle list for raycast aim collision
    const obstacles = Array.from(this.bubbleSprites.entries()).map(([key, _sprite]) => {
      const [r, c] = key.split(',').map(Number);
      const cellPos = HexMath.hexToPixel({ row: r ?? 0, col: c ?? 0 }, this.metrics);
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

    this.isProcessingShot = true;
    this.cannon.fireRecoil();

    const muzzle = this.cannon.getMuzzlePosition();
    this.activeProjectileColor = this.currentBubbleColor;

    // Create projectile physics sprite
    this.activeProjectile = this.physics.add.image(
      muzzle.x,
      muzzle.y,
      `bubble_${this.activeProjectileColor}`
    );
    this.activeProjectile.setCircle(this.metrics.bubbleRadius);
    this.activeProjectile.setBounce(1, 1);
    this.activeProjectile.setCollideWorldBounds(true);
    this.activeProjectile.setDepth(24);

    // Check wall bounce for haptic feedback
    this.activeProjectile.body.onWorldBounds = true;
    this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
      if (body.gameObject === this.activeProjectile) {
        HapticsAdapter.impactLight();
      }
    });

    // Speed: 1300 px/s
    const speed = 1300;
    this.activeProjectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Trail particle emitter
    this.projectileTrail = ParticleFactory.createProjectileTrail(this, this.activeProjectileColor);
    this.projectileTrail.startFollow(this.activeProjectile);

    // Queue Next Bubble Reload
    const oldNext = this.nextBubbleColor;
    this.currentBubbleColor = oldNext;
    this.nextBubbleColor = this.getRandomActiveColor();
    this.cannon.animateReload(this.currentBubbleColor, this.nextBubbleColor);
  }

  public update(): void {
    if (!this.activeProjectile || !this.activeProjectileColor) return;

    const proj = this.activeProjectile;
    const projX = proj.x;
    const projY = proj.y;

    // 1. Check Ceiling Collision
    if (projY <= this.CEILING_Y + this.metrics.bubbleRadius + 2) {
      this.snapAndResolveProjectile(null);
      return;
    }

    // 2. Check Collision with Active Grid Bubbles
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

    // Cleanup Projectile & Trail
    this.projectileTrail?.stop();
    this.projectileTrail?.destroy();
    this.projectileTrail = null;
    this.activeProjectile.destroy();
    this.activeProjectile = null;
    this.activeProjectileColor = null;

    // 1. Compute Hexagonal Snap Coordinate
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

    // 2. Create Domain Bubble & Visual Sprite
    const newBubble = new Bubble({
      id: `b_${Date.now()}_${Math.random()}`,
      row: snapCoord.row,
      col: snapCoord.col,
      color: bubbleColor,
    });

    const targetPos = HexMath.hexToPixel(snapCoord, this.metrics);
    const sprite = this.add.image(targetPos.x, targetPos.y, `bubble_${bubbleColor}`);
    sprite.setDepth(10);
    sprite.setScale(0.2);

    // Pop-in bounce tween
    this.tweens.add({
      targets: sprite,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: 'Back.easeOut',
    });

    const key = HexGrid.getCoordKey(snapCoord.row, snapCoord.col);
    this.bubbleSprites.set(key, sprite);

    // 3. Process Matches, Orphans and Threat Step
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
      // High-impact haptic feedback for large combos
      if (result.matchedBubbles.length >= 5 || result.orphanBubbles.length >= 3) {
        HapticsAdapter.impactHeavy();
        ScreenJuice.shake(this, 0.012, 120);
      } else {
        HapticsAdapter.impactMedium();
        ScreenJuice.shake(this, 0.006, 80);
      }

      // 1. Animate Matched Bubbles Popping
      for (const matched of result.matchedBubbles) {
        const key = HexGrid.getCoordKey(matched.row, matched.col);
        const sp = this.bubbleSprites.get(key);
        if (sp) {
          ParticleFactory.emitBubblePop(this, sp.x, sp.y, matched.color, 1.2);
          sp.destroy();
          this.bubbleSprites.delete(key);
        }
      }

      // Add Match Score
      const matchScore = result.matchedBubbles.length * 100;
      this.addScore(matchScore);
      const centerMatched = result.matchedBubbles[0];
      if (centerMatched) {
        const pos = HexMath.hexToPixel(centerMatched, this.metrics);
        FloatingTextPool.show(this, pos.x, pos.y, `+${matchScore}`, '#00F0FF', 22);
      }

      // 2. Animate Disconnected Orphan Bubbles (Peggle Gravity Drop)
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

    // 3. Update Threat UI
    this.updateThreatUI();

    // 4. Handle Shift Down (Silent Descent)
    if (result.threatStatus.shouldShiftDown && result.shiftedBubbles) {
      this.animateGridShiftDown(result.shiftedBubbles);
    } else {
      this.isProcessingShot = false;
    }

    // 5. Check Death Line / Game Over
    if (result.dangerStatus.isGameOver) {
      this.handleGameOver();
    }
  }

  private triggerPeggleFall(sprite: Phaser.GameObjects.Image, color: BubbleColor): void {
    const x = sprite.x;
    const y = sprite.y;
    sprite.destroy();

    // Create dynamic physics falling bubble
    const falling = this.fallingBubblesGroup.create(x, y, `bubble_${color}`) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    falling.setCircle(this.metrics.bubbleRadius);
    falling.setDepth(18);
    falling.setGravityY(1100); // Strong arcade gravity
    falling.setVelocity(
      Phaser.Math.Between(-140, 140),
      Phaser.Math.Between(-180, -60)
    );
    falling.setAngularVelocity(Phaser.Math.Between(-300, 300));
    falling.setBounce(0.5, 0.4);

    // Auto cleanup once it exits below screen
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

  private animateGridShiftDown(shiftedBubbles: Bubble[]): void {
    ScreenJuice.shake(this, 0.008, 100);
    HapticsAdapter.impactMedium();

    // Reposition visual sprites cleanly
    this.bubbleSprites.forEach((sp) => sp.destroy());
    this.bubbleSprites.clear();

    for (const b of shiftedBubbles) {
      const targetPos = HexMath.hexToPixel(b, this.metrics);
      const sp = this.add.image(targetPos.x, targetPos.y - this.metrics.rowHeight, `bubble_${b.color}`);
      sp.setDepth(10);

      this.tweens.add({
        targets: sp,
        y: targetPos.y,
        duration: 200,
        ease: 'Bounce.easeOut',
      });

      this.bubbleSprites.set(HexGrid.getCoordKey(b.row, b.col), sp);
    }

    this.time.delayedCall(220, () => {
      this.isProcessingShot = false;
    });
  }

  private updateThreatUI(): void {
    const currentMisses = this.threatManager.getMisses();
    const maxMisses = this.threatManager.getMaxMisses();

    for (let i = 0; i < maxMisses; i++) {
      const dot = this.threatDots[i];
      if (dot) {
        if (i < currentMisses) {
          dot.setTint(0xff0055);
          dot.setAlpha(1);
        } else {
          dot.clearTint();
          dot.setAlpha(0.3);
        }
      }
    }
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
        const pos = HexMath.hexToPixel({ row: r, col: c }, this.metrics);
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
    ScreenJuice.shake(this, 0.02, 300);
    HapticsAdapter.notificationWarning();
    this.isProcessingShot = true;

    this.add.text(this.PLAY_WIDTH / 2, 400, 'GAME OVER', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#FF0055',
      stroke: '#0e1013',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(100);

    this.time.delayedCall(2000, () => {
      this.scene.restart();
    });
  }
}
