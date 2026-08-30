import { Bubble } from './Bubble';

export interface HexGridConfig {
  maxRows: number;
  evenCols: number; // 8
  oddCols: number;  // 7
  deathLineRow: number; // 11
}

export class HexGrid {
  public readonly config: HexGridConfig;
  private cells: Map<string, Bubble>;
  public topParity: number; // 0 = row 0 has evenCols (8), 1 = row 0 has oddCols (7)

  constructor(config?: Partial<HexGridConfig>, initialTopParity: number = 0) {
    this.config = {
      maxRows: config?.maxRows ?? 14,
      evenCols: config?.evenCols ?? 8,
      oddCols: config?.oddCols ?? 7,
      deathLineRow: config?.deathLineRow ?? 11,
    };
    this.cells = new Map<string, Bubble>();
    this.topParity = initialTopParity;
  }

  public static getCoordKey(row: number, col: number): string {
    return `${row},${col}`;
  }

  /**
   * Returns 0 for even-style row (8 columns, no X offset), 1 for odd-style row (7 columns, +R offset)
   */
  public getRowParity(row: number): number {
    return (row + this.topParity) % 2;
  }

  public getColsInRow(row: number): number {
    return this.getRowParity(row) === 0 ? this.config.evenCols : this.config.oddCols;
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
      throw new Error(`Invalid grid coordinates: (${bubble.row}, ${bubble.col}) with parity ${this.topParity}`);
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

  /**
   * Shifts the grid down by 1 row.
   * Flips topParity so that existing bubbles maintain their EXACT horizontal column position (no X shifting or column truncation).
   */
  public shiftDown(newTopRowBubbles?: Bubble[]): { shifted: Bubble[]; newRow: Bubble[] } {
    const oldBubbles = this.getAllBubbles();
    this.cells.clear();

    // Toggle top parity (e.g. 0 -> 1 -> 0)
    this.topParity = (this.topParity + 1) % 2;

    const shifted: Bubble[] = [];
    for (const bubble of oldBubbles) {
      const newRow = bubble.row + 1;
      bubble.setGridPosition(newRow, bubble.col);
      if (newRow < this.config.maxRows) {
        this.setBubble(bubble);
        shifted.push(bubble);
      }
    }

    const newRow: Bubble[] = [];
    if (newTopRowBubbles) {
      for (const topBubble of newTopRowBubbles) {
        topBubble.setGridPosition(0, topBubble.col);
        this.setBubble(topBubble);
        newRow.push(topBubble);
      }
    }

    return { shifted, newRow };
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
