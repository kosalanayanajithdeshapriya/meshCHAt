

export interface User {
  uid: string;
  displayName: string;
  isOnline: boolean;
  lastSeen: number; // Timestamp
  isTyping?: boolean;
  status?: 'online' | 'away' | 'offline';
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // IndexedDB blob URL or base64
  thumbnail?: string;
  encrypted: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number; // Timestamp
  messageHash: string;
  channelId: string;
  encrypted?: boolean;
  attachments?: FileAttachment[];
  messageType?: 'text' | 'file' | 'voice' | 'image';
  replyTo?: string; // Message ID being replied to
  editedAt?: number;
  deletedAt?: number;
  isPinned?: boolean;
  reactions?: Record<string, string[]>; // emoji -> user IDs
}

export interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  password?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: number;
}

export enum CommandType {
  JOIN = 'join',
  MSG = 'msg',
  NICK = 'nick',
  CLEAR = 'clear',
  HELP = 'help',
  GEMINI = 'gemini'
}
