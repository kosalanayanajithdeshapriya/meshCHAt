import React from 'react';
import { Wifi, WifiOff, Users } from 'lucide-react';

interface ConnectionStatusProps {
    isConnected: boolean;
    peerCount: number;
    roomId: string | null;
    onClick: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    isConnected,
    peerCount,
    roomId,
    onClick
}) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isConnected
                    ? 'bg-green-500/10 border border-green-500/30 hover:bg-green-500/20'
                    : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800'
                }`}
            title={isConnected ? `Connected to ${roomId}` : 'Connect to other devices'}
        >
            {isConnected ? (
                <>
                    <Wifi size={18} className="text-green-400" />
                    <span className="text-sm font-bold text-green-400">
                        {peerCount} {peerCount === 1 ? 'Peer' : 'Peers'}
                    </span>
                </>
            ) : (
                <>
                    <WifiOff size={18} className="text-slate-500" />
                    <span className="text-sm font-bold text-slate-500">Connect</span>
                </>
            )}
        </button>
    );
};
