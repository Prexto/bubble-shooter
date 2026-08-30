export enum BubbleColor {
  CYAN = 'CYAN',
  MAGENTA = 'MAGENTA',
  YELLOW = 'YELLOW',
  LIME = 'LIME',
  PURPLE = 'PURPLE',
  ORANGE = 'ORANGE',
}

export interface BubbleColorConfig {
  name: BubbleColor;
  hex: number;
  hexString: string;
  glowHex: string;
}

export const BUBBLE_COLOR_PALETTE: Record<BubbleColor, BubbleColorConfig> = {
  [BubbleColor.CYAN]: {
    name: BubbleColor.CYAN,
    hex: 0x00f0ff,
    hexString: '#00F0FF',
    glowHex: 'rgba(0, 240, 255, 0.4)',
  },
  [BubbleColor.MAGENTA]: {
    name: BubbleColor.MAGENTA,
    hex: 0xff0055,
    hexString: '#FF0055',
    glowHex: 'rgba(255, 0, 85, 0.4)',
  },
  [BubbleColor.YELLOW]: {
    name: BubbleColor.YELLOW,
    hex: 0xffe600,
    hexString: '#FFE600',
    glowHex: 'rgba(255, 230, 0, 0.4)',
  },
  [BubbleColor.LIME]: {
    name: BubbleColor.LIME,
    hex: 0x00ff66,
    hexString: '#00FF66',
    glowHex: 'rgba(0, 255, 102, 0.4)',
  },
  [BubbleColor.PURPLE]: {
    name: BubbleColor.PURPLE,
    hex: 0xb026ff,
    hexString: '#B026FF',
    glowHex: 'rgba(176, 38, 255, 0.4)',
  },
  [BubbleColor.ORANGE]: {
    name: BubbleColor.ORANGE,
    hex: 0xff7700,
    hexString: '#FF7700',
    glowHex: 'rgba(255, 119, 0, 0.4)',
  },
};

export const ACTIVE_GAME_COLORS: BubbleColor[] = [
  BubbleColor.CYAN,
  BubbleColor.MAGENTA,
  BubbleColor.YELLOW,
  BubbleColor.LIME,
  BubbleColor.PURPLE,
];
