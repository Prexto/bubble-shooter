import Phaser from 'phaser';
import { DEFAULT_MULTIPLIER_BUCKETS, MultiplierBucket } from '../../core/domain/models/MultiplierBucket';
import { ParticleFactory } from '../effects/ParticleFactory';
import { FloatingTextPool } from '../effects/FloatingTextPool';
import { ScreenJuice } from '../effects/ScreenJuice';
import { HapticsAdapter } from '../../infrastructure/haptics/HapticsAdapter';
import { BubbleColor } from '../../core/domain/models/BubbleColor';

export interface BucketCatchEvent {
  bucket: MultiplierBucket;
  scoreAwarded: number;
}

export class MultiplierBucketsView {
  private scene: Phaser.Scene;
  public readonly buckets: MultiplierBucket[];
  private bucketContainers: Phaser.GameObjects.Container[] = [];
  private bucketZones: Phaser.GameObjects.Zone[] = [];
  public dividerPinsGroup!: Phaser.Physics.Arcade.StaticGroup;

  public readonly bucketY = 815;
  private readonly totalWidth = 480;
  private readonly bucketWidth: number;

  constructor(
    scene: Phaser.Scene,
    onCatchCallback: (event: BucketCatchEvent) => void,
    customBuckets?: MultiplierBucket[]
  ) {
    this.scene = scene;
    this.buckets = customBuckets ?? DEFAULT_MULTIPLIER_BUCKETS;
    this.bucketWidth = this.totalWidth / this.buckets.length; // 96px each

    this.dividerPinsGroup = scene.physics.add.staticGroup();

    this.createBuckets(onCatchCallback);
    this.createDividerPins();
  }

