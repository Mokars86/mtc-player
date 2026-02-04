import React from 'react';
import { Modal } from '../Modal';
import { Icons } from '../Icon';
import { MediaItem } from '../../types';

interface TrackOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    track: MediaItem | null;
    isFavorite: boolean;
    toggleFavorite: () => void;
    onAddToPlaylist: () => void;
    onRemoveFromPlaylist?: () => void; // If in a playlist
    onEditMetadata?: () => void; // If local
    onDelete?: () => void; // If local or playlist removal
    deleteLabel?: string; // "Delete File" vs "Remove from Playlist"
}

export const TrackOptionsModal: React.FC<TrackOptionsModalProps> = ({
    isOpen, onClose, track, isFavorite, toggleFavorite,
    onAddToPlaylist, onRemoveFromPlaylist, onEditMetadata, onDelete, deleteLabel
}) => {
    if (!track) return null;

    const OptionButton = ({ icon: Icon, label, onClick, className = "" }: { icon: any, label: string, onClick: () => void, className?: string }) => (
        <button onClick={() => { onClick(); onClose(); }} className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-app-card transition-colors ${className}`}>
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Track Options">
            <div className="flex flex-col gap-1">
                {/* Track Info Header */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-app-border">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-app-card flex-shrink-0">
                        {track.id.startsWith('local') || !track.coverUrl ? (
                            <div className="w-full h-full flex items-center justify-center text-app-subtext">
                                <Icons.Music className="w-6 h-6" />
                            </div>
                        ) : (
                            <img src={track.coverUrl} className="w-full h-full object-cover" alt="" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-app-text truncate">{track.title}</h4>
                        <p className="text-sm text-app-subtext truncate">{track.artist}</p>
                    </div>
                </div>

                <OptionButton
                    icon={Icons.Heart}
                    label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    onClick={toggleFavorite}
                    className={isFavorite ? "text-brand-accent" : "text-app-text"}
                />

                {!onRemoveFromPlaylist && (
                    <OptionButton icon={Icons.ListPlus} label="Add to Playlist" onClick={onAddToPlaylist} />
                )}

                {onRemoveFromPlaylist && (
                    <OptionButton icon={Icons.X} label="Remove from Playlist" onClick={onRemoveFromPlaylist} className="text-red-500" />
                )}

                {onEditMetadata && (
                    <OptionButton icon={Icons.Edit} label="Edit Metadata" onClick={onEditMetadata} />
                )}

                {onDelete && (
                    <OptionButton icon={Icons.Trash2} label={deleteLabel || "Delete"} onClick={onDelete} className="text-red-500" />
                )}
            </div>
        </Modal>
    );
};
