import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { useSpeech } from './hooks/useSpeech';
import { sendMessageToBot } from './services/geminiService';
import simulationService from './services/simulationService';
import type { Message, SimulationOutput, GeminiHistory, AppSettings } from './types';
import { Role } from './types';
import { CHAT_HISTORY_KEY, SIMULATION_STATE_KEY, SETTINGS_KEY } from './constants';
import { parsePdf, parseDocx } from './utils/fileParser';
import { stripMarkdown } from './utils/textUtils';

import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import SimulationVisualizer from './components/SimulationVisualizer';
import SettingsPanel from './components/SettingsPanel';

const textToNumericArray = (text: string, length: number = 50): number[] => {
    const arr = new Array(length).fill(0);
    if (!text) return arr;
    for (let i = 0; i < text.length; i++) {
        arr[i % length] += text.charCodeAt(i) / 255.0;
    }
    const maxVal = Math.max(...arr.map(v => Math.abs(v)));
    if (maxVal === 0) return arr;
    return arr.map(v => (v / maxVal) * 0.1);
};

const formatSystemReport = (result: SimulationOutput): string => {
    if (!result || result.error) return "[SYSTEM STATE REPORT]\nError in simulation cycle.";
    return `[SYSTEM STATE REPORT]
Time: ${result.time.toFixed(2)} | Stability: ${result.stability.toFixed(4)} | Chaos: ${result.patterns.chaos_metric.toFixed(4)} | MI Loss: ${result.mi_feedback.mi_loss.toFixed(5)}
[/SYSTEM STATE REPORT]`;
};

const transformToGeminiHistory = (messages: Message[]): GeminiHistory => {
  return messages
    .filter(msg => msg.content.trim() !== '')
    .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));
};

const defaultSettings: AppSettings = {
    ai: {
        temperature: 0.7,
        maxOutputTokens: 1024,
    },
    simulation: {
        syntropyTarget: 0.5,
        initialMass: 1.0,
        initialCoupling: 0.1,
    }
};

const loadSettings = (): AppSettings => {
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            // Merge with defaults to ensure all keys are present
            return {
                ai: { ...defaultSettings.ai, ...parsed.ai },
                simulation: { ...defaultSettings.simulation, ...parsed.simulation },
            };
        }
    } catch (error) {
        console.error("Failed to load settings:", error);
    }
    return defaultSettings;
};


