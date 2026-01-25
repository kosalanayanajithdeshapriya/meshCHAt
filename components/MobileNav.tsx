import React from 'react';
import { MessageSquare, Users, Settings, Wifi } from 'lucide-react';

interface MobileNavProps {
    activeTab: 'messages' | 'channels' | 'connect' | 'settings';
    onTabChange: (tab: 'messages' | 'channels' | 'connect' | 'settings') => void;
    unreadCount?: number;
    isConnected?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
    activeTab,
    onTabChange,
    unreadCount = 0,
    isConnected = false
}) => {
    const tabs = [
        { id: 'messages' as const, icon: MessageSquare, label: 'Messages', badge: unreadCount },
        { id: 'channels' as const, icon: Users, label: 'Channels' },
        { id: 'connect' as const, icon: Wifi, label: 'Connect', active: isConnected },
        { id: 'settings' as const, icon: Settings, label: 'Settings' }
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 safe-area-bottom">
            <div className="flex items-center justify-around px-2 py-2">
                {tabs.map(({ id, icon: Icon, label, badge, active }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px] ${activeTab === id
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <div className="relative">
                            <Icon size={20} />
                            {badge > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    {badge > 9 ? '9+' : badge}
                                </span>
                            )}
                            {active && id === 'connect' && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-slate-900"></span>
                            )}
                        </div>
                        <span className="text-[10px] font-semibold">{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};
