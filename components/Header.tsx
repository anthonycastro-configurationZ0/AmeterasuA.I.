import React from 'react';
import Icon from './Icon';

interface HeaderProps {
    onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps): React.ReactNode {
    return (
        <header className="relative text-center border-b border-violet-800/60 pb-4">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">
                Ameterasu A.I.
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl mx-auto">
                An intelligence modulated by a dynamic particle field.
            </p>
             <button 
                onClick={onOpenSettings} 
                className="absolute top-0 right-0 p-2 text-slate-400 hover:text-violet-300 transition-colors"
                aria-label="Open settings"
             >
                <Icon name="settings" className="w-6 h-6" />
            </button>
        </header>
    );
}
