import React from 'react';
import { Icons } from '../Icon';
import { Modal } from '../Modal';

interface CreatePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    newPlaylistName: string;
    setNewPlaylistName: (name: string) => void;
    handleCreatePlaylist: (isAI?: boolean) => void;
}

export const CreatePlaylistModal = ({
    isOpen, onClose, newPlaylistName, setNewPlaylistName, handleCreatePlaylist
}: CreatePlaylistModalProps) => {
    const [isAI, setIsAI] = React.useState(false);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Playlist"
            footer={
                <>
                    <button onClick={onClose} className="px-4 py-2 text-app-subtext hover:text-app-text transition-colors">Cancel</button>
                    <button onClick={() => handleCreatePlaylist(isAI)} className="px-6 py-2 bg-brand-accent hover:bg-brand-light text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2">
                        {isAI && <Icons.Sparkles className="w-4 h-4" />}
                        {isAI ? 'Generate' : 'Create'}
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-app-subtext mb-1">Playlist Name</label>
                    <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="My Awesome Mix"
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-brand-accent outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                    />
                </div>

                {/* AI Feature Upsell */}
                <div
                    onClick={() => setIsAI(!isAI)}
                    className={`bg-gradient-to-br from-brand-accent/10 to-transparent border rounded-xl p-4 relative overflow-hidden group cursor-pointer transition-all ${isAI ? 'border-brand-accent ring-1 ring-brand-accent' : 'border-brand-accent/20 hover:border-brand-accent/50'}`}
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Icons.Wand2 className="w-16 h-16 text-brand-accent" />
                    </div>
                    <div className="relative z-10 flex items-start gap-3">
                        <div className={`p-2 rounded-lg shadow-lg transition-colors ${isAI ? 'bg-brand-accent text-white' : 'bg-app-card text-app-subtext'}`}>
                            {isAI ? <Icons.Check className="w-5 h-5" /> : <Icons.Sparkles className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm ${isAI ? 'text-brand-accent' : 'text-app-text'}`}>
                                {isAI ? 'AI Magic Mix Enabled' : 'Want a Magic Mix?'}
                            </h3>
                            <p className="text-xs text-app-subtext mt-1 leading-relaxed">Let our AI curate the perfect vibe for you. Enter a mood or genre ("Sad Rainy Day", "90s Workout") as the name.</p>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-app-subtext bg-app-bg/50 p-3 rounded-lg border border-app-border">
                    <Icons.Info className="w-4 h-4 inline mr-1 text-brand-accent" />
                    You can manually add tracks or let AI suggest them later.
                </div>
            </div>
        </Modal>
    );
};
