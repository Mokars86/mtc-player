import React from 'react';
import { AppView, MediaItem } from '../../types';
import { Icons } from '../Icon';

interface MiniPlayerProps {
    currentTrack: MediaItem;
    isPlaying: boolean;
    togglePlay: () => void;
    toggleFavorite: (id: string, e: React.MouseEvent) => void;
    favorites: Set<string>;
    currentTime: number;
    duration: number;
    setCurrentView: (view: AppView) => void;
    AppView: typeof AppView; // Pass Enum for easy usage or just string
}

export const MiniPlayer = ({
    currentTrack, isPlaying, togglePlay, toggleFavorite, favorites, currentTime, duration, setCurrentView
}: MiniPlayerProps) => {
    return (
        <div className="fixed bottom-[4.5rem] md:bottom-0 md:left-20 md:right-0 h-16 bg-app-surface border-t border-app-border flex items-center px-4 z-40 cursor-pointer w-full shadow-[0_-5px_20px_rgba(0,0,0,0.1)] transition-colors duration-300" onClick={() => setCurrentView(AppView.PLAYER)}>
            <div className="relative w-10 h-10 mr-3 flex-shrink-0">
                <img src={currentTrack.coverUrl} className="w-full h-full rounded-md object-cover" />
                {isPlaying && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Icons.Activity className="w-4 h-4 text-white" /></div>}
            </div>
            <div className="flex-1 min-w-0 mr-4"><h4 className="text-sm font-bold truncate text-app-text">{currentTrack.title}</h4><p className="text-xs text-app-subtext truncate">{currentTrack.artist}</p></div>
            <div className="flex items-center gap-3">
                <button onClick={(e) => toggleFavorite(currentTrack.id, e)} className="hidden sm:block text-app-subtext hover:text-brand-accent p-2"><Icons.Heart className={`w-5 h-5 ${favorites.has(currentTrack.id) ? 'fill-brand-accent text-brand-accent' : ''}`} /></button>
                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-10 h-10 rounded-full bg-brand-accent text-white flex items-center justify-center hover:bg-brand-light transition shadow-lg flex-shrink-0">
                    {isPlaying ? <Icons.Pause className="w-5 h-5" /> : <Icons.Play className="w-5 h-5 ml-1" />}
                </button>
            </div>
            <div className="absolute top-0 left-0 h-[2px] bg-brand-accent" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
        </div>
    );
};
