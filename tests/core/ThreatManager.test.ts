import { describe, it, expect } from 'vitest';
import { ThreatManager } from '../../src/core/domain/rules/ThreatManager';

describe('ThreatManager ("Descenso Silencioso")', () => {
  it('should not increment misses on a successful match', () => {
    const threat = new ThreatManager({ maxMisses: 3 });

    const result = threat.registerShot(true);
    expect(result.currentMisses).toBe(0);
    expect(result.shouldShiftDown).toBe(false);
  });

  it('should increment misses on missed shot and trigger shiftDown on threshold', () => {
    const threat = new ThreatManager({ maxMisses: 3 });

    // Miss 1
    const r1 = threat.registerShot(false);
    expect(r1.currentMisses).toBe(1);
    expect(r1.shouldShiftDown).toBe(false);

    // Miss 2
    const r2 = threat.registerShot(false);
    expect(r2.currentMisses).toBe(2);
    expect(r2.shouldShiftDown).toBe(false);

    // Miss 3 (triggers shift down & resets counter)
    const r3 = threat.registerShot(false);
    expect(r3.shouldShiftDown).toBe(true);
    expect(r3.currentMisses).toBe(0);
  });
});
