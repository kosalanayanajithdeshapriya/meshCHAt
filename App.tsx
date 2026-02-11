
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import {
  MessageSquare,
  Hash,
  Settings,
  Users,
  Send,
  Shield,
  Cpu,
  LogOut,
  Plus,
  Lock,
  Search,
  Terminal,
  Menu,
  X,
  Trash2,
  AlertTriangle,
  Info,
  Circle,
  Wifi,
  Radio,
  Zap,
  Clock,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Camera,
  Smile
} from 'lucide-react';
import { z } from 'zod';

import { User, Channel, Message, FileAttachment } from './types';
import { getGeminiResponse } from './services/geminiService';
import { encryptMessage, decryptMessage, generateHash, clearAllKeys, ENCRYPTION_PREFIX } from './utils/crypto';
import { FileUpload } from './components/FileUpload';
import { FileMessage } from './components/FileMessage';
import { VoiceRecorder } from './components/VoiceRecorder';
import { AudioPlayer } from './components/AudioPlayer';
import { CameraCapture } from './components/CameraCapture';
import { MediaGallery } from './components/MediaGallery';
import { TypingIndicator } from './components/TypingIndicator';
import { PeerDiscovery } from './components/PeerDiscovery';
import { ConnectionStatus } from './components/ConnectionStatus';
import { MobileNav } from './components/MobileNav';
import { FloatingActionButton } from './components/FloatingActionButton';
import { LoadingScreen } from './components/LoadingScreen';
import { SettingsPage } from './components/SettingsPage';
import { encryptFile, fileToBase64, validateFile, compressImage, formatFileSize } from './utils/fileHandler';
import { encryptAudio, audioToBase64 } from './utils/audioProcessor';
import { WebRTCMesh } from './services/webrtcService';
import { useIsMobile, useIsDesktop } from './hooks/useMediaQuery';
import { Transmission } from './components/Transmission';
import { EmojiPicker } from './components/EmojiPicker';
import { ReplyPreview } from './components/ReplyPreview';
import { MessageStatus, ReplyInfo } from './types';
import { formatSmartTime, groupMessages } from './utils/messageHelpers';

// --- SCHEMA VALIDATION ---
// Updated to allow empty text when attachments are present
const messageSchema = z.object({
  text: z.string().max(5000, "Packet overflow"),
  senderId: z.string(),
  senderName: z.string(),
  channelId: z.string(),
  attachments: z.array(z.any()).optional(),
}).refine(
  (data) => data.text.trim().length > 0 || (data.attachments && data.attachments.length > 0),
  {
    message: "Message must have either text or attachments",
    path: ["text"],
  }
);

// --- PERSISTENT LOCAL MESH DB ---
// Simulates a decentralized mesh network using BroadcastChannel and LocalStorage
class MeshNode {
  private bc = new BroadcastChannel('enchat_mesh_sync');
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private webrtc: WebRTCMesh | null = null; // WebRTC for cross-device P2P
  private webrtcRoomId: string | null = null;

  constructor() {
    this.bc.onmessage = (event) => {
      const { type, path, data } = event.data;
      if (type === 'SYNC_PACKET') {
        this.triggerListeners(path, data);
      } else if (type === 'PING') {
        // Heartbeat response
        this.bc.postMessage({ type: 'PONG', uid: localStorage.getItem('enchat_uid') });
      } else if (type === 'PRESENCE') {
        // User presence update
        this.triggerListeners('presence', event.data);
      } else if (type === 'TYPING') {
        // Typing indicator
        this.triggerListeners('typing', event.data);
      }
    };
    this.initializeMesh();
  }

  private initializeMesh() {
    if (!localStorage.getItem('bc_channels')) {
      const defaultChannels: Channel[] = [
        { id: 'global-mesh', name: 'global-mesh', isPrivate: false, participants: [] },
        { id: 'dev-node', name: 'dev-node', isPrivate: false, participants: [] },
        { id: 'shadow-link', name: 'shadow-link', isPrivate: true, participants: [] }
      ];
      localStorage.setItem('bc_channels', JSON.stringify(defaultChannels));
    }
    if (!localStorage.getItem('bc_messages')) {
      localStorage.setItem('bc_messages', JSON.stringify({}));
    }
  }

  private triggerListeners(path: string, data: any) {
    this.listeners.get(path)?.forEach(cb => cb(data));
  }

  onSnapshot(path: string, callback: (data: any) => void) {
    if (!this.listeners.has(path)) this.listeners.set(path, []);
    this.listeners.get(path)?.push(callback);

    // Initial load
    if (path === 'channels') {
      callback(JSON.parse(localStorage.getItem('bc_channels') || '[]'));
    } else if (path.startsWith('messages/')) {
      const cid = path.split('/')[1];
      const allMsgs = JSON.parse(localStorage.getItem('bc_messages') || '{}');
      callback(allMsgs[cid] || []);
    }
    return () => {
      const idx = this.listeners.get(path)?.indexOf(callback);
      if (idx !== undefined && idx > -1) this.listeners.get(path)?.splice(idx, 1);
    };
  }

