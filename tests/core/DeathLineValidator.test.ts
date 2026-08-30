import { describe, it, expect } from 'vitest';
import { HexGrid } from '../../src/core/domain/models/HexGrid';
import { Bubble } from '../../src/core/domain/models/Bubble';
import { BubbleColor } from '../../src/core/domain/models/BubbleColor';
import { DeathLineValidator } from '../../src/core/domain/rules/DeathLineValidator';

describe('DeathLineValidator', () => {
  it('should report safe when bubbles are far above death line', () => {
    const grid = new HexGrid({ deathLineRow: 10 });
    grid.setBubble(new Bubble({ id: '1', row: 3, col: 0, color: BubbleColor.CYAN }));

    const status = DeathLineValidator.checkDanger(grid);
    expect(status.isGameOver).toBe(false);
    expect(status.isDangerClose).toBe(false);
    expect(status.rowsRemaining).toBe(7);
  });

  it('should report danger close when bubbles are 1 or 2 rows away', () => {
    const grid = new HexGrid({ deathLineRow: 10 });
    grid.setBubble(new Bubble({ id: '1', row: 8, col: 0, color: BubbleColor.CYAN }));

    const status = DeathLineValidator.checkDanger(grid);
    expect(status.isGameOver).toBe(false);
    expect(status.isDangerClose).toBe(true);
    expect(status.rowsRemaining).toBe(2);
  });

  it('should report game over when bubbles reach or exceed death line row', () => {
    const grid = new HexGrid({ deathLineRow: 10 });
    grid.setBubble(new Bubble({ id: '1', row: 10, col: 0, color: BubbleColor.CYAN }));

    const status = DeathLineValidator.checkDanger(grid);
    expect(status.isGameOver).toBe(true);
    expect(status.rowsRemaining).toBe(0);
  });
});
