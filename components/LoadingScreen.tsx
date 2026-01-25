import React from 'react';
import { Radio, Zap } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden">
            {/* Animated grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.5)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 animate-pulse"></div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Logo */}
                <div className="relative">
                    <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_50px_rgba(37,99,235,0.4)] animate-pulse">
                        <Radio size={48} strokeWidth={2.5} />
                    </div>
                    {/* Pulse rings */}
                    <div className="absolute inset-0 rounded-3xl bg-blue-600/20 animate-ping"></div>
                    <div className="absolute inset-0 rounded-3xl bg-blue-600/10 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                </div>

                {/* App name */}
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-5xl font-black text-white tracking-tighter italic">BITCHAT</h1>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.3em]">Decentralized Mesh Protocol</p>
                </div>

                {/* Loading indicator */}
                <div className="flex items-center gap-3 mt-4">
                    <Zap className="text-blue-500 animate-spin" size={20} />
                    <span className="text-slate-400 text-sm font-mono">Initializing Node...</span>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2 mt-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>

            {/* Bottom text */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <p className="text-slate-600 text-xs font-mono">v1.0.0 • E2E Encrypted • P2P Mesh Network</p>
            </div>
        </div>
    );
};
