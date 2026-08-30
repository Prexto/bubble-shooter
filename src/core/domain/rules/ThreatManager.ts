export interface ThreatManagerConfig {
  maxMisses: number;
}

export class ThreatManager {
  private misses: number;
  private readonly maxMisses: number;

  constructor(config?: ThreatManagerConfig) {
    this.maxMisses = config?.maxMisses ?? 5;
    this.misses = 0;
  }

  public registerShot(wasMatch: boolean): { shouldShiftDown: boolean; currentMisses: number; maxMisses: number } {
    if (wasMatch) {
      return {
        shouldShiftDown: false,
        currentMisses: this.misses,
        maxMisses: this.maxMisses,
      };
    }

    this.misses += 1;

    if (this.misses >= this.maxMisses) {
      this.misses = 0;
      return {
        shouldShiftDown: true,
        currentMisses: this.misses,
        maxMisses: this.maxMisses,
      };
    }

    return {
      shouldShiftDown: false,
      currentMisses: this.misses,
      maxMisses: this.maxMisses,
    };
  }

  public getMisses(): number {
    return this.misses;
  }

  public getMaxMisses(): number {
    return this.maxMisses;
  }

  public reset(): void {
    this.misses = 0;
  }
}
