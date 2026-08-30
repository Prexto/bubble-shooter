import Phaser from 'phaser';
import { HapticsAdapter } from '../../infrastructure/haptics/HapticsAdapter';

export interface PauseModalCallbacks {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export class PauseModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private isVisible = false;

  constructor(scene: Phaser.Scene, callbacks: PauseModalCallbacks) {
    this.scene = scene;
    const width = 480;
    const height = 854;

    this.container = scene.add.container(0, 0);
    this.container.setDepth(999);
    this.container.setVisible(false);

    // 1. Full Screen Backdrop
    const backdrop = scene.add.graphics();
    backdrop.fillStyle(0x0a0c0f, 0.92);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    // 2. Center Card
    const card = scene.add.container(width / 2, height / 2);
    const cardBg = scene.add.graphics();
    cardBg.fillStyle(0x13171f, 1);
    cardBg.fillRoundedRect(-160, -180, 320, 360, 16);
    cardBg.lineStyle(2, 0x242d3b, 1);
    cardBg.strokeRoundedRect(-160, -180, 320, 360, 16);

    // Top Accent
    cardBg.lineStyle(3, 0x00f0ff, 1);
    cardBg.lineBetween(-100, -178, 100, -178);

    const title = scene.add.text(0, -130, 'PAUSA', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // 3. Resume Button
    const resumeBtn = this.createButton(0, -50, 'CONTINUAR', 0x00f0ff, '#0a0c0f', () => {
      this.hide();
      callbacks.onResume();
    });

    // 4. Restart Button
    const restartBtn = this.createButton(0, 20, 'REINICIAR', 0x1a212d, '#FFFFFF', () => {
      this.hide();
      callbacks.onRestart();
    }, 0x2d3748);

    // 5. Quit to Menu Button
    const quitBtn = this.createButton(0, 90, 'SALIR AL MENÚ', 0x1a212d, '#FF0055', () => {
      this.hide();
      callbacks.onQuit();
    }, 0xff0055);

    card.add([cardBg, title, resumeBtn, restartBtn, quitBtn]);
    this.container.add([backdrop, card]);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    bgHex: number,
    textColor: string,
    onClick: () => void,
    borderHex?: number
  ): Phaser.GameObjects.Container {
    const btn = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(bgHex, 1);
    bg.fillRoundedRect(-120, -22, 240, 44, 8);
    if (borderHex !== undefined) {
      bg.lineStyle(1.5, borderHex, 1);
      bg.strokeRoundedRect(-120, -22, 240, 44, 8);
    }

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: textColor,
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(240, 44);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      btn.setScale(0.96);
      HapticsAdapter.impactLight();
    });

    btn.on('pointerup', () => {
      btn.setScale(1);
      onClick();
    });

    btn.on('pointerout', () => {
      btn.setScale(1);
    });

    return btn;
  }

  public show(): void {
    this.isVisible = true;
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 150,
      ease: 'Power2',
    });
  }

  public hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }
}
