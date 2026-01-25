
import React from 'react';

interface TypingIndicatorProps {
    users: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
    if (users.length === 0) return null;

    const displayText = users.length === 1
        ? `${users[0]} is typing`
        : users.length === 2
            ? `${users[0]} and ${users[1]} are typing`
            : `${users[0]} and ${users.length - 1} others are typing`;

    return (
        <div className="flex items-center gap-3 px-4 py-2 text-blue-400/70 font-mono text-xs">
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="uppercase tracking-wider">{displayText}...</span>
        </div>
    );
};
