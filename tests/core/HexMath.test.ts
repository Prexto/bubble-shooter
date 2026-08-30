import { describe, it, expect } from 'vitest';
import { HexMath } from '../../src/core/domain/algorithms/HexMath';
import { HexGrid } from '../../src/core/domain/models/HexGrid';

describe('HexMath & HexGrid Geometry', () => {
  it('should calculate metrics based on grid width and column count', () => {
    const metrics = HexMath.calculateMetrics(400, 8, 50);
    expect(metrics.bubbleDiameter).toBe(50);
    expect(metrics.bubbleRadius).toBe(25);
    expect(metrics.startX).toBe(25);
    expect(metrics.startY).toBe(50);
    expect(metrics.rowHeight).toBeCloseTo(25 * Math.sqrt(3), 4);
  });

  it('should convert even row coordinates to pixel positions without offset', () => {
    const metrics = HexMath.calculateMetrics(400, 8, 0);
    const pixel = HexMath.hexToPixel({ row: 0, col: 2 }, metrics);
    expect(pixel.x).toBe(25 + 2 * 50); // 125
    expect(pixel.y).toBe(0);
  });

  it('should convert odd row coordinates to pixel positions with radius offset', () => {
    const metrics = HexMath.calculateMetrics(400, 8, 0);
    const pixel = HexMath.hexToPixel({ row: 1, col: 0 }, metrics);
    expect(pixel.x).toBe(25 + 25 + 0); // 50
    expect(pixel.y).toBeCloseTo(25 * Math.sqrt(3), 4);
  });

  it('should identify correct 6 neighbors for even row cells', () => {
    const grid = new HexGrid({ evenCols: 8, oddCols: 7, maxRows: 10 });
    const neighbors = HexMath.getNeighborCoords(2, 3, grid);

    expect(neighbors).toEqual(
      expect.arrayContaining([
        { row: 2, col: 2 }, // Left
        { row: 2, col: 4 }, // Right
        { row: 1, col: 2 }, // Top-Left
        { row: 1, col: 3 }, // Top-Right
        { row: 3, col: 2 }, // Bottom-Left
        { row: 3, col: 3 }, // Bottom-Right
      ])
    );
    expect(neighbors.length).toBe(6);
  });

  it('should identify correct 6 neighbors for odd row cells', () => {
    const grid = new HexGrid({ evenCols: 8, oddCols: 7, maxRows: 10 });
    const neighbors = HexMath.getNeighborCoords(1, 2, grid);

    expect(neighbors).toEqual(
      expect.arrayContaining([
        { row: 1, col: 1 }, // Left
        { row: 1, col: 3 }, // Right
        { row: 0, col: 2 }, // Top-Left
        { row: 0, col: 3 }, // Top-Right
        { row: 2, col: 2 }, // Bottom-Left
        { row: 2, col: 3 }, // Bottom-Right
      ])
    );
    expect(neighbors.length).toBe(6);
  });

  it('should filter out out-of-bounds neighbors on grid borders', () => {
    const grid = new HexGrid({ evenCols: 8, oddCols: 7, maxRows: 10 });
    const cornerNeighbors = HexMath.getNeighborCoords(0, 0, grid);

    // Row 0 has no top neighbors, and col 0 has no left neighbor
    expect(cornerNeighbors).toEqual(
      expect.arrayContaining([
        { row: 0, col: 1 }, // Right
        { row: 1, col: 0 }, // Bottom-Right (from even 0,0 is (1,0))
      ])
    );
    expect(cornerNeighbors.length).toBe(2);
  });
});
