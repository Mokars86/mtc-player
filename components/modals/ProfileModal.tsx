import React, { useState } from 'react';
import { AppView, Playlist, MediaItem } from '../../types';
import { Icons } from '../Icon';
import { Modal } from '../Modal';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    setUserName: (name: string) => void;
    playlists: Playlist[];
    favorites: Set<string>;
    localLibrary: MediaItem[];
    setCurrentView: (view: AppView) => void;
}

export const ProfileModal = ({
    isOpen, onClose, userName, setUserName, playlists, favorites, localLibrary, setCurrentView
}: ProfileModalProps) => {

    const handleNameChange = () => {
        const n = prompt("Enter new name:", userName);
        if (n) setUserName(n);
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="User Profile"
        >
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-24 h-24 rounded-full bg-brand-dark p-1 border-4 border-brand-accent shadow-xl relative group">
                    <img src={`https://ui-avatars.com/api/?name=${userName}&background=0d9488&color=fff`} className="w-full h-full rounded-full object-cover" />
                    <button onClick={handleNameChange} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icons.Settings className="w-6 h-6 text-white" />
                    </button>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-app-text">{userName}</h2>
                    <p className="text-app-subtext">Free Tier Account</p>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full mt-4">
                    <div className="bg-app-bg p-3 rounded-xl border border-app-border">
                        <div className="text-2xl font-bold text-brand-accent">{playlists.length}</div>
                        <div className="text-xs text-app-subtext">Playlists</div>
                    </div>
                    <div className="bg-app-bg p-3 rounded-xl border border-app-border">
                        <div className="text-2xl font-bold text-brand-accent">{favorites.size}</div>
                        <div className="text-xs text-app-subtext">Favorites</div>
                    </div>
                    <div className="bg-app-bg p-3 rounded-xl border border-app-border">
                        <div className="text-2xl font-bold text-brand-accent">{localLibrary.length}</div>
                        <div className="text-xs text-app-subtext">Local</div>
                    </div>
                </div>

                <div className="w-full mt-2">
                    <button onClick={() => { onClose(); setCurrentView(AppView.SETTINGS); }} className="w-full py-3 rounded-xl bg-app-card hover:bg-app-border transition-colors text-app-text font-semibold flex items-center justify-center gap-2">
                        <Icons.Settings className="w-5 h-5" /> Settings
                    </button>
                </div>
            </div>
        </Modal>
    );
};
