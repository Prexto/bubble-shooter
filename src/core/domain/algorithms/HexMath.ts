import { HexGrid } from '../models/HexGrid';

export interface HexCoord {
  row: number;
  col: number;
}

export interface PixelPoint {
  x: number;
  y: number;
}

export interface HexMetrics {
  bubbleRadius: number;
  startX: number;
  startY: number;
  rowHeight: number;
  bubbleDiameter: number;
}

export class HexMath {
  public static calculateMetrics(
    gridWidth: number,
    evenCols: number = 8,
    startY: number = 40
  ): HexMetrics {
    const bubbleDiameter = gridWidth / evenCols;
    const bubbleRadius = bubbleDiameter / 2;
    // In equilateral hexagonal packing, vertical pitch is radius * sqrt(3)
    const rowHeight = bubbleRadius * Math.sqrt(3);
    const startX = bubbleRadius;

    return {
      bubbleRadius,
      startX,
      startY,
      rowHeight,
      bubbleDiameter,
    };
  }

  public static hexToPixel(coord: HexCoord, metrics: HexMetrics): PixelPoint {
    const isOdd = coord.row % 2 !== 0;
    const offsetX = isOdd ? metrics.bubbleRadius : 0;
    const x = metrics.startX + offsetX + coord.col * metrics.bubbleDiameter;
    const y = metrics.startY + coord.row * metrics.rowHeight;
    return { x, y };
  }

  public static getNeighborCoords(row: number, col: number, grid?: HexGrid): HexCoord[] {
    const isEven = row % 2 === 0;
    const candidates: HexCoord[] = isEven
      ? [
          { row, col: col - 1 },         // Left
          { row, col: col + 1 },         // Right
          { row: row - 1, col: col - 1 }, // Top-Left
          { row: row - 1, col },         // Top-Right
          { row: row + 1, col: col - 1 }, // Bottom-Left
          { row: row + 1, col },         // Bottom-Right
        ]
      : [
          { row, col: col - 1 },         // Left
          { row, col: col + 1 },         // Right
          { row: row - 1, col },         // Top-Left
          { row: row - 1, col: col + 1 }, // Top-Right
          { row: row + 1, col },         // Bottom-Left
          { row: row + 1, col: col + 1 }, // Bottom-Right
        ];

    if (!grid) {
      return candidates;
    }

    return candidates.filter((c) => grid.isValidCoord(c.row, c.col));
  }

  public static pixelToHex(
    point: PixelPoint,
    metrics: HexMetrics,
    grid: HexGrid
  ): HexCoord {
    const approxRow = Math.round((point.y - metrics.startY) / metrics.rowHeight);
    const clampedRow = Math.max(0, Math.min(approxRow, grid.config.maxRows - 1));

    let closestCoord: HexCoord = { row: 0, col: 0 };
    let minDistanceSq = Number.MAX_VALUE;

    // Check candidate rows around the approximate row
    const rowMin = Math.max(0, clampedRow - 1);
    const rowMax = Math.min(grid.config.maxRows - 1, clampedRow + 1);

    for (let r = rowMin; r <= rowMax; r++) {
      const cols = grid.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        const cellPixel = HexMath.hexToPixel({ row: r, col: c }, metrics);
        const dx = point.x - cellPixel.x;
        const dy = point.y - cellPixel.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          closestCoord = { row: r, col: c };
        }
      }
    }

    return closestCoord;
  }

  public static findClosestEmptyNeighbor(
    impactPoint: PixelPoint,
    targetRow: number,
    targetCol: number,
    metrics: HexMetrics,
    grid: HexGrid
  ): HexCoord | null {
    const neighbors = HexMath.getNeighborCoords(targetRow, targetCol, grid);
    const emptyNeighbors = neighbors.filter((n) => grid.isEmpty(n.row, n.col));

    if (emptyNeighbors.length === 0) {
      return null;
    }

    let closest: HexCoord = emptyNeighbors[0]!;
    let minDistSq = Number.MAX_VALUE;

    for (const neighbor of emptyNeighbors) {
      const cellPos = HexMath.hexToPixel(neighbor, metrics);
      const dx = impactPoint.x - cellPos.x;
      const dy = impactPoint.y - cellPos.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = neighbor;
      }
    }

    return closest;
  }
}
