import Phaser from 'phaser';
import { BUBBLE_COLOR_PALETTE, BubbleColor } from '../../core/domain/models/BubbleColor';

export class TextureGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    this.generateBubbles(scene);
    this.generateParticles(scene);
    this.generateAimGuide(scene);
    this.generateCannon(scene);
    this.generateBuckets(scene);
    this.generateDeathLine(scene);
  }

  private static generateBubbles(scene: Phaser.Scene): void {
    const size = 64;
    const radius = 28;
    const center = size / 2;

    for (const colorKey of Object.keys(BUBBLE_COLOR_PALETTE) as BubbleColor[]) {
      const config = BUBBLE_COLOR_PALETTE[colorKey];
      const g = scene.make.graphics({ x: 0, y: 0 });

      // Outer subtle dark contour for contrast
      g.fillStyle(0x06080a, 0.4);
      g.fillCircle(center, center, radius + 2);

      // Solid vibrant flat neon base
      g.fillStyle(config.hex, 1);
      g.fillCircle(center, center, radius);

      // Bottom inner shadow (flat crescent)
      g.fillStyle(0x000000, 0.2);
      g.beginPath();
      g.arc(center, center, radius, 0, Math.PI, false);
      g.fillPath();

      // Top-left crisp inner highlight arc (vector shine)
      g.lineStyle(3, 0xffffff, 0.85);
      g.beginPath();
      g.arc(center, center, radius - 4, -Math.PI * 0.85, -Math.PI * 0.25, false);
      g.strokePath();

      // Top-left specular dot
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(center - 10, center - 10, 3.5);

      g.generateTexture(`bubble_${colorKey}`, size, size);
      g.destroy();
    }
  }

  private static generateParticles(scene: Phaser.Scene): void {
    // Triangles and Diamonds for each color
    for (const colorKey of Object.keys(BUBBLE_COLOR_PALETTE) as BubbleColor[]) {
      const config = BUBBLE_COLOR_PALETTE[colorKey];

      // Triangle Particle (16x16)
      const gt = scene.make.graphics({ x: 0, y: 0 });
      gt.fillStyle(config.hex, 1);
      gt.beginPath();
      gt.moveTo(8, 2);
      gt.lineTo(14, 14);
      gt.lineTo(2, 14);
      gt.closePath();
      gt.fillPath();
      gt.generateTexture(`particle_triangle_${colorKey}`, 16, 16);
      gt.destroy();

      // Diamond / Square Particle (14x14)
      const gs = scene.make.graphics({ x: 0, y: 0 });
      gs.fillStyle(config.hex, 1);
      gs.beginPath();
      gs.moveTo(7, 1);
      gs.lineTo(13, 7);
      gs.lineTo(7, 13);
      gs.lineTo(1, 7);
      gs.closePath();
      gs.fillPath();
      gs.generateTexture(`particle_square_${colorKey}`, 14, 14);
      gs.destroy();
    }

    // White Sparkle / Core Shard (12x12)
    const gw = scene.make.graphics({ x: 0, y: 0 });
    gw.fillStyle(0xffffff, 1);
    gw.beginPath();
    gw.moveTo(6, 0);
    gw.lineTo(8, 4);
    gw.lineTo(12, 6);
    gw.lineTo(8, 8);
    gw.lineTo(6, 12);
    gw.lineTo(4, 8);
    gw.lineTo(0, 6);
    gw.lineTo(4, 4);
    gw.closePath();
    gw.fillPath();
    gw.generateTexture('particle_sparkle', 12, 12);
    gw.destroy();
  }

  private static generateAimGuide(scene: Phaser.Scene): void {
    // Aim Dot (16x16)
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x0e1013, 0.8);
    g.fillCircle(8, 8, 6);
    g.fillStyle(0x00f0ff, 1);
    g.fillCircle(8, 8, 4);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(8, 8, 1.5);
    g.generateTexture('aim_dot', 16, 16);
    g.destroy();

    // Aim Wall Bounce Diamond (20x20)
    const gb = scene.make.graphics({ x: 0, y: 0 });
    gb.lineStyle(2, 0x00f0ff, 0.9);
    gb.beginPath();
    gb.moveTo(10, 2);
    gb.lineTo(18, 10);
    gb.lineTo(10, 18);
    gb.lineTo(2, 10);
    gb.closePath();
    gb.strokePath();
    gb.fillStyle(0xffffff, 0.8);
    gb.fillCircle(10, 10, 2.5);
    gb.generateTexture('aim_bounce', 20, 20);
    gb.destroy();
  }

  private static generateCannon(scene: Phaser.Scene): void {
    // Cannon Base Ring (90x90)
    const gb = scene.make.graphics({ x: 0, y: 0 });
    // Outer dark housing
    gb.fillStyle(0x16191f, 1);
    gb.fillCircle(45, 45, 42);
    gb.lineStyle(3, 0x2d333f, 1);
    gb.strokeCircle(45, 45, 42);
    // Inner bevel ring
    gb.fillStyle(0x0e1013, 1);
    gb.fillCircle(45, 45, 34);
    gb.lineStyle(2, 0x00f0ff, 0.6);
    gb.strokeCircle(45, 45, 34);
    gb.generateTexture('cannon_base', 90, 90);
    gb.destroy();

    // Cannon Barrel (48x80) - Rotatable railgun body
    const gbar = scene.make.graphics({ x: 0, y: 0 });
    // Main barrel trapezoid
    gbar.fillStyle(0x1e222b, 1);
    gbar.beginPath();
    gbar.moveTo(14, 75); // base left
    gbar.lineTo(34, 75); // base right
    gbar.lineTo(38, 15); // top right
    gbar.lineTo(10, 15); // top left
    gbar.closePath();
    gbar.fillPath();

    // Side muzzle wings (45 degree chamfers)
    gbar.fillStyle(0x2a303c, 1);
    gbar.beginPath();
    gbar.moveTo(8, 15);
    gbar.lineTo(14, 0);
    gbar.lineTo(18, 15);
    gbar.closePath();
    gbar.fillPath();

    gbar.beginPath();
    gbar.moveTo(40, 15);
    gbar.lineTo(34, 0);
    gbar.lineTo(30, 15);
    gbar.closePath();
    gbar.fillPath();

    // Center chamber glow track
    gbar.fillStyle(0x0e1013, 1);
    gbar.fillRect(20, 20, 8, 45);
    gbar.lineStyle(1.5, 0x00f0ff, 0.8);
    gbar.strokeRect(20, 20, 8, 45);

    // Barrel border
    gbar.lineStyle(2, 0x3d4656, 1);
    gbar.beginPath();
    gbar.moveTo(14, 75);
    gbar.lineTo(34, 75);
    gbar.lineTo(38, 15);
    gbar.lineTo(10, 15);
    gbar.closePath();
    gbar.strokePath();

    gbar.generateTexture('cannon_barrel', 48, 80);
    gbar.destroy();
  }

  private static generateBuckets(scene: Phaser.Scene): void {
    // Bucket Box (80x70)
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Background flat container
    g.fillStyle(0x16191f, 0.95);
    g.fillRoundedRect(2, 2, 76, 66, 8);
    // Border
    g.lineStyle(2, 0x2d333f, 1);
    g.strokeRoundedRect(2, 2, 76, 66, 8);
    // Top entry light accent
    g.lineStyle(3, 0x00f0ff, 0.9);
    g.lineBetween(10, 4, 70, 4);

    g.generateTexture('bucket_box', 80, 70);
    g.destroy();
  }

  private static generateDeathLine(scene: Phaser.Scene): void {
    const width = 480;
    const height = 8;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Danger striped warning line
    g.lineStyle(2, 0xff0055, 0.8);
    for (let x = 0; x < width; x += 16) {
      g.lineBetween(x, 0, x + 8, height);
    }
    g.lineStyle(1, 0xff0055, 0.4);
    g.lineBetween(0, height / 2, width, height / 2);

    g.generateTexture('death_line', width, height);
    g.destroy();
  }
}