export default function App(): React.ReactNode {
    const [settings, setSettings] = useState<AppSettings>(loadSettings);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const { triggerCycle, resetSimulation } = useSimulation({
        ...settings.simulation,
        width: 50,
        height: 50,
    });
    const { isListening, transcript, startListening, stopListening, hasSpeechRecognition, speak, cancelSpeech } = useSpeech();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [systemNotification, setSystemNotification] = useState<string | null>(null);
    const hasInitialized = useRef(false);

    useEffect(() => {
        let chatHistoryLoaded = false;
        try {
            const savedHistoryJson = localStorage.getItem(CHAT_HISTORY_KEY);
            if (savedHistoryJson) {
                const parsedHistory = JSON.parse(savedHistoryJson) as Message[];
                if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
                    setMessages(parsedHistory);
                    chatHistoryLoaded = true;
                }
            }
        } catch (error) {
            console.error("Failed to load chat history:", error);
            localStorage.removeItem(CHAT_HISTORY_KEY);
        }

        try {
            const savedSimStateJson = localStorage.getItem(SIMULATION_STATE_KEY);
            if (savedSimStateJson) {
                const savedSimState = JSON.parse(savedSimStateJson);
                simulationService.loadState(savedSimState);
            }
        } catch (error) {
            console.error("Failed to load simulation state:", error);
            localStorage.removeItem(SIMULATION_STATE_KEY);
        }
        
        if (chatHistoryLoaded) {
            setSystemNotification("Continuity established. Cognitive state restored.");
            setTimeout(() => setSystemNotification(null), 4000);
        }

        hasInitialized.current = true;
    }, []);

    useEffect(() => {
        if (hasInitialized.current) {
            if (messages.length > 0) {
                localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
            }
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        }
    }, [messages, settings]);

    const handleSend = useCallback(async (userInput: string, file: File | null) => {
        const userMessageContent = userInput.trim();
        if ((userMessageContent === '' && !file) || isLoading) return;

        setIsLoading(true);
        cancelSpeech(); // Cancel any ongoing speech

        let messageWithFileContext = userMessageContent;
        let uiMessageContent = userMessageContent;
        
        if (file) {
            try {
                const parsedText = file.type === 'application/pdf'
                    ? await parsePdf(file)
                    : await parseDocx(file);
                
                messageWithFileContext = `[START OF DOCUMENT: ${file.name}]\n\n${parsedText}\n\n[END OF DOCUMENT]\n\nUser query: "${userMessageContent}"`;
                uiMessageContent = `[File: ${file.name}]\n${userMessageContent}`;
            } catch (parseError: any) {
                const errorMessage = parseError.message || 'Unknown error';
                setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: Role.BOT, content: `I couldn't read the file. Error: ${errorMessage}` }]);
                setIsLoading(false);
                return;
            }
        }

        const currentHistory = transformToGeminiHistory(messages);
        const userMessage: Message = { id: `user-${Date.now()}`, role: Role.USER, content: uiMessageContent };
        setMessages(prev => [...prev, userMessage]);

        const externalData = textToNumericArray(messageWithFileContext);
        const simResult = triggerCycle(externalData);

        if (!simResult) {
             setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: Role.BOT, content: `The simulation is currently busy. This shouldn't happen.` }]);
             setIsLoading(false);
             return;
        }
        
        localStorage.setItem(SIMULATION_STATE_KEY, JSON.stringify(simulationService.saveState()));

        if (simResult.error) {
            setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: Role.BOT, content: `A cognitive matrix fluctuation occurred: ${simResult.error}` }]);
            setIsLoading(false);
            return;
        }

        const systemReport = formatSystemReport(simResult);
        const messageToBot = `${systemReport}\n\n${messageWithFileContext}`;
        
        try {
            const stream = await sendMessageToBot(messageToBot, currentHistory, settings.ai);
            const botMessageId = `bot-${Date.now()}`;
            let fullBotResponse = '';
            setMessages(prev => [...prev, { id: botMessageId, role: Role.BOT, content: '' }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                fullBotResponse += chunkText;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === botMessageId ? { ...msg, content: fullBotResponse } : msg
                    )
                );
            }
            speak(stripMarkdown(fullBotResponse));
        } catch (error: any) {
            console.error("An error occurred during chat:", error);
            const errorMessage = error.message || 'An unknown error occurred';
            setMessages(prev => [
                ...prev,
                { id: `error-${Date.now()}`, role: Role.BOT, content: `My connection to the generative stream was disrupted. Please try again.\n\n*${errorMessage}*`},
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, triggerCycle, speak, cancelSpeech, messages, settings.ai]);

    return (
        <div className="h-screen w-screen overflow-hidden relative">
            <SimulationVisualizer />
            
            {isSettingsOpen && (
                <SettingsPanel 
                    settings={settings}
                    onChange={setSettings}
                    onClose={() => setIsSettingsOpen(false)}
                    onResetSimulation={resetSimulation}
                />
            )}

            <div className="relative z-10 flex flex-col h-full w-full p-4 gap-4">
                <Header onOpenSettings={() => setIsSettingsOpen(true)} />
                <div className="flex-grow min-h-0">
                     <ChatInterface 
                        messages={messages}
                        onSend={handleSend}
                        isLoading={isLoading}
                        systemNotification={systemNotification}
                        isListening={isListening}
                        transcript={transcript}
                        startListening={startListening}
                        stopListening={stopListening}
                        hasSpeechRecognition={hasSpeechRecognition}
                     />
                </div>
            </div>
        </div>
    );
}
