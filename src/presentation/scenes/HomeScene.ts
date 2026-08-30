import Phaser from 'phaser';
import { AuthRepository } from '../../infrastructure/auth/AuthRepository';
import { User } from '../../core/domain/models/User';
import { GAME_MODES, GameModeType } from '../../core/domain/models/GameMode';
import { HapticsAdapter } from '../../infrastructure/haptics/HapticsAdapter';

export class HomeScene extends Phaser.Scene {
  private currentUser!: User;

  constructor() {
    super({ key: 'HomeScene' });
  }

  public create(): void {
    const width = 480;
    const height = 854;

    // Load active user or redirect to Auth
    const user = AuthRepository.getCurrentUser();
    if (!user) {
      this.scene.start('AuthScene');
      return;
    }
    this.currentUser = user;

    // 1. Background with Grid Pattern
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0c0f, 1);
    bg.fillRect(0, 0, width, height);

    bg.lineStyle(1, 0x161c24, 0.6);
    for (let x = 0; x < width; x += 40) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      bg.lineBetween(0, y, width, y);
    }

    // 2. Top Player Profile Bar
    this.createProfileHeader(width);

    // 3. Section Title
    this.add.text(width / 2, 130, 'MODOS DE JUEGO', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // 4. Game Mode Cards
    const modes: GameModeType[] = [
      GameModeType.CLASSIC_ARCADE,
      GameModeType.TIME_ATTACK,
      GameModeType.PEGGLE_FEVER,
    ];

    const startY = 230;
    const cardSpacing = 175;

    modes.forEach((modeType, index) => {
      this.createModeCard(width / 2, startY + index * cardSpacing, modeType);
    });

    // 5. Footer Quick Settings
    this.createFooter(width, height);
  }

  private createProfileHeader(width: number): void {
    const headerContainer = this.add.container(width / 2, 50);

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x13171f, 0.95);
    headerBg.fillRoundedRect(-width / 2 + 16, -30, width - 32, 60, 12);
    headerBg.lineStyle(1.5, 0x242d3b, 1);
    headerBg.strokeRoundedRect(-width / 2 + 16, -30, width - 32, 60, 12);

    // Avatar Circle
    const avatar = this.add.image(-width / 2 + 50, 0, `bubble_${this.currentUser.avatarColor}`);
    avatar.setScale(0.65);

    // Username & Badge
    const usernameText = this.add.text(-width / 2 + 82, -14, this.currentUser.username, {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });

    const badgeLabel = this.currentUser.isGuest ? 'GUEST' : 'PLAYER';
    const badgeColor = this.currentUser.isGuest ? '#718096' : '#00F0FF';
    const badgeText = this.add.text(-width / 2 + 82, 6, badgeLabel, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: badgeColor,
    });

    // High Score Badge (Right Side)
    const recordLabel = this.add.text(width / 2 - 95, -14, 'BEST RECORD', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#FFE600',
    });

    const recordValue = this.add.text(width / 2 - 95, 2, this.currentUser.getOverallHighScore().toString().padStart(6, '0'), {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });

    // Logout Button
    const logoutBtn = this.add.text(width / 2 - 38, 0, '✕', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FF0055',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    logoutBtn.on('pointerdown', () => {
      HapticsAdapter.impactLight();
      AuthRepository.logout();
      this.scene.start('AuthScene');
    });

    headerContainer.add([headerBg, avatar, usernameText, badgeText, recordLabel, recordValue, logoutBtn]);
  }

  private createModeCard(x: number, y: number, modeType: GameModeType): void {
    const config = GAME_MODES[modeType];
    const card = this.add.container(x, y);

    const cardWidth = 430;
    const cardHeight = 150;

    // Card Box
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x13171f, 0.95);
    cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
    cardBg.lineStyle(2, config.accentColorHex, 0.85);
    cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);

    // Mode Tag Badge
    const tagBg = this.add.graphics();
    tagBg.fillStyle(config.accentColorHex, 0.2);
    tagBg.fillRoundedRect(-cardWidth / 2 + 16, -cardHeight / 2 + 14, 80, 22, 4);
    tagBg.lineStyle(1, config.accentColorHex, 0.8);
    tagBg.strokeRoundedRect(-cardWidth / 2 + 16, -cardHeight / 2 + 14, 80, 22, 4);

    const tagText = this.add.text(-cardWidth / 2 + 56, -cardHeight / 2 + 25, config.tag, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: config.accentColorStr,
    }).setOrigin(0.5);

    // Title & Description
    const titleText = this.add.text(-cardWidth / 2 + 16, -cardHeight / 2 + 45, config.title, {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });

    const descText = this.add.text(-cardWidth / 2 + 16, -cardHeight / 2 + 72, config.description, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#A0AEC0',
      wordWrap: { width: 270 },
    });

    // Mode High Score Record
    let modeScore = 0;
    if (modeType === GameModeType.CLASSIC_ARCADE) modeScore = this.currentUser.stats.classicHighScore;
    else if (modeType === GameModeType.TIME_ATTACK) modeScore = this.currentUser.stats.timeAttackHighScore;
    else if (modeType === GameModeType.PEGGLE_FEVER) modeScore = this.currentUser.stats.peggleFeverHighScore;

    const scoreTag = this.add.text(-cardWidth / 2 + 16, cardHeight / 2 - 24, `RÉCORD: ${modeScore.toString().padStart(6, '0')}`, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FFE600',
    });

    // Play Action Button (Right Side)
    const btnContainer = this.add.container(cardWidth / 2 - 62, 0);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(config.accentColorHex, 1);
    btnBg.fillRoundedRect(-45, -28, 90, 56, 10);

    const btnText = this.add.text(0, 0, 'JUGAR', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#0a0c0f',
    }).setOrigin(0.5);

    btnContainer.add([btnBg, btnText]);
    btnContainer.setSize(90, 56);
    btnContainer.setInteractive({ useHandCursor: true });

    btnContainer.on('pointerdown', () => {
      btnContainer.setScale(0.92);
      HapticsAdapter.impactMedium();
    });

    btnContainer.on('pointerup', () => {
      btnContainer.setScale(1);
      this.scene.start('GameScene', { mode: modeType });
    });

    btnContainer.on('pointerout', () => {
      btnContainer.setScale(1);
    });

    card.add([cardBg, tagBg, tagText, titleText, descText, scoreTag, btnContainer]);
  }

  private createFooter(width: number, height: number): void {
    const footerContainer = this.add.container(width / 2, height - 40);

    // Haptics Toggle
    const hapticsEnabled = HapticsAdapter.isEnabled();
    const hapticsText = this.add.text(0, 0, `HAPTICS: ${hapticsEnabled ? 'ON' : 'OFF'}`, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: hapticsEnabled ? '#00F0FF' : '#718096',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    hapticsText.on('pointerdown', () => {
      const next = !HapticsAdapter.isEnabled();
      HapticsAdapter.setEnabled(next);
      hapticsText.setText(`HAPTICS: ${next ? 'ON' : 'OFF'}`);
      hapticsText.setColor(next ? '#00F0FF' : '#718096');
      if (next) HapticsAdapter.impactMedium();
    });

    footerContainer.add([hapticsText]);
  }
}
