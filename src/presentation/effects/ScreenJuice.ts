import Phaser from 'phaser';

export class ScreenJuice {
  public static shake(
    scene: Phaser.Scene,
    intensity: number = 0.008,
    duration: number = 100
  ): void {
    scene.cameras.main.shake(duration, intensity);
  }

  public static flash(
    scene: Phaser.Scene,
    color: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 },
    duration: number = 80
  ): void {
    scene.cameras.main.flash(duration, color.r, color.g, color.b);
  }
}
