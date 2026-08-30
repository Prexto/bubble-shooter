import Phaser from 'phaser';
import { BubbleColor } from '../../core/domain/models/BubbleColor';

export class ParticleFactory {
  public static emitBubblePop(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: BubbleColor,
    intensityMultiplier: number = 1
  ): void {
    const count = Math.round(12 * intensityMultiplier);

    // Burst triangle particles
    const emitterTriangle = scene.add.particles(x, y, `particle_triangle_${color}`, {
      speed: { min: 140, max: 320 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: -180, max: 180 },
      lifespan: { min: 350, max: 550 },
      gravityY: 150,
      quantity: Math.ceil(count / 2),
      emitting: false,
    });
    emitterTriangle.explode(Math.ceil(count / 2));

    // Burst square / diamond particles
    const emitterSquare = scene.add.particles(x, y, `particle_square_${color}`, {
      speed: { min: 120, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.1, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: -90, max: 90 },
      lifespan: { min: 300, max: 500 },
      gravityY: 150,
      quantity: Math.floor(count / 2),
      emitting: false,
    });
    emitterSquare.explode(Math.floor(count / 2));

    // Sparkle core burst
    const emitterSparkle = scene.add.particles(x, y, 'particle_sparkle', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.0, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 250,
      quantity: 4,
      emitting: false,
    });
    emitterSparkle.explode(4);

    // Auto cleanup after lifespan
    scene.time.delayedCall(600, () => {
      emitterTriangle.destroy();
      emitterSquare.destroy();
      emitterSparkle.destroy();
    });
  }

  public static emitBucketCatch(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: BubbleColor
  ): void {
    // Upward fountain of sparkles and diamonds
    const emitter = scene.add.particles(x, y, `particle_triangle_${color}`, {
      speedY: { min: -350, max: -150 },
      speedX: { min: -120, max: 120 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: -220, max: 220 },
      lifespan: { min: 450, max: 650 },
      gravityY: 300,
      quantity: 16,
      emitting: false,
    });
    emitter.explode(16);

    const sparkles = scene.add.particles(x, y, 'particle_sparkle', {
      speedY: { min: -280, max: -100 },
      speedX: { min: -80, max: 80 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 8,
      emitting: false,
    });
    sparkles.explode(8);

    scene.time.delayedCall(700, () => {
      emitter.destroy();
      sparkles.destroy();
    });
  }

  public static createProjectileTrail(
    scene: Phaser.Scene,
    color: BubbleColor
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const emitter = scene.add.particles(0, 0, `particle_square_${color}`, {
      speed: { min: 20, max: 60 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 180,
      frequency: 25,
      blendMode: 'ADD',
    });
    return emitter;
  }
}
