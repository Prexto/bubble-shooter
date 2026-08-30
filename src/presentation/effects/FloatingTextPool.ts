import Phaser from 'phaser';

export class FloatingTextPool {
  public static show(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    colorHex: string = '#FFE600',
    fontSize: number = 24
  ): void {
    const textObj = scene.add.text(x, y, text, {
      fontFamily: 'Outfit, Space Grotesk, sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: colorHex,
      stroke: '#0e1013',
      strokeThickness: 4,
    });

    textObj.setOrigin(0.5, 0.5);
    textObj.setScale(0.3);
    textObj.setAlpha(1);

    scene.tweens.add({
      targets: textObj,
      y: y - 55,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: textObj,
          y: y - 80,
          scaleX: 1.0,
          scaleY: 1.0,
          alpha: 0,
          duration: 380,
          ease: 'Power2',
          onComplete: () => {
            textObj.destroy();
          },
        });
      },
    });
  }
}
