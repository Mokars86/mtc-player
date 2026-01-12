
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../components/Icon';
import { MediaItem, RepeatMode, MediaType, GestureSettings, GestureType, GestureAction, EqSettings, PresetName } from '../types';
import { PartyState, partySession } from '../services/partySessionService';
import AudioEngine from '../components/AudioEngine';
import { translateLyrics } from '../services/geminiService';
import { VisualizerOverlay } from '../components/VisualizerOverlay';
import { fetchLyrics } from '../services/lyricsService';
import { useToast } from '../components/Toast';

interface PlayerViewProps {
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
    onUpdateTime?: (time: number) => void;
    onUpdateDuration?: (duration: number) => void;
    gestureSettings?: GestureSettings;
    eqSettings?: EqSettings;
    onUpdateEq?: (settings: EqSettings) => void;
    sleepTimerActive?: boolean;
    onSetSleepTimer?: (minutes: number | null) => void;
    partyState?: PartyState | null;
    accentColor?: string;
    isMiniMode?: boolean;
    onToggleMiniMode?: () => void;
}

const PlayerView: React.FC<PlayerViewProps> = ({
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
    isFavorite = false,
    onToggleFavorite,
    shuffleOn = false,
    repeatMode = RepeatMode.OFF,
    onToggleShuffle,
    onToggleRepeat,
    onUpdateTime,
    onUpdateDuration,
    gestureSettings,
    eqSettings = { preset: 'Flat', auto: false, gains: { 60: 0, 250: 0, 1000: 0, 4000: 0, 16000: 0 } },
    onUpdateEq,
    sleepTimerActive,
    onSetSleepTimer,
    partyState,
    accentColor = '#2dd4bf',
    isMiniMode = false,
    onToggleMiniMode
}) => {
    const [showLyrics, setShowLyrics] = useState(false);
    // const [isMiniMode, setIsMiniMode] = useState(false); // Controlled by parent now
    const [volume, setVolume] = useState(() => audioElement ? audioElement.volume : 1);
    const [isZoomed, setIsZoomed] = useState(false);
    const [showEq, setShowEq] = useState(false);
    const [showSleepMenu, setShowSleepMenu] = useState(false);
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const { showToast } = useToast();

    // Playback Speed State
    const [playbackRate, setPlaybackRate] = useState(1);

    // Translation State
    const [translatedLyrics, setTranslatedLyrics] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // Video Controls State
    const [showVideoControls, setShowVideoControls] = useState(true);
    const controlsTimeoutRef = useRef<number | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Gesture State
    const touchRef = useRef<{
        startX: number;
        startY: number;
        startDist: number;
        startAngle: number;
        initialVol: number;
        initialTime: number;
        active: boolean;
    } | null>(null);
    const [gestureFeedback, setGestureFeedback] = useState<{ icon: any; value?: string } | null>(null);

    // Sync volume state with global Audio element
    useEffect(() => {
        if (!audioElement) return;
        if (Math.abs(audioElement.volume - volume) > 0.01) {
            setVolume(audioElement.volume);
        }
        const handleVolumeUpdate = () => {
            setVolume(audioElement.volume);
        };
        audioElement.addEventListener('volumechange', handleVolumeUpdate);
        return () => {
            audioElement.removeEventListener('volumechange', handleVolumeUpdate);
        };
    }, [audioElement]);

    useEffect(() => {
        if (currentTrack.type === MediaType.VIDEO && videoRef.current) {
            if (isPlaying && videoRef.current.paused) {
                videoRef.current.play().catch(e => console.warn("Video auto-play interrupted", e));
            } else if (!isPlaying && !videoRef.current.paused) {
                videoRef.current.pause();
            }
            if (Math.abs(videoRef.current.volume - volume) > 0.01) {
                videoRef.current.volume = volume;
            }
        }
    }, [currentTrack.type, isPlaying, volume]);

    // Sync Playback Rate
    useEffect(() => {
        if (audioElement) audioElement.playbackRate = playbackRate;
        if (videoRef.current) videoRef.current.playbackRate = playbackRate;
    }, [playbackRate, audioElement]);

    useEffect(() => {
        if (currentTrack.type === MediaType.VIDEO && videoRef.current) {
            if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
                videoRef.current.currentTime = currentTime;
            }
        }
    }, [currentTime, currentTrack.type]);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        updateVolume(newVolume);
    };

    const updateVolume = (newVolume: number) => {
        setVolume(newVolume);
        if (audioElement) audioElement.volume = newVolume;
        if (videoRef.current) videoRef.current.volume = newVolume;
    }

    const toggleMute = () => {
        const newVol = volume > 0 ? 0 : 1;
        updateVolume(newVol);
    };

    const requestPictureInPicture = async () => {
        if (videoRef.current && document.pictureInPictureEnabled) {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    await videoRef.current.requestPictureInPicture();
                }
            } catch (err) {
                console.error("PiP failed", err);
            }
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        onSeek(time);
        if (videoRef.current && !isPlaying) {
            videoRef.current.currentTime = time;
        }
    };

    const handleVideoMouseMove = () => {
        setShowVideoControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = window.setTimeout(() => setShowVideoControls(false), 3000);
    };

    // --- GESTURES ---
    const getDistance = (t1: React.Touch, t2: React.Touch) => Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const getAngle = (t: React.Touch, cx: number, cy: number) => Math.atan2(t.clientY - cy, t.clientX - cx);

    const onTouchStart = (e: React.TouchEvent) => {
        if (!gestureSettings) return;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const rect = e.currentTarget.getBoundingClientRect();
        touchRef.current = {
            startX: t1.clientX,
            startY: t1.clientY,
            startDist: t2 ? getDistance(t1, t2) : 0,
            startAngle: getAngle(t1, rect.left + rect.width / 2, rect.top + rect.height / 2),
            initialVol: volume,
            initialTime: currentTime,
            active: true
        };
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!touchRef.current || !gestureSettings || !touchRef.current.active) return;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const rect = e.currentTarget.getBoundingClientRect();
        const { startX, startY, startDist, startAngle, initialVol, initialTime } = touchRef.current;

        let action = GestureAction.NONE;
        let delta = 0;

        if (t2 && startDist > 0) {
            e.preventDefault();
            delta = getDistance(t1, t2) - startDist;
            action = gestureSettings[GestureType.PINCH];
        } else if (!t2) {
            const dx = t1.clientX - startX;
            const angleDelta = getAngle(t1, rect.left + rect.width / 2, rect.top + rect.height / 2) - startAngle;
            if (gestureSettings[GestureType.CIRCLE] !== GestureAction.NONE && Math.abs(angleDelta) > 0.1) {
                e.preventDefault();
                action = gestureSettings[GestureType.CIRCLE];
                delta = angleDelta * 50;
            } else if (gestureSettings[GestureType.SWIPE] !== GestureAction.NONE && Math.abs(dx) > 10) {
                if (Math.abs(dx) > Math.abs(t1.clientY - startY)) e.preventDefault();
                action = gestureSettings[GestureType.SWIPE];
                delta = dx;
            }
        }

        if (action !== GestureAction.NONE && Math.abs(delta) > 5) {
            if (action === GestureAction.VOLUME) {
                const newVol = Math.min(1, Math.max(0, initialVol + (delta * 0.005)));
                updateVolume(newVol);
                setGestureFeedback({ icon: <Icons.Volume2 />, value: `${Math.round(newVol * 100)}%` });
            } else if (action === GestureAction.SEEK) {
                const newTime = Math.min(duration, Math.max(0, initialTime + (delta * 0.2)));
                onSeek(newTime);
                setGestureFeedback({ icon: delta > 0 ? <Icons.SkipForward /> : <Icons.SkipBack />, value: formatTime(newTime) });
            } else if (action === GestureAction.ZOOM) {
                if (delta > 50 && !isZoomed) setIsZoomed(true);
                if (delta < -50 && isZoomed) setIsZoomed(false);
            }
        }
    };

    const onTouchEnd = () => {
        setGestureFeedback(null);
        if (touchRef.current) touchRef.current.active = false;
    };

    // --- EQ LOGIC ---
    const handleEqChange = (freq: number, val: number) => {
        if (!onUpdateEq) return;
        const newSettings = { ...eqSettings, preset: 'Custom' as PresetName, gains: { ...eqSettings.gains, [freq]: val } };
        onUpdateEq(newSettings);
    };

    const applyPreset = (name: PresetName) => {
        if (!onUpdateEq) return;
        let gains = { 60: 0, 250: 0, 1000: 0, 4000: 0, 16000: 0 };
        if (name === 'Bass Boost') gains = { 60: 8, 250: 5, 1000: 0, 4000: 0, 16000: 2 };
        if (name === 'Vocal') gains = { 60: -2, 250: 2, 1000: 5, 4000: 3, 16000: 1 };
        if (name === 'Treble') gains = { 60: -2, 250: 0, 1000: 2, 4000: 6, 16000: 8 };
        onUpdateEq({ preset: name, gains });
    };

    // --- FEATURES ---
    const cyclePlaybackRate = () => {
        const rates = [1, 1.25, 1.5, 2.0, 0.5];
        const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(next);
    };

    const handleShare = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: currentTrack.title,
                    text: `Check out "${currentTrack.title}" by ${currentTrack.artist} on MTC Player!`,
                    url: currentTrack.mediaUrl
                });
            } catch (err) { }
        } else {
            try {
                await navigator.clipboard.writeText(`${currentTrack.title} by ${currentTrack.artist}\n${currentTrack.mediaUrl}`);
                showToast("Track info copied to clipboard", "success");
            } catch (e) {
                showToast("Failed to share", "error");
            }
        }
    };

    const handleTranslate = async () => {
        if (!currentTrack.lyrics && !fetchedLyrics) return;
        if (translatedLyrics) {
            setTranslatedLyrics(null);
            return;
        }

        setIsTranslating(true);
        const text = currentTrack.lyrics ? currentTrack.lyrics.map(l => l.text).join('\n') : fetchedLyrics || '';
        const result = await translateLyrics(text);
        setTranslatedLyrics(result);
        setIsTranslating(false);
    };

    const [fetchedLyrics, setFetchedLyrics] = useState<string | null>(null);

    useEffect(() => {
        setFetchedLyrics(null);
        setTranslatedLyrics(null);
        if (!currentTrack.lyrics && currentTrack.title && currentTrack.artist) {
            fetchLyrics(currentTrack.artist, currentTrack.title).then(setFetchedLyrics);
        }
    }, [currentTrack]);

    // Party Mode Sync
    useEffect(() => {
        if (!partyState || !partyState.roomId) return;
        if (!partyState.isHost) {
            const handlePartyEvent = (event: any) => {
                const { type, payload } = event;
                if (type === 'play') {
                    if (audioElement && audioElement.paused) {
                        if (Math.abs(audioElement.currentTime - payload.currentTime) > 0.5) {
                            audioElement.currentTime = payload.currentTime;
                        }
                        audioElement.play().catch(e => console.error("Party Play failed", e));
                    }
                } else if (type === 'pause') {
                    if (audioElement && !audioElement.paused) {
                        audioElement.pause();
                    }
                } else if (type === 'seek') {
                    if (audioElement) {
                        audioElement.currentTime = payload.currentTime;
                    }
                }
            };
            partySession.onEvent(handlePartyEvent);
            return () => partySession.offEvent(handlePartyEvent);
        }
    }, [partyState, audioElement]);

    const handlePlayPauseProxy = () => {
        onPlayPause();
        if (partyState?.isHost) {
            partySession.broadcast(isPlaying ? 'pause' : 'play', { currentTime: currentTime });
        }
    };

    const isVideo = currentTrack.type === MediaType.VIDEO;

    return (
        <div
            className={`${isMiniMode ? 'fixed bottom-24 right-4 z-[60] w-80 bg-app-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300' : 'fixed inset-0 z-50 flex flex-col bg-app-bg text-app-text animate-in slide-in-from-bottom duration-300'}`}
            onTouchStart={isMiniMode ? undefined : onTouchStart}
            onTouchMove={isMiniMode ? undefined : onTouchMove}
            onTouchEnd={isMiniMode ? undefined : onTouchEnd}
        >
            {isMiniMode ? (
                /* MINI MODE LAYOUT */
                <div className="flex flex-col p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <img src={currentTrack.coverUrl} className="w-12 h-12 rounded-lg object-cover shadow-md" />
                        <div className="flex-1 overflow-hidden">
                            <h3 className="text-sm font-bold text-app-text truncate">{currentTrack.title}</h3>
                            <p className="text-xs text-app-subtext truncate">{currentTrack.artist}</p>
                        </div>
                        <button onClick={onToggleMiniMode} className="p-2 text-app-subtext hover:text-white transition-colors">
                            <Icons.Maximize2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-2">
                        <button onClick={onPrev} className="p-2 text-app-subtext hover:text-white"><Icons.SkipBack className="w-5 h-5 fill-current" /></button>
                        <button onClick={onPlayPause} className="w-10 h-10 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                            {isPlaying ? <Icons.Pause className="w-5 h-5 fill-current" /> : <Icons.Play className="w-5 h-5 fill-current ml-1" />}
                        </button>
                        <button onClick={onNext} className="p-2 text-app-subtext hover:text-white"><Icons.SkipForward className="w-5 h-5 fill-current" /></button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Icons.Volume2 className="w-4 h-4 text-app-subtext" />
                        <input
                            type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange}
                            className="flex-1 h-1 bg-app-border rounded-full accent-brand-accent"
                        />
                    </div>
                </div>
            ) : (
                /* FULL MODE LAYOUT */
                <>
                    {showVisualizer && analyser && (
                        <VisualizerOverlay analyser={analyser} onClose={() => setShowVisualizer(false)} />
                    )}

                    {gestureFeedback && (
                        <div className="absolute inset-0 z-[70] pointer-events-none flex items-center justify-center">
                            <div className="bg-black/70 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center animate-fade-in text-white shadow-2xl">
                                <div className="mb-2 text-brand-accent scale-150">{gestureFeedback.icon}</div>
                                <span className="text-xl font-bold font-mono">{gestureFeedback.value}</span>
                            </div>
                        </div>
                    )}

                    {/* Header Controls */}
                    <div className="flex justify-between items-center p-4 md:p-8 z-50">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-app-text transition-colors">
                            <Icons.ChevronDown className="w-6 h-6" />
                        </button>
                        <div className="flex gap-4 md:absolute md:top-6 md:left-6 md:flex-row-reverse">
                            {!isVideo && (
                                <button onClick={cyclePlaybackRate} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md flex items-center gap-1">
                                    <Icons.Gauge className="w-5 h-5" />
                                    <span className="text-xs font-bold w-6">{playbackRate}x</span>
                                </button>
                            )}
                            {!isVideo && (
                                <button onClick={() => setShowVisualizer(true)} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md animate-pulse">
                                    <Icons.Activity className="w-6 h-6" />
                                </button>
                            )}
                            <button onClick={() => setShowSleepMenu(!showSleepMenu)} className={`p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md ${sleepTimerActive ? 'text-brand-accent' : 'text-white'}`}>
                                <Icons.Timer className="w-6 h-6" />
                            </button>
                            <button onClick={() => setShowEq(!showEq)} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md">
                                <Icons.Sliders className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {isVideo ? (
                        /* VIDEO LAYOUT */
                        <div className="flex-1 flex items-center justify-center bg-black relative group w-full h-full md:h-auto md:aspect-video md:rounded-2xl md:overflow-hidden md:shadow-2xl" onMouseMove={handleVideoMouseMove} onClick={handleVideoMouseMove}>
                            <video
                                ref={videoRef}
                                src={currentTrack.mediaUrl}
                                className="w-full h-full object-contain"
                                playsInline
                                loop={repeatMode === RepeatMode.ONE}
                            />
                            {/* Video Overlay Controls */}
                            <div className={`absolute inset-0 bg-black/40 flex flex-col justify-between transition-opacity duration-300 ${showVideoControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="flex-1 flex items-center justify-center">
                                    <button onClick={handlePlayPauseProxy} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-accent/20">
                                        {isPlaying ? <Icons.Pause className="w-8 h-8 fill-current" /> : <Icons.Play className="w-8 h-8 fill-current ml-1" />}
                                    </button>
                                </div>
                                <div className="p-4 bg-gradient-to-t from-black/80 to-transparent space-y-2" onClick={e => e.stopPropagation()}>
                                    <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeekChange} className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-brand-accent hover:h-2 transition-all" />
                                    <div className="flex justify-between items-center text-white">
                                        <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                                        <div className="flex items-center gap-4">
                                            <button onClick={onToggleFavorite}><Icons.Heart className={`w-6 h-6 ${isFavorite ? 'fill-brand-accent text-brand-accent' : 'text-white'}`} /></button>
                                            <button onClick={requestPictureInPicture}><Icons.Maximize2 className="w-5 h-5 hover:text-brand-accent" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* AUDIO LAYOUT */
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                            {/* Left Side: Artwork/Visualizer */}
                            <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 relative w-full md:w-1/2 md:max-w-none md:p-0 md:min-h-auto">
                                <div className={`relative aspect-square w-[min(85vw,55vh)] md:w-[min(45vw,70vh)] ${showLyrics ? 'rounded-2xl' : 'rounded-full'} overflow-hidden shadow-2xl transition-all duration-500 ${isZoomed ? 'scale-110 z-20' : ''} ${isPlaying && !showLyrics ? 'animate-spin-slow' : ''}`} onClick={() => setIsZoomed(!isZoomed)}>
                                    {(showLyrics ? (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col p-6 overflow-y-auto text-center scroll-smooth no-scrollbar">
                                            <div className="flex justify-between items-center mb-4 sticky top-0">
                                                <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Lyrics</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleTranslate(); }} disabled={isTranslating} className="text-xs flex items-center gap-1 bg-white/10 px-2 py-1 rounded hover:bg-white/20 text-white">
                                                    <Icons.Languages className="w-3 h-3" />
                                                    {isTranslating ? 'Translating...' : translatedLyrics ? 'Original' : 'Translate'}
                                                </button>
                                            </div>
                                            {isTranslating ? (
                                                <div className="flex-1 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full"></div></div>
                                            ) : translatedLyrics ? (
                                                <p className="text-lg text-white leading-relaxed whitespace-pre-line font-medium">{translatedLyrics}</p>
                                            ) : (
                                                currentTrack.lyrics ? (
                                                    <div className="space-y-6 py-4">
                                                        {currentTrack.lyrics.map((line, i) => (
                                                            <p key={i} className={`transition-all duration-300 cursor-pointer hover:text-brand-light ${Math.abs(currentTime - line.time) < 5 ? 'text-brand-accent scale-110 font-bold' : 'text-white/60 text-sm'}`} onClick={(e) => { e.stopPropagation(); onSeek(line.time); }}>
                                                                {line.text}
                                                            </p>
                                                        ))}
                                                    </div>
                                                ) : fetchedLyrics ? (
                                                    <p className="text-white/80 leading-relaxed whitespace-pre-line font-medium text-sm py-4">{fetchedLyrics}</p>
                                                ) : <div className="flex flex-col items-center justify-center h-48 space-y-4">
                                                    <Icons.Music className="w-12 h-12 text-white/20" />
                                                    <p className="text-white/50">No lyrics found.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <img src={currentTrack.coverUrl} className="w-full h-full object-cover" />
                                            {/* Vinyl Center Hole */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#1a1a1a] rounded-full border-4 border-[#27272a] shadow-inner z-10 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-black rounded-full"></div>
                                                </div>
                                            </div>
                                            {/* Audio Engine (Visualizer) Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-0">
                                                <div className="w-full h-full opacity-80">
                                                    <AudioEngine
                                                        audioElement={audioElement}
                                                        isPlaying={isPlaying}
                                                        color={accentColor}
                                                        eqSettings={eqSettings}
                                                        onAnalyserReady={setAnalyser}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Controls */}
                            <div className="w-full flex-shrink-0 flex flex-col items-center justify-end p-4 pb-8 md:w-1/2 md:p-0 md:items-stretch md:justify-center">
                                <div className="w-full max-w-sm md:max-w-md mb-2 flex justify-between items-center md:mb-8">
                                    <div className="overflow-hidden">
                                        <h2 className="text-2xl font-bold text-app-text truncate md:text-4xl">{currentTrack.title}</h2>
                                        <p className="text-app-subtext truncate md:text-xl md:mt-1">{currentTrack.artist}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => handleShare(e)} className="p-2 transition-transform active:scale-90 text-app-subtext hover:text-app-text">
                                            <Icons.Share2 className="w-6 h-6 md:w-7 md:h-7" />
                                        </button>
                                        <button onClick={() => onToggleFavorite?.()} className="p-2 transition-transform active:scale-90">
                                            <Icons.Heart className={`w-7 h-7 md:w-8 md:h-8 ${isFavorite ? 'fill-brand-accent text-brand-accent' : 'text-app-subtext'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="w-full max-w-sm md:max-w-md mb-6 group md:mb-10">
                                    <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeekChange} className="w-full h-1.5 bg-app-border rounded-full appearance-none cursor-pointer accent-brand-accent hover:h-2 transition-all" />
                                    <div className="flex justify-between text-xs text-app-subtext mt-2 font-mono">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                <div className="w-full max-w-sm md:max-w-md flex items-center justify-between mb-8 md:mb-12">
                                    <button onClick={onToggleShuffle} className={`p-2 transition-colors ${shuffleOn ? 'text-brand-accent' : 'text-app-subtext'}`}><Icons.Shuffle className="w-5 h-5 md:w-6 md:h-6" /></button>
                                    <button onClick={onPrev} className="p-2 text-app-text hover:text-brand-accent transition-colors"><Icons.SkipBack className="w-8 h-8 md:w-10 md:h-10 fill-current" /></button>
                                    <button onClick={handlePlayPauseProxy} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-[0_0_20px_rgba(13,148,136,0.4)] hover:scale-105 hover:shadow-[0_0_30px_rgba(13,148,136,0.6)] transition-all">
                                        {isPlaying ? <Icons.Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" /> : <Icons.Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />}
                                    </button>
                                    <button onClick={onNext} className="p-2 text-app-text hover:text-brand-accent transition-colors"><Icons.SkipForward className="w-8 h-8 md:w-10 md:h-10 fill-current" /></button>
                                    <button onClick={onToggleRepeat} className={`p-2 transition-colors ${repeatMode !== RepeatMode.OFF ? 'text-brand-accent' : 'text-app-subtext'}`}>
                                        {repeatMode === RepeatMode.ONE ? <Icons.Repeat1 className="w-5 h-5 md:w-6 md:h-6" /> : <Icons.Repeat className="w-5 h-5 md:w-6 md:h-6" />}
                                    </button>
                                    <button onClick={onToggleMiniMode} title="Switch to Floating Mini Player" className="hidden md:flex p-2 text-app-subtext hover:text-brand-accent transition-colors">
                                        <Icons.Minimize2 className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                </div>

                                <div className="w-full max-w-sm md:max-w-md flex items-center justify-between px-4 md:px-0">
                                    <div className="flex items-center gap-2 group relative">
                                        <button onClick={toggleMute} className="text-app-subtext hover:text-app-text"><Icons.Volume2 className="w-5 h-5 md:w-6 md:h-6" /></button>
                                        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-20 h-1 bg-app-border rounded-full accent-brand-accent" />
                                    </div>
                                    <button onClick={() => setShowLyrics(!showLyrics)} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${showLyrics ? 'bg-brand-accent text-white border-brand-accent' : 'border-app-border text-app-subtext hover:text-app-text'}`}>
                                        <Icons.MessageSquare className="w-4 h-4" /> Lyrics
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PlayerView;
