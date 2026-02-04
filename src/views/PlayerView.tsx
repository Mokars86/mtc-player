
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../components/Icon';
import { MediaItem, RepeatMode, MediaType, GestureSettings, GestureType, GestureAction, EqSettings, PresetName, ReverbSettings } from '../types';
import { PartyState, partySession } from '../services/partySessionService';
import AudioEngine from '../components/AudioEngine';
import { translateLyrics } from '../services/geminiService';
import { VisualizerOverlay } from '../components/VisualizerOverlay';
import { fetchLyrics } from '../services/lyricsService';
import { useToast } from '../components/Toast';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { DefaultDisc } from '../components/player/DefaultDisc';

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
    reverbSettings?: ReverbSettings;
    onUpdateReverb?: (settings: ReverbSettings) => void;
    onDownload?: () => void;
    isOfflineAvailable?: boolean;
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
    onToggleMiniMode,
    reverbSettings,
    onUpdateReverb,
    onDownload,
    isOfflineAvailable
}) => {
    const [showLyrics, setShowLyrics] = useState(false);
    // const [isMiniMode, setIsMiniMode] = useState(false); // Controlled by parent now
    const [volume, setVolume] = useState(() => audioElement ? audioElement.volume : 1);
    const [isZoomed, setIsZoomed] = useState(false);
    const [showEq, setShowEq] = useState(false);
    const [showReverbMenu, setShowReverbMenu] = useState(false);
    const [showSleepMenu, setShowSleepMenu] = useState(false);
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const { showToast } = useToast();
    const isOnline = useOnlineStatus();

    // Playback Speed State
    const [playbackRate, setPlaybackRate] = useState(1);

    // Translation State
    const [translatedLyrics, setTranslatedLyrics] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

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

    // Image Error State
    const [imgError, setImgError] = useState(false);
    useEffect(() => {
        setImgError(false);
    }, [currentTrack.coverUrl]);
    const showDefaultDisc = !isOnline || !currentTrack.coverUrl || imgError;

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

    // Sync Playback Rate
    useEffect(() => {
        if (audioElement) audioElement.playbackRate = playbackRate;
    }, [playbackRate, audioElement]);


    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        updateVolume(newVolume);
    };

    const updateVolume = (newVolume: number) => {
        setVolume(newVolume);
        if (audioElement) audioElement.volume = newVolume;
    }

    const toggleMute = () => {
        const newVol = volume > 0 ? 0 : 1;
        updateVolume(newVol);
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
                            <button onClick={cyclePlaybackRate} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md flex items-center gap-1">
                                <Icons.Gauge className="w-5 h-5" />
                                <span className="text-xs font-bold w-6">{playbackRate}x</span>
                            </button>
                            <button onClick={() => setShowVisualizer(true)} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md animate-pulse">
                                <Icons.Activity className="w-6 h-6" />
                            </button>
                            <button onClick={() => setShowReverbMenu(!showReverbMenu)} className={`p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md ${reverbSettings?.active ? 'text-brand-accent' : 'text-white'}`}>
                                <Icons.Wand2 className="w-6 h-6" />
                            </button>
                            <button onClick={() => setShowSleepMenu(!showSleepMenu)} className={`p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md ${sleepTimerActive ? 'text-brand-accent' : 'text-white'}`}>
                                <Icons.Timer className="w-6 h-6" />
                            </button>
                            <button onClick={() => setShowEq(!showEq)} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md">
                                <Icons.Sliders className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* AUDIO LAYOUT */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                        {/* Left Side: Artwork/Visualizer */}
                        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 relative w-full md:w-1/2 md:max-w-none md:p-0 md:min-h-auto text-center shrink-0">
                            <div className={`relative shrink-0 ${showLyrics ? 'rounded-2xl w-[85vw] h-[50vh]' : 'rounded-full w-[min(70vw,40vh)] h-[min(70vw,40vh)]'} overflow-hidden shadow-2xl transition-all duration-500 ${isZoomed ? 'scale-110 z-20' : ''} ${isPlaying && !showLyrics ? 'animate-spin-slow' : ''}`} onClick={() => setIsZoomed(!isZoomed)}>
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

                                        {showDefaultDisc ? (
                                            <div className="w-full h-full p-0 flex items-center justify-center bg-black/90 rounded-2xl overflow-hidden shadow-2xl relative">
                                                {/* Use the new offline/default cover */}
                                                <img
                                                    src="/mtc-offline-cover.png"
                                                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                                                    alt="MTC Default"
                                                />
                                                {/* Optional overlay text if needed, but image has text */}
                                            </div>
                                        ) : (
                                            <img
                                                src={currentTrack.coverUrl}
                                                className="w-full h-full object-cover"
                                                onError={() => setImgError(true)}
                                            />
                                        )}

                                        {/* Vinyl Center Hole (Removed for card style default art) */}
                                        {!showDefaultDisc && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#1a1a1a]/0 rounded-full z-10 flex items-center justify-center">
                                                    {/* Hidden hole for full art experience or keep if vinyl style desired. 
                                                    User asked for "Album Cover Art", usually square/card, NOT vinyl. 
                                                    But existing UI seems to be vinyl style? 
                                                    Let's keep the hole ONLY if it's NOT the default disc (i.e. real cover). 
                                                    Actually, for modern art, maybe remove hole? 
                                                    The existing code puts a hole over everything. 
                                                    Let's hide the hole if it is the default disc so the art shows fully.
                                                */}
                                                </div>
                                            </div>
                                        )}
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
                                    {onDownload && (
                                        <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className={`p-2 transition-transform active:scale-90 ${isOfflineAvailable ? 'text-brand-accent' : 'text-app-subtext hover:text-white'}`} disabled={isOfflineAvailable}>
                                            {isOfflineAvailable ? <Icons.CheckCircle className="w-6 h-6 md:w-7 md:h-7" /> : <Icons.Download className="w-6 h-6 md:w-7 md:h-7" />}
                                        </button>
                                    )}
                                    <button onClick={() => onToggleFavorite?.()} className="p-2 transition-transform active:scale-90">
                                        <Icons.Heart className={`w-7 h-7 md:w-8 md:h-8 ${isFavorite ? 'fill-brand-accent text-brand-accent' : 'text-app-subtext'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="w-full max-w-sm md:max-w-md mb-4 group md:mb-10">
                                <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeekChange} className="w-full h-1.5 bg-app-border rounded-full appearance-none cursor-pointer accent-brand-accent hover:h-2 transition-all" />
                                <div className="flex justify-between text-xs text-app-subtext mt-2 font-mono">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="w-full max-w-sm md:max-w-md flex items-center justify-between mb-4 md:mb-12">
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

                            <div className="w-full max-w-sm md:max-w-md flex items-center justify-between px-4 md:px-0 mt-2 md:mt-0">
                                <div className="flex items-center gap-2 group relative">
                                    <button onClick={toggleMute} className="text-app-subtext hover:text-app-text p-2 hover:bg-white/5 rounded-full"><Icons.Volume2 className="w-5 h-5 md:w-6 md:h-6" /></button>
                                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-24 h-1.5 bg-app-border rounded-full accent-brand-accent" />
                                </div>
                                <button onClick={() => setShowLyrics(!showLyrics)} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${showLyrics ? 'bg-brand-accent text-white border-brand-accent' : 'border-app-border text-app-subtext hover:text-app-text'}`}>
                                    <Icons.MessageSquare className="w-4 h-4" /> Lyrics
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Equalizer Overlay */}
            {showEq && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in" onClick={() => setShowEq(false)}>
                    <div className="bg-app-card border border-app-border p-6 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Icons.Sliders className="w-5 h-5 text-brand-accent" /> Equalizer</h3>
                            <button onClick={() => setShowEq(false)} className="p-2 hover:text-white text-app-subtext"><Icons.X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex justify-between h-48 mb-6 px-2">
                            {[60, 250, 1000, 4000, 16000].map(freq => (
                                <div key={freq} className="flex flex-col items-center h-full gap-2">
                                    <input
                                        type="range" min="-12" max="12" step="1"
                                        value={eqSettings.gains[freq] || 0}
                                        onChange={(e) => handleEqChange(freq, Number(e.target.value))}
                                        className="h-full w-2 bg-app-border rounded-full appearance-none cursor-pointer accent-brand-accent writing-mode-vertical"
                                        style={{ WebkitAppearance: 'slider-vertical' } as any}
                                    />
                                    <span className="text-xs font-mono text-app-subtext w-8 text-center">{freq >= 1000 ? `${freq / 1000}k` : freq}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {['Bass Boost', 'Vocal', 'Treble', 'Flat'].map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => applyPreset(preset as any)}
                                    className={`px-2 py-2 rounded-lg text-xs font-bold transition-all ${eqSettings.preset === preset ? 'bg-brand-accent text-white shadow-lg' : 'bg-app-surface text-app-subtext hover:bg-white/5'}`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Sleep Timer Overlay */}
            {showSleepMenu && (
                <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in" onClick={() => setShowSleepMenu(false)}>
                    <div className="bg-app-card w-full md:w-80 md:rounded-2xl rounded-t-2xl border-t md:border border-app-border shadow-2xl overflow-hidden mb-0 md:mb-0 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-app-border flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2"><Icons.Timer className="w-5 h-5 text-brand-accent" /> Sleep Timer</h3>
                            <button onClick={() => setShowSleepMenu(false)}><Icons.X className="w-5 h-5 text-app-subtext" /></button>
                        </div>
                        <div className="p-2 space-y-1">
                            {[null, 15, 30, 45, 60].map((min) => (
                                <button
                                    key={min || 'off'}
                                    onClick={() => {
                                        if (onSetSleepTimer) onSetSleepTimer(min);
                                        setShowSleepMenu(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl flex justify-between items-center transition-colors ${sleepTimerActive && ((min === null && !sleepTimerActive) || (min && sleepTimerActive)) ? 'bg-brand-accent/10 text-brand-accent' : 'hover:bg-white/5 text-app-text'}`}
                                >
                                    <span>{min ? `${min} Minutes` : 'Turn Off'}</span>
                                    {sleepTimerActive && min !== null && <Icons.Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Reverb Overlay */}
            {showReverbMenu && reverbSettings && onUpdateReverb && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in" onClick={() => setShowReverbMenu(false)}>
                    <div className="bg-app-card border border-app-border p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Icons.Activity className="w-5 h-5 text-brand-accent" /> Reverb</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-app-subtext uppercase">{reverbSettings.active ? 'ON' : 'OFF'}</span>
                                <button
                                    onClick={() => onUpdateReverb({ ...reverbSettings, active: !reverbSettings.active })}
                                    className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${reverbSettings.active ? 'bg-brand-accent' : 'bg-white/10'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${reverbSettings.active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </button>
                                <button onClick={() => setShowReverbMenu(false)} className="p-2 ml-2 hover:text-white text-app-subtext"><Icons.X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className={`space-y-6 transition-opacity ${reverbSettings.active ? 'opacity-100 pointer-events-auto' : 'opacity-50 pointer-events-none'}`}>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-app-subtext font-bold uppercase">
                                    <span>Mix (Dry / Wet)</span>
                                    <span>{Math.round(reverbSettings.mix * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={reverbSettings.mix}
                                    onChange={(e) => onUpdateReverb({ ...reverbSettings, mix: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-app-border rounded-full accent-brand-accent appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-app-subtext font-bold uppercase">
                                    <span>Size (Decay)</span>
                                    <span>{reverbSettings.decay}s</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="5.0" step="0.1"
                                    value={reverbSettings.decay}
                                    onChange={(e) => onUpdateReverb({ ...reverbSettings, decay: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-app-border rounded-full accent-brand-accent appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerView;
