import React from 'react';
import { Icons } from '../Icon';
import { Playlist, MediaItem } from '../../types';

interface AddToPlaylistModalProps {
    trackToAction: MediaItem | null;
    setTrackToAction: (track: MediaItem | null) => void;
    openCreatePlaylistModal: () => void;
    playlists: Playlist[];
    addToPlaylist: (playlistId: string, trackId: string) => void;
}

export const AddToPlaylistModal = ({
    trackToAction, setTrackToAction, openCreatePlaylistModal, playlists, addToPlaylist
}: AddToPlaylistModalProps) => {
    if (!trackToAction) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setTrackToAction(null)}>
            <div className="bg-app-card border border-app-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-app-border flex justify-between items-center bg-app-surface">
                    <h3 className="font-bold text-app-text">Add to Playlist</h3>
                    <button onClick={() => setTrackToAction(null)}><Icons.X className="w-5 h-5 text-app-subtext hover:text-app-text" /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    <button onClick={() => { setTrackToAction(null); openCreatePlaylistModal(); }} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-app-bg text-brand-accent font-medium border-b border-app-border/50">
                        <Icons.FolderPlus className="w-5 h-5" /> Create New Playlist
                    </button>
                    {playlists.map(p => (
                        <button key={p.id} onClick={() => addToPlaylist(p.id, trackToAction.id)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-app-bg text-app-text">
                            <span className="truncate">{p.name}</span>
                            <span className="text-xs text-app-subtext">{p.tracks.length} tracks</span>
                        </button>
                    ))}
                    {playlists.length === 0 && <div className="p-4 text-center text-sm text-app-subtext">No playlists available.</div>}
                </div>
            </div>
        </div>
    );
};
