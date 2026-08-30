import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export class HapticsAdapter {
  private static isNative = Capacitor.isNativePlatform();
  private static enabled = true;

  public static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  public static async impactLight(): Promise<void> {
    if (!this.enabled || !this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Graceful fallback on unsupported platforms
    }
  }

  public static async impactMedium(): Promise<void> {
    if (!this.enabled || !this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Graceful fallback
    }
  }

  public static async impactHeavy(): Promise<void> {
    if (!this.enabled || !this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Graceful fallback
    }
  }

  public static async notificationSuccess(): Promise<void> {
    if (!this.enabled || !this.isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Graceful fallback
    }
  }

  public static async notificationWarning(): Promise<void> {
    if (!this.enabled || !this.isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      // Graceful fallback
    }
  }
}
