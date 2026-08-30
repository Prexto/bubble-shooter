import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../../src/core/domain/models/User';
import { BubbleColor } from '../../src/core/domain/models/BubbleColor';
import { AuthRepository } from '../../src/infrastructure/auth/AuthRepository';

describe('User and AuthRepository', () => {
  beforeEach(() => {
    AuthRepository.clearMemory();
    AuthRepository.logout();
  });

  it('should record game results and update high scores per mode', () => {
    const user = new User({
      id: 'u1',
      username: 'NeoGamer',
      avatarColor: BubbleColor.CYAN,
      isGuest: false,
      stats: {
        gamesPlayed: 0,
        totalScore: 0,
        highestMultiplier: 1,
        classicHighScore: 1000,
        timeAttackHighScore: 2000,
        peggleFeverHighScore: 3000,
      },
      createdAt: Date.now(),
    });

    const isNew1 = user.recordGameResult('CLASSIC_ARCADE', 1500, 5);
    expect(isNew1).toBe(true);
    expect(user.stats.classicHighScore).toBe(1500);
    expect(user.stats.gamesPlayed).toBe(1);
    expect(user.stats.highestMultiplier).toBe(5);

    const isNew2 = user.recordGameResult('CLASSIC_ARCADE', 1200, 3);
    expect(isNew2).toBe(false);
    expect(user.stats.classicHighScore).toBe(1500);
    expect(user.stats.gamesPlayed).toBe(2);
  });

  it('should create guest session with default stats in AuthRepository', () => {
    const guest = AuthRepository.loginAsGuest();
    expect(guest.isGuest).toBe(true);
    expect(guest.username).toContain('Guest #');
    
    const current = AuthRepository.getCurrentUser();
    expect(current?.id).toBe(guest.id);
  });

  it('should register and login user with persistence', () => {
    const registered = AuthRepository.register('ArcadeMaster', 'master@arcade.com');
    expect(registered.username).toBe('ArcadeMaster');
    expect(registered.email).toBe('master@arcade.com');

    AuthRepository.logout();
    expect(AuthRepository.getCurrentUser()).toBeNull();

    const loggedIn = AuthRepository.login('ArcadeMaster');
    expect(loggedIn.id).toBe(registered.id);
  });
});
