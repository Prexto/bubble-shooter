import { HexCoord, HexMath, HexMetrics, PixelPoint } from '../domain/algorithms/HexMath';
import { HexGrid } from '../domain/models/HexGrid';

export class SnapBubbleUseCase {
  public static execute(
    impactPoint: PixelPoint,
    hitBubbleCoord: HexCoord | null,
    metrics: HexMetrics,
    grid: HexGrid
  ): HexCoord | null {
    // Case 1: Hit existing bubble in grid
    if (hitBubbleCoord) {
      const neighborSlot = HexMath.findClosestEmptyNeighbor(
        impactPoint,
        hitBubbleCoord.row,
        hitBubbleCoord.col,
        metrics,
        grid
      );
      if (neighborSlot) {
        return neighborSlot;
      }
    }

    // Case 2: Hit ceiling directly (row 0)
    if (impactPoint.y <= metrics.startY + metrics.rowHeight * 0.5) {
      const cols = grid.getColsInRow(0);
      let closestCol = 0;
      let minDistance = Number.MAX_VALUE;

      for (let c = 0; c < cols; c++) {
        if (grid.isEmpty(0, c)) {
          const cellPixel = HexMath.hexToPixel({ row: 0, col: c }, metrics, grid.topParity);
          const dx = Math.abs(impactPoint.x - cellPixel.x);
          if (dx < minDistance) {
            minDistance = dx;
            closestCol = c;
          }
        }
      }

      if (minDistance < Number.MAX_VALUE) {
        return { row: 0, col: closestCol };
      }
    }

    // Case 3: Fallback closest empty cell near impact
    const approx = HexMath.pixelToHex(impactPoint, metrics, grid);
    if (grid.isEmpty(approx.row, approx.col)) {
      return approx;
    }

    const fallbackNeighbors = HexMath.findClosestEmptyNeighbor(
      impactPoint,
      approx.row,
      approx.col,
      metrics,
      grid
    );

    return fallbackNeighbors;
  }
}
