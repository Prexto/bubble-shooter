import { Bubble } from '../models/Bubble';
import { HexGrid } from '../models/HexGrid';
import { HexMath } from './HexMath';

export class OrphanFinder {
  /**
   * Identifies all bubbles that are no longer anchored to the ceiling (row 0).
   * Uses multi-source BFS starting from all active bubbles at row 0.
   */
  public static findOrphans(grid: HexGrid): Bubble[] {
    const visited = new Set<string>();
    const queue: { row: number; col: number }[] = [];

    // Seed BFS with all bubbles anchored to the ceiling (row 0)
    const topCols = grid.getColsInRow(0);
    for (let c = 0; c < topCols; c++) {
      const bubble = grid.getBubble(0, c);
      if (bubble) {
        const key = HexGrid.getCoordKey(0, c);
        visited.add(key);
        queue.push({ row: 0, col: c });
      }
    }

    // Traverse all reachable bubbles connected to row 0
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = HexMath.getNeighborCoords(current.row, current.col, grid);

      for (const neighbor of neighbors) {
        const key = HexGrid.getCoordKey(neighbor.row, neighbor.col);
        if (!visited.has(key)) {
          const neighborBubble = grid.getBubble(neighbor.row, neighbor.col);
          if (neighborBubble) {
            visited.add(key);
            queue.push(neighbor);
          }
        }
      }
    }

    // Any bubble in the grid that wasn't visited is an orphan
    const allBubbles = grid.getAllBubbles();
    const orphans: Bubble[] = [];

    for (const bubble of allBubbles) {
      const key = HexGrid.getCoordKey(bubble.row, bubble.col);
      if (!visited.has(key)) {
        bubble.markFalling();
        orphans.push(bubble);
      }
    }

    return orphans;
  }
}
