import { Bubble } from '../models/Bubble';
import { HexGrid } from '../models/HexGrid';
import { HexMath } from './HexMath';

export class MatchFinder {
  public static findMatches(
    startRow: number,
    startCol: number,
    grid: HexGrid,
    minMatchCount: number = 3
  ): Bubble[] {
    const originBubble = grid.getBubble(startRow, startCol);
    if (!originBubble) return [];

    const targetColor = originBubble.color;
    const visited = new Set<string>();
    const matchedBubbles: Bubble[] = [];
    const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }];

    visited.add(HexGrid.getCoordKey(startRow, startCol));

    while (queue.length > 0) {
      const current = queue.shift()!;
      const bubble = grid.getBubble(current.row, current.col);

      if (bubble && bubble.color === targetColor) {
        matchedBubbles.push(bubble);

        const neighbors = HexMath.getNeighborCoords(current.row, current.col, grid);
        for (const neighbor of neighbors) {
          const key = HexGrid.getCoordKey(neighbor.row, neighbor.col);
          if (!visited.has(key)) {
            visited.add(key);
            const neighborBubble = grid.getBubble(neighbor.row, neighbor.col);
            if (neighborBubble && neighborBubble.color === targetColor) {
              queue.push(neighbor);
            }
          }
        }
      }
    }

    if (matchedBubbles.length >= minMatchCount) {
      return matchedBubbles;
    }

    return [];
  }
}
