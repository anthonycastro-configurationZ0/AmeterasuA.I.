import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { Message } from '../types';
import { Role } from '../types';

// Simple inline icons to avoid dependency/file issues
const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-blue-600/80 flex items-center justify-center flex-shrink-0 ring-2 ring-blue-500/50">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    </div>
);

const BotIcon = () => (
     <div className="w-8 h-8 rounded-full bg-violet-600/80 flex items-center justify-center flex-shrink-0 ring-2 ring-violet-500/50">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
    </div>
);

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === Role.USER;

    // Sanitize and parse markdown only for bot messages
    const sanitizedHtml = isUser 
        ? '' 
        : DOMPurify.sanitize(marked.parse(message.content) as string, {
            // Allow basic formatting but disable potentially harmful tags
            USE_PROFILES: { html: true } 
          });

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && <BotIcon />}

            <div className={`max-w-xl p-3 rounded-xl shadow-md prose prose-sm prose-invert prose-p:my-2 prose-headings:my-3 prose-li:my-1
                ${
                    isUser 
                    ? 'bg-blue-600/50 text-slate-200 rounded-br-none' 
                    : 'bg-slate-900/60 text-slate-300 rounded-bl-none'
                }`
            }>
                {isUser ? (
                    // Use <p> for user messages for consistent styling if needed
                    <p className="whitespace-pre-wrap m-0">{message.content}</p>
                ) : (
                    // Render the sanitized HTML from the bot
                    <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
                )}
            </div>

            {isUser && <UserIcon />}
        </div>
    );
};

export default ChatMessage;
