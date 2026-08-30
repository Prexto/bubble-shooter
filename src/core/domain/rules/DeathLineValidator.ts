import { HexGrid } from '../models/HexGrid';

export interface DangerStatus {
  isGameOver: boolean;
  lowestRow: number;
  deathLineRow: number;
  rowsRemaining: number;
  isDangerClose: boolean; // e.g. 1 or 2 rows away
}

export class DeathLineValidator {
  public static checkDanger(grid: HexGrid, deathLineRow?: number): DangerStatus {
    const targetDeathRow = deathLineRow ?? grid.config.deathLineRow;
    const lowestRow = grid.getLowestRow();

    if (lowestRow === -1) {
      return {
        isGameOver: false,
        lowestRow: -1,
        deathLineRow: targetDeathRow,
        rowsRemaining: targetDeathRow,
        isDangerClose: false,
      };
    }

    const rowsRemaining = targetDeathRow - lowestRow;
    const isGameOver = lowestRow >= targetDeathRow;
    const isDangerClose = rowsRemaining <= 2 && !isGameOver;

    return {
      isGameOver,
      lowestRow,
      deathLineRow: targetDeathRow,
      rowsRemaining,
      isDangerClose,
    };
  }
}
