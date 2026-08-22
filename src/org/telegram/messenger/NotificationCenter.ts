/**
 * Telegram Official NotificationCenter Observer System
 * Replicates org.telegram.messenger.NotificationCenter.java
 */

export class NotificationCenter {
  private static instance: NotificationCenter;
  private observers: Map<number, Set<(id: number, account: number, ...args: any[]) => void>> = new Map();

  // Telegram Event IDs
  public static readonly dialogsNeedReload: number = 1;
  public static readonly updateInterfaces: number = 2;
  public static readonly messagesDidLoad: number = 3;
  public static readonly didLoadedReplyMessages: number = 4;
  public static readonly userFullInfoDidLoad: number = 5;
  public static readonly chatInfoDidLoad: number = 6;
  public static readonly encryptedChatCreated: number = 7;
  public static readonly dialogPhotosLoaded: number = 8;
  public static readonly notificationsSettingsUpdated: number = 9;
  public static readonly didReceivedNewMessages: number = 10;
  public static readonly messagesDeleted: number = 11;
  public static readonly messageReceivedByAck: number = 12;
  public static readonly messageSendError: number = 13;
  public static readonly chatDidCreated: number = 14;
  public static readonly dialogDeleted: number = 15;
  public static readonly totalUnreadPushedOnce: number = 16;
  public static readonly mainUserInfoChanged: number = 17;
  public static readonly privacyRulesUpdated: number = 18;
  public static readonly proxySettingsChanged: number = 19;
  public static readonly appDidLogout: number = 20;

  private constructor() {}

  public static getInstance(): NotificationCenter {
    if (!NotificationCenter.instance) {
      NotificationCenter.instance = new NotificationCenter();
    }
    return NotificationCenter.instance;
  }

  public static getGlobalInstance(): NotificationCenter {
    return NotificationCenter.getInstance();
  }

  public addObserver(observer: (id: number, account: number, ...args: any[]) => void, id: number): void {
    let set = this.observers.get(id);
    if (!set) {
      set = new Set();
      this.observers.set(id, set);
    }
    set.add(observer);
  }

  public removeObserver(observer: (id: number, account: number, ...args: any[]) => void, id: number): void {
    const set = this.observers.get(id);
    if (set) {
      set.delete(observer);
      if (set.size === 0) {
        this.observers.delete(id);
      }
    }
  }

  public postNotificationName(id: number, ...args: any[]): void {
    const set = this.observers.get(id);
    if (set && set.size > 0) {
      const copy = Array.from(set);
      copy.forEach((observer) => {
        try {
          observer(id, 0, ...args);
        } catch (e) {
          console.error(`[NotificationCenter] Error in observer for event ${id}:`, e);
        }
      });
    }
  }

  public hasObservers(id: number): boolean {
    const set = this.observers.get(id);
    return Boolean(set && set.size > 0);
  }
}
