import { BubbleColor } from './BubbleColor';

export type BubbleState = 'grid' | 'shooting' | 'falling' | 'popping' | 'idle_launcher';

export interface BubbleProps {
  id: string;
  row: number;
  col: number;
  color: BubbleColor;
  state?: BubbleState;
}

export class Bubble {
  public readonly id: string;
  public row: number;
  public col: number;
  public readonly color: BubbleColor;
  public state: BubbleState;

  constructor(props: BubbleProps) {
    this.id = props.id;
    this.row = props.row;
    this.col = props.col;
    this.color = props.color;
    this.state = props.state ?? 'grid';
  }

  public setGridPosition(row: number, col: number): void {
    this.row = row;
    this.col = col;
    this.state = 'grid';
  }

  public markFalling(): void {
    this.state = 'falling';
  }

  public markPopping(): void {
    this.state = 'popping';
  }

  public clone(): Bubble {
    return new Bubble({
      id: this.id,
      row: this.row,
      col: this.col,
      color: this.color,
      state: this.state,
    });
  }
}
