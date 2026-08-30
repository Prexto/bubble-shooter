import { MultiplierBucket } from './MultiplierBucket';

export enum GameModeType {
  CLASSIC_ARCADE = 'CLASSIC_ARCADE',
  TIME_ATTACK = 'TIME_ATTACK',
  PEGGLE_FEVER = 'PEGGLE_FEVER',
}

export interface GameModeConfig {
  type: GameModeType;
  title: string;
  subtitle: string;
  tag: string;
  accentColorHex: number;
  accentColorStr: string;
  description: string;
  timeLimitSec?: number;
  maxShots?: number;
  maxMissesBeforeDescent?: number;
  buckets: MultiplierBucket[];
}

export const GAME_MODES: Record<GameModeType, GameModeConfig> = {
  [GameModeType.CLASSIC_ARCADE]: {
    type: GameModeType.CLASSIC_ARCADE,
    title: 'ARCADE CLÁSICO',
    subtitle: 'SUPERVIVENCIA',
    tag: 'SURVIVAL',
    accentColorHex: 0x00f0ff,
    accentColorStr: '#00F0FF',
    description: 'El panal desciende con cada 5 fallos. ¡Sobrevive tanto como puedas!',
    maxMissesBeforeDescent: 5,
    buckets: [
      new MultiplierBucket({ index: 0, multiplier: 2, label: 'x2', baseScore: 100, colorHex: 0x00f0ff }),
      new MultiplierBucket({ index: 1, multiplier: 3, label: 'x3', baseScore: 100, colorHex: 0xff0055 }),
      new MultiplierBucket({ index: 2, multiplier: 5, label: 'x5', baseScore: 100, colorHex: 0xffe600 }),
      new MultiplierBucket({ index: 3, multiplier: 3, label: 'x3', baseScore: 100, colorHex: 0xff0055 }),
      new MultiplierBucket({ index: 4, multiplier: 2, label: 'x2', baseScore: 100, colorHex: 0x00f0ff }),
    ],
  },
  [GameModeType.TIME_ATTACK]: {
    type: GameModeType.TIME_ATTACK,
    title: 'TIME ATTACK',
    subtitle: 'FRENESÍ 60s',
    tag: 'SPEED',
    accentColorHex: 0xffe600,
    accentColorStr: '#FFE600',
    description: '¡60 segundos sin límite de tiros! Encadena combos a máxima velocidad.',
    timeLimitSec: 60,
    buckets: [
      new MultiplierBucket({ index: 0, multiplier: 3, label: 'x3', baseScore: 150, colorHex: 0xffe600 }),
      new MultiplierBucket({ index: 1, multiplier: 5, label: 'x5', baseScore: 150, colorHex: 0xff0055 }),
      new MultiplierBucket({ index: 2, multiplier: 8, label: 'x8', baseScore: 150, colorHex: 0x00f0ff }),
      new MultiplierBucket({ index: 3, multiplier: 5, label: 'x5', baseScore: 150, colorHex: 0xff0055 }),
      new MultiplierBucket({ index: 4, multiplier: 3, label: 'x3', baseScore: 150, colorHex: 0xffe600 }),
    ],
  },
  [GameModeType.PEGGLE_FEVER]: {
    type: GameModeType.PEGGLE_FEVER,
    title: 'PEGGLE FEVER',
    subtitle: 'PACHINKO MANIA',
    tag: 'JACKPOT',
    accentColorHex: 0xb026ff,
    accentColorStr: '#B026FF',
    description: 'Solo 15 tiros tácticos con mega multiplicadores hasta x25 en la base.',
    maxShots: 15,
    buckets: [
      new MultiplierBucket({ index: 0, multiplier: 5, label: 'x5', baseScore: 200, colorHex: 0xb026ff }),
      new MultiplierBucket({ index: 1, multiplier: 10, label: 'x10', baseScore: 200, colorHex: 0xff0055 }),
      new MultiplierBucket({ index: 2, multiplier: 25, label: 'x25', baseScore: 200, colorHex: 0xffe600 }),
      new MultiplierBucket({ index: 3, multiplier: 10, label: 'x10', baseScore: 200, colorHex: 0xff0055 }),
      new MultiplierBucket({ index: 4, multiplier: 5, label: 'x5', baseScore: 200, colorHex: 0xb026ff }),
    ],
  },
};
