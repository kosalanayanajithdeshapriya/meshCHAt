import React from 'react';
import { Plus, Edit, Send } from 'lucide-react';

interface FloatingActionButtonProps {
    onClick: () => void;
    icon?: 'plus' | 'edit' | 'send';
    label?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    onClick,
    icon = 'plus',
    label
}) => {
    const Icon = icon === 'plus' ? Plus : icon === 'edit' ? Edit : Send;

    return (
        <button
            onClick={onClick}
            className="md:hidden fixed bottom-20 right-4 z-40 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl shadow-blue-900/50 transition-all active:scale-90 flex items-center gap-2 group"
            aria-label={label || 'Action button'}
        >
            <div className="w-14 h-14 flex items-center justify-center">
                <Icon size={24} />
            </div>
            {label && (
                <span className="pr-4 font-semibold text-sm whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs transition-all duration-300 overflow-hidden">
                    {label}
                </span>
            )}
        </button>
    );
};
