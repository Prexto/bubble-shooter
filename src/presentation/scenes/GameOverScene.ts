import Phaser from 'phaser';
import { HapticsAdapter } from '../../infrastructure/haptics/HapticsAdapter';

export interface GameOverData {
  score: number;
  highScore: number;
  isNewRecord: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  public create(data: GameOverData): void {
    const width = 480;
    const height = 854;

    // 1. Semi-transparent Matte Backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x0a0c0f, 0.92);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setDepth(50);
    backdrop.setAlpha(0);

    this.tweens.add({
      targets: backdrop,
      alpha: 1,
      duration: 250,
      ease: 'Power2',
    });

    // 2. Center Card Container
    const card = this.add.container(width / 2, height / 2 - 20);
    card.setDepth(51);
    card.setScale(0.8);
    card.setAlpha(0);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x13171f, 1);
    cardBg.fillRoundedRect(-180, -200, 360, 400, 16);
    cardBg.lineStyle(2, 0x2d333f, 1);
    cardBg.strokeRoundedRect(-180, -200, 360, 400, 16);

    // Header Accent Line
    cardBg.lineStyle(3, 0xff0055, 1);
    cardBg.lineBetween(-120, -198, 120, -198);

    // Title: GAME OVER
    const title = this.add.text(0, -150, 'GAME OVER', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#FF0055',
      stroke: '#0e1013',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // New High Score Banner (if achieved)
    if (data.isNewRecord) {
      const banner = this.add.text(0, -105, '★ NEW HIGH SCORE! ★', {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#FFE600',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: banner,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      card.add(banner);
    }

    // Final Score Section
    const scoreLabel = this.add.text(0, -65, 'FINAL SCORE', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#718096',
    }).setOrigin(0.5);

    const scoreValue = this.add.text(0, -30, '0', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#00F0FF',
    }).setOrigin(0.5);

    // Count-up animation for final score
    let currentDisplayScore = 0;
    const targetScore = data.score;
    this.tweens.addCounter({
      from: 0,
      to: targetScore,
      duration: 800,
      ease: 'Power2',
      onUpdate: (tween) => {
        currentDisplayScore = Math.floor(tween.getValue() ?? 0);
        scoreValue.setText(currentDisplayScore.toString().padStart(6, '0'));
      },
    });

    // Best Score Section
    const bestLabel = this.add.text(0, 35, 'BEST RECORD', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#718096',
    }).setOrigin(0.5);

    const bestValue = this.add.text(0, 58, data.highScore.toString().padStart(6, '0'), {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    // 3. Play Again Button
    const btnContainer = this.add.container(0, 130);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x00f0ff, 1);
    btnBg.fillRoundedRect(-120, -25, 240, 50, 10);

    const btnText = this.add.text(0, 0, 'PLAY AGAIN', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#0e1013',
    }).setOrigin(0.5);

    btnContainer.add([btnBg, btnText]);

    // Button Interactivity
    btnContainer.setSize(240, 50);
    btnContainer.setInteractive({ useHandCursor: true });

    btnContainer.on('pointerdown', () => {
      HapticsAdapter.impactMedium();
      btnContainer.setScale(0.95);
    });

    btnContainer.on('pointerup', () => {
      btnContainer.setScale(1);
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene');
    });

    btnContainer.on('pointerout', () => {
      btnContainer.setScale(1);
    });

    card.add([cardBg, title, scoreLabel, scoreValue, bestLabel, bestValue, btnContainer]);

    // Entrance Animation for Card
    this.tweens.add({
      targets: card,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }
}
