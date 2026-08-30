import { Bubble } from './Bubble';

export interface HexGridConfig {
  maxRows: number;
  evenCols: number; // e.g. 8
  oddCols: number;  // e.g. 7
  deathLineRow: number; // e.g. 11
}

export class HexGrid {
  public readonly config: HexGridConfig;
  private cells: Map<string, Bubble>;

  constructor(config?: Partial<HexGridConfig>) {
    this.config = {
      maxRows: config?.maxRows ?? 14,
      evenCols: config?.evenCols ?? 8,
      oddCols: config?.oddCols ?? 7,
      deathLineRow: config?.deathLineRow ?? 11,
    };
    this.cells = new Map<string, Bubble>();
  }

  public static getCoordKey(row: number, col: number): string {
    return `${row},${col}`;
  }

  public getColsInRow(row: number): number {
    return row % 2 === 0 ? this.config.evenCols : this.config.oddCols;
  }

  public isValidCoord(row: number, col: number): boolean {
    if (row < 0 || row >= this.config.maxRows) return false;
    const maxCols = this.getColsInRow(row);
    return col >= 0 && col < maxCols;
  }

  public getBubble(row: number, col: number): Bubble | null {
    if (!this.isValidCoord(row, col)) return null;
    return this.cells.get(HexGrid.getCoordKey(row, col)) ?? null;
  }

  public setBubble(bubble: Bubble): void {
    if (!this.isValidCoord(bubble.row, bubble.col)) {
      throw new Error(`Invalid grid coordinates: (${bubble.row}, ${bubble.col})`);
    }
    this.cells.set(HexGrid.getCoordKey(bubble.row, bubble.col), bubble);
  }

  public removeBubble(row: number, col: number): Bubble | null {
    const key = HexGrid.getCoordKey(row, col);
    const existing = this.cells.get(key);
    if (existing) {
      this.cells.delete(key);
      return existing;
    }
    return null;
  }

  public isEmpty(row: number, col: number): boolean {
    return this.isValidCoord(row, col) && !this.cells.has(HexGrid.getCoordKey(row, col));
  }

  public getAllBubbles(): Bubble[] {
    return Array.from(this.cells.values());
  }

  public getTopRowBubbles(): Bubble[] {
    const topBubbles: Bubble[] = [];
    const cols = this.getColsInRow(0);
    for (let c = 0; c < cols; c++) {
      const b = this.getBubble(0, c);
      if (b) topBubbles.push(b);
    }
    return topBubbles;
  }

  public shiftDown(newTopRowBubbles?: Bubble[]): Bubble[] {
    const shiftedBubbles: Bubble[] = [];
    const oldBubbles = this.getAllBubbles();
    this.cells.clear();

    for (const bubble of oldBubbles) {
      const newRow = bubble.row + 1;
      const newRowIsEven = newRow % 2 === 0;
      
      // Keep column alignment logic if needed
      let newCol = bubble.col;
      const maxCols = newRowIsEven ? this.config.evenCols : this.config.oddCols;
      if (newCol >= maxCols) {
        newCol = maxCols - 1;
      }

      bubble.setGridPosition(newRow, newCol);
      if (newRow < this.config.maxRows) {
        this.setBubble(bubble);
        shiftedBubbles.push(bubble);
      }
    }

    if (newTopRowBubbles) {
      for (const topBubble of newTopRowBubbles) {
        topBubble.setGridPosition(0, topBubble.col);
        this.setBubble(topBubble);
        shiftedBubbles.push(topBubble);
      }
    }

    return shiftedBubbles;
  }

  public getLowestRow(): number {
    let maxRow = -1;
    for (const bubble of this.cells.values()) {
      if (bubble.row > maxRow) {
        maxRow = bubble.row;
      }
    }
    return maxRow;
  }

  public clear(): void {
    this.cells.clear();
  }

  public count(): number {
    return this.cells.size;
  }
}
