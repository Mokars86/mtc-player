import React, { useState } from 'react';
import { Icons } from '../Icon';
import { Modal } from '../Modal';
import { partySession } from '../../services/partySessionService';

interface PartyModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    onSessionStart: (roomId: string, isHost: boolean) => void;
}

export const PartyModeModal = ({ isOpen, onClose, userName, onSessionStart, initialRoomId }: PartyModeModalProps & { initialRoomId?: string }) => {
    const [mode, setMode] = useState<'HOST' | 'JOIN'>(initialRoomId ? 'JOIN' : 'HOST');
    const [joinRoomId, setJoinRoomId] = useState(initialRoomId || '');
    const [generatedRoomId] = useState(`${userName.replace(/\s/g, '').toLowerCase()}-${Math.floor(Math.random() * 1000)}`);
    const [loading, setLoading] = useState(false);

    // Update state if initialRoomId changes while modal is open (rare but good practice)
    React.useEffect(() => {
        if (initialRoomId) {
            setMode('JOIN');
            setJoinRoomId(initialRoomId);
        }
    }, [initialRoomId]);

    const handleStart = async () => {
        setLoading(true);
        const roomId = mode === 'HOST' ? generatedRoomId : joinRoomId;
        const isHost = mode === 'HOST';

        try {
            await partySession.createSession(roomId, isHost, userName);
            onSessionStart(roomId, isHost);
            onClose();
        } catch (e) {
            console.error(e);
            // Handle error (toast?)
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Social Party Mode"
            footer={null}
        >
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex bg-app-bg rounded-lg p-1 border border-app-border">
                    <button
                        onClick={() => setMode('HOST')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'HOST' ? 'bg-app-card text-brand-accent shadow-sm' : 'text-app-subtext hover:text-app-text'}`}
                    >
                        Host a Party
                    </button>
                    <button
                        onClick={() => setMode('JOIN')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'JOIN' ? 'bg-app-card text-brand-accent shadow-sm' : 'text-app-subtext hover:text-app-text'}`}
                    >
                        Join a Party
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-[150px] flex flex-col justify-center">
                    {mode === 'HOST' ? (
                        <div className="text-center space-y-4 animate-fade-in">
                            <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Icons.Music className="w-8 h-8 text-brand-accent" />
                            </div>
                            <p className="text-app-text font-medium">Your Party Room ID</p>
                            <div className="bg-app-bg border border-brand-accent/30 rounded-xl p-4 text-2xl font-mono font-bold text-center select-all text-brand-light tracking-widest">
                                {generatedRoomId}
                            </div>
                            <p className="text-xs text-app-subtext">Share this ID with your friends so they can join!</p>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Icons.Users className="w-8 h-8 text-brand-accent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-app-subtext mb-1">Enter Room ID</label>
                                <input
                                    type="text"
                                    value={joinRoomId}
                                    onChange={(e) => setJoinRoomId(e.target.value)}
                                    placeholder="e.g. user-123"
                                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-brand-accent outline-none font-mono text-center text-lg"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <button
                    onClick={handleStart}
                    disabled={loading || (mode === 'JOIN' && !joinRoomId)}
                    className="w-full py-3 bg-brand-accent hover:bg-brand-light text-white rounded-xl font-bold shadow-lg shadow-brand-accent/20 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                    {loading ? <Icons.Loader className="w-5 h-5 animate-spin" /> : (mode === 'HOST' ? 'Start Party' : 'Join Party')}
                </button>
            </div>
        </Modal>
    );
};
