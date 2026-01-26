import React, { useState, useEffect, useMemo } from 'react';

const CHARS = '0123456789ABCDEF';
const STREAM_COUNT = 150;

const getRandomColorClass = () => {
    const rand = Math.random();
    if (rand < 0.45) return 'text-blue-400';
    if (rand < 0.9) return 'text-violet-400';
    return 'text-slate-200'; // Platinum
};


// FIX: Changed function component declaration to use React.FC to fix a TypeScript error with the 'key' prop.
const RainColumn: React.FC<{ speed: number }> = ({ speed }) => {
    const [text, setText] = useState('');
    const [position, setPosition] = useState({ top: -1000, left: 0 }); // Start off-screen
    const columnHeight = useMemo(() => Math.floor(Math.random() * 20) + 20, []);
    
    const columnColors = useMemo(() => {
        return Array.from({ length: columnHeight }, () => getRandomColorClass());
    }, [columnHeight]);

    // Safely calculate position after the component has mounted
    useEffect(() => {
        setPosition({
            top: -Math.random() * window.innerHeight * 1.5,
            left: Math.random() * 100
        });
    }, []);

    useEffect(() => {
        let initialText = '';
        for (let i = 0; i < columnHeight; i++) {
            initialText += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        }
        setText(initialText);

        const interval = setInterval(() => {
            setText(prev => {
                let newText = '';
                for (let i = 0; i < columnHeight; i++) {
                    newText += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
                }
                return newText;
            });
        }, Math.random() * 150 + 100);

        return () => clearInterval(interval);
    }, [columnHeight]);
    
    return (
        <div
            className="absolute writing-mode-vertical-rl text-sm opacity-70"
            style={{
                left: `${position.left}vw`,
                top: `${position.top}px`,
                animation: `fall ${speed}s linear infinite`,
                textShadow: '0 0 8px rgba(96, 165, 250, 0.5), 0 0 8px rgba(139, 92, 246, 0.5)',
            }}
            aria-hidden="true"
        >
            {text.split('').map((char, index) => (
                <span key={index} className={columnColors[index]}>
                    {char}
                </span>
            ))}
        </div>
    );
};

export default function SimulationVisualizer(): React.ReactNode {
    const streams = useMemo(() => {
        return Array.from({ length: STREAM_COUNT }).map((_, i) => ({
            id: i,
            speed: Math.random() * 12 + 8,
        }));
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
            {streams.map(stream => (
                <RainColumn key={stream.id} speed={stream.speed} />
            ))}
        </div>
    );
};