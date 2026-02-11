

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

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Reaction {
  emoji: string;
  users: string[]; // user IDs
}

export interface ReplyInfo {
  id: string;
  senderName: string;
  text: string;
  hasAttachment: boolean;
  attachmentType?: string;
  thumbnail?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number; // Timestamp
  messageHash: string;
  channelId: string;
  status?: MessageStatus;
  encrypted?: boolean;
  attachments?: FileAttachment[];
  messageType?: 'text' | 'file' | 'voice' | 'image' | 'video' | 'system';
  replyTo?: ReplyInfo;
  editedAt?: number;
  deletedAt?: number;
  deletedFor?: string[]; // IDs of users who deleted this message
  isPinned?: boolean;
  isForwarded?: boolean;
  reactions?: Reaction[];
}

export interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  password?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  typingUsers?: string[];
}

export enum CommandType {
  JOIN = 'join',
  MSG = 'msg',
  NICK = 'nick',
  CLEAR = 'clear',
  HELP = 'help',
  GEMINI = 'gemini'
}
