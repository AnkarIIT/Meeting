export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  isMe?: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  timestamp: Date;
  parentId?: string; // For threading
  isAI?: boolean;
  reactions?: Record<string, string[]>; // emoji -> list of userIds
  attachment?: {
    name: string;
    size: number;
    type: string;
  };
}

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'dm';
  unreadCount: number;
  icon?: string;
}

export interface ChatState {
  messages: Message[];
  activeChannelId: string;
  activeThreadId: string | null;
  currentUser: User;
  isDarkMode: boolean;
}