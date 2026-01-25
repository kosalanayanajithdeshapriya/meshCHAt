import React from 'react';
import {
    Radio,
    Shield,
    Zap,
    Users,
    Lock,
    Wifi,
    MessageSquare,
    FileText,
    Mic,
    Camera,
    Image,
    Globe,
    LogOut,
    Trash2,
    Info,
    CheckCircle,
    X
} from 'lucide-react';

interface SettingsPageProps {
    currentUser: { uid: string; displayName: string };
    onLogout: () => void;
    onClose?: () => void;
    webrtcConnected: boolean;
    webrtcPeerCount: number;
    webrtcRoomId: string | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
    currentUser,
    onLogout,
    onClose,
    webrtcConnected,
    webrtcPeerCount,
    webrtcRoomId
}) => {
    const handleClearData = () => {
        if (confirm('⚠️ This will delete all messages and channels. Continue?')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#020617] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Settings size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">Settings</h1>
                        <p className="text-xs text-slate-500 font-mono">Configuration & Info</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* About BitChat */}
                <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                            <Radio size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic">BITCHAT</h2>
                            <p className="text-xs text-slate-500 font-mono">v1.0.0 • Decentralized Mesh Protocol</p>
                        </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed mb-4">
                        BitChat is a <span className="text-blue-400 font-bold">peer-to-peer encrypted messaging platform</span> that operates without central servers.
                        Your messages are transmitted directly between devices using WebRTC technology.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-xs text-blue-400 font-mono">
                            E2E Encrypted
                        </span>
                        <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full text-xs text-green-400 font-mono">
                            No Cloud
                        </span>
                        <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs text-purple-400 font-mono">
                            P2P Mesh
                        </span>
                    </div>
                </section>

                {/* Key Features */}
                <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Key Features</h3>

                    <div className="space-y-3">
                        <FeatureItem
                            icon={<Shield size={18} />}
                            title="End-to-End Encryption"
                            description="Messages encrypted with AES-256-GCM"
                        />
                        <FeatureItem
                            icon={<Wifi size={18} />}
                            title="P2P Mesh Network"
                            description="Direct device-to-device communication"
                        />
                        <FeatureItem
                            icon={<MessageSquare size={18} />}
                            title="Real-time Messaging"
                            description="Instant message delivery via WebRTC"
                        />
                        <FeatureItem
                            icon={<FileText size={18} />}
                            title="File Sharing"
                            description="Send images, videos, documents (up to 10MB)"
                        />
                        <FeatureItem
                            icon={<Mic size={18} />}
                            title="Voice Messages"
                            description="Record and send audio messages"
                        />
                        <FeatureItem
                            icon={<Camera size={18} />}
                            title="Camera Capture"
                            description="Take photos and videos directly"
                        />
                        <FeatureItem
                            icon={<Users size={18} />}
                            title="Multi-Peer Support"
                            description="Connect with multiple devices simultaneously"
                        />
                        <FeatureItem
                            icon={<Globe size={18} />}
                            title="Cross-Network"
                            description="Works across different WiFi/mobile networks"
                        />
                    </div>
                </section>

                {/* Connection Status */}
                <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Connection Status</h3>

                    <div className="space-y-3">
                        <StatusItem
                            label="User ID"
                            value={currentUser.uid}
                            status="active"
                        />
                        <StatusItem
                            label="Display Name"
                            value={currentUser.displayName}
                            status="active"
                        />
                        <StatusItem
                            label="WebRTC Status"
                            value={webrtcConnected ? 'Connected' : 'Disconnected'}
                            status={webrtcConnected ? 'active' : 'inactive'}
                        />
                        <StatusItem
                            label="Connected Peers"
                            value={`${webrtcPeerCount} peer(s)`}
                            status={webrtcPeerCount > 0 ? 'active' : 'inactive'}
                        />
                        {webrtcRoomId && (
                            <StatusItem
                                label="Room ID"
                                value={webrtcRoomId}
                                status="active"
                            />
                        )}
                    </div>
                </section>

                {/* Actions */}
                <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Actions</h3>

                    <div className="space-y-3">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all text-left group"
                        >
                            <LogOut size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white">Logout</div>
                                <div className="text-xs text-slate-500">Exit current session</div>
                            </div>
                        </button>

                        <button
                            onClick={handleClearData}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/20 hover:bg-red-900/30 border border-red-800/50 rounded-xl transition-all text-left group"
                        >
                            <Trash2 size={18} className="text-red-400 group-hover:text-red-300 transition-colors" />
                            <div className="flex-1">
                                <div className="text-sm font-bold text-red-400">Clear All Data</div>
                                <div className="text-xs text-red-500/70">Delete all messages and channels</div>
                            </div>
                        </button>
                    </div>
                </section>

                {/* How to Use */}
                <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">How to Use</h3>

                    <div className="space-y-4 text-sm text-slate-300">
                        <div>
                            <h4 className="font-bold text-white mb-2">📱 Connect Devices</h4>
                            <ol className="list-decimal list-inside space-y-1 text-slate-400 ml-2">
                                <li>Click "Peer Discovery" to create or join a room</li>
                                <li>Share the room code with other devices</li>
                                <li>Wait for connection to establish</li>
                            </ol>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">💬 Send Messages</h4>
                            <ol className="list-decimal list-inside space-y-1 text-slate-400 ml-2">
                                <li>Type your message in the input field</li>
                                <li>Press send or hit Enter</li>
                                <li>Messages sync across all connected devices</li>
                            </ol>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">📎 Share Files</h4>
                            <ol className="list-decimal list-inside space-y-1 text-slate-400 ml-2">
                                <li>Click the paperclip icon</li>
                                <li>Select files (max 10MB each)</li>
                                <li>Images are automatically compressed</li>
                            </ol>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">🔒 Private Channels</h4>
                            <ol className="list-decimal list-inside space-y-1 text-slate-400 ml-2">
                                <li>Create a channel with encryption enabled</li>
                                <li>Set a session key: <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">/key yourpassword</code></li>
                                <li>All messages are end-to-end encrypted</li>
                            </ol>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <div className="text-center text-xs text-slate-600 font-mono py-4">
                    <p>BitChat • Decentralized Mesh Protocol</p>
                    <p className="mt-1">No servers • No tracking • No cloud</p>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
    icon,
    title,
    description
}) => (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800/50 hover:border-slate-700 transition-colors">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">{title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        </div>
    </div>
);

const StatusItem: React.FC<{ label: string; value: string; status: 'active' | 'inactive' }> = ({
    label,
    value,
    status
}) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
        <span className="text-sm text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-white">{value}</span>
            {status === 'active' ? (
                <CheckCircle size={16} className="text-green-500" />
            ) : (
                <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
            )}
        </div>
    </div>
);

// Import Settings icon
const Settings = ({ size, className }: { size: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m-6-6h6m6 0h6"></path>
    </svg>
);
