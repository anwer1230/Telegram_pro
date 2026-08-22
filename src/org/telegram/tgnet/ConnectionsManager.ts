/**
 * Telegram Official ConnectionsManager
 * Replicates org.telegram.tgnet.ConnectionsManager.java
 */

import { NotificationCenter } from '../messenger/NotificationCenter';

export enum ConnectionState {
  ConnectionStateConnecting = 1,
  ConnectionStateWaitingForNetwork = 2,
  ConnectionStateConnected = 3,
  ConnectionStateUpdating = 4,
}

export class ConnectionsManager {
  private static instance: ConnectionsManager;
  private connectionState: ConnectionState = ConnectionState.ConnectionStateConnected;
  private pingInterval: any = null;
  private currentPing: number = 24;

  private constructor() {
    this.startHeartbeat();
  }

  public static getInstance(account: number = 0): ConnectionsManager {
    if (!ConnectionsManager.instance) {
      ConnectionsManager.instance = new ConnectionsManager();
    }
    return ConnectionsManager.instance;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      NotificationCenter.getInstance().postNotificationName(NotificationCenter.updateInterfaces);
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
      const res = await fetch(`/api/telegram/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
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
