import { describe, it, expect } from 'vitest';
import { HexGrid } from '../../src/core/domain/models/HexGrid';
import { Bubble } from '../../src/core/domain/models/Bubble';
import { BubbleColor } from '../../src/core/domain/models/BubbleColor';
import { MatchFinder } from '../../src/core/domain/algorithms/MatchFinder';

describe('MatchFinder BFS Algorithm', () => {
  it('should return matched bubbles when cluster size >= 3', () => {
    const grid = new HexGrid();

    // Create 3 adjacent CYAN bubbles
    const b1 = new Bubble({ id: '1', row: 0, col: 0, color: BubbleColor.CYAN });
    const b2 = new Bubble({ id: '2', row: 0, col: 1, color: BubbleColor.CYAN });
    const b3 = new Bubble({ id: '3', row: 1, col: 0, color: BubbleColor.CYAN });
    // Adjacent MAGENTA bubble
    const b4 = new Bubble({ id: '4', row: 0, col: 2, color: BubbleColor.MAGENTA });

    grid.setBubble(b1);
    grid.setBubble(b2);
    grid.setBubble(b3);
    grid.setBubble(b4);

    const matches = MatchFinder.findMatches(0, 0, grid, 3);
    expect(matches.length).toBe(3);
    expect(matches.map((b) => b.id)).toEqual(expect.arrayContaining(['1', '2', '3']));
    expect(matches.map((b) => b.id)).not.toContain('4');
  });

  it('should return empty list when cluster size < 3', () => {
    const grid = new HexGrid();

    // Only 2 adjacent YELLOW bubbles
    const b1 = new Bubble({ id: '1', row: 0, col: 0, color: BubbleColor.YELLOW });
    const b2 = new Bubble({ id: '2', row: 0, col: 1, color: BubbleColor.YELLOW });
    const b3 = new Bubble({ id: '3', row: 0, col: 2, color: BubbleColor.LIME });

    grid.setBubble(b1);
    grid.setBubble(b2);
    grid.setBubble(b3);

    const matches = MatchFinder.findMatches(0, 0, grid, 3);
    expect(matches.length).toBe(0);
  });
});
