import React, { useState } from 'react';
import { X, Copy, Check, Users, Wifi, WifiOff } from 'lucide-react';

interface PeerDiscoveryProps {
    onClose: () => void;
    onConnect: (roomId: string) => Promise<void>;
    onDisconnect: () => void;
    isConnected: boolean;
    currentRoom: string | null;
    peerCount: number;
}

export const PeerDiscovery: React.FC<PeerDiscoveryProps> = ({
    onClose,
    onConnect,
    onDisconnect,
    isConnected,
    currentRoom,
    peerCount
}) => {
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    // Generate random room code
    const generateRoomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'MESH-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    // Initialize room code
    React.useEffect(() => {
        if (!roomCode) {
            setRoomCode(generateRoomCode());
        }
    }, []);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCreateRoom = async () => {
        setConnecting(true);
        setError('');

        try {
            await onConnect(roomCode);
        } catch (err) {
            setError('Failed to create room. Check signaling server connection.');
            console.error(err);
        } finally {
            setConnecting(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!joinCode.trim()) {
            setError('Please enter a room code');
            return;
        }

        setConnecting(true);
        setError('');

        try {
            await onConnect(joinCode.toUpperCase());
        } catch (err) {
            setError('Failed to join room. Check the code and try again.');
            console.error(err);
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = () => {
        onDisconnect();
        setMode('create');
        setRoomCode(generateRoomCode());
        setJoinCode('');
    };

    if (isConnected && currentRoom) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white">Connected</h2>
                            <p className="text-sm text-slate-500 font-mono mt-1">
                                Room: {currentRoom}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Connected Status */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
                            <div className="p-3 bg-green-500/20 rounded-xl">
                                <Wifi size={24} className="text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-bold">Connected to Mesh</p>
                                <p className="text-sm text-slate-400 font-mono">
                                    {peerCount} {peerCount === 1 ? 'peer' : 'peers'} online
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-800/50 rounded-2xl">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Room Code</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-lg font-mono font-bold text-white">
                                    {currentRoom}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(currentRoom);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                                >
                                    {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleDisconnect}
                            className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold transition-all"
                        >
                            Disconnect from Mesh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white">Connect to Mesh</h2>
                        <p className="text-sm text-slate-500 font-mono mt-1">
                            Cross-device P2P messaging
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="px-6 pt-6 flex gap-2">
                    <button
                        onClick={() => setMode('create')}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${mode === 'create'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                            }`}
                    >
                        Create Room
                    </button>
                    <button
                        onClick={() => setMode('join')}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${mode === 'join'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                            }`}
                    >
                        Join Room
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {mode === 'create' ? (
                        <>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2 uppercase tracking-wider">
                                    Your Room Code
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={roomCode}
                                        readOnly
                                        className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleCopyCode}
                                        className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 transition-colors"
                                    >
                                        {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Share this code with others to connect
                                </p>
                            </div>

                            <button
                                onClick={handleCreateRoom}
                                disabled={connecting}
                                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {connecting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Users size={20} />
                                        Create Room & Connect
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2 uppercase tracking-wider">
                                    Enter Room Code
                                </label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="MESH-ABC123"
                                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleJoinRoom();
                                    }}
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Get the code from the room creator
                                </p>
                            </div>

                            <button
                                onClick={handleJoinRoom}
                                disabled={connecting || !joinCode.trim()}
                                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {connecting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    <>
                                        <Wifi size={20} />
                                        Join Room
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {/* Info */}
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            <strong className="text-slate-400">WebRTC P2P:</strong> Direct peer-to-peer connection.
                            Messages are encrypted and sent directly between devices. No server in the middle!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
