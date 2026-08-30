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

    // 1. Deep Obsidian Luxury Arcade Backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x06080b, 1);
    bg.fillRect(0, 0, width, height);

    // Subtle Perspective Grid Floor & Ceiling Lines
    bg.lineStyle(1, 0x121822, 0.7);
    for (let x = 0; x <= width; x += 32) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += 32) {
      bg.lineBetween(0, y, width, y);
    }

    // 2. Ambient Floating Neon Dust Particles
    this.createAmbientDust(width, height);

    // 3. Top Player Header Pill
    this.createPlayerHeader(width);

    // 4. Hero Title & Brand Identity
    this.createHeroTitle(width);

    // 5. Deluxe Game Mode Capsules
    const modes: GameModeType[] = [
      GameModeType.CLASSIC_ARCADE,
      GameModeType.TIME_ATTACK,
      GameModeType.PEGGLE_FEVER,
    ];

    const startY = 280;
    const spacing = 158;

    modes.forEach((modeType, index) => {
      this.createDeluxeModeCard(width / 2, startY + index * spacing, modeType);
    });

    // 6. Footer Quick Settings
    this.createFooter(width, height);
  }

  private createAmbientDust(width: number, height: number): void {
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(40, height - 40);
      const colors = [0x00f0ff, 0xff0055, 0xffe600, 0xb026ff, 0x00ff66];
      const color = colors[i % colors.length] ?? 0x00f0ff;

      const particle = this.add.graphics();
      particle.fillStyle(color, 0.4);
      particle.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      particle.setPosition(x, y);

      this.tweens.add({
        targets: particle,
        y: y - Phaser.Math.Between(60, 140),
        x: x + Phaser.Math.Between(-30, 30),
        alpha: { from: 0.1, to: 0.7 },
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createPlayerHeader(width: number): void {
    const headerContainer = this.add.container(width / 2, 46);

    const headerWidth = width - 36;
    const headerHeight = 56;

    // Glassmorphism Capsule Box
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0f131a, 0.95);
    headerBg.fillRoundedRect(-headerWidth / 2, -headerHeight / 2, headerWidth, headerHeight, 14);
    headerBg.lineStyle(1.5, 0x242d3c, 1);
    headerBg.strokeRoundedRect(-headerWidth / 2, -headerHeight / 2, headerWidth, headerHeight, 14);

    // Avatar with Neon Outer Glow Ring
    const avatarX = -headerWidth / 2 + 34;
    const avatarRing = this.add.graphics();
    avatarRing.lineStyle(2, 0x00f0ff, 0.9);
    avatarRing.strokeCircle(avatarX, 0, 20);

    const avatar = this.add.image(avatarX, 0, `bubble_${this.currentUser.avatarColor}`);
    avatar.setScale(0.58);

    // Player Name & Level Badge
    const nameText = this.add.text(avatarX + 28, -12, this.currentUser.username, {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });

    const rankTag = this.currentUser.isGuest ? '★ INVITADO' : '★ ARCADE PILOT';
    const rankColor = this.currentUser.isGuest ? '#718096' : '#00F0FF';
    const rankText = this.add.text(avatarX + 28, 6, rankTag, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: rankColor,
      letterSpacing: 1,
    });

    // High Score Trophy Section (Right)
    const trophyIcon = this.add.text(headerWidth / 2 - 120, -12, '🏆 RÉCORD', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#FFE600',
    });

    const trophyValue = this.add.text(headerWidth / 2 - 120, 4, this.currentUser.getOverallHighScore().toString().padStart(6, '0'), {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });

    // Logout / Switch User Pill Button
    const logoutBtn = this.add.container(headerWidth / 2 - 28, 0);
    const logoutBg = this.add.graphics();
    logoutBg.fillStyle(0x1a212d, 1);
    logoutBg.fillRoundedRect(-14, -14, 28, 28, 6);
    logoutBg.lineStyle(1, 0xff0055, 0.8);
    logoutBg.strokeRoundedRect(-14, -14, 28, 28, 6);

    const logoutIcon = this.add.text(0, 0, '✕', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FF0055',
    }).setOrigin(0.5);

    logoutBtn.add([logoutBg, logoutIcon]);
    logoutBtn.setSize(28, 28);
    logoutBtn.setInteractive({ useHandCursor: true });

    logoutBtn.on('pointerdown', () => {
      HapticsAdapter.impactLight();
      logoutBtn.setScale(0.9);
    });

    logoutBtn.on('pointerup', () => {
      logoutBtn.setScale(1);
      AuthRepository.logout();
      this.scene.start('AuthScene');
    });

    logoutBtn.on('pointerout', () => {
      logoutBtn.setScale(1);
    });

    headerContainer.add([headerBg, avatarRing, avatar, nameText, rankText, trophyIcon, trophyValue, logoutBtn]);
  }

  private createHeroTitle(width: number): void {
    const titleContainer = this.add.container(width / 2, 140);

    // Sub-title pill
    const subPill = this.add.graphics();
    subPill.fillStyle(0x00f0ff, 0.15);
    subPill.fillRoundedRect(-85, -45, 170, 22, 11);
    subPill.lineStyle(1, 0x00f0ff, 0.7);
    subPill.strokeRoundedRect(-85, -45, 170, 22, 11);

    const subText = this.add.text(0, -34, '★ PEGGLE ARCADE ★', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#00F0FF',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Main Logo Typography
    const mainTitle = this.add.text(0, 0, 'BUBBLE SHOOTER', {
      fontFamily: 'Outfit, Space Grotesk, sans-serif',
      fontSize: '32px',
      fontStyle: '900',
      color: '#FFFFFF',
      letterSpacing: 3,
      stroke: '#0e1013',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // Mode Selector Subheading
    const subHeading = this.add.text(0, 36, 'SELECCIONA TU MODO DE JUEGO', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#718096',
      letterSpacing: 3,
    }).setOrigin(0.5);

    titleContainer.add([subPill, subText, mainTitle, subHeading]);

    this.tweens.add({
      targets: titleContainer,
      y: 144,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createDeluxeModeCard(x: number, y: number, modeType: GameModeType): void {
    const config = GAME_MODES[modeType];
    const card = this.add.container(x, y);

    const cardWidth = 444;
    const cardHeight = 142;

    // 1. Dark Frosted Container
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x0f131a, 0.96);
    cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);
    
    // Glowing Neon Accent Border
    cardBg.lineStyle(2, config.accentColorHex, 0.85);
    cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);

    // Top Glowing Bar Accent
    cardBg.lineStyle(3, config.accentColorHex, 1);
    cardBg.lineBetween(-cardWidth / 2 + 30, -cardHeight / 2 + 2, cardWidth / 2 - 30, -cardHeight / 2 + 2);

    // 2. Tag Badge Pill
    const tagBg = this.add.graphics();
    tagBg.fillStyle(config.accentColorHex, 0.2);
    tagBg.fillRoundedRect(-cardWidth / 2 + 18, -cardHeight / 2 + 16, 95, 24, 6);
    tagBg.lineStyle(1.5, config.accentColorHex, 0.9);
    tagBg.strokeRoundedRect(-cardWidth / 2 + 18, -cardHeight / 2 + 16, 95, 24, 6);

    const tagText = this.add.text(-cardWidth / 2 + 65, -cardHeight / 2 + 28, config.tag, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: config.accentColorStr,
      letterSpacing: 1,
    }).setOrigin(0.5);

    // 3. Title & Description
    const titleText = this.add.text(-cardWidth / 2 + 18, -cardHeight / 2 + 48, config.title, {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });

    const descText = this.add.text(-cardWidth / 2 + 18, -cardHeight / 2 + 76, config.description, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#A0AEC0',
      wordWrap: { width: 280 },
    });

    // 4. High Score Record Pill
    let modeScore = 0;
    if (modeType === GameModeType.CLASSIC_ARCADE) modeScore = this.currentUser.stats.classicHighScore;
    else if (modeType === GameModeType.TIME_ATTACK) modeScore = this.currentUser.stats.timeAttackHighScore;
    else if (modeType === GameModeType.PEGGLE_FEVER) modeScore = this.currentUser.stats.peggleFeverHighScore;

    const recordContainer = this.add.container(-cardWidth / 2 + 18, cardHeight / 2 - 22);
    const recBg = this.add.graphics();
    recBg.fillStyle(0x181e28, 1);
    recBg.fillRoundedRect(0, -10, 140, 20, 4);

    const recText = this.add.text(8, 0, `RÉCORD: ${modeScore.toString().padStart(6, '0')}`, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FFE600',
    }).setOrigin(0, 0.5);

    recordContainer.add([recBg, recText]);

    // 5. Premium "JUGAR" Button (Right Side)
    const btnContainer = this.add.container(cardWidth / 2 - 58, 0);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(config.accentColorHex, 1);
    btnBg.fillRoundedRect(-44, -28, 88, 56, 12);

    const btnText = this.add.text(0, 0, 'JUGAR', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
      color: '#07090c',
      letterSpacing: 1,
    }).setOrigin(0.5);

    btnContainer.add([btnBg, btnText]);
    btnContainer.setSize(88, 56);
    btnContainer.setInteractive({ useHandCursor: true });

    btnContainer.on('pointerdown', () => {
      btnContainer.setScale(0.92);
      HapticsAdapter.impactHeavy();
    });

    btnContainer.on('pointerup', () => {
      btnContainer.setScale(1);
      this.cameras.main.fadeOut(150, 7, 9, 12);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { mode: modeType });
      });
    });

    btnContainer.on('pointerout', () => {
      btnContainer.setScale(1);
    });

    card.add([cardBg, tagBg, tagText, titleText, descText, recordContainer, btnContainer]);
  }

  private createFooter(width: number, height: number): void {
    const footerContainer = this.add.container(width / 2, height - 36);

    // Haptics Toggle Pill
    const hapticsPill = this.add.container(0, 0);
    const isHaptics = HapticsAdapter.isEnabled();

    const pillBg = this.add.graphics();
    pillBg.fillStyle(0x0f131a, 0.95);
    pillBg.fillRoundedRect(-90, -18, 180, 36, 18);
    pillBg.lineStyle(1.5, isHaptics ? 0x00f0ff : 0x2d3748, 1);
    pillBg.strokeRoundedRect(-90, -18, 180, 36, 18);

    const led = this.add.graphics();
    led.fillStyle(isHaptics ? 0x00f0ff : 0x718096, 1);
    led.fillCircle(-60, 0, 4);

    const label = this.add.text(-46, 0, `HAPTICS: ${isHaptics ? 'ACTIVO' : 'OFF'}`, {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: isHaptics ? '#00F0FF' : '#718096',
    }).setOrigin(0, 0.5);

    hapticsPill.add([pillBg, led, label]);
    hapticsPill.setSize(180, 36);
    hapticsPill.setInteractive({ useHandCursor: true });

    hapticsPill.on('pointerdown', () => {
      const next = !HapticsAdapter.isEnabled();
      HapticsAdapter.setEnabled(next);
      if (next) HapticsAdapter.impactMedium();

      pillBg.clear();
      pillBg.fillStyle(0x0f131a, 0.95);
      pillBg.fillRoundedRect(-90, -18, 180, 36, 18);
      pillBg.lineStyle(1.5, next ? 0x00f0ff : 0x2d3748, 1);
      pillBg.strokeRoundedRect(-90, -18, 180, 36, 18);

      led.clear();
      led.fillStyle(next ? 0x00f0ff : 0x718096, 1);
      led.fillCircle(-60, 0, 4);

      label.setText(`HAPTICS: ${next ? 'ACTIVO' : 'OFF'}`);
      label.setColor(next ? '#00F0FF' : '#718096');
    });

    footerContainer.add([hapticsPill]);
  }
}
