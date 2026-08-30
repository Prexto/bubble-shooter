import { describe, it, expect } from 'vitest';
import { HexGrid } from '../../src/core/domain/models/HexGrid';
import { Bubble } from '../../src/core/domain/models/Bubble';
import { BubbleColor } from '../../src/core/domain/models/BubbleColor';
import { OrphanFinder } from '../../src/core/domain/algorithms/OrphanFinder';

describe('OrphanFinder (Peggle Disconnection Mechanic)', () => {
  it('should find bubbles not connected to row 0 (ceiling)', () => {
    const grid = new HexGrid();

    // Top connected bubble at row 0
    const topBubble = new Bubble({ id: 'top', row: 0, col: 0, color: BubbleColor.CYAN });
    // Connected child at row 1
    const childBubble = new Bubble({ id: 'child', row: 1, col: 0, color: BubbleColor.MAGENTA });
    
    // Floating isolated island at row 3
    const orphan1 = new Bubble({ id: 'orphan1', row: 3, col: 2, color: BubbleColor.YELLOW });
    const orphan2 = new Bubble({ id: 'orphan2', row: 3, col: 3, color: BubbleColor.YELLOW });

    grid.setBubble(topBubble);
    grid.setBubble(childBubble);
    grid.setBubble(orphan1);
    grid.setBubble(orphan2);

    const orphans = OrphanFinder.findOrphans(grid);
    expect(orphans.length).toBe(2);
    expect(orphans.map((b) => b.id)).toEqual(expect.arrayContaining(['orphan1', 'orphan2']));
    expect(orphans.map((b) => b.id)).not.toContain('top');
    expect(orphans.map((b) => b.id)).not.toContain('child');
  });

  it('should return empty list when all bubbles are anchored to the ceiling', () => {
    const grid = new HexGrid();

    const b1 = new Bubble({ id: '1', row: 0, col: 0, color: BubbleColor.LIME });
    const b2 = new Bubble({ id: '2', row: 1, col: 0, color: BubbleColor.LIME });
    const b3 = new Bubble({ id: '3', row: 2, col: 0, color: BubbleColor.LIME });

    grid.setBubble(b1);
    grid.setBubble(b2);
    grid.setBubble(b3);

    const orphans = OrphanFinder.findOrphans(grid);
    expect(orphans.length).toBe(0);
  });
});
