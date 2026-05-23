import { useState, useEffect, useRef, useCallback } from 'react';

// The Web Speech API is not strictly typed, so we define basic interfaces.
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

// --- Main Hook ---
export const useSpeech = () => {
    // --- State ---
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
    const [hasSpeechSynthesis, setHasSpeechSynthesis] = useState(false);

    // --- Refs ---
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

    // --- Voice Initialization and Setup ---
    useEffect(() => {
        // --- Speech Recognition (Input) Setup ---
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        const createRecognition = (): SpeechRecognition | null => {
            if (!SpeechRecognitionAPI) return null;

            const recognition = new SpeechRecognitionAPI();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setTranscript(finalTranscript + interimTranscript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
                recognitionRef.current = null;
            };

            return recognition;
        };

        if (SpeechRecognitionAPI) {
            setHasSpeechRecognition(true);
            recognitionRef.current = createRecognition();
        } else {
            console.warn("Speech Recognition API not supported in this browser.");
            setHasSpeechRecognition(false);
        }

        // --- Speech Synthesis (Output) Setup ---
        const findAndSetVoice = () => {
            const synth = window.speechSynthesis;
            if (!synth) {
                setHasSpeechSynthesis(false);
                return;
            }
            setHasSpeechSynthesis(true);
            const voices = synth.getVoices();
            if (voices.length === 0) {
                return; // Voices not loaded yet.
            }

            const isFemale = (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('female');

            const voicePreferences = [
                // High-quality, specific voices by name
                (v: SpeechSynthesisVoice) => v.name === 'Google US English',
                (v: SpeechSynthesisVoice) => v.name === 'Samantha', // Common on Apple devices
                (v: SpeechSynthesisVoice) => v.name === 'Google UK English Female',

                // Prioritize major English accents that are female
                (v: SpeechSynthesisVoice) => v.lang === 'en-US' && isFemale(v),
                (v: SpeechSynthesisVoice) => v.lang === 'en-GB' && isFemale(v),
                (v: SpeechSynthesisVoice) => v.lang === 'en-AU' && isFemale(v),

                // Broader fallback to any English female voice
                (v: SpeechSynthesisVoice) => v.lang.startsWith('en-') && isFemale(v),
            ];
            
            let selectedVoice: SpeechSynthesisVoice | null = null;
            for (const condition of voicePreferences) {
                const foundVoice = voices.find(condition);
                if (foundVoice) {
                    selectedVoice = foundVoice;
                    break;
                }
            }
            
            selectedVoiceRef.current = selectedVoice;

            if (!selectedVoice) {
                console.warn("No preferred female voice found. The browser's default voice will be used.");
            }
        };

        if (typeof window !== 'undefined' && window.speechSynthesis) {
             // The 'voiceschanged' event is the only reliable way to know when voices are loaded.
            window.speechSynthesis.onvoiceschanged = findAndSetVoice;
            // Also call it once, in case the voices are already loaded.
            findAndSetVoice();
        } else {
            console.warn("Speech Synthesis API not supported in this browser.");
            setHasSpeechSynthesis(false);
        }
        
    }, []);

    // --- Public API for the Hook ---
    const startListening = useCallback(() => {
        if (!hasSpeechRecognition) return;

        if (!recognitionRef.current) {
            const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognitionAPI) {
                recognitionRef.current = new SpeechRecognitionAPI();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    let finalTranscript = '';
                    let interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }
                    setTranscript(finalTranscript + interimTranscript);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                    recognitionRef.current = null;
                };
            }
        }

        if (recognitionRef.current && !isListening) {
            setTranscript('');
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error('Speech recognition start failed:', error);
                setIsListening(false);
            }
        }
    }, [hasSpeechRecognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const speak = useCallback((text: string) => {
        if (!hasSpeechSynthesis || text.trim() === '') return;
        const synth = window.speechSynthesis;

        // Cancel any previous speech queue to prevent overlap
        if (synth.speaking || synth.pending) {
            synth.cancel();
        }

        // Split text into sentences. This regex handles various sentence terminators.
        const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];

        sentences.forEach(sentence => {
            if (sentence.trim().length === 0) return;

            const utterance = new SpeechSynthesisUtterance(sentence.trim());
            
            if (selectedVoiceRef.current) {
                utterance.voice = selectedVoiceRef.current;
            }

            // Add subtle, randomized variations to pitch and rate for a more natural cadence
            utterance.pitch = 1 + (Math.random() - 0.4) * 0.2; // Varies between ~0.92 and ~1.12
            utterance.rate = 1 + (Math.random() - 0.3) * 0.2;  // Varies between ~0.94 and ~1.14
            
            utterance.onerror = (event) => console.error('SpeechSynthesisUtterance.onerror', event);
            
            synth.speak(utterance);
        });
    }, [hasSpeechSynthesis]);

    const cancelSpeech = useCallback(() => {
        if (!hasSpeechSynthesis) return;
        window.speechSynthesis.cancel();
    }, [hasSpeechSynthesis]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        hasSpeechRecognition,
        speak,
        cancelSpeech,
    };
};