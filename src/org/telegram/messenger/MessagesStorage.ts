/**
 * Telegram Official MessagesStorage Engine (SQLite Virtual Layer & Fast Cache)
 * Replicates org.telegram.messenger.MessagesStorage.java & SQLiteDatabase
 */

import { NotificationCenter } from './NotificationCenter';

export class SQLiteDatabase {
  private inMemoryTables: Map<string, Map<string | number, any>> = new Map();

  constructor() {
    this.initTables();
  }

  private initTables(): void {
    this.inMemoryTables.set('dialogs', new Map());
    this.inMemoryTables.set('messages', new Map());
    this.inMemoryTables.set('users', new Map());
    this.inMemoryTables.set('chats', new Map());
  }

  public async execute(sql: string, params: any[] = []): Promise<void> {
    // Execute simulated or local DB operations
    return new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  public async queryFinalized(table: string, queryFn?: (item: any) => boolean): Promise<any[]> {
    const targetTable = this.inMemoryTables.get(table);
    if (!targetTable) return [];
    const items = Array.from(targetTable.values());
    if (queryFn) {
      return items.filter(queryFn);
    }
    return items;
  }

  public put(table: string, id: string | number, value: any): void {
    let targetTable = this.inMemoryTables.get(table);
    if (!targetTable) {
      targetTable = new Map();
      this.inMemoryTables.set(table, targetTable);
    }
    targetTable.set(id, value);
  }

  public get(table: string, id: string | number): any {
    return this.inMemoryTables.get(table)?.get(id);
  }

  public remove(table: string, id: string | number): boolean {
    return this.inMemoryTables.get(table)?.delete(id) || false;
  }
}

export class MessagesStorage {
  private static instance: MessagesStorage;
  public database: SQLiteDatabase;

  private constructor() {
    this.database = new SQLiteDatabase();
  }

  public static getInstance(account: number = 0): MessagesStorage {
    if (!MessagesStorage.instance) {
      MessagesStorage.instance = new MessagesStorage();
    }
    return MessagesStorage.instance;
  }

  public async setDialogFlags(dialogId: string | number, flags: { pinned?: boolean; pinnedNum?: number; muted?: boolean; unread?: number }): Promise<void> {
    const dialog = this.database.get('dialogs', dialogId) || { id: dialogId };
    const updated = { ...dialog, ...flags };
    this.database.put('dialogs', dialogId, updated);
    await this.database.execute('UPDATE dialogs SET flags = ? WHERE id = ?', [JSON.stringify(flags), dialogId]);
    NotificationCenter.getInstance().postNotificationName(NotificationCenter.dialogsNeedReload);
  }

  public async deleteDialog(dialogId: string | number, folderId: number = 0): Promise<void> {
    this.database.remove('dialogs', dialogId);
    await this.database.execute('DELETE FROM dialogs WHERE id = ?', [dialogId]);
    await this.database.execute('DELETE FROM messages WHERE dialog_id = ?', [dialogId]);
    NotificationCenter.getInstance().postNotificationName(NotificationCenter.dialogDeleted, dialogId);
    NotificationCenter.getInstance().postNotificationName(NotificationCenter.dialogsNeedReload);
  }

  public async markMessagesAsDeleted(dialogId: string | number, messageIds: Array<number | string>): Promise<void> {
    for (const mid of messageIds) {
      this.database.remove('messages', `${dialogId}_${mid}`);
    }
    await this.database.execute('DELETE FROM messages WHERE id IN (?)', [messageIds.join(',')]);
    NotificationCenter.getInstance().postNotificationName(NotificationCenter.messagesDeleted, messageIds, dialogId);
  }

  public async putMessages(messages: any[], isChannel: boolean = false): Promise<void> {
    for (const msg of messages) {
      const key = `${msg.chat_id || msg.dialog_id}_${msg.id}`;
      this.database.put('messages', key, msg);
    }
    NotificationCenter.getInstance().postNotificationName(NotificationCenter.didReceivedNewMessages, messages);
  }

  public async updateDialogsWithReadFlags(dialogId: string | number, maxId: number): Promise<void> {
    const dialog = this.database.get('dialogs', dialogId);
    if (dialog) {
      dialog.read_inbox_max_id = maxId;
      dialog.unread_count = 0;
      this.database.put('dialogs', dialogId, dialog);
    }
    NotificationCenter.getInstance().postNotificationName(NotificationCenter.dialogsNeedReload);
  }
}
