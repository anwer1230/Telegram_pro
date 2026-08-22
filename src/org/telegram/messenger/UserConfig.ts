/**
 * Telegram Official UserConfig
 * Replicates org.telegram.messenger.UserConfig.java
 */

import { NotificationCenter } from './NotificationCenter';

export interface TelegramCurrentUser {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  photo?: string;
  bio?: string;
  is_premium?: boolean;
  is_verified?: boolean;
  has_2fa?: boolean;
  two_factor_enabled?: boolean;
}

export class UserConfig {
  public static selectedAccount: number = 0;
  private static currentUser: TelegramCurrentUser | null = null;
  private static clientUserId: number | string = 0;
  private static isActivated: boolean = false;

  public static getClientUserId(): number | string {
    if (!this.clientUserId) {
      this.loadConfig();
    }
    return this.clientUserId;
  }

  public static getCurrentUser(): TelegramCurrentUser | null {
    if (!this.currentUser) {
      this.loadConfig();
    }
    return this.currentUser;
  }

  public static isClientActivated(): boolean {
    return this.isActivated && Boolean(this.clientUserId);
  }

  public static isPremium(): boolean {
    return Boolean(this.currentUser?.is_premium);
  }

  public static setCurrentUser(user: TelegramCurrentUser | null): void {
    this.currentUser = user;
    if (user && user.id) {
      this.clientUserId = user.id;
      this.isActivated = true;
    } else {
      this.clientUserId = 0;
      this.isActivated = false;
    }
    this.saveConfig();
    NotificationCenter.getInstance().postNotificationName(NotificationCenter.mainUserInfoChanged);
  }

  public static clearConfig(): void {
    this.currentUser = null;
    this.clientUserId = 0;
    this.isActivated = false;
    try {
      localStorage.removeItem('tg_user_config');
    } catch {}
    NotificationCenter.getInstance().postNotificationName(NotificationCenter.appDidLogout);
  }

  private static loadConfig(): void {
    try {
      const saved = localStorage.getItem('tg_user_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentUser = parsed.user || null;
        this.clientUserId = parsed.clientUserId || (parsed.user?.id || 0);
        this.isActivated = Boolean(this.clientUserId);
      }
    } catch {}
  }

  public static saveConfig(): void {
    try {
      localStorage.setItem(
        'tg_user_config',
        JSON.stringify({
          clientUserId: this.clientUserId,
          user: this.currentUser,
          selectedAccount: this.selectedAccount,
        })
      );
    } catch {}
  }
}
