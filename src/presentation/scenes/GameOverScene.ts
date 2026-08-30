import Phaser from 'phaser';
import { HapticsAdapter } from '../../infrastructure/haptics/HapticsAdapter';
import { GameModeType } from '../../core/domain/models/GameMode';

export interface GameOverData {
  score: number;
  highScore: number;
  isNewRecord: boolean;
  mode?: GameModeType;
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
    cardBg.fillRoundedRect(-180, -210, 360, 420, 16);
    cardBg.lineStyle(2, 0x2d333f, 1);
    cardBg.strokeRoundedRect(-180, -210, 360, 420, 16);

    // Header Accent Line
    cardBg.lineStyle(3, 0xff0055, 1);
    cardBg.lineBetween(-120, -208, 120, -208);

    // Title: GAME OVER
    const title = this.add.text(0, -160, 'GAME OVER', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#FF0055',
      stroke: '#0e1013',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // New High Score Banner (if achieved)
    if (data.isNewRecord) {
      const banner = this.add.text(0, -115, '★ ¡NUEVO RÉCORD! ★', {
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
    const scoreLabel = this.add.text(0, -75, 'PUNTUACIÓN FINAL', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#718096',
    }).setOrigin(0.5);

    const scoreValue = this.add.text(0, -40, '0', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '42px',
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
    const bestLabel = this.add.text(0, 20, 'MEJOR RÉCORD', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#718096',
    }).setOrigin(0.5);

    const bestValue = this.add.text(0, 42, data.highScore.toString().padStart(6, '0'), {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    // 3. Action Buttons: Play Again & Back to Menu
    const playAgainBtn = this.add.container(0, 100);
    const playBg = this.add.graphics();
    playBg.fillStyle(0x00f0ff, 1);
    playBg.fillRoundedRect(-130, -20, 260, 42, 8);

    const playText = this.add.text(0, 0, 'JUGAR DE NUEVO', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#0a0c0f',
    }).setOrigin(0.5);

    playAgainBtn.add([playBg, playText]);
    playAgainBtn.setSize(260, 42);
    playAgainBtn.setInteractive({ useHandCursor: true });

    playAgainBtn.on('pointerdown', () => {
      HapticsAdapter.impactMedium();
      playAgainBtn.setScale(0.96);
    });

    playAgainBtn.on('pointerup', () => {
      playAgainBtn.setScale(1);
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene', { mode: data.mode });
    });

    playAgainBtn.on('pointerout', () => {
      playAgainBtn.setScale(1);
    });

    // Menu Button
    const menuBtn = this.add.container(0, 155);
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x1a212d, 1);
    menuBg.fillRoundedRect(-130, -18, 260, 38, 8);
    menuBg.lineStyle(1.5, 0x2d3748, 1);
    menuBg.strokeRoundedRect(-130, -18, 260, 38, 8);

    const menuText = this.add.text(0, 0, 'VOLVER AL MENÚ', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#A0AEC0',
    }).setOrigin(0.5);

    menuBtn.add([menuBg, menuText]);
    menuBtn.setSize(260, 38);
    menuBtn.setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      HapticsAdapter.impactLight();
      menuBtn.setScale(0.96);
    });

    menuBtn.on('pointerup', () => {
      menuBtn.setScale(1);
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('HomeScene');
    });

    menuBtn.on('pointerout', () => {
      menuBtn.setScale(1);
    });

    card.add([cardBg, title, scoreLabel, scoreValue, bestLabel, bestValue, playAgainBtn, menuBtn]);

    // Entrance Animation
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
