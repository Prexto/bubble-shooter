import Phaser from 'phaser';
import { TextureGenerator } from '../graphics/TextureGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    // Zero static image loading! Everything generated dynamically.
  }

  public create(): void {
    // Generate all procedural in-memory vector textures
    TextureGenerator.generateAll(this);

    // Transition to AuthScene / HomeScene
    this.scene.start('AuthScene');
  }
}
