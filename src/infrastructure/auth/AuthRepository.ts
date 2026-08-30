import { User, UserStats } from '../../core/domain/models/User';
import { BubbleColor } from '../../core/domain/models/BubbleColor';

export class AuthRepository {
  private static readonly SESSION_KEY = 'juicy_bubble_shooter_session';
  private static readonly USERS_DB_KEY = 'juicy_bubble_shooter_users';
  private static memoryStorage: Map<string, string> = new Map();

  private static getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback to memory storage
    }
    return this.memoryStorage.get(key) ?? null;
  }

  private static setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback to memory storage
    }
    this.memoryStorage.set(key, value);
  }

  private static removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fallback to memory storage
    }
    this.memoryStorage.delete(key);
  }

  public static clearMemory(): void {
    this.memoryStorage.clear();
  }

  private static createDefaultStats(): UserStats {
    return {
      gamesPlayed: 0,
      totalScore: 0,
      highestMultiplier: 1,
      classicHighScore: 0,
      timeAttackHighScore: 0,
      peggleFeverHighScore: 0,
    };
  }

  private static getRandomAvatarColor(): BubbleColor {
    const colors = [
      BubbleColor.CYAN,
      BubbleColor.MAGENTA,
      BubbleColor.YELLOW,
      BubbleColor.LIME,
      BubbleColor.PURPLE,
      BubbleColor.ORANGE,
    ];
    return colors[Math.floor(Math.random() * colors.length)] ?? BubbleColor.CYAN;
  }

  private static getAllUsers(): Record<string, User> {
    const raw = this.getItem(this.USERS_DB_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as Record<string, any>;
      const users: Record<string, User> = {};
      for (const [key, data] of Object.entries(parsed)) {
        users[key] = new User(data);
      }
      return users;
    } catch {
      return {};
    }
  }

  private static saveAllUsers(users: Record<string, User>): void {
    this.setItem(this.USERS_DB_KEY, JSON.stringify(users));
  }

  public static getCurrentUser(): User | null {
    const raw = this.getItem(this.SESSION_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      return new User(data);
    } catch {
      return null;
    }
  }

  public static login(username: string): User {
    const cleanUsername = username.trim() || 'Player 1';
    const users = this.getAllUsers();
    let user = users[cleanUsername.toLowerCase()];

    if (!user) {
      user = new User({
        id: `user_${Date.now()}`,
        username: cleanUsername,
        avatarColor: this.getRandomAvatarColor(),
        isGuest: false,
        stats: this.createDefaultStats(),
        createdAt: Date.now(),
      });
      users[cleanUsername.toLowerCase()] = user;
      this.saveAllUsers(users);
    }

    this.setCurrentSession(user);
    return user;
  }

  public static register(username: string, email?: string): User {
    const cleanUsername = username.trim() || 'Player 1';
    const users = this.getAllUsers();

    const user = new User({
      id: `user_${Date.now()}`,
      username: cleanUsername,
      email: email?.trim(),
      avatarColor: this.getRandomAvatarColor(),
      isGuest: false,
      stats: this.createDefaultStats(),
      createdAt: Date.now(),
    });

    users[cleanUsername.toLowerCase()] = user;
    this.saveAllUsers(users);
    this.setCurrentSession(user);
    return user;
  }

  public static loginAsGuest(): User {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUser = new User({
      id: `guest_${Date.now()}`,
      username: `Guest #${randomSuffix}`,
      avatarColor: this.getRandomAvatarColor(),
      isGuest: true,
      stats: this.createDefaultStats(),
      createdAt: Date.now(),
    });

    this.setCurrentSession(guestUser);
    return guestUser;
  }

  public static saveUser(user: User): void {
    const users = this.getAllUsers();
    users[user.username.toLowerCase()] = user;
    this.saveAllUsers(users);

    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentSession(user);
    }
  }

  public static setCurrentSession(user: User): void {
    this.setItem(this.SESSION_KEY, JSON.stringify(user));
  }

  public static logout(): void {
    this.removeItem(this.SESSION_KEY);
  }
}