  async broadcast(cid: string, msgData: Omit<Message, 'id' | 'timestamp' | 'channelId'>) {
    try {
      messageSchema.parse({ ...msgData, channelId: cid });
    } catch (e) {
      console.error('❌ Message validation failed:', e);
      return null;
    }

    const allMsgs = JSON.parse(localStorage.getItem('bc_messages') || '{}');
    const fullMsg: Message = {
      ...msgData,
      id: Math.random().toString(36).substr(2, 12),
      timestamp: Date.now(),
      channelId: cid
    };

    console.log('💾 Saving message to localStorage:', {
      id: fullMsg.id,
      hasAttachments: !!(fullMsg.attachments && fullMsg.attachments.length > 0),
      attachmentCount: fullMsg.attachments?.length,
      messageType: fullMsg.messageType
    });

    if (!allMsgs[cid]) allMsgs[cid] = [];

    // Deduplication check
    if (allMsgs[cid].find((m: Message) => m.messageHash === fullMsg.messageHash)) {
      console.warn('⚠️ Duplicate message detected, skipping');
      return null;
    }

    allMsgs[cid].push(fullMsg);
    // Mesh optimization: trim old packets
    if (allMsgs[cid].length > 200) allMsgs[cid] = allMsgs[cid].slice(-200);

    localStorage.setItem('bc_messages', JSON.stringify(allMsgs));
    console.log('✅ Message saved to localStorage');

    // Broadcast locally via BroadcastChannel
    this.bc.postMessage({ type: 'SYNC_PACKET', path: `messages/${cid}`, data: allMsgs[cid] });
    this.triggerListeners(`messages/${cid}`, allMsgs[cid]);

    // Also broadcast to remote peers via WebRTC
    if (this.webrtc && this.webrtc.isConnected()) {
      this.webrtc.broadcast({
        type: 'MESSAGE',
        channelId: cid,
        data: allMsgs[cid]
      });
    }

    return fullMsg;
  }

  async updateMessage(cid: string, msgId: string, updates: Partial<Message>) {
    const allMsgs = JSON.parse(localStorage.getItem('bc_messages') || '{}');
    if (!allMsgs[cid]) return;

    const idx = allMsgs[cid].findIndex((m: Message) => m.id === msgId);
    if (idx === -1) return;

    allMsgs[cid][idx] = { ...allMsgs[cid][idx], ...updates };
    localStorage.setItem('bc_messages', JSON.stringify(allMsgs));

    // Broadcast update
    this.bc.postMessage({ type: 'SYNC_PACKET', path: `messages/${cid}`, data: allMsgs[cid] });
    this.triggerListeners(`messages/${cid}`, allMsgs[cid]);

    // WebRTC update - send full list sync
    if (this.webrtc && this.webrtc.isConnected()) {
      this.webrtc.broadcast({
        type: 'MESSAGE',
        channelId: cid,
        data: allMsgs[cid]
      });
    }
  }

  async createSegment(name: string, isPrivate = false) {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const channels = JSON.parse(localStorage.getItem('bc_channels') || '[]');
    if (channels.find((c: Channel) => c.id === id)) return channels.find((c: Channel) => c.id === id);

    const newChan: Channel = { id, name, isPrivate, participants: [] };
    channels.push(newChan);
    localStorage.setItem('bc_channels', JSON.stringify(channels));
    this.bc.postMessage({ type: 'SYNC_PACKET', path: 'channels', data: channels });
    this.triggerListeners('channels', channels);
    return newChan;
  }

  broadcastPresence(uid: string, status: 'online' | 'away' | 'offline') {
    this.bc.postMessage({
      type: 'PRESENCE',
      uid,
      status,
      timestamp: Date.now()
    });
  }

  broadcastTyping(channelId: string, uid: string, userName: string, isTyping: boolean) {
    this.bc.postMessage({
      type: 'TYPING',
      channelId,
      uid,
      userName,
      isTyping,
      timestamp: Date.now()
    });

    // Also broadcast via WebRTC
    if (this.webrtc && this.webrtc.isConnected()) {
      this.webrtc.broadcast({
        type: 'TYPING',
        channelId,
        data: { uid, userName, isTyping }
      });
    }
  }

