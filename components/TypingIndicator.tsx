import React from 'react';

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2 my-2 ml-11">
        <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-pulse"></div>
        <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

export default TypingIndicator;
