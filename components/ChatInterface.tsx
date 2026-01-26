import React, { useState, useRef, useEffect } from 'react';
import { Role, Message } from '../types';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import Icon from './Icon';

interface ChatInterfaceProps {
    messages: Message[];
    onSend: (userInput: string, file: File | null) => void;
    isLoading: boolean;
    systemNotification: string | null;
    // New props for speech recognition
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    hasSpeechRecognition: boolean;
}

const initialMessage: Message = {
    id: 'initial-message',
    role: Role.BOT,
    content: "The streams of thought have aligned. I'm here. What shall we explore?",
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    messages, onSend, isLoading, systemNotification,
    isListening, transcript, startListening, stopListening, hasSpeechRecognition
}) => {
    const [input, setInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // When the transcript from the speech hook updates, update our input field
    useEffect(() => {
        if (isListening) {
            setInput(transcript);
        }
    }, [transcript, isListening]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                setFileError("File is too large (Max 10MB).");
                setFile(null);
            } else if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
                setFileError("Unsupported file type (PDF/DOCX only).");
                setFile(null);
            }
            else {
                setFile(selectedFile);
                setFileError(null);
            }
        }
        if(event.target) event.target.value = '';
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFileError(null);
    };

    const handleSendClick = () => {
        if ((input.trim() === '' && !file) || isLoading) return;
        if (isListening) stopListening();
        onSend(input, file);
        setInput('');
        setFile(null);
        setFileError(null);
    };

    const handleMicClick = () => {
        if (isLoading) return;
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };
    
    const displayedMessages = messages.length > 0 ? messages : [initialMessage];

    return (
        <div className="h-full w-full flex flex-col bg-black/20 backdrop-blur-sm rounded-lg shadow-2xl shadow-indigo-900/50 ring-1 ring-violet-500/30 overflow-hidden">
            {systemNotification && (
                <div className="text-center p-2 bg-slate-900/80 text-violet-300 text-sm animate-pulse-slow border-b border-violet-700/40 z-10">
                    {systemNotification}
                </div>
            )}
            
            <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-4">
                {displayedMessages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-violet-800/60">
                {(file || fileError) && (
                     <div className="mb-2 px-3 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-md flex justify-between items-center">
                        {fileError ? ( <span className="text-red-400">{fileError}</span> ) : file && ( <span className="text-blue-300 truncate">{file.name}</span> )}
                         <button onClick={handleRemoveFile} className="ml-2 text-slate-400 hover:text-white">
                             <Icon name="x-circle" className="w-5 h-5"/>
                         </button>
                     </div>
                )}
                <div className="flex items-center bg-slate-900/50 border border-blue-500/50 rounded-md focus-within:ring-2 focus-within:ring-blue-400 transition-all">
                    <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-3 text-violet-400 hover:text-violet-200 disabled:text-violet-800 transition-colors">
                       <Icon name="paperclip" className="w-5 h-5"/>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx" />
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendClick();
                            }
                        }}
                        placeholder={isListening ? "Listening..." : (file ? "Add a message about the file..." : "Transmit your query...")}
                        className="flex-1 p-3 bg-transparent text-slate-300 placeholder-slate-500 focus:outline-none"
                        disabled={isLoading}
                    />
                    {hasSpeechRecognition && (
                        <button onClick={handleMicClick} disabled={isLoading} className={`p-3 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-violet-400 hover:text-violet-200'}`}>
                            <Icon name="microphone" className="w-5 h-5"/>
                        </button>
                    )}
                    <button onClick={handleSendClick} disabled={isLoading || (!input.trim() && !file)} className="p-3 text-violet-400 hover:text-violet-200 disabled:text-violet-800 disabled:cursor-not-allowed transition-colors">
                        <Icon name="send" className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
