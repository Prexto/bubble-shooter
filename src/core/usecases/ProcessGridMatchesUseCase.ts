import { MatchFinder } from '../domain/algorithms/MatchFinder';
import { OrphanFinder } from '../domain/algorithms/OrphanFinder';
import { Bubble } from '../domain/models/Bubble';
import { HexGrid } from '../domain/models/HexGrid';
import { DangerStatus, DeathLineValidator } from '../domain/rules/DeathLineValidator';
import { ThreatManager } from '../domain/rules/ThreatManager';

export interface ProcessMatchesResult {
  insertedBubble: Bubble;
  matchedBubbles: Bubble[];
  orphanBubbles: Bubble[];
  wasMatch: boolean;
  threatStatus: {
    shouldShiftDown: boolean;
    currentMisses: number;
    maxMisses: number;
  };
  dangerStatus: DangerStatus;
  shiftedBubbles?: Bubble[] | undefined;
}

export class ProcessGridMatchesUseCase {
  public static execute(
    bubble: Bubble,
    grid: HexGrid,
    threatManager: ThreatManager,
    generateNewRowCallback?: (cols: number) => Bubble[]
  ): ProcessMatchesResult {
    // 1. Insert bubble into grid
    grid.setBubble(bubble);

    // 2. Find matching cluster
    const matches = MatchFinder.findMatches(bubble.row, bubble.col, grid, 3);
    const wasMatch = matches.length >= 3;

    let matchedBubbles: Bubble[] = [];
    let orphanBubbles: Bubble[] = [];
    let shiftedBubbles: Bubble[] | undefined;

    if (wasMatch) {
      // Mark and remove matched bubbles
      for (const matched of matches) {
        matched.markPopping();
        grid.removeBubble(matched.row, matched.col);
      }
      matchedBubbles = matches;

      // Find and remove disconnected orphan islands
      const orphans = OrphanFinder.findOrphans(grid);
      for (const orphan of orphans) {
        grid.removeBubble(orphan.row, orphan.col);
      }
      orphanBubbles = orphans;
    }

    // 3. Register threat shot
    const threatStatus = threatManager.registerShot(wasMatch);

    // 4. Handle grid shift down if threat threshold reached
    if (threatStatus.shouldShiftDown) {
      const topCols = grid.getColsInRow(0);
      const newTopBubbles = generateNewRowCallback ? generateNewRowCallback(topCols) : undefined;
      shiftedBubbles = grid.shiftDown(newTopBubbles);
    }

    // 5. Evaluate death line danger
    const dangerStatus = DeathLineValidator.checkDanger(grid);

    return {
      insertedBubble: bubble,
      matchedBubbles,
      orphanBubbles,
      wasMatch,
      threatStatus,
      dangerStatus,
      shiftedBubbles,
    };
  }
}
