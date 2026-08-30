import Phaser from 'phaser';
import { AuthRepository } from '../../infrastructure/auth/AuthRepository';
import { HapticsAdapter } from '../../infrastructure/haptics/HapticsAdapter';

export class AuthScene extends Phaser.Scene {
  private isRegisterMode = false;
  private usernameInput = 'Player 1';
  private emailInput = 'player@arcade.com';

  private tabLoginBg!: Phaser.GameObjects.Graphics;
  private tabRegisterBg!: Phaser.GameObjects.Graphics;
  private tabLoginText!: Phaser.GameObjects.Text;
  private tabRegisterText!: Phaser.GameObjects.Text;

  private usernameFieldText!: Phaser.GameObjects.Text;
  private emailFieldText!: Phaser.GameObjects.Text;
  private emailContainer!: Phaser.GameObjects.Container;
  private submitButtonText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'AuthScene' });
  }

  public create(): void {
    const width = 480;
    const height = 854;

    // Check if already authenticated
    const existingUser = AuthRepository.getCurrentUser();
    if (existingUser) {
      this.scene.start('HomeScene');
      return;
    }

    // 1. Deep Obsidian Background
    const bg = this.add.graphics();
    bg.fillStyle(0x06080b, 1);
    bg.fillRect(0, 0, width, height);

    bg.lineStyle(1, 0x121822, 0.7);
    for (let x = 0; x <= width; x += 32) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += 32) {
      bg.lineBetween(0, y, width, y);
    }

    // Ambient floating dust
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(30, width - 30);
      const y = Phaser.Math.Between(60, height - 60);
      const p = this.add.graphics();
      p.fillStyle(0x00f0ff, 0.35);
      p.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      p.setPosition(x, y);

      this.tweens.add({
        targets: p,
        y: y - 80,
        alpha: { from: 0.1, to: 0.8 },
        duration: Phaser.Math.Between(3000, 5500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // 2. Animated Floating Logo / Title
    const logoContainer = this.add.container(width / 2, 140);
    const subPill = this.add.graphics();
    subPill.fillStyle(0x00f0ff, 0.15);
    subPill.fillRoundedRect(-75, -42, 150, 20, 10);
    subPill.lineStyle(1, 0x00f0ff, 0.8);
    subPill.strokeRoundedRect(-75, -42, 150, 20, 10);

    const subText = this.add.text(0, -32, '★ PEGGLE ARCADE ★', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#00F0FF',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const logoMain = this.add.text(0, 5, 'BUBBLE\nSHOOTER', {
      fontFamily: 'Outfit, Space Grotesk, sans-serif',
      fontSize: '36px',
      fontStyle: '900',
      color: '#FFFFFF',
      align: 'center',
      lineSpacing: -6,
      letterSpacing: 2,
      stroke: '#0e1013',
      strokeThickness: 6,
    }).setOrigin(0.5);

    logoContainer.add([subPill, subText, logoMain]);

    this.tweens.add({
      targets: logoContainer,
      y: 145,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. Main Form Card
    const cardY = 475;
    const card = this.add.container(width / 2, cardY);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x0f131a, 0.96);
    cardBg.fillRoundedRect(-180, -220, 360, 440, 18);
    cardBg.lineStyle(2, 0x242d3c, 1);
    cardBg.strokeRoundedRect(-180, -220, 360, 440, 18);

    // Glowing top bar accent
    cardBg.lineStyle(3, 0x00f0ff, 1);
    cardBg.lineBetween(-100, -218, 100, -218);

    // 4. Tab Switchers
    const tabContainer = this.add.container(0, -170);

    this.tabLoginBg = this.add.graphics();
    this.tabLoginText = this.add.text(-80, 0, 'INICIAR SESIÓN', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#00F0FF',
    }).setOrigin(0.5);

    const tabLoginHit = this.add.zone(-80, 0, 150, 40).setInteractive({ useHandCursor: true });
    tabLoginHit.on('pointerdown', () => this.setMode(false));

    this.tabRegisterBg = this.add.graphics();
    this.tabRegisterText = this.add.text(80, 0, 'REGISTRARSE', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#718096',
    }).setOrigin(0.5);

    const tabRegisterHit = this.add.zone(80, 0, 150, 40).setInteractive({ useHandCursor: true });
    tabRegisterHit.on('pointerdown', () => this.setMode(true));

    tabContainer.add([this.tabLoginBg, this.tabRegisterBg, this.tabLoginText, this.tabRegisterText, tabLoginHit, tabRegisterHit]);
    this.updateTabsVisual();

    // 5. Username Input Field
    const userFieldContainer = this.add.container(0, -90);
    const userLabel = this.add.text(-150, -22, 'NOMBRE DE PILOTO', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#00F0FF',
      letterSpacing: 1,
    });

    const userBox = this.add.graphics();
    userBox.fillStyle(0x06080b, 1);
    userBox.fillRoundedRect(-150, 0, 300, 46, 8);
    userBox.lineStyle(1.5, 0x242d3c, 1);
    userBox.strokeRoundedRect(-150, 0, 300, 46, 8);

    this.usernameFieldText = this.add.text(-134, 14, this.usernameInput, {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });

    const userHit = this.add.zone(0, 23, 300, 46).setInteractive({ useHandCursor: true });
    userHit.on('pointerdown', () => {
      HapticsAdapter.impactLight();
      const val = prompt('Ingresa tu nombre de piloto:', this.usernameInput);
      if (val && val.trim().length > 0) {
        this.usernameInput = val.trim();
        this.usernameFieldText.setText(this.usernameInput);
      }
    });

    userFieldContainer.add([userLabel, userBox, this.usernameFieldText, userHit]);

    // 6. Email Input Field (Register only)
    this.emailContainer = this.add.container(0, -10);
    const emailLabel = this.add.text(-150, -22, 'CORREO ELECTRÓNICO (OPCIONAL)', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#FF0055',
      letterSpacing: 1,
    });

    const emailBox = this.add.graphics();
    emailBox.fillStyle(0x06080b, 1);
    emailBox.fillRoundedRect(-150, 0, 300, 46, 8);
    emailBox.lineStyle(1.5, 0x242d3c, 1);
    emailBox.strokeRoundedRect(-150, 0, 300, 46, 8);

    this.emailFieldText = this.add.text(-134, 14, this.emailInput, {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '15px',
      color: '#FFFFFF',
    });

    const emailHit = this.add.zone(0, 23, 300, 46).setInteractive({ useHandCursor: true });
    emailHit.on('pointerdown', () => {
      HapticsAdapter.impactLight();
      const val = prompt('Ingresa tu correo:', this.emailInput);
      if (val && val.trim().length > 0) {
        this.emailInput = val.trim();
        this.emailFieldText.setText(this.emailInput);
      }
    });

    this.emailContainer.add([emailLabel, emailBox, this.emailFieldText, emailHit]);
    this.emailContainer.setVisible(false);

    // 7. Primary Submit CTA
    const submitBtn = this.add.container(0, 80);
    const submitBg = this.add.graphics();
    submitBg.fillStyle(0x00f0ff, 1);
    submitBg.fillRoundedRect(-150, -25, 300, 50, 12);

    this.submitButtonText = this.add.text(0, 0, 'ENTRAR AL JUEGO', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
      color: '#06080b',
      letterSpacing: 1,
    }).setOrigin(0.5);

    submitBtn.add([submitBg, this.submitButtonText]);
    submitBtn.setSize(300, 50);
    submitBtn.setInteractive({ useHandCursor: true });

    submitBtn.on('pointerdown', () => {
      submitBtn.setScale(0.96);
      HapticsAdapter.impactHeavy();
    });

    submitBtn.on('pointerup', () => {
      submitBtn.setScale(1);
      this.handleSubmit();
    });

    submitBtn.on('pointerout', () => {
      submitBtn.setScale(1);
    });

    // 8. Fast Guest Button
    const guestBtn = this.add.container(0, 150);
    const guestBg = this.add.graphics();
    guestBg.fillStyle(0x181e28, 1);
    guestBg.fillRoundedRect(-150, -22, 300, 44, 10);
    guestBg.lineStyle(1.5, 0x242d3c, 1);
    guestBg.strokeRoundedRect(-150, -22, 300, 44, 10);

    const guestText = this.add.text(0, 0, 'JUGAR COMO INVITADO', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#A0AEC0',
      letterSpacing: 1,
    }).setOrigin(0.5);

    guestBtn.add([guestBg, guestText]);
    guestBtn.setSize(300, 44);
    guestBtn.setInteractive({ useHandCursor: true });

    guestBtn.on('pointerdown', () => {
      guestBtn.setScale(0.96);
      HapticsAdapter.impactLight();
    });

    guestBtn.on('pointerup', () => {
      guestBtn.setScale(1);
      AuthRepository.loginAsGuest();
      this.cameras.main.fadeOut(150, 7, 9, 12);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('HomeScene');
      });
    });

    guestBtn.on('pointerout', () => {
      guestBtn.setScale(1);
    });

    card.add([cardBg, tabContainer, userFieldContainer, this.emailContainer, submitBtn, guestBtn]);
  }

  private setMode(isRegister: boolean): void {
    if (this.isRegisterMode === isRegister) return;
    this.isRegisterMode = isRegister;
    HapticsAdapter.impactLight();
    this.updateTabsVisual();
    this.emailContainer.setVisible(isRegister);
    this.submitButtonText.setText(isRegister ? 'CREAR CUENTA' : 'ENTRAR AL JUEGO');
  }

  private updateTabsVisual(): void {
    this.tabLoginBg.clear();
    this.tabRegisterBg.clear();

    if (!this.isRegisterMode) {
      this.tabLoginBg.fillStyle(0x1a2332, 1);
      this.tabLoginBg.fillRoundedRect(-155, -16, 150, 32, 6);
      this.tabLoginBg.lineStyle(1.5, 0x00f0ff, 1);
      this.tabLoginBg.strokeRoundedRect(-155, -16, 150, 32, 6);
      this.tabLoginText.setColor('#00F0FF');
      this.tabRegisterText.setColor('#718096');
    } else {
      this.tabRegisterBg.fillStyle(0x1a2332, 1);
      this.tabRegisterBg.fillRoundedRect(5, -16, 150, 32, 6);
      this.tabRegisterBg.lineStyle(1.5, 0xff0055, 1);
      this.tabRegisterBg.strokeRoundedRect(5, -16, 150, 32, 6);
      this.tabRegisterText.setColor('#FF0055');
      this.tabLoginText.setColor('#718096');
    }
  }

  private handleSubmit(): void {
    if (this.isRegisterMode) {
      AuthRepository.register(this.usernameInput, this.emailInput);
    } else {
      AuthRepository.login(this.usernameInput);
    }

    HapticsAdapter.notificationSuccess();
    this.cameras.main.fadeOut(150, 7, 9, 12);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('HomeScene');
    });
  }
}
