import Phaser from 'phaser';
import { BubbleColor } from '../../core/domain/models/BubbleColor';

export class CannonView {
  private scene: Phaser.Scene;
  public readonly x: number;
  public readonly y: number;

  private baseSprite: Phaser.GameObjects.Image;
  private barrelSprite: Phaser.GameObjects.Image;
  private activeBubbleSprite: Phaser.GameObjects.Image;
  private nextBubbleSprite: Phaser.GameObjects.Image;

  private currentAngle: number = -Math.PI / 2; // Pointing up

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    // 1. Next Bubble Preview Slot (to the left of the base)
    const nextSlotX = x - 70;
    const nextSlotY = y + 10;

    scene.add.text(nextSlotX, nextSlotY - 26, 'NEXT', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#4b5568',
    }).setOrigin(0.5).setDepth(20);

    this.nextBubbleSprite = scene.add.image(nextSlotX, nextSlotY, 'bubble_CYAN');
    this.nextBubbleSprite.setScale(0.55);
    this.nextBubbleSprite.setDepth(20);

    // 2. Base Ring (Fixed)
    this.baseSprite = scene.add.image(x, y, 'cannon_base');
    this.baseSprite.setDepth(20);

    // 3. Rotational Barrel
    this.barrelSprite = scene.add.image(x, y, 'cannon_barrel');
    this.barrelSprite.setOrigin(0.5, 0.9); // Pivot near base
    this.barrelSprite.setDepth(21);
    this.barrelSprite.setRotation(this.currentAngle + Math.PI / 2);

    // 4. Active Chamber Bubble
    this.activeBubbleSprite = scene.add.image(x, y - 18, 'bubble_CYAN');
    this.activeBubbleSprite.setScale(0.85);
    this.activeBubbleSprite.setDepth(22);

    // Pulse animation for active chamber bubble
    scene.tweens.add({
      targets: this.activeBubbleSprite,
      scaleX: 0.88,
      scaleY: 0.88,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public setRotation(angle: number): void {
    this.currentAngle = angle;
    // Phaser sprite rotation: 0 points right, so offset by 90 deg for barrel sprite pointing up
    this.barrelSprite.setRotation(angle + Math.PI / 2);

    // Reposition active bubble along the barrel axis
    const chamberOffset = 18;
    this.activeBubbleSprite.setPosition(
      this.x + Math.cos(angle) * chamberOffset,
      this.y + Math.sin(angle) * chamberOffset
    );
  }

  public getMuzzlePosition(): { x: number; y: number } {
    const muzzleOffset = 52;
    return {
      x: this.x + Math.cos(this.currentAngle) * muzzleOffset,
      y: this.y + Math.sin(this.currentAngle) * muzzleOffset,
    };
  }

  public getAngle(): number {
    return this.currentAngle;
  }

  public setActiveColor(color: BubbleColor): void {
    this.activeBubbleSprite.setTexture(`bubble_${color}`);
    this.activeBubbleSprite.setVisible(true);
  }

  public setNextColor(color: BubbleColor): void {
    this.nextBubbleSprite.setTexture(`bubble_${color}`);
  }

  public fireRecoil(): void {
    this.activeBubbleSprite.setVisible(false);

    // Recoil backward along negative angle
    const recoilDist = 12;
    const recoilX = this.x - Math.cos(this.currentAngle) * recoilDist;
    const recoilY = this.y - Math.sin(this.currentAngle) * recoilDist;

    this.scene.tweens.add({
      targets: this.barrelSprite,
      x: recoilX,
      y: recoilY,
      duration: 60,
      ease: 'Power2',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.barrelSprite,
          x: this.x,
          y: this.y,
          duration: 180,
          ease: 'Back.easeOut',
        });
      },
    });
  }

  public animateReload(newActiveColor: BubbleColor, newNextColor: BubbleColor): void {
    const startX = this.nextBubbleSprite.x;
    const startY = this.nextBubbleSprite.y;

    // Temporary flight sprite moving from next slot to barrel chamber
    const movingBubble = this.scene.add.image(startX, startY, `bubble_${newActiveColor}`);
    movingBubble.setScale(0.55);
    movingBubble.setDepth(25);

    this.setNextColor(newNextColor);

    const chamberOffset = 18;
    const targetX = this.x + Math.cos(this.currentAngle) * chamberOffset;
    const targetY = this.y + Math.sin(this.currentAngle) * chamberOffset;

    this.scene.tweens.add({
      targets: movingBubble,
      x: targetX,
      y: targetY,
      scaleX: 0.85,
      scaleY: 0.85,
      duration: 160,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        movingBubble.destroy();
        this.setActiveColor(newActiveColor);
      },
    });
  }
}
