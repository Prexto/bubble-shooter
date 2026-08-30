import { describe, it, expect } from 'vitest';
import { HexGrid } from '../../src/core/domain/models/HexGrid';
import { Bubble } from '../../src/core/domain/models/Bubble';
import { BubbleColor } from '../../src/core/domain/models/BubbleColor';
import { ThreatManager } from '../../src/core/domain/rules/ThreatManager';
import { ProcessGridMatchesUseCase } from '../../src/core/usecases/ProcessGridMatchesUseCase';

describe('ProcessGridMatchesUseCase Orchestration', () => {
  it('should process match of 3 bubbles and detach hanging orphans', () => {
    const grid = new HexGrid();
    const threat = new ThreatManager({ maxMisses: 5 });

    // Existing cluster at top
    const b1 = new Bubble({ id: '1', row: 0, col: 0, color: BubbleColor.CYAN });
    const b2 = new Bubble({ id: '2', row: 0, col: 1, color: BubbleColor.CYAN });
    // An orphan that only hangs from b2
    const hangingOrphan = new Bubble({ id: 'hang', row: 1, col: 1, color: BubbleColor.YELLOW });

    grid.setBubble(b1);
    grid.setBubble(b2);
    grid.setBubble(hangingOrphan);

    // Shooting bubble b3 (CYAN) into (1, 0) adjacent to b1 and b2
    const b3 = new Bubble({ id: '3', row: 1, col: 0, color: BubbleColor.CYAN });

    const result = ProcessGridMatchesUseCase.execute(b3, grid, threat);

    expect(result.wasMatch).toBe(true);
    expect(result.matchedBubbles.length).toBe(3);
    // hangingOrphan was detached because (0, 0), (0, 1), and (1, 0) were popped
    expect(result.orphanBubbles.length).toBe(1);
    expect(result.orphanBubbles[0]?.id).toBe('hang');
    expect(grid.count()).toBe(0);
  });

  it('should register miss and trigger grid shift down when threat threshold is reached', () => {
    const grid = new HexGrid();
    const threat = new ThreatManager({ maxMisses: 2 });

    const b1 = new Bubble({ id: '1', row: 0, col: 0, color: BubbleColor.CYAN });
    grid.setBubble(b1);

    // Shot 1: Miss
    const miss1 = new Bubble({ id: 'm1', row: 0, col: 1, color: BubbleColor.MAGENTA });
    const res1 = ProcessGridMatchesUseCase.execute(miss1, grid, threat);
    expect(res1.wasMatch).toBe(false);
    expect(res1.threatStatus.shouldShiftDown).toBe(false);

    // Shot 2: Miss (hits threshold 2)
    const miss2 = new Bubble({ id: 'm2', row: 0, col: 2, color: BubbleColor.YELLOW });
    const res2 = ProcessGridMatchesUseCase.execute(miss2, grid, threat, (cols) => {
      const newRow: Bubble[] = [];
      for (let c = 0; c < cols; c++) {
        newRow.push(new Bubble({ id: `new_${c}`, row: 0, col: c, color: BubbleColor.LIME }));
      }
      return newRow;
    });

    expect(res2.wasMatch).toBe(false);
    expect(res2.threatStatus.shouldShiftDown).toBe(true);
    expect(res2.shiftedBubbles).toBeDefined();
    // Verify previous bubbles moved to row 1
    const shiftedB1 = grid.getBubble(1, 0);
    expect(shiftedB1?.color).toBe(BubbleColor.CYAN);
  });
});
