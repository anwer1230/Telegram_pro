import { Chat, ChatFolder, Message, UserProfile } from '../types';

export const initialUserProfile: UserProfile = {
  id: '',
  uid: '',
  first_name: 'مستخدم تليجرام',
  last_name: '',
  username: '',
  phone: '',
  bio: '',
  photo: '',
  has_2fa: false,
  hint_2fa: '',
  is_premium: false,
  is_online: true,
};

export const initialFolders: ChatFolder[] = [
  { id: 'all', title: 'الكل', icon: '💬', chat_ids: [] },
  { id: 'unread', title: 'غير مقروءة', icon: '🔔', chat_ids: [] },
  { id: 'channels', title: 'القنوات', icon: '📢', chat_ids: [] },
  { id: 'groups', title: 'المجموعات', icon: '👥', chat_ids: [] },
  { id: 'bots', title: 'البوتات', icon: '🤖', chat_ids: [] },
];

export const initialChats: Chat[] = [
  {
    id: 1001,
    type: 'saved',
    title: 'الرسائل المحفوظة',
    name: 'الرسائل المحفوظة',
    username: 'saved',
    avatar: 'https://telegram.org/img/t_logo.png',
    photo: 'https://telegram.org/img/t_logo.png',
    description: 'سحابتك الشخصية لتخزين الرسائل والملفات والروابط والوسائط في تليجرام بلا حدود.',
    unread_count: 0,
    unread: 0,
    is_pinned: true,
    pinned: true,
    is_verified: true,
    lastMsg: 'سحابتك الشخصية في تليجرام جاهزة للمزامنة السريعة.',
    lastMsgDate: Math.floor(Date.now() / 1000),
    last_message: {
      id: 'm_saved_1',
      chat_id: 1001,
      sender_id: 'me',
      sender_name: 'أنت',
      date: Math.floor(Date.now() / 1000),
      is_outgoing: true,
      from_me: true,
      text: 'سحابتك الشخصية في تليجرام جاهزة للمزامنة السريعة.',
      content: { type: 'text', text: 'سحابتك الشخصية في تليجرام جاهزة للمزامنة السريعة.' },
    },
  } as any,
];

export const initialMessagesMap: Record<string | number, Message[]> = {
  1001: [
    {
      id: 'm_saved_1',
      chat_id: 1001,
      sender_id: 'me',
      sender_name: 'أنت',
      date: Math.floor(Date.now() / 1000),
      is_outgoing: true,
      from_me: true,
      text: 'سحابتك الشخصية في تليجرام جاهزة للمزامنة السريعة.',
      content: { type: 'text', text: 'سحابتك الشخصية في تليجرام جاهزة للمزامنة السريعة.' },
    },
  ],
};
