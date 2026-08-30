export interface MultiplierBucketProps {
  index: number;
  multiplier: number;
  label: string;
  baseScore: number;
  colorHex: number;
}

export class MultiplierBucket {
  public readonly index: number;
  public readonly multiplier: number;
  public readonly label: string;
  public readonly baseScore: number;
  public readonly colorHex: number;

  constructor(props: MultiplierBucketProps) {
    this.index = props.index;
    this.multiplier = props.multiplier;
    this.label = props.label;
    this.baseScore = props.baseScore;
    this.colorHex = props.colorHex;
  }

  public calculateScore(): number {
    return this.baseScore * this.multiplier;
  }
}

export const DEFAULT_MULTIPLIER_BUCKETS: MultiplierBucket[] = [
  new MultiplierBucket({ index: 0, multiplier: 2, label: 'x2', baseScore: 100, colorHex: 0x00f0ff }),
  new MultiplierBucket({ index: 1, multiplier: 3, label: 'x3', baseScore: 100, colorHex: 0xff0055 }),
  new MultiplierBucket({ index: 2, multiplier: 5, label: 'x5', baseScore: 100, colorHex: 0xffe600 }),
  new MultiplierBucket({ index: 3, multiplier: 3, label: 'x3', baseScore: 100, colorHex: 0xff0055 }),
  new MultiplierBucket({ index: 4, multiplier: 2, label: 'x2', baseScore: 100, colorHex: 0x00f0ff }),
];
