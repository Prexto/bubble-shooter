export class HighScoreRepository {
  private static readonly STORAGE_KEY = 'juicy_bubble_shooter_high_score';

  public static getHighScore(): number {
    try {
      const val = localStorage.getItem(this.STORAGE_KEY);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  public static saveScore(score: number): { isNewRecord: boolean; highScore: number } {
    const currentHigh = this.getHighScore();
    if (score > currentHigh) {
      try {
        localStorage.setItem(this.STORAGE_KEY, score.toString());
      } catch {
        // Fallback if local storage restricted
      }
      return { isNewRecord: true, highScore: score };
    }
    return { isNewRecord: false, highScore: currentHigh };
  }
}
