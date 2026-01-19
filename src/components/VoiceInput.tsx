import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icon';
import { useToast } from './Toast'; // Import useToast

interface VoiceInputProps {
    onCommand: (transcript: string) => void;
    isProcessing: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onCommand, isProcessing }) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { showToast } = useToast(); // Use toast hook

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onCommand(transcript);
            };
            recognition.onerror = (event: any) => { // Handle errors
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    showToast("Microphone access denied", "error");
                } else if (event.error === 'no-speech') {
                    // ignore often, or show vague hint
                } else {
                    showToast(`Voice Error: ${event.error}`, "error");
                }
            };

            recognitionRef.current = recognition;
        } else {
            // console.warn("Speech Recognition not supported in this browser."); // Controlled by parent or ignored
            // We can keep it silent or show a toast on click
        }
    }, [onCommand, showToast]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            showToast("Voice control not supported in this browser", "error");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`p-3 rounded-full transition-all duration-300 relative group overflow-hidden ${isListening
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-110'
                : 'bg-app-surface border border-app-border text-app-subtext hover:text-brand-accent hover:border-brand-accent'
                }`}
        >
            {isListening && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-full h-full rounded-full bg-red-500 animate-ping opacity-20"></span>
                </div>
            )}

            {isProcessing ? (
                <Icons.Sparkles className="w-6 h-6 animate-pulse text-brand-accent" />
            ) : (
                <Icons.Mic className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`} />
            )}
        </button>
    );
};
