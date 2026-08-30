import Phaser from 'phaser';
import { GameConfig } from './presentation/config/GameConfig';

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(GameConfig);
});