  private createBuckets(onCatchCallback: (event: BucketCatchEvent) => void): void {
    const bucketHeight = 65;

    this.buckets.forEach((bucket, index) => {
      const centerX = index * this.bucketWidth + this.bucketWidth / 2;
      const centerY = this.bucketY;

      const container = this.scene.add.container(centerX, centerY);
      container.setDepth(12);

      // 1. Bucket Background Box
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x13171f, 0.95);
      bg.fillRoundedRect(-this.bucketWidth / 2 + 3, -bucketHeight / 2, this.bucketWidth - 6, bucketHeight, 8);
      
      // Bucket Border with bucket's accent color
      bg.lineStyle(2, bucket.colorHex, 0.9);
      bg.strokeRoundedRect(-this.bucketWidth / 2 + 3, -bucketHeight / 2, this.bucketWidth - 6, bucketHeight, 8);

      // Top glowing rim
      bg.lineStyle(3, bucket.colorHex, 1);
      bg.lineBetween(-this.bucketWidth / 2 + 10, -bucketHeight / 2 + 2, this.bucketWidth / 2 - 10, -bucketHeight / 2 + 2);

      // 2. Multiplier Text Label
      const label = this.scene.add.text(0, -4, bucket.label, {
        fontFamily: 'Space Grotesk, Outfit, sans-serif',
        fontSize: bucket.multiplier >= 5 ? '26px' : '22px',
        fontStyle: 'bold',
        color: `#${bucket.colorHex.toString(16).padStart(6, '0')}`,
        stroke: '#0e1013',
        strokeThickness: 3,
      }).setOrigin(0.5);

      // Bonus points sub-label
      const subLabel = this.scene.add.text(0, 16, `+${bucket.calculateScore()}`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#718096',
      }).setOrigin(0.5);

      container.add([bg, label, subLabel]);
      this.bucketContainers.push(container);

      // 3. Physics Catch Zone
      const zone = this.scene.add.zone(centerX, centerY - 10, this.bucketWidth - 10, 30);
      this.scene.physics.add.existing(zone, true);
      this.bucketZones.push(zone);

      // Subtle breathing pulse for Jackpot bucket (x5)
      if (bucket.multiplier >= 5) {
        this.scene.tweens.add({
          targets: label,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    });

    // Register overlap in physics for all buckets
    this.scene.events.on('bubble_entered_bucket', (data: { bucketIndex: number; bubbleObj: Phaser.Types.Physics.Arcade.ImageWithDynamicBody; color: BubbleColor }) => {
      this.handleBubbleCatch(data.bucketIndex, data.bubbleObj, data.color, onCatchCallback);
    });
  }

  private createDividerPins(): void {
    // Pins between buckets that make falling bubbles bounce left/right into buckets
    for (let i = 1; i < this.buckets.length; i++) {
      const pinX = i * this.bucketWidth;
      const pinY = this.bucketY - 36;

      const pinGraphics = this.scene.add.graphics();
      pinGraphics.fillStyle(0x2a3240, 1);
      pinGraphics.fillCircle(0, 0, 5);
      pinGraphics.lineStyle(1.5, 0x00f0ff, 0.8);
      pinGraphics.strokeCircle(0, 0, 5);
      pinGraphics.generateTexture(`pin_peg_${i}`, 14, 14);
      pinGraphics.destroy();

      const pin = this.dividerPinsGroup.create(pinX, pinY, `pin_peg_${i}`) as Phaser.Physics.Arcade.Image;
      pin.setCircle(6);
      pin.setDepth(15);
      pin.refreshBody();
    }
  }

  public registerFallingOverlap(
    fallingGroup: Phaser.Physics.Arcade.Group,
    onCatchCallback: (event: BucketCatchEvent) => void
  ): void {
    this.bucketZones.forEach((zone, index) => {
      this.scene.physics.add.overlap(fallingGroup, zone, (_zoneObj, bubbleObj) => {
        const bubble = bubbleObj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
        if (!bubble.active) return;

        const textureKey = bubble.texture.key;
        const colorKey = (textureKey.replace('bubble_', '') as BubbleColor) || BubbleColor.CYAN;

        this.handleBubbleCatch(index, bubble, colorKey, onCatchCallback);
      });
    });

    // Bounce physics against divider pins
    this.scene.physics.add.collider(fallingGroup, this.dividerPinsGroup);
  }

  private handleBubbleCatch(
    bucketIndex: number,
    bubble: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
    color: BubbleColor,
    callback: (event: BucketCatchEvent) => void
  ): void {
    const bucket = this.buckets[bucketIndex];
    if (!bucket || !bubble.active) return;

    const catchX = bubble.x;
    const catchY = bubble.y;
    bubble.destroy();

    const scoreAwarded = bucket.calculateScore();
    const container = this.bucketContainers[bucketIndex];

    // 1. Container Punch / Bounce Animation
    if (container) {
      this.scene.tweens.add({
        targets: container,
        scaleX: 1.12,
        scaleY: 1.12,
        y: this.bucketY + 4,
        duration: 80,
        yoyo: true,
        ease: 'Power2',
      });
    }

    // 2. Geometric Fountain Particles
    ParticleFactory.emitBucketCatch(this.scene, catchX, catchY - 15, color);

    // 3. Floating Score Text
    const isJackpot = bucket.multiplier >= 5;
    const textColor = isJackpot ? '#FFE600' : '#00F0FF';
    const fontSize = isJackpot ? 28 : 22;
    const textLabel = isJackpot ? `+${scoreAwarded} JACKPOT!` : `+${scoreAwarded} ${bucket.label}!`;

    FloatingTextPool.show(this.scene, catchX, catchY - 25, textLabel, textColor, fontSize);

    // 4. Haptic Feedback & Screen Shake
    if (isJackpot) {
      HapticsAdapter.impactHeavy();
      ScreenJuice.shake(this.scene, 0.012, 140);
    } else {
      HapticsAdapter.impactMedium();
      ScreenJuice.shake(this.scene, 0.005, 60);
    }

    // 5. Notify GameScene of Score Increment
    callback({
      bucket,
      scoreAwarded,
    });
  }
}
