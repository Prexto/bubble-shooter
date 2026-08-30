import { BubbleColor } from './BubbleColor';

export interface UserStats {
  gamesPlayed: number;
  totalScore: number;
  highestMultiplier: number;
  classicHighScore: number;
  timeAttackHighScore: number;
  peggleFeverHighScore: number;
}

export interface UserProps {
  id: string;
  username: string;
  email?: string | undefined;
  avatarColor: BubbleColor;
  isGuest: boolean;
  stats: UserStats;
  createdAt: number;
}

export class User {
  public readonly id: string;
  public username: string;
  public email?: string | undefined;
  public avatarColor: BubbleColor;
  public isGuest: boolean;
  public stats: UserStats;
  public readonly createdAt: number;

  constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username;
    this.email = props.email;
    this.avatarColor = props.avatarColor;
    this.isGuest = props.isGuest;
    this.stats = props.stats;
    this.createdAt = props.createdAt;
  }

  public getOverallHighScore(): number {
    return Math.max(
      this.stats.classicHighScore,
      this.stats.timeAttackHighScore,
      this.stats.peggleFeverHighScore
    );
  }

  public recordGameResult(mode: string, score: number, maxMultiplier: number): boolean {
    this.stats.gamesPlayed += 1;
    this.stats.totalScore += score;
    if (maxMultiplier > this.stats.highestMultiplier) {
      this.stats.highestMultiplier = maxMultiplier;
    }

    let isNewRecord = false;
    if (mode === 'CLASSIC_ARCADE' && score > this.stats.classicHighScore) {
      this.stats.classicHighScore = score;
      isNewRecord = true;
    } else if (mode === 'TIME_ATTACK' && score > this.stats.timeAttackHighScore) {
      this.stats.timeAttackHighScore = score;
      isNewRecord = true;
    } else if (mode === 'PEGGLE_FEVER' && score > this.stats.peggleFeverHighScore) {
      this.stats.peggleFeverHighScore = score;
      isNewRecord = true;
    }

    return isNewRecord;
  }
}
