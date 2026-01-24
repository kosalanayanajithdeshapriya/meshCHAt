
export interface User {
  uid: string;
  displayName: string;
  isOnline: boolean;
  lastSeen: number; // Timestamp
  isTyping?: boolean;
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
