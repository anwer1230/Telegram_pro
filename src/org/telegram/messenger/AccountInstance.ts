/**
 * Telegram Official AccountInstance Engine
 * Replicates org.telegram.messenger.AccountInstance.java from DrKLO/Telegram
 * Encapsulates isolated controllers per account (0..MAX_ACCOUNT_COUNT-1).
 */

import { UserConfig } from './UserConfig';
import { MessagesController } from './MessagesController';
import { MessagesStorage } from './MessagesStorage';
import { NotificationCenter } from './NotificationCenter';
import { ConnectionsManager } from '../tgnet/ConnectionsManager';

export class AccountInstance {
  private static instances: AccountInstance[] = [];
  private readonly currentAccount: number;

  private constructor(account: number) {
    this.currentAccount = account;
  }

  public static getInstance(account: number = UserConfig.selectedAccount): AccountInstance {
    if (account < 0 || account >= UserConfig.MAX_ACCOUNT_COUNT) {
      account = 0;
    }
    if (!AccountInstance.instances[account]) {
      AccountInstance.instances[account] = new AccountInstance(account);
    }
    return AccountInstance.instances[account];
  }

  public getCurrentAccount(): number {
    return this.currentAccount;
  }

  public getUserConfig(): UserConfig {
    return UserConfig.getInstance(this.currentAccount);
  }

  public getMessagesController(): MessagesController {
    return MessagesController.getInstance(this.currentAccount);
  }

  public getMessagesStorage(): MessagesStorage {
    return MessagesStorage.getInstance(this.currentAccount);
  }

  public getConnectionsManager(): ConnectionsManager {
    return ConnectionsManager.getInstance(this.currentAccount);
  }

  public getNotificationCenter(): NotificationCenter {
    return NotificationCenter.getInstance(this.currentAccount);
  }
}
