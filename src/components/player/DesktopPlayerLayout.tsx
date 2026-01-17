import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icon';
import { MediaItem, MediaType, RepeatMode, EqSettings, PresetName } from '../../types';
import AudioEngine from '../AudioEngine';
import { VisualizerOverlay } from '../VisualizerOverlay';

interface DesktopPlayerLayoutProps {
    currentTrack: MediaItem;
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    audioElement: HTMLAudioElement | null;
    onClose: () => void;
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
    shuffleOn?: boolean;
    repeatMode?: RepeatMode;
    onToggleShuffle?: () => void;
    onToggleRepeat?: () => void;
    volume: number;
    onVolumeChange: (newVol: number) => void;
    showLyrics: boolean;
    onToggleLyrics: () => void;
    onToggleMiniMode?: () => void;
    accentColor?: string;
    eqSettings?: EqSettings;
    playbackRate: number;
    onPlaybackRateChange: (rate: number) => void;
}

export const DesktopPlayerLayout: React.FC<DesktopPlayerLayoutProps> = ({
    currentTrack,
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    audioElement,
    onClose,
    currentTime,
    duration,
    onSeek,
    isFavorite,
    onToggleFavorite,
    shuffleOn,
    repeatMode,
    onToggleShuffle,
    onToggleRepeat,
    volume,
    onVolumeChange,
    showLyrics,
    onToggleLyrics,
    onToggleMiniMode,
    accentColor = '#2dd4bf',
    eqSettings,
    playbackRate,
    onPlaybackRateChange
}) => {
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [showEqualizer, setShowEqualizer] = useState(false);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Sync video element
    useEffect(() => {
        if (currentTrack.type === MediaType.VIDEO && videoRef.current) {
            if (isPlaying && videoRef.current.paused) {
                videoRef.current.play().catch(e => console.warn("Video play failed", e));
            } else if (!isPlaying && !videoRef.current.paused) {
                videoRef.current.pause();
            }
            if (Math.abs(videoRef.current.volume - volume) > 0.01) {
                videoRef.current.volume = volume;
            }
            if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
                videoRef.current.currentTime = currentTime;
            }
            videoRef.current.playbackRate = playbackRate;
        }
    }, [currentTrack, isPlaying, volume, currentTime, playbackRate]);

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        onSeek(val);
        if (videoRef.current) videoRef.current.currentTime = val;
    };

    // Menu Bar Items
    const menuItems = [
        { label: 'Media', action: () => { } },
        { label: 'Playback', action: () => { } },
        { label: 'Audio', action: () => { } },
        { label: 'Video', action: () => { } },
        { label: 'View', action: () => setShowPlaylist(!showPlaylist) },
        { label: 'Help', action: () => { } },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-[#0f0f10] text-app-text flex flex-col overflow-hidden font-sans select-none">
            {/* Top Window Bar (Menu) */}
            <div className="h-8 bg-[#18181b] flex items-center px-2 select-none border-b border-white/5 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-2">
                        <img src="/pwa-icon.png" alt="App Icon" className="w-5 h-5 rounded-sm" />
                        <span className="text-xs font-bold text-brand-accent tracking-wider">MTC PLAYER</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={item.action}
                                className="px-3 py-1 text-[11px] text-zinc-400 hover:bg-white/10 hover:text-white rounded-sm transition-colors"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center">
                    <button onClick={onToggleMiniMode} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white" title="Mini Player">
                        <Icons.Minimize2 className="w-3 h-3" />
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-red-500/20 hover:text-red-500 rounded ml-2" title="Close Player">
                        <Icons.X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Center Stage */}
                <div className="flex-1 flex flex-col relative bg-black">
                    {currentTrack.type === MediaType.VIDEO ? (
                        <video
                            ref={videoRef}
                            src={currentTrack.mediaUrl}
                            className="w-full h-full object-contain"
                            onClick={onPlayPause}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center relative overflow-hidden group">
                            {/* Ambient Background */}
                            <div
                                className="absolute inset-0 opacity-30 blur-3xl scale-150 transition-all duration-[10s] ease-in-out animate-pulse-slow"
                                style={{
                                    backgroundImage: `url(${currentTrack.coverUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />

                            {/* Artwork */}
                            <div className="relative z-10 flex flex-col items-center">
                                <div className={`w-[400px] h-[400px] rounded-lg shadow-2xl overflow-hidden border border-white/10 transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95 grayscale-[0.3]'}`}>
                                    <img src={currentTrack.coverUrl} className="w-full h-full object-cover" />
                                </div>
                                <div className="mt-8 text-center">
                                    <h1 className="text-3xl font-bold text-white tracking-tight">{currentTrack.title}</h1>
                                    <p className="text-xl text-zinc-400 mt-2 font-light">{currentTrack.artist}</p>
                                    <p className="text-sm text-zinc-600 mt-1 uppercase tracking-widest">{currentTrack.album}</p>
                                </div>
                            </div>

                            {/* Audio Visualizer */}
                            <div className="absolute inset-x-0 bottom-0 h-48 opacity-50 pointer-events-none">
                                <AudioEngine
                                    audioElement={audioElement}
                                    isPlaying={isPlaying}
                                    color={accentColor}
                                    eqSettings={eqSettings}
                                    onAnalyserReady={setAnalyser}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Playlist Sidebar (Float-in or Split) */}
                <div className={`${showPlaylist ? 'w-80 border-l border-white/5' : 'w-0 border-none'} bg-[#121214] transition-all duration-300 ease-in-out overflow-hidden flex flex-col`}>
                    <div className="h-10 border-b border-white/5 flex items-center px-4 bg-[#18181b]">
                        <span className="text-xs font-bold text-zinc-400 uppercase">Current Playlist</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="p-4 text-center text-zinc-600 text-sm">
                            Playlist features coming soon...
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="h-24 bg-[#18181b]/90 backdrop-blur-md border-t border-white/5 flex flex-col px-4 z-50">
                {/* Scrubber - Full Width Top of Bar */}
                <div className="w-full py-2 group cursor-pointer relative" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const per = x / rect.width;
                    onSeek(per * duration);
                    if (videoRef.current) videoRef.current.currentTime = per * duration;
                }}>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative group-hover:h-3 transition-all duration-200">
                        <div
                            className="h-full bg-brand-accent absolute left-0 top-0 transition-all duration-100"
                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                        />
                        {/* Hover Position Indicator (Visual only, difficult without proper state tracking of hover x) */}
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] font-mono text-zinc-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls Area */}
                <div className="flex-1 flex items-center justify-between pb-2">
                    {/* Left: Meta & Extra */}
                    <div className="flex items-center gap-4 w-1/3">
                        <div className="flex items-center gap-3">
                            <img src={currentTrack.coverUrl} className="w-10 h-10 rounded object-cover shadow border border-white/10" />
                            <div className="flex flex-col max-w-[150px]">
                                <span className="text-sm font-medium text-white truncate">{currentTrack.title}</span>
                                <span className="text-xs text-zinc-500 truncate">{currentTrack.artist}</span>
                            </div>
                        </div>
                        <button onClick={onToggleFavorite} className={`p-2 rounded-full hover:bg-white/5 ${isFavorite ? 'text-brand-accent' : 'text-zinc-600'}`}>
                            <Icons.Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    {/* Center: Playback */}
                    <div className="flex items-center gap-6 justify-center w-1/3">
                        <button onClick={onToggleShuffle} className={`p-2 rounded-full hover:bg-white/5 ${shuffleOn ? 'text-brand-accent' : 'text-zinc-600'}`}>
                            <Icons.Shuffle className="w-4 h-4" />
                        </button>
                        <button onClick={onPrev} className="p-2 rounded-full hover:bg-white/5 text-zinc-300 hover:text-white">
                            <Icons.SkipBack className="w-5 h-5 fill-current" />
                        </button>
                        <button onClick={onPlayPause} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10">
                            {isPlaying ? <Icons.Pause className="w-5 h-5 fill-current" /> : <Icons.Play className="w-5 h-5 fill-current ml-1" />}
                        </button>
                        <button onClick={onNext} className="p-2 rounded-full hover:bg-white/5 text-zinc-300 hover:text-white">
                            <Icons.SkipForward className="w-5 h-5 fill-current" />
                        </button>
                        <button onClick={onToggleRepeat} className={`p-2 rounded-full hover:bg-white/5 ${repeatMode !== RepeatMode.OFF ? 'text-brand-accent' : 'text-zinc-600'}`}>
                            {repeatMode === RepeatMode.ONE ? <Icons.Repeat1 className="w-4 h-4" /> : <Icons.Repeat className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Right: Volume & Tools */}
                    <div className="flex items-center gap-4 justify-end w-1/3">
                        <div className="flex items-center gap-2 group">
                            <button onClick={() => onVolumeChange(volume > 0 ? 0 : 1)} className="text-zinc-400 hover:text-white">
                                {volume === 0 ? <Icons.VolumeX className="w-5 h-5" /> : <Icons.Volume2 className="w-5 h-5" />}
                            </button>
                            <div className="w-24 h-1 bg-zinc-800 rounded-full relative cursor-pointer group-hover:h-1.5 transition-all">
                                <div
                                    className="h-full bg-white rounded-full absolute left-0 top-0"
                                    style={{ width: `${volume * 100}%` }}
                                />
                                <input
                                    type="range" min="0" max="1" step="0.01"
                                    value={volume}
                                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="h-6 w-[1px] bg-white/10 mx-2" />
                        <button
                            onClick={() => onToggleLyrics()}
                            className={`p-2 rounded hover:bg-white/10 ${showLyrics ? 'text-brand-accent' : 'text-zinc-500'}`}
                            title="Lyrics"
                        >
                            <Icons.MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                            onClick={item => setShowPlaylist(!showPlaylist)}
                            className={`p-2 rounded hover:bg-white/10 ${showPlaylist ? 'text-brand-accent' : 'text-zinc-500'}`}
                            title="Playlist"
                        >
                            <Icons.ListMusic className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
