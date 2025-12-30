import React from 'react';
import { Icons } from '../Icon';
import { Modal } from '../Modal';

interface CreatePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    newPlaylistName: string;
    setNewPlaylistName: (name: string) => void;
    handleCreatePlaylist: () => void;
}

export const CreatePlaylistModal = ({
    isOpen, onClose, newPlaylistName, setNewPlaylistName, handleCreatePlaylist
}: CreatePlaylistModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Playlist"
            footer={
                <>
                    <button onClick={onClose} className="px-4 py-2 text-app-subtext hover:text-app-text transition-colors">Cancel</button>
                    <button onClick={handleCreatePlaylist} className="px-6 py-2 bg-brand-accent hover:bg-brand-light text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95">Create</button>
                </>
            }
        >
            <div className="space-y-4">
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
                <div className="text-xs text-app-subtext bg-app-bg/50 p-3 rounded-lg border border-app-border">
                    <Icons.Info className="w-4 h-4 inline mr-1 text-brand-accent" />
                    You can add tracks to this playlist from the library or player view.
                </div>
            </div>
        </Modal>
    );
};