  // WebRTC Methods
  initializeWebRTC(userId: string, peerId: string) {
    if (this.webrtc) {
      console.log('WebRTC already initialized');
      return;
    }

    this.webrtc = new WebRTCMesh(userId, peerId);

    // Handle incoming WebRTC messages
    this.webrtc.onMessage((message) => {
      try {
        if (message.type === 'MESSAGE') {
          // CRITICAL FIX: Merge received messages into localStorage
          const channelId = message.channelId;

          // Safety check: ensure channelId exists
          if (!channelId) {
            console.warn('Received message without channelId:', message);
            return;
          }

          let allMsgs: any = {};
          try {
            allMsgs = JSON.parse(localStorage.getItem('bc_messages') || '{}');
          } catch (e) {
            console.error('Failed to parse bc_messages from localStorage, resetting:', e);
            allMsgs = {};
          }

          if (!allMsgs[channelId]) {
            allMsgs[channelId] = [];
          }

          // Merge incoming messages with existing ones (deduplicate by messageHash)
          const incomingMessages = Array.isArray(message.data) ? message.data : [message.data];

          incomingMessages.forEach((incomingMsg: any) => {
            // Safety check: ensure message has required fields
            if (!incomingMsg || !incomingMsg.timestamp) {
              console.warn('Skipping malformed message:', incomingMsg);
              return;
            }

            // Check if message already exists (by messageHash or id)
            const exists = allMsgs[channelId].find((m: any) =>
              (m.messageHash && incomingMsg.messageHash && m.messageHash === incomingMsg.messageHash) ||
              (m.id && incomingMsg.id && m.id === incomingMsg.id)
            );

            if (!exists) {
              allMsgs[channelId].push(incomingMsg);
            }
          });

          // Sort by timestamp to maintain chronological order
          allMsgs[channelId].sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));

          // Trim to last 200 messages
          if (allMsgs[channelId].length > 200) {
            allMsgs[channelId] = allMsgs[channelId].slice(-200);
          }

          // Save to localStorage
          try {
            localStorage.setItem('bc_messages', JSON.stringify(allMsgs));
          } catch (e) {
            console.error('Failed to save messages to localStorage:', e);
          }

          // Trigger local listeners to update UI
          this.triggerListeners(`messages/${channelId}`, allMsgs[channelId]);
        } else if (message.type === 'PRESENCE') {
          this.triggerListeners('presence', message.data);
        } else if (message.type === 'TYPING') {
          this.triggerListeners('typing', {
            type: 'TYPING',
            channelId: message.channelId,
            ...message.data,
            timestamp: message.timestamp
          });
        }
      } catch (error) {
        console.error('Error handling WebRTC message:', error, message);
      }
    });

    console.log('✅ WebRTC initialized');
  }

  async connectToRoom(roomId: string): Promise<void> {
    if (!this.webrtc) {
      // Auto-initialize if not already done
      const userId = localStorage.getItem('enchat_uid') || 'unknown';
      const peerId = Math.random().toString(36).substr(2, 12);
      this.initializeWebRTC(userId, peerId);
    }
    await this.webrtc!.connect(roomId);
    this.webrtcRoomId = roomId;
  }

  disconnectFromRoom(): void {
    if (this.webrtc) {
      this.webrtc.disconnect();
      this.webrtcRoomId = null;
    }
  }

  getWebRTCStatus() {
    return {
      isConnected: this.webrtc?.isConnected() || false,
      peerCount: this.webrtc?.getPeerCount() || 0,
      roomId: this.webrtcRoomId
    };
  }

  wipeNode() {
    localStorage.clear();
    this.bc.postMessage({ type: 'SYNC_PACKET', path: 'channels', data: [] });
    window.location.reload();
  }
}

const mesh = new MeshNode();

// --- COMPONENTS ---

// Moved MeshStatus up to be defined before use in Dashboard
const MeshStatus: React.FC = () => {
  return (
    <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-slate-800/50">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mesh: ACTIVE</span>
      </div>
      <div className="h-3 w-[1px] bg-slate-800"></div>
      <div className="flex items-center gap-2 text-slate-500">
        <Wifi size={12} />
        <span className="text-[9px] font-mono">P2P_LOCAL</span>
      </div>
    </div>
  );
};

