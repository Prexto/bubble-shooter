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

    // 1. Background with Grid Pattern
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0c0f, 1);
    bg.fillRect(0, 0, width, height);

    // Subtle dark cyber grid lines
    bg.lineStyle(1, 0x161c24, 0.6);
    for (let x = 0; x < width; x += 40) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      bg.lineBetween(0, y, width, y);
    }

    // 2. Animated Floating Logo / Title
    const logoContainer = this.add.container(width / 2, 140);
    const logoSub = this.add.text(0, -35, 'ARCADE FLAT', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#00F0FF',
      letterSpacing: 6,
    }).setOrigin(0.5);

    const logoMain = this.add.text(0, 0, 'BUBBLE\nSHOOTER', {
      fontFamily: 'Outfit, Space Grotesk, sans-serif',
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      align: 'center',
      lineSpacing: -4,
      stroke: '#0e1013',
      strokeThickness: 6,
    }).setOrigin(0.5);

    logoContainer.add([logoSub, logoMain]);

    this.tweens.add({
      targets: logoContainer,
      y: 146,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. Main Form Card
    const cardY = 470;
    const card = this.add.container(width / 2, cardY);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x13171f, 0.96);
    cardBg.fillRoundedRect(-180, -220, 360, 440, 16);
    cardBg.lineStyle(2, 0x242d3b, 1);
    cardBg.strokeRoundedRect(-180, -220, 360, 440, 16);

    // 4. Tab Switchers (LOGIN vs REGISTER)
    const tabContainer = this.add.container(0, -175);

    // Login Tab Button
    this.tabLoginBg = this.add.graphics();
    this.tabLoginText = this.add.text(-80, 0, 'INICIAR SESIÓN', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#00F0FF',
    }).setOrigin(0.5);

    const tabLoginHit = this.add.zone(-80, 0, 150, 40).setInteractive({ useHandCursor: true });
    tabLoginHit.on('pointerdown', () => this.setMode(false));

    // Register Tab Button
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
    const userFieldContainer = this.add.container(0, -95);
    const userLabel = this.add.text(-150, -22, 'NOMBRE DE USUARIO', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#00F0FF',
    });

    const userBox = this.add.graphics();
    userBox.fillStyle(0x0e1117, 1);
    userBox.fillRoundedRect(-150, 0, 300, 44, 8);
    userBox.lineStyle(1.5, 0x2d3748, 1);
    userBox.strokeRoundedRect(-150, 0, 300, 44, 8);

    this.usernameFieldText = this.add.text(-136, 12, this.usernameInput, {
      fontFamily: 'Outfit, Space Grotesk, sans-serif',
      fontSize: '15px',
      color: '#FFFFFF',
    });

    const userHit = this.add.zone(0, 22, 300, 44).setInteractive({ useHandCursor: true });
    userHit.on('pointerdown', () => {
      HapticsAdapter.impactLight();
      const val = prompt('Ingresa tu nombre de usuario:', this.usernameInput);
      if (val && val.trim().length > 0) {
        this.usernameInput = val.trim();
        this.usernameFieldText.setText(this.usernameInput);
      }
    });

    userFieldContainer.add([userLabel, userBox, this.usernameFieldText, userHit]);

    // 6. Email Input Field (Only in Register mode)
    this.emailContainer = this.add.container(0, -15);
    const emailLabel = this.add.text(-150, -22, 'CORREO ELECTRÓNICO (OPCIONAL)', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#FF0055',
    });

    const emailBox = this.add.graphics();
    emailBox.fillStyle(0x0e1117, 1);
    emailBox.fillRoundedRect(-150, 0, 300, 44, 8);
    emailBox.lineStyle(1.5, 0x2d3748, 1);
    emailBox.strokeRoundedRect(-150, 0, 300, 44, 8);

    this.emailFieldText = this.add.text(-136, 12, this.emailInput, {
      fontFamily: 'Outfit, Space Grotesk, sans-serif',
      fontSize: '15px',
      color: '#FFFFFF',
    });

    const emailHit = this.add.zone(0, 22, 300, 44).setInteractive({ useHandCursor: true });
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

    // 7. Primary Action Button
    const submitBtn = this.add.container(0, 75);
    const submitBg = this.add.graphics();
    submitBg.fillStyle(0x00f0ff, 1);
    submitBg.fillRoundedRect(-150, -24, 300, 48, 10);

    this.submitButtonText = this.add.text(0, 0, 'ENTRAR AL JUEGO', {
      fontFamily: 'Space Grotesk, Outfit, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#0a0c0f',
    }).setOrigin(0.5);

    submitBtn.add([submitBg, this.submitButtonText]);
    submitBtn.setSize(300, 48);
    submitBtn.setInteractive({ useHandCursor: true });

    submitBtn.on('pointerdown', () => {
      submitBtn.setScale(0.96);
      HapticsAdapter.impactMedium();
    });

    submitBtn.on('pointerup', () => {
      submitBtn.setScale(1);
      this.handleSubmit();
    });

    submitBtn.on('pointerout', () => {
      submitBtn.setScale(1);
    });

    // 8. Guest Action Button
    const guestBtn = this.add.container(0, 145);
    const guestBg = this.add.graphics();
    guestBg.fillStyle(0x1a212d, 1);
    guestBg.fillRoundedRect(-150, -20, 300, 40, 8);
    guestBg.lineStyle(1.5, 0x2d3748, 1);
    guestBg.strokeRoundedRect(-150, -20, 300, 40, 8);

    const guestText = this.add.text(0, 0, 'JUGAR COMO INVITADO', {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#A0AEC0',
    }).setOrigin(0.5);

    guestBtn.add([guestBg, guestText]);
    guestBtn.setSize(300, 40);
    guestBtn.setInteractive({ useHandCursor: true });

    guestBtn.on('pointerdown', () => {
      guestBtn.setScale(0.96);
      HapticsAdapter.impactLight();
    });

    guestBtn.on('pointerup', () => {
      guestBtn.setScale(1);
      AuthRepository.loginAsGuest();
      this.scene.start('HomeScene');
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
      // Login active
      this.tabLoginBg.fillStyle(0x1a2332, 1);
      this.tabLoginBg.fillRoundedRect(-155, -16, 150, 32, 6);
      this.tabLoginBg.lineStyle(1.5, 0x00f0ff, 1);
      this.tabLoginBg.strokeRoundedRect(-155, -16, 150, 32, 6);
      this.tabLoginText.setColor('#00F0FF');
      this.tabRegisterText.setColor('#718096');
    } else {
      // Register active
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
    this.scene.start('HomeScene');
  }
}
