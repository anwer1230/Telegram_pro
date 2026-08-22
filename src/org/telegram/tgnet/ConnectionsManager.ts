/**
 * Telegram Official ConnectionsManager
 * Replicates org.telegram.tgnet.ConnectionsManager.java from DrKLO/Telegram
 */

import { NotificationCenter } from '../messenger/NotificationCenter';
import { UserConfig } from '../messenger/UserConfig';

export enum ConnectionState {
  ConnectionStateConnecting = 1,
  ConnectionStateWaitingForNetwork = 2,
  ConnectionStateConnected = 3,
  ConnectionStateUpdating = 4,
}

export class ConnectionsManager {
  private static instances: ConnectionsManager[] = [];
  private readonly currentAccount: number;
  private connectionState: ConnectionState = ConnectionState.ConnectionStateConnected;
  private currentPing: number = 24;

  private constructor(account: number) {
    this.currentAccount = account;
    this.startHeartbeat();
  }

  public static getInstance(account: number = UserConfig.selectedAccount): ConnectionsManager {
    if (account < 0 || account >= UserConfig.MAX_ACCOUNT_COUNT) {
      account = 0;
    }
    if (!ConnectionsManager.instances[account]) {
      ConnectionsManager.instances[account] = new ConnectionsManager(account);
    }
    return ConnectionsManager.instances[account];
  }

  public getCurrentAccount(): number {
    return this.currentAccount;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      NotificationCenter.getInstance(this.currentAccount).postNotificationName(NotificationCenter.didUpdateConnectionState);
      NotificationCenter.getInstance(this.currentAccount).postNotificationName(NotificationCenter.updateInterfaces);
    }
  }

  public getPing(): number {
    return this.currentPing;
  }

  public async sendRequest(
    method: string,
    params: any = {},
    onComplete?: (response: any, error: any) => void
  ): Promise<any> {
    try {
      const payload = {
        ...params,
        account_id: params.account_id !== undefined ? params.account_id : this.currentAccount,
      };

      const res = await fetch(`/api/telegram/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Account': String(this.currentAccount),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || (data.success === false && data.error)) {
        if (onComplete) onComplete(null, data.error || 'RPC_ERROR');
        return { success: false, error: data.error };
      }
      if (onComplete) onComplete(data, null);
      return data;
    } catch (e: any) {
      if (onComplete) onComplete(null, e.message || 'NETWORK_ERROR');
      return { success: false, error: e.message };
    }
  }

  private startHeartbeat(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => this.setConnectionState(ConnectionState.ConnectionStateConnected));
    window.addEventListener('offline', () => this.setConnectionState(ConnectionState.ConnectionStateWaitingForNetwork));
  }
}
