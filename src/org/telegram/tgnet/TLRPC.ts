/**
 * Telegram Official TLRPC definitions & error handling engine.
 * Mirrors org.telegram.tgnet.TLRPC & TL_error structure from official Telegram Android repo.
 */

export namespace TLRPC {
  export interface TLObject {
    _type?: string;
    code?: number;
    text?: string;
  }

  export class TL_error implements TLObject {
    public _type: string = 'TL_error';
    public code: number;
    public text: string;

    constructor(code: number = 0, text: string = '') {
      this.code = code;
      this.text = text;
    }

    public static TLdeserialize(stream: any): TL_error {
      return new TL_error(stream.readInt32?.() || 0, stream.readString?.() || '');
    }

    public isFlood(): boolean {
      return this.text?.startsWith('FLOOD_WAIT_') || this.code === 420;
    }

    public getFloodWaitSeconds(): number {
      if (this.isFlood()) {
        const match = this.text.match(/FLOOD_WAIT_(\d+)/);
        return match ? parseInt(match[1], 10) : 60;
      }
      return 0;
    }

    public isChatWriteForbidden(): boolean {
      return this.text === 'CHAT_WRITE_FORBIDDEN' || this.text === 'CHAT_GUEST_SEND_FORBIDDEN';
    }

    public isChatAdminRequired(): boolean {
      return this.text === 'CHAT_ADMIN_REQUIRED';
    }

    public isUserBanned(): boolean {
      return this.text === 'USER_BANNED_IN_CHANNEL' || this.text === 'USER_RESTRICTED' || this.text === 'USER_BANNED';
    }

    public isInviteRequestSent(): boolean {
      return this.text === 'INVITE_REQUEST_SENT';
    }
  }

  export interface TL_chatBannedRights {
    view_messages?: boolean;
    send_messages?: boolean;
    send_media?: boolean;
    send_stickers?: boolean;
    send_gifs?: boolean;
    send_games?: boolean;
    send_inline?: boolean;
    embed_links?: boolean;
    send_polls?: boolean;
    change_info?: boolean;
    invite_users?: boolean;
    pin_messages?: boolean;
    manage_topics?: boolean;
    send_photos?: boolean;
    send_videos?: boolean;
    send_roundvideos?: boolean;
    send_audios?: boolean;
    send_voices?: boolean;
    send_docs?: boolean;
    send_plain?: boolean;
    until_date?: number;
  }

  export interface TL_channel {
    id: number;
    title: string;
    username?: string;
    photo?: any;
    date: number;
    creator?: boolean;
    left?: boolean;
    broadcast?: boolean;
    verified?: boolean;
    megagroup?: boolean;
    restricted?: boolean;
    restriction_reason?: string[];
    banned_rights?: TL_chatBannedRights;
    default_banned_rights?: TL_chatBannedRights;
    participants_count?: number;
  }

  export interface TL_message {
    id: number;
    peer_id: {
      user_id?: number;
      chat_id?: number;
      channel_id?: number;
    };
    date: number;
    message: string;
    out?: boolean;
    unread?: boolean;
    pinned?: boolean;
    from_id?: {
      user_id?: number;
      channel_id?: number;
    };
    reply_to?: {
      reply_to_msg_id?: number;
    };
    media?: any;
    entities?: Array<{
      _: string;
      offset: number;
      length: number;
      url?: string;
    }>;
  }

  export interface TL_dialog {
    peer: {
      user_id?: number;
      chat_id?: number;
      channel_id?: number;
    };
    top_message: number;
    read_inbox_max_id: number;
    read_outbox_max_id: number;
    unread_count: number;
    unread_mentions_count: number;
    unread_reactions_count: number;
    pinned?: boolean;
    pinnedNum?: number;
    last_message_date: number;
  }
}