const AuthScreen: React.FC<{ onAuth: (user: User) => void }> = ({ onAuth }) => {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;
    setLoading(true);

    // Simulate node discovery
    setTimeout(() => {
      const uid = Math.random().toString(36).substr(2, 10).toUpperCase();
      const user: User = {
        uid,
        displayName: handle.trim(),
        isOnline: true,
        lastSeen: Date.now()
      };
      localStorage.setItem('enchat_uid', uid);
      onAuth(user);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.5)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-[0_0_30px_rgba(37,99,235,0.3)] animate-pulse">
            <Radio size={40} />
          </div>

          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">EncHAT</h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-10">Local Mesh Protocol v1.0</p>

          <form className="w-full space-y-6" onSubmit={handleAuth}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Identity Handle</label>
              <input
                autoFocus
                disabled={loading}
                type="text"
                required
                className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-lg placeholder-slate-700"
                placeholder="ANON_NODE"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toUpperCase().replace(/\s/g, '_'))}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 uppercase text-sm tracking-widest"
            >
              {loading ? <Zap className="animate-spin" size={20} /> : 'Initialize Node'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800/50 w-full flex justify-between px-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Shield size={14} className="text-blue-500/50" />
              <span className="text-[9px] font-mono uppercase tracking-widest">E2E Ready</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Zap size={14} className="text-yellow-500/50" />
              <span className="text-[9px] font-mono uppercase tracking-widest">No Cloud</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Moved Transmission up to fix hoisting issues (used in Dashboard)
// Transmission component moved to components/Transmission.tsx

const Dashboard: React.FC<{ currentUser: User; onLogout: () => void }> = ({ currentUser, onLogout }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState('global-mesh');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionKeys, setSessionKeys] = useState<Record<string, string>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; timestamp: number }>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set([currentUser.uid]));
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // WebRTC state
  const [showPeerDiscovery, setShowPeerDiscovery] = useState(false);
  const [webrtcConnected, setWebrtcConnected] = useState(false);
  const [webrtcPeerCount, setWebrtcPeerCount] = useState(0);
  const [webrtcRoomId, setWebrtcRoomId] = useState<string | null>(null);

  // New state for WhatsApp features
  const [replyingTo, setReplyingTo] = useState<ReplyInfo | undefined>(undefined);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Mobile responsive
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [mobileTab, setMobileTab] = useState<'messages' | 'channels' | 'connect' | 'settings'>('messages');
  const [showSettings, setShowSettings] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubChannels = mesh.onSnapshot('channels', setChannels);
    return () => unsubChannels();
  }, []);

  useEffect(() => {
    const unsubMessages = mesh.onSnapshot(`messages/${activeChannelId}`, setMessages);
    return () => unsubMessages();
  }, [activeChannelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Presence heartbeat - broadcast online status every 5 seconds
  useEffect(() => {
    mesh.broadcastPresence(currentUser.uid, 'online');

    const heartbeat = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      const status = idleTime > 300000 ? 'away' : 'online'; // 5 min idle = away
      mesh.broadcastPresence(currentUser.uid, status);
    }, 5000);

    // Listen for presence updates
    const unsubPresence = mesh.onSnapshot('presence', (data: any) => {
      if (data.uid && data.uid !== currentUser.uid) {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (data.status === 'online' || data.status === 'away') {
            newSet.add(data.uid);
          } else {
            newSet.delete(data.uid);
          }
          return newSet;
        });
      }
    });

    // Broadcast offline on unmount
    return () => {
      clearInterval(heartbeat);
      mesh.broadcastPresence(currentUser.uid, 'offline');
      unsubPresence();
    };
  }, [currentUser.uid, lastActivity]);

  // Typing indicator cleanup
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(uid => {
          if (now - updated[uid].timestamp > 3000) {
            delete updated[uid];
          }
        });
        return updated;
      });
    }, 1000);

    // Listen for typing updates
    const unsubTyping = mesh.onSnapshot('typing', (data: any) => {
      if (data.channelId === activeChannelId && data.uid !== currentUser.uid) {
        if (data.isTyping) {
          setTypingUsers(prev => ({
            ...prev,
            [data.uid]: { name: data.userName, timestamp: data.timestamp }
          }));
        } else {
          setTypingUsers(prev => {
            const updated = { ...prev };
            delete updated[data.uid];
            return updated;
          });
        }
      }
    });

    return () => {
      clearInterval(cleanup);
      unsubTyping();
    };
  }, [activeChannelId, currentUser.uid]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  // Initialize WebRTC
  useEffect(() => {
    const peerId = Math.random().toString(36).substr(2, 12);
    mesh.initializeWebRTC(currentUser.uid, peerId);
  }, [currentUser.uid]);

  // Update WebRTC status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = mesh.getWebRTCStatus();
      setWebrtcConnected(status.isConnected);
      setWebrtcPeerCount(status.peerCount);
      setWebrtcRoomId(status.roomId);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const currentChannel = useMemo(() =>
    channels.find(c => c.id === activeChannelId) || channels[0],
    [channels, activeChannelId]);

  const handleDispatch = async (text: string, files?: File[]) => {
    console.log('📤 handleDispatch called:', { text, filesCount: files?.length });

    if (text.startsWith('/')) {
      handleProtocolCommand(text);
      return;
    }

    // Ensure we have either text or files
    if (!text.trim() && (!files || files.length === 0)) {
      console.warn('⚠️ Nothing to send - no text or files');
      return;
    }

    const currentSecret = sessionKeys[activeChannelId];
    let finalContent = text.trim();
    let attachments: FileAttachment[] | undefined;

    // Handle file attachments
    if (files && files.length > 0) {
      console.log('📎 Processing files:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
      attachments = [];
      for (const file of files) {
        try {
          // Validate file first
          const validation = validateFile(file);
          if (!validation.valid) {
            alert(`❌ ${file.name}: ${validation.error}`);
            continue; // Skip this file but process others
          }

          // Compress images if needed
          let processedFile = file;
          if (file.type.startsWith('image/')) {
            try {
              processedFile = await compressImage(file);
              if (processedFile.size < file.size) {
                console.log(`✅ Compressed ${file.name} from ${formatFileSize(file.size)} to ${formatFileSize(processedFile.size)}`);
              }
            } catch (e) {
              console.warn('Compression failed, using original file', e);
            }
          }

          let fileUrl = await fileToBase64(processedFile);
          let encrypted = false;

          if (currentChannel?.isPrivate && currentSecret) {
            const encryptedFile = await encryptFile(processedFile, currentSecret, activeChannelId);
            fileUrl = encryptedFile.encryptedData;
            encrypted = true;
          }

          attachments.push({
            id: Math.random().toString(36).substr(2, 12),
            name: processedFile.name,
            size: processedFile.size,
            type: processedFile.type,
            url: fileUrl,
            encrypted
          });
        } catch (e) {
          console.error('File processing failed', e);
          const errorMsg = e instanceof Error ? e.message : 'Unknown error';
          alert(`❌ Failed to process ${file.name}: ${errorMsg}\n\nTry a smaller file or different format.`);
        }
      }
    }

    // Encrypt text if private channel
    if (currentChannel?.isPrivate) {
      if (!currentSecret) {
        alert("CRITICAL: Segment Locked. Set session key via /key [secret]");
        return;
      }
      if (text) {
        finalContent = await encryptMessage(text, currentSecret, activeChannelId);
      }
    }

    const hash = await generateHash((text || 'file') + Date.now() + currentUser.uid);
    console.log('✅ Broadcasting message:', {
      finalContent: finalContent || '[file only]',
      attachmentsCount: attachments?.length,
      messageType: attachments && attachments.length > 0 ? 'file' : 'text'
    });
    await mesh.broadcast(activeChannelId, {
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      text: finalContent || '',
      messageHash: hash,
      attachments,
      messageType: attachments && attachments.length > 0 ? 'file' : 'text',
      status: 'sent',
      replyTo: replyingTo
    });

    // Reset states
    setSelectedFiles([]);
    setShowFileUpload(false);
    setReplyingTo(undefined);
    setMessageText('');
    setShowEmojiPicker(false);

    if (text.toLowerCase().includes('@gemini')) {
      processMeshAI(text);
    }
  };

  const handleReply = (msg: Message) => {
    const rawText = msg.text.startsWith(ENCRYPTION_PREFIX) ? '[Encrypted Message]' : msg.text; // Simplification, ideally we pass decrypted
    setReplyingTo({
      id: msg.id,
      senderName: msg.senderName,
      text: rawText,
      hasAttachment: !!(msg.attachments && msg.attachments.length > 0),
      attachmentType: msg.attachments?.[0]?.type,
      thumbnail: msg.attachments?.[0]?.type.startsWith('image') ? msg.attachments[0].url : undefined
    });
    inputRef.current?.focus();
  };

  const handleReact = (msg: Message, emoji: string) => {
    const currentReactions = msg.reactions || [];
    const existingReaction = currentReactions.find(r => r.emoji === emoji);
    let newReactions = [...currentReactions];

    if (existingReaction) {
      if (existingReaction.users.includes(currentUser.uid)) {
        // Already reacted, remove it (toggle)
        existingReaction.users = existingReaction.users.filter(u => u !== currentUser.uid);
        if (existingReaction.users.length === 0) {
          newReactions = newReactions.filter(r => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(currentUser.uid);
      }
    } else {
      newReactions.push({ emoji, users: [currentUser.uid] });
    }
    mesh.updateMessage(msg.channelId, msg.id, { reactions: newReactions });
  };

  const handleRemoveReaction = (msg: Message, emoji: string) => {
    handleReact(msg, emoji);
  };

  const handleDelete = (msg: Message, forEveryone: boolean) => {
    if (forEveryone) {
      mesh.updateMessage(msg.channelId, msg.id, {
        text: '🚫 This message was deleted',
        attachments: [],
        messageType: 'system' // Change to system type so it renders differently
      });
    } else {
      const deletedFor = msg.deletedFor || [];
      if (!deletedFor.includes(currentUser.uid)) {
        deletedFor.push(currentUser.uid);
        mesh.updateMessage(msg.channelId, msg.id, { deletedFor });
      }
    }
  };

  const handleForward = (msg: Message) => {
    setMessageText(`Forwarded: ${msg.text}`);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleVoiceMessage = async (audioBlob: Blob, duration: number, waveform: number[]) => {
    const currentSecret = sessionKeys[activeChannelId];
    let audioUrl = await audioToBase64(audioBlob);
    let encrypted = false;

    // Encrypt audio if private channel
    if (currentChannel?.isPrivate && currentSecret) {
      const encryptedAudio = await encryptAudio(audioBlob, currentSecret, activeChannelId);
      audioUrl = encryptedAudio.encryptedData;
      encrypted = true;
    }

    const attachment: FileAttachment = {
      id: Math.random().toString(36).substr(2, 12),
      name: `voice-${Date.now()}.webm`,
      size: audioBlob.size,
      type: 'audio/webm',
      url: audioUrl,
      encrypted
    };

    const hash = await generateHash('voice' + Date.now() + currentUser.uid);
    await mesh.broadcast(activeChannelId, {
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      text: '',
      messageHash: hash,
      attachments: [attachment],
      messageType: 'voice',
      status: 'sent'
    });

    setShowVoiceRecorder(false);
  };

  const handleCameraCapture = async (file: File, type: 'image' | 'video') => {
    console.log('📷 Camera captured:', { name: file.name, type, size: file.size });
    const files = [file];
    await handleDispatch('', files);
    setShowCameraCapture(false);
  };

  // WebRTC handlers
  const handleConnectToRoom = async (roomId: string) => {
    try {
      await mesh.connectToRoom(roomId);
      console.log(`✅ Connected to room: ${roomId}`);
    } catch (error) {
      console.error('Failed to connect to room:', error);
      throw error;
    }
  };

  const handleDisconnectFromRoom = () => {
    mesh.disconnectFromRoom();
    console.log('📴 Disconnected from WebRTC mesh');
  };

  const processMeshAI = async (input: string) => {
    setIsTyping(true);
    const secret = sessionKeys[activeChannelId];

    const context = await Promise.all(messages.slice(-15).map(async m => ({
      role: m.senderId === 'gemini-ai' ? 'model' : 'user',
      parts: [{
        text: m.text.startsWith(ENCRYPTION_PREFIX) && secret
          ? await decryptMessage(m.text, secret, activeChannelId)
          : m.text
      }]
    })));

    const response = await getGeminiResponse(input, context);
    setIsTyping(false);

    let aiPayload = response;
    if (currentChannel?.isPrivate && secret) {
      aiPayload = await encryptMessage(response, secret, activeChannelId);
    }

    await mesh.broadcast(activeChannelId, {
      senderId: 'gemini-ai',
      senderName: 'GEMINI_MESH_NODE',
      text: aiPayload,
      messageHash: 'ai-' + Date.now()
    });
  };

  const handleProtocolCommand = (cmd: string) => {
    const [command, ...args] = cmd.slice(1).split(' ');
    const param = args.join(' ');

    switch (command.toLowerCase()) {
      case 'join':
        if (param) mesh.createSegment(param).then(c => c && setActiveChannelId(c.id));
        break;
      case 'key':
        if (param) {
          setSessionKeys(prev => ({ ...prev, [activeChannelId]: param }));
          mesh.broadcast(activeChannelId, {
            senderId: 'system',
            senderName: 'PROTOCOL',
            text: `ENCRYPTION_KEY_SYNCHRONIZED_FOR_SEGMENT_${activeChannelId.toUpperCase()}`,
            messageHash: 'sys-' + Date.now()
          });
        }
        break;
      case 'wipe':
        if (confirm("PROTOCOL WIPE: Destroy all localized node data?")) {
          mesh.wipeNode();
        }
        break;
      case 'clear':
        setMessages([]);
        break;
      case 'help':
        mesh.broadcast(activeChannelId, {
          senderId: 'system',
          senderName: 'PROTOCOL',
          text: 'COMMANDS: /join [name], /key [secret], /wipe, /clear, /help',
          messageHash: 'sys-help-' + Date.now()
        });
        break;
      default:
        alert(`ERR: UNKNOWN_CMD [${command}]`);
    }
  };

  const selectChannel = (id: string) => {
    const c = channels.find(x => x.id === id);
    if (c?.isPrivate && !sessionKeys[id]) {
      const k = prompt(`Segment #${c.name} is encrypted. Enter session key:`);
      if (k) {
        setSessionKeys(prev => ({ ...prev, [id]: k }));
        setActiveChannelId(id);
      }
    } else {
      setActiveChannelId(id);
    }
    setIsSidebarOpen(false);
    setShowSettings(false);
    setMobileTab('messages');
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      <div className={`
        fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden
        ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setIsSidebarOpen(false)}></div>

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-slate-900/80 backdrop-blur-2xl border-r border-slate-800 flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Radio size={22} />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter text-white">EncHAT</h1>
          </div>
          <button className="md:hidden p-2 text-slate-500" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Mesh Segments</h2>
              <button
                onClick={() => {
                  const n = prompt('Identifier?');
                  if (n) mesh.createSegment(n, confirm('Enable E2EE?'));
                }}
                className="p-1.5 hover:bg-blue-600 hover:text-white rounded-lg text-slate-500 transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {channels.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectChannel(c.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeChannelId === c.id
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20'
                    : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {c.isPrivate ? <Lock size={15} /> : <Hash size={16} />}
                    <span className="truncate">{c.name}</span>
                  </div>
                  {activeChannelId !== c.id && c.isPrivate && <div className="w-2 h-2 bg-blue-500/20 rounded-full"></div>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 px-2">Protocol Controls</h2>
            <div className="space-y-1">
              <button onClick={() => setShowPeerDiscovery(true)} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-800/50 hover:text-slate-200 transition-all">
                <Users size={18} />
                <span>Node Discovery</span>
              </button>
              <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-800/50 hover:text-slate-200 transition-all">
                <Shield size={18} />
                <span>Security Console</span>
              </button>
              <button onClick={() => mesh.wipeNode()} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all">
                <Trash2 size={18} />
                <span>Emergency Wipe</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800/50 bg-slate-900/30">
          <div className="flex items-center gap-4 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
            <img
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.uid}`}
              className="w-10 h-10 rounded-xl bg-slate-800"
              alt="Avatar"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate">{currentUser.displayName}</p>
              <p className="text-[9px] font-mono text-slate-600 truncate">ID: {currentUser.uid}</p>
            </div>
            <button onClick={onLogout} className="text-slate-600 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 md:h-20 bg-slate-900/40 backdrop-blur-3xl border-b border-slate-800/50 flex items-center justify-between px-4 md:px-8 z-30">
          <div className="flex items-center gap-6">
            <button className="md:hidden p-2.5 bg-slate-800 rounded-2xl text-slate-400" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className={currentChannel?.isPrivate ? 'text-blue-500' : 'text-slate-600'}>
                  {currentChannel?.isPrivate ? <Lock size={22} /> : <Hash size={24} />}
                </span>
                <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">{currentChannel?.name}</h2>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Protocol Static: Clear</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <MeshStatus />

            {/* WebRTC Connection Status */}
            <ConnectionStatus
              isConnected={webrtcConnected}
              peerCount={webrtcPeerCount}
              roomId={webrtcRoomId}
              onClick={() => setShowPeerDiscovery(true)}
            />

            <button
              onClick={() => setShowMediaGallery(true)}
              className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"
              title="Media Gallery"
            >
              <ImageIcon size={20} />
            </button>
            <button className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all">
              <Search size={20} />
            </button>
          </div>
        </header>

        <section ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 pb-20 md:pb-8 relative">
          <div className="max-w-4xl mx-auto py-10">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 opacity-20">
                <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-600">
                  <Terminal size={48} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-[0.3em] mb-2">Channel Null</h3>
                  <p className="text-xs font-mono uppercase tracking-widest">Listening for mesh transmissions...</p>
                </div>
              </div>
            ) : (
              groupMessages(messages).map((group, groupIndex) => (
                <div key={groupIndex} className="mb-2">
                  {group.map((m, index) => {
                    // Check if message is deleted for current user
                    if (m.deletedFor?.includes(currentUser.uid)) {
                      return null;
                    }

                    return (
                      <Transmission
                        key={m.id}
                        m={m}
                        currentUser={currentUser}
                        secret={sessionKeys[activeChannelId]}
                        previousMessage={index > 0 ? group[index - 1] : undefined}
                        onReply={handleReply}
                        onReact={handleReact}
                        onRemoveReaction={handleRemoveReaction}
                        onDelete={handleDelete}
                        onForward={handleForward}
                        onCopy={handleCopy}
                      />
                    );
                  })}
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex items-center gap-3 text-blue-500/50 font-mono text-[10px] uppercase tracking-widest mt-4">
                <Zap size={12} className="animate-pulse" />
                <span>Neural node processing...</span>
              </div>
            )}

            {/* Typing Indicator */}
            {Object.keys(typingUsers).length > 0 && (
              <TypingIndicator users={Object.values(typingUsers).map((u: any) => u.name)} />
            )}
          </div>
        </section>

        <footer className="p-4 md:p-8 bg-slate-900/40 backdrop-blur-3xl border-t border-slate-800/50 pb-20 md:pb-8 z-40">
          {/* Modals are rendered here so they overlay properly */}
          {/* File Upload Modal */}
          {showFileUpload && (
            <div className="max-w-4xl mx-auto mb-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Attach Files</h3>
                <button
                  onClick={() => {
                    setShowFileUpload(false);
                    setSelectedFiles([]);
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <FileUpload
                onFilesSelected={setSelectedFiles}
                maxFiles={5}
              />
              {selectedFiles.length > 0 && (
                <button
                  onClick={() => {
                    // Send files with or without message text
                    handleDispatch(messageText || '', selectedFiles);
                  }}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  Send {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}

          {/* Voice Recorder Modal */}
          {showVoiceRecorder && (
            <div className="max-w-4xl mx-auto mb-6">
              <VoiceRecorder
                onSend={handleVoiceMessage}
                onCancel={() => setShowVoiceRecorder(false)}
                disabled={false}
              />
            </div>
          )}

          {/* Camera Capture Modal */}
          {showCameraCapture && (
            <div className="max-w-4xl mx-auto mb-6">
              <CameraCapture
                onCapture={handleCameraCapture}
                onCancel={() => setShowCameraCapture(false)}
              />
            </div>
          )}

          {/* Reply Preview */}
          {replyingTo && (
            <div className="max-w-4xl mx-auto px-2">
              <ReplyPreview replyConfig={replyingTo} onCancel={() => setReplyingTo(undefined)} />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const hasContent = messageText.trim() || selectedFiles.length > 0;
              if (hasContent) {
                handleDispatch(messageText, selectedFiles.length > 0 ? selectedFiles : undefined);
              }
            }}
            className="max-w-4xl mx-auto flex gap-2 md:gap-4 items-end"
          >
            <button
              type="button"
              onClick={() => setShowFileUpload(!showFileUpload)}
              className={`p-3 md:p-4 rounded-2xl transition-all shadow-xl mb-1 ${showFileUpload
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-white'
                }`}
              title="Attach files"
            >
              <Paperclip size={20} />
            </button>

            <button
              type="button"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className={`p-3 md:p-4 rounded-2xl transition-all shadow-xl mb-1 ${showVoiceRecorder
                ? 'bg-red-600 text-white'
                : 'bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-white'
                }`}
              title="Record voice message"
            >
              <Mic size={20} />
            </button>

            <button
              type="button"
              onClick={() => setShowCameraCapture(!showCameraCapture)}
              className={`p-3 md:p-4 rounded-2xl transition-all shadow-xl mb-1 ${showCameraCapture
                ? 'bg-green-600 text-white'
                : 'bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-white'
                }`}
              title="Capture photo/video"
            >
              <Camera size={20} />
            </button>

            <div className="relative flex-1 group bg-slate-950/80 border border-slate-800 rounded-3xl flex items-center shadow-2xl">
              {/* Emoji Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-3 text-slate-500 hover:text-yellow-400 transition-colors"
                >
                  <Smile size={20} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-4 left-0 z-50">
                    <EmojiPicker onSelect={(emoji) => {
                      setMessageText(prev => prev + emoji);
                      // Keep open for multiple emojis
                    }} />
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                name="msg"
                autoComplete="off"
                type="text"
                className="w-full bg-transparent border-none text-white px-2 py-4 focus:outline-none focus:ring-0 font-medium text-base placeholder-slate-600"
                placeholder={`Message #${currentChannel?.name}...`}
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  // Broadcast typing status
                  if (e.target.value.length > 0) {
                    mesh.broadcastTyping(activeChannelId, currentUser.uid, currentUser.displayName, true);
                  } else {
                    mesh.broadcastTyping(activeChannelId, currentUser.uid, currentUser.displayName, false);
                  }
                }}
                onBlur={() => {
                  // Stop typing when input loses focus
                  mesh.broadcastTyping(activeChannelId, currentUser.uid, currentUser.displayName, false);
                }}
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white p-3 md:p-4 rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 active:scale-90 mb-1"
            >
              <Send size={20} />
            </button>
          </form>

          <div className="max-w-4xl mx-auto mt-4 flex justify-between items-center opacity-30 text-[9px] font-black uppercase tracking-[0.3em]">
            <div className="flex gap-4">
              <span>{currentChannel?.isPrivate ? 'E2EE_ACTIVE' : 'OPEN_WAVE'}</span>
              <span>Buffer: {messages.length}/200</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={10} />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Settings Page (Desktop & Mobile) */}
      {(showSettings || mobileTab === 'settings') && (
        <div className="fixed inset-0 z-50 md:relative md:flex-1 md:z-auto">
          <SettingsPage
            currentUser={currentUser}
            onLogout={onLogout}
            onClose={() => {
              setShowSettings(false);
              setMobileTab('messages');
            }}
            webrtcConnected={webrtcConnected}
            webrtcPeerCount={webrtcPeerCount}
            webrtcRoomId={webrtcRoomId}
          />
        </div>
      )}

      {/* Media Gallery Modal */}
      {showMediaGallery && (
        <MediaGallery
          messages={messages}
          onClose={() => setShowMediaGallery(false)}
        />
      )}

      {/* Peer Discovery Modal */}
      {showPeerDiscovery && (
        <PeerDiscovery
          onClose={() => setShowPeerDiscovery(false)}
          onConnect={handleConnectToRoom}
          onDisconnect={handleDisconnectFromRoom}
          isConnected={webrtcConnected}
          currentRoom={webrtcRoomId}
          peerCount={webrtcPeerCount}
        />
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileNav
          activeTab={mobileTab}
          onTabChange={(tab) => {
            setMobileTab(tab);
            if (tab === 'channels') {
              setIsSidebarOpen(true);
              setShowSettings(false);
            }
            if (tab === 'connect') {
              setShowPeerDiscovery(true);
              setShowSettings(false);
            }
            if (tab === 'settings') {
              setShowSettings(true);
              setIsSidebarOpen(false);
            }
            if (tab === 'messages') {
              setShowSettings(false);
              setIsSidebarOpen(false);
            }
          }}
          isConnected={webrtcConnected}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for smooth UX
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('bitchat_user_v2');
      if (saved) setUser(JSON.parse(saved));
      setLoading(false);
    }, 1500); // 1.5 second loading screen

    return () => clearTimeout(timer);
  }, []);

  const handleAuth = (u: User) => {
    setUser(u);
    localStorage.setItem('bitchat_user_v2', JSON.stringify(u));
  };

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('bitchat_user_v2');
    localStorage.removeItem('bitchat_uid');
    await clearAllKeys();
  };

  return (
    <>
      {loading ? (
        <LoadingScreen />
      ) : (
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                user
                  ? <Dashboard currentUser={user} onLogout={handleLogout} />
                  : <AuthScreen onAuth={handleAuth} />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      )}
    </>
  );
};

export default App;
