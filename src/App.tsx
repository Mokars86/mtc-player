import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { AppView, MediaItem, MediaType, RepeatMode, GestureType, GestureAction, GestureSettings, EqSettings, SleepTimer, Playlist, Theme } from './types';
import { SKINS, Skin } from './constants/skins';
import { Icons } from './components/Icon';
import HomeView from './views/HomeView';
import PlayerView from './views/PlayerView';
import AIChatView from './views/AIChatView';
import { SettingsView } from './views/SettingsView';
import { ToastProvider, useToast } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { api } from './services/api';
import { supabase } from './services/supabase';
import { AuthView } from './views/AuthView';
import { saveBatchMediaToDB, loadMediaFromDB, clearMediaDB, removeMediaFromDB } from './services/db';

// Extracted Components
import { SplashScreen } from './components/SplashScreen';
import { SyncStatus } from './components/SyncStatus';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { MiniPlayer } from './components/player/MiniPlayer';
import { ProfileModal } from './components/modals/ProfileModal';
import { CreatePlaylistModal } from './components/modals/CreatePlaylistModal';
import { AddToPlaylistModal } from './components/modals/AddToPlaylistModal';
import { PartyModeModal } from './components/modals/PartyModeModal';
import { partySession, PartyState } from './services/partySessionService';
import { processVoiceCommand } from './services/geminiService';
import { updateMediaItem, incrementPlayCount } from './services/db';
import { MetadataEditorModal } from './components/modals/MetadataEditorModal';
import { SupportModal } from './components/modals/SupportModal';
import { fetchCoverArt } from './services/coverArtService';

import { LibraryView } from './views/LibraryView';
import { StatsView } from './views/StatsView';
import { RadioView } from './views/RadioView';


// Internal App Component (Wrapped by Providers below)
const AppContent = () => {
    // Auth State
    const [session, setSession] = useState<any>(null);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [showPartyModal, setShowPartyModal] = useState(false);
    const [pendingPartyId, setPendingPartyId] = useState<string | undefined>(undefined);
    const [partyState, setPartyState] = useState<PartyState | null>(null);

    const [isGuest, setIsGuest] = useState(false);
    const [userName, setUserName] = useState("Guest User");
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

    const [showSplash, setShowSplash] = useState(true);
    const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
    const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [theme, setTheme] = useState<Theme>('light');

    // Apply Theme/Skin
    useEffect(() => {
        const selectedSkin = SKINS.find(s => s.id === theme) || SKINS[0];
        const root = document.documentElement;

        root.style.setProperty('--bg-app', selectedSkin.colors.bgApp);
        root.style.setProperty('--bg-card', selectedSkin.colors.bgCard);
        root.style.setProperty('--bg-surface', selectedSkin.colors.bgSurface);
        root.style.setProperty('--text-main', selectedSkin.colors.textMain);
        root.style.setProperty('--text-sub', selectedSkin.colors.textSub);
        root.style.setProperty('--border-app', selectedSkin.colors.border);
        root.style.setProperty('--brand-accent', selectedSkin.colors.accent);
        root.style.setProperty('--brand-pink', selectedSkin.colors.secondary); // reusing pink var for secondary

        // Tailwind class hack for light mode if needed, though we use vars now
        if (theme === 'light') {
            document.documentElement.classList.add('light-theme');
        } else {
            document.documentElement.classList.remove('light-theme');
        }
    }, [theme]);


    // Offline / Network State
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // User Profile State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);

    // Player Logic State
    const [shuffleOn, setShuffleOn] = useState(false);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.OFF);

    // Advanced Audio State
    const [eqSettings, setEqSettings] = useState<EqSettings>({ preset: 'Flat', gains: { 60: 0, 250: 0, 1000: 0, 4000: 0, 16000: 0 } });
    const [sleepTimer, setSleepTimer] = useState<SleepTimer>({ active: false, endTime: null, fadeDuration: 60000 });

    // Library & Favorites State
    const [localLibrary, setLocalLibrary] = useState<MediaItem[]>([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState<MediaItem[]>([]); // New State
    // Initialized empty, loaded via API
    // Initialized empty, loaded via API
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    // We should extract Library State too if possible, but keep here for now
    const [libraryTab, setLibraryTab] = useState<'ALL' | 'AUDIO' | 'VIDEO' | 'FAVORITES' | 'PLAYLISTS' | 'ALBUMS' | 'ARTISTS' | 'LOCAL' | 'HISTORY'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Playlist & Collection State
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    const [selectedCollection, setSelectedCollection] = useState<{ type: 'PLAYLIST' | 'ALBUM' | 'ARTIST', id: string, title: string } | null>(null);
    const [trackToAction, setTrackToAction] = useState<MediaItem | null>(null);

    // Gesture Settings
    const [gestureSettings, setGestureSettings] = useState<GestureSettings>({
        [GestureType.SWIPE]: GestureAction.SEEK,
        [GestureType.PINCH]: GestureAction.ZOOM,
        [GestureType.CIRCLE]: GestureAction.VOLUME
    });

    // --- METADATA EDITOR ---
    const [showMetadataModal, setShowMetadataModal] = useState(false);

    // AUTO-FETCH COVER ART
    useEffect(() => {
        if (!currentTrack || !isOnline) return;

        // Check if cover is missing or placeholder
        const isPlaceholder = !currentTrack.coverUrl || currentTrack.coverUrl.includes('picsum') || currentTrack.coverUrl.includes('ui-avatars') || currentTrack.coverUrl === '/placeholder.png';

        if (isPlaceholder && currentTrack.artist && currentTrack.title && currentTrack.type === MediaType.MUSIC) {
            fetchCoverArt(currentTrack.artist, currentTrack.title, currentTrack.album).then(url => {
                if (url) {
                    const updated = { ...currentTrack, coverUrl: url };
                    setCurrentTrack(updated);
                    setLocalLibrary(prev => prev.map(m => m.id === currentTrack.id ? updated : m));
                    updateMediaItem(updated);
                }
            });
        }
    }, [currentTrack?.id, isOnline]);

    const [trackToEdit, setTrackToEdit] = useState<MediaItem | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const handleNextRef = useRef<(autoTrigger?: boolean) => void>(() => { });

    const { showToast } = useToast();

    // --- AUTH & INITIAL LOAD ---
    useEffect(() => {
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user?.email) setUserName(session.user.email.split('@')[0]);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user?.email) setUserName(session.user.email.split('@')[0]);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load User Data when Session or Guest Mode is active
    useEffect(() => {
        if (!session && !isGuest) return;

        const loadData = async () => {
            try {
                const data = await api.fetchUserData();
                setPlaylists(data.playlists);
                setFavorites(new Set(data.favorites));
                if (data.gestures) setGestureSettings(data.gestures);
                if (data.history) setRecentlyPlayed(data.history);

                // Artificial delay to show splash screen a bit longer if data loads too fast
                setTimeout(() => {
                    setIsDataLoaded(true);
                    setShowSplash(false);
                }, 800);
            } catch (e) {
                console.error("Failed to load user data", e);
                showToast("Failed to connect to cloud services", "error");
                setIsDataLoaded(true);
                setShowSplash(false);
            }
        };
        loadData();
    }, [showToast, session, isGuest]);

    // Sync History
    useEffect(() => {
        // Debounce or just sync
        const timer = setTimeout(() => {
            api.syncHistory(recentlyPlayed);
        }, 1000);
        return () => clearTimeout(timer);
    }, [recentlyPlayed]);

    // Load Persistent Local Library
    useEffect(() => {
        const loadLocal = async () => {
            try {
                const saved = await loadMediaFromDB();
                if (saved.length > 0) {
                    setLocalLibrary(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const unique = saved.filter(s => !existingIds.has(s.id));
                        return [...prev, ...unique];
                    });
                }
            } catch (e) {
                console.error("Failed to load local DB", e);
            }
        };
        loadLocal();
    }, []);

    // Handle Login from AuthView
    const handleLogin = (guestMode = false) => {
        if (guestMode) {
            setIsGuest(true);
            setUserName("Guest User");
        }
    };

    const handleLogout = async () => {
        if (isGuest) {
            setIsGuest(false);
            setUserName("Guest User");
            // Optionally clear local data here if desired
        } else {
            await supabase.auth.signOut();
            setSession(null);
        }
        // Reset View
        setCurrentView(AppView.HOME);
    };

    // --- SYNC EFFECTS ---
    // We use refs to prevent syncing on initial load
    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) { isMounted.current = true; return; }
        if (!isDataLoaded) return;

        const sync = async () => {
            setSyncStatus('syncing');
            try {
                await api.syncPlaylists(playlists);
                setSyncStatus('synced');
                setTimeout(() => setSyncStatus('idle'), 2000);
            } catch (e) {
                setSyncStatus('error');
            }
        };
        // Debounce logic could go here
        const timeout = setTimeout(sync, 1000);
        return () => clearTimeout(timeout);
    }, [playlists, isDataLoaded]);

    useEffect(() => {
        if (!isMounted.current || !isDataLoaded) return;
        const sync = async () => {
            setSyncStatus('syncing');
            try {
                await api.syncFavorites(Array.from(favorites));
                setSyncStatus('synced');
                setTimeout(() => setSyncStatus('idle'), 2000);
            } catch (e) {
                setSyncStatus('error');
            }
        };
        const timeout = setTimeout(sync, 1000);
        return () => clearTimeout(timeout);
    }, [favorites, isDataLoaded]);

    useEffect(() => {
        if (!isMounted.current || !isDataLoaded) return;
        const sync = async () => {
            setSyncStatus('syncing');
            try {
                await api.syncGestures(gestureSettings);
                setSyncStatus('synced');
                setTimeout(() => setSyncStatus('idle'), 2000);
            } catch (e) {
                setSyncStatus('error');
            }
        };
        const timeout = setTimeout(sync, 1000);
        return () => clearTimeout(timeout);
    }, [gestureSettings, isDataLoaded]);

    // Network Status Listeners
    useEffect(() => {
        // Party Session Listener
        const unsubscribeParty = partySession.onStateChange((state) => {
            setPartyState(state);
            if (state.roomId) {
                showToast(state.isHost ? `Hosting Party: ${state.roomId}` : `Joined Party: ${state.roomId}`, "success");
            } else {
                showToast("Left Party", "info");
            }
        });

        // Deep Link Listener for Party Join
        CapacitorApp.addListener('appUrlOpen', data => {
            const url = data.url;
            // Example formats:
            // mtc-player://party/ROOM_ID
            // https://mtc-player.com/party/ROOM_ID
            if (url.includes('/party/')) {
                const parts = url.split('/party/');
                if (parts.length > 1) {
                    const roomId = parts[1].split('/')[0].split('?')[0]; // simple cleaning
                    if (roomId) {
                        setPendingPartyId(roomId);
                        setShowPartyModal(true);
                        showToast(`Found Party Invitation: ${roomId}`, 'info');
                    }
                }
            }
        });

        // Offline / Online listener

        // Offline / Online listener
        const handleOnline = () => {
            setIsOnline(true);
            showToast("Connected to Cloud Services", "success");
        };
        const handleOffline = () => {
            setIsOnline(false);
            showToast("Offline Mode: Changes saved locally", "info");
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [showToast]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (audioRef.current) handleSeek(Math.min(duration, currentTime + 5));
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (audioRef.current) handleSeek(Math.max(0, currentTime - 5));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (audioRef.current) {
                        const newVol = Math.min(1, audioRef.current.volume + 0.1);
                        audioRef.current.volume = newVol;
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (audioRef.current) {
                        const newVol = Math.max(0, audioRef.current.volume - 0.1);
                        audioRef.current.volume = newVol;
                    }
                    break;
                case 'KeyM':
                    if (audioRef.current) audioRef.current.volume = audioRef.current.volume > 0 ? 0 : 1;
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [duration, currentTime, isPlaying]);

    // Sleep Timer Logic
    useEffect(() => {
        if (!sleepTimer.active || !sleepTimer.endTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            if (now >= sleepTimer.endTime!) {
                setIsPlaying(false);
                if (audioRef.current) audioRef.current.pause();
                setSleepTimer(prev => ({ ...prev, active: false, endTime: null }));
                clearInterval(interval);
                showToast("Sleep timer ended.", "info");
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [sleepTimer, isPlaying]);

    const setTimer = (minutes: number | null) => {
        if (minutes === null) {
            setSleepTimer({ active: false, endTime: null, fadeDuration: 60000 });
            showToast("Sleep timer disabled");
        } else {
            setSleepTimer({
                active: true,
                endTime: Date.now() + minutes * 60 * 1000,
                fadeDuration: 60000
            });
            showToast(`Sleep timer set for ${minutes} minutes`, "success");
        }
    };

    const allMedia = useMemo(() => [...localLibrary], [localLibrary]);

    const albums = useMemo(() => {
        const map = new Map<string, MediaItem[]>();
        allMedia.forEach(m => {
            const albumName = m.album || 'Unknown Album';
            if (!map.has(albumName)) map.set(albumName, []);
            map.get(albumName)!.push(m);
        });
        return map;
    }, [allMedia]);

    const artists = useMemo(() => {
        const map = new Map<string, MediaItem[]>();
        allMedia.forEach(m => {
            const artistName = m.artist || 'Unknown Artist';
            if (!map.has(artistName)) map.set(artistName, []);
            map.get(artistName)!.push(m);
        });
        return map;
    }, [allMedia]);

    const filteredMedia = useMemo(() => {
        let media = allMedia;

        if (selectedCollection) {
            if (selectedCollection.type === 'PLAYLIST') {
                const playlist = playlists.find(p => p.id === selectedCollection.id);
                if (playlist) {
                    media = playlist.tracks.map(id => allMedia.find(m => m.id === id)).filter(Boolean) as MediaItem[];
                } else {
                    media = [];
                }
            } else if (selectedCollection.type === 'ALBUM') {
                media = albums.get(selectedCollection.title) || [];
            } else if (selectedCollection.type === 'ARTIST') {
                media = artists.get(selectedCollection.title) || [];
            }
        } else {
            if (libraryTab === 'FAVORITES') {
                media = media.filter(m => favorites.has(m.id));
            } else if (libraryTab === 'LOCAL') {
                media = localLibrary;
            } else if (libraryTab === 'AUDIO') {
                media = media.filter(m => m.type === MediaType.MUSIC || m.type === MediaType.PODCAST || m.type === MediaType.AUDIOBOOK);
            } else if (libraryTab === 'VIDEO') {
                media = media.filter(m => m.type === MediaType.VIDEO);
            } else if (libraryTab === 'PLAYLISTS' || libraryTab === 'ALBUMS' || libraryTab === 'ARTISTS') {
                media = [];
            } else if (libraryTab === 'HISTORY') {
                media = recentlyPlayed;
            }
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            // If searching in top level lists (Playlists/Albums/Artists), we handled that in the UI rendering logic in the original file
            // but here we are filtering MEDIA items.
            // So if tab is Playlists, filteredMedia is empty, but we render playlist cards separately.

            media = media.filter(m =>
                m.title.toLowerCase().includes(query) ||
                m.artist.toLowerCase().includes(query) ||
                m.moods?.some(mood => mood.toLowerCase().includes(query))
            );
        }
        return media;
    }, [allMedia, localLibrary, libraryTab, favorites, searchQuery, selectedCollection, playlists, albums, artists]);

    const playTrack = useCallback(async (track: MediaItem) => {
        if (!audioRef.current) return;
        setCurrentTrack(track);

        // Add to Recently Played (Duplicate check)
        setRecentlyPlayed(prev => {
            const filtered = prev.filter(t => t.id !== track.id);
            return [track, ...filtered].slice(0, 10); // Keep last 10
        });

        if (track.type === MediaType.VIDEO) {
            audioRef.current.pause();
            setIsPlaying(true);
            setCurrentTime(0);
            setDuration(track.duration || 0);
            return;
        }

        // Check offline capability for remote tracks
        if (!isOnline && !track.id.startsWith('local-') && !track.mediaUrl.startsWith('blob:')) {
            showToast("Offline: Cannot play remote track.", "error");
            setIsPlaying(false);
            return;
        }

        try {
            audioRef.current.pause();
            // Ensure crossOrigin is set for Visualizer (Web Audio API requirement)
            audioRef.current.crossOrigin = "anonymous";
            audioRef.current.src = track.mediaUrl;
            audioRef.current.load();

            try {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }
                setIsPlaying(true);
            } catch (playError: any) {
                // Robust Fallback: If CORS or Source error, try without CORS (Visualizer will be disabled)
                if (playError.name === 'NotSupportedError' || playError.message.includes('supported source')) {
                    console.warn("Playback error detected (CORS/Source). Retrying without CORS headers.");

                    // Reset source and CORS
                    audioRef.current.pause();
                    audioRef.current.crossOrigin = null; // Remove CORS requirement
                    audioRef.current.src = track.mediaUrl;
                    audioRef.current.load();

                    await audioRef.current.play();
                    setIsPlaying(true);
                    showToast("Playing (Visualizer disabled due to source restrictions)", "info");
                } else {
                    throw playError;
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                // Expected when switching tracks quickly
            } else {
                console.error("PlayTrack failed:", error);
                setIsPlaying(false);
                showToast(`Error: ${error.message || "Failed to load media"}`, "error");
            }
        }
    }, [showToast, isOnline]);

    const handleNext = useCallback((autoTrigger = false) => {
        if (!currentTrack) return;

        // TRACK STATS IF AUTO TRIGGERED (FINISHED)
        if (autoTrigger) {
            incrementPlayCount(currentTrack.id, Date.now()).then(updated => {
                if (updated) {
                    setAllMedia(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
                    // Also update localLibrary if it's there
                    setLocalLibrary(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
                }
            });
        }

        if (autoTrigger && repeatMode === RepeatMode.ONE) {
            if (currentTrack.type === MediaType.VIDEO) {
                playTrack(currentTrack);
            } else if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
                setIsPlaying(true);
            }
            return;
        }

        const list = filteredMedia.length > 0 ? filteredMedia : allMedia;
        const currentIdx = list.findIndex(t => t.id === currentTrack.id);

        if (shuffleOn) {
            let nextIdx = Math.floor(Math.random() * list.length);
            if (list.length > 1 && nextIdx === currentIdx) {
                nextIdx = (nextIdx + 1) % list.length;
            }
            playTrack(list[nextIdx]);
            return;
        }

        if (currentIdx === -1) {
            playTrack(list[0]);
            return;
        }

        const nextIdx = currentIdx + 1;
        if (nextIdx >= list.length) {
            if (repeatMode === RepeatMode.ALL) {
                playTrack(list[0]);
            } else {
                setIsPlaying(false);
                if (!autoTrigger) {
                    playTrack(list[0]);
                }
            }
        } else {
            playTrack(list[nextIdx]);
        }
    }, [currentTrack, filteredMedia, allMedia, shuffleOn, repeatMode, playTrack]);

    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    const handlePrev = useCallback(() => {
        if (!currentTrack) return;
        const list = filteredMedia.length > 0 ? filteredMedia : allMedia;
        const currentIdx = list.findIndex(t => t.id === currentTrack.id);

        if (currentTime > 3) {
            if (currentTrack.type !== MediaType.VIDEO && audioRef.current) {
                audioRef.current.currentTime = 0;
            } else {
                playTrack(currentTrack);
            }
            return;
        }

        const prevIdx = (currentIdx - 1 + list.length) % list.length;
        playTrack(list[prevIdx]);
    }, [currentTrack, filteredMedia, allMedia, playTrack, currentTime]);

    useEffect(() => {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audioRef.current = audio;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => { handleNextRef.current(true); };
        const onError = (e: Event) => {
            const target = e.target as HTMLAudioElement;
            // Suppress errors if we know we are offline or if it's an AbortError
            if (target.error && target.error.code !== target.error.MEDIA_ERR_ABORTED && navigator.onLine) {
                // We handle basic loading errors in playTrack now, but valid stream errors might still bubble here
                console.warn("Audio Element Error:", target.error);
            }
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            audio.pause();
        };
    }, []);

    const toggleTheme = (newTheme: Theme) => {
        setTheme(newTheme);
    };

    const toggleFavorite = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const removeFromLibrary = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (confirm("Remove this track from your local library?")) {
            removeMediaFromDB(id);
            setLocalLibrary(prev => prev.filter(item => item.id !== id));
            showToast("Track removed from library");
        }
    };

    const clearLocalLibrary = () => {
        if (confirm("Clear all local tracks? This action cannot be undone.")) {
            clearMediaDB();
            setLocalLibrary([]);
            showToast("Local library cleared");
        }
    };







    const toggleShuffle = () => {
        setShuffleOn(prev => {
            const newVal = !prev;
            showToast(newVal ? "Shuffle On" : "Shuffle Off");
            return newVal;
        });
    }

    const toggleRepeat = () => {
        setRepeatMode(prev => {
            if (prev === RepeatMode.OFF) {
                showToast("Repeat All");
                return RepeatMode.ALL;
            }
            if (prev === RepeatMode.ALL) {
                showToast("Repeat One");
                return RepeatMode.ONE;
            }
            showToast("Repeat Off");
            return RepeatMode.OFF;
        });
    };

    const handleShuffleAll = () => {
        if (allMedia.length === 0) {
            showToast("Library is empty!", "error");
            return;
        }
        setShuffleOn(true);
        const randomIdx = Math.floor(Math.random() * allMedia.length);
        playTrack(allMedia[randomIdx]);
        showToast("Shuffling all tracks...");
    };

    // --- AI VOICE CONTROL ---
    const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);

    const handleVoiceCommand = async (transcript: string) => {
        setIsVoiceProcessing(true);
        // Combine all available tracks for context (local + loaded playlists)
        const allMedia = [...localLibrary, ...playlists.flatMap(p => p.items)];

        const command = await processVoiceCommand(transcript, allMedia);
        showToast(command.feedback, "info");

        if (command.action === 'PLAY') {
            if (command.params?.song || command.params?.artist) {
                // simple search match
                const term = (command.params.song || command.params.artist || "").toLowerCase();
                const match = allMedia.find(m =>
                    m.title.toLowerCase().includes(term) ||
                    m.artist.toLowerCase().includes(term)
                );
                if (match) {
                    setCurrentTrack(match);
                    setIsPlaying(true);
                    setCurrentView(AppView.PLAYER);
                } else {
                    showToast("Couldn't find that track.", "error");
                }
            } else {
                setIsPlaying(true); // Resume
            }
        } else if (command.action === 'PAUSE') {
            setIsPlaying(false);
        } else if (command.action === 'NEXT') {
            handleNext(false);
        } else if (command.action === 'PREV') {
            handlePrev();
        } else if (command.action === 'SHUFFLE') {
            toggleShuffle();
        }

        setIsVoiceProcessing(false);
    };


    // SMART EQ LOGIC
    useEffect(() => {
        if (!eqSettings.auto || !currentTrack) return;

        const tags = [...(currentTrack.tags || []), ...(currentTrack.moods || [])].map(t => t.toLowerCase());
        const combined = tags.join(' ');

        let newGains = { ...eqSettings.gains }; // Default flat start? Or keep current
        let preset: PresetName = 'Flat';

        if (combined.includes('rock') || combined.includes('metal') || combined.includes('dance') || combined.includes('techno') || combined.includes('hip hop')) {
            // Bass Boost
            preset = 'Bass Boost';
            newGains = { 60: 8, 250: 5, 1000: 0, 4000: 0, 16000: 2 };
        } else if (combined.includes('pop') || combined.includes('acoustic') || combined.includes('folk')) {
            // Vocal
            preset = 'Vocal';
            newGains = { 60: -2, 250: 2, 1000: 5, 4000: 3, 16000: 1 };
        } else if (combined.includes('classical') || combined.includes('jazz')) {
            // Treble
            preset = 'Treble';
            newGains = { 60: -2, 250: 0, 1000: 2, 4000: 6, 16000: 8 };
        } else {
            // Default Flat
            preset = 'Flat';
            newGains = { 60: 0, 250: 0, 1000: 0, 4000: 0, 16000: 0 };
        }

        // Only update if changed prevents loop
        if (eqSettings.preset !== preset) {
            setEqSettings({ ...eqSettings, preset, gains: newGains });
            showToast(`Smart EQ: Applied ${preset} for ${currentTrack.artist}`, "success");
        }

    }, [currentTrack, eqSettings.auto]);

    const handleEditMetadata = (track: MediaItem) => {
        setTrackToEdit(track);
        setShowMetadataModal(true);
    };

    const handleSaveMetadata = async (id: string, updates: Partial<MediaItem>) => {
        try {
            // Update DB
            await updateMediaItem(id, updates);

            // Update Local State (optimistic UI)
            setLocalLibrary(prev => prev.map(item =>
                item.id === id ? { ...item, ...updates } : item
            ));

            // If currently playing, update that too
            if (currentTrack && currentTrack.id === id) {
                setCurrentTrack(prev => prev ? { ...prev, ...updates } : null);
            }

            showToast("Metadata updated successfully!", "success");
        } catch (e) {
            console.error(e);
            showToast("Failed to save changes", "error");
        }
    };

    // Modern Playlist Creation using Modal
    const openCreatePlaylistModal = () => {
        if (!isOnline) {
            showToast("Offline: Cannot create playlists.", "error");
            return;
        }
        if (isGuest) {
            showToast("Playlist creation is not available in Guest mode.", "error");
            return;
        }
        setNewPlaylistName('');
        setShowPlaylistModal(true);
    };

    const handleCreatePlaylist = () => {
        if (!isOnline) return showToast("Offline: Cannot save playlists.", "error");
        if (isGuest) return;

        if (!newPlaylistName.trim()) {
            showToast("Please enter a playlist name", "error");
            return;
        }
        const newPlaylist: Playlist = {
            id: `pl-${Date.now()}`,
            name: newPlaylistName,
            tracks: [],
            createdAt: Date.now()
        };
        setPlaylists(prev => [newPlaylist, ...prev]);
        showToast(`Playlist "${newPlaylistName}" created`, "success");
        setShowPlaylistModal(false);
    };

    const deletePlaylist = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this playlist?")) {
            setPlaylists(prev => prev.filter(p => p.id !== id));
            if (selectedCollection?.id === id) setSelectedCollection(null);
            showToast("Playlist deleted");
        }
    };

    const addToPlaylist = (playlistId: string, trackId: string) => {
        if (!isOnline) {
            showToast("Offline: Cannot modify playlists.", "error");
            return;
        }
        let added = false;
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                if (!p.tracks.includes(trackId)) {
                    added = true;
                    return { ...p, tracks: [...p.tracks, trackId] };
                } else {
                    showToast("Track already in playlist", "info");
                }
            }
            return p;
        }));
        if (added) {
            showToast("Added to playlist", "success");
            setTrackToAction(null);
        }
    };

    const removeFromPlaylist = (playlistId: string, trackId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                return { ...p, tracks: p.tracks.filter(id => id !== trackId) };
            }
            return p;
        }));
        showToast("Removed from playlist");
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        try {
            const newTracks: MediaItem[] = Array.from(files).map((file: File, index) => {
                const isVideo = file.type.startsWith('video');
                const objectUrl = URL.createObjectURL(file);

                let title = file.name.replace(/\.[^/.]+$/, "");
                let artist = 'Local Artist';

                if (title.includes('-')) {
                    const parts = title.split('-');
                    if (parts.length >= 2) {
                        artist = parts[0].trim();
                        title = parts.slice(1).join('-').trim();
                    }
                }

                return {
                    id: `local-${Date.now()}-${index}`,
                    title: title,
                    artist: artist,
                    album: 'Local Uploads',
                    coverUrl: isVideo ? '' : 'https://picsum.photos/400/400?grayscale',
                    mediaUrl: objectUrl,
                    type: isVideo ? MediaType.VIDEO : MediaType.MUSIC,
                    duration: 0,
                    moods: ['Local']
                };
            });

            // Save to Persistent Storage
            await saveBatchMediaToDB(newTracks.map((item, i) => ({ item, file: files[i] })));

            setLocalLibrary(prev => [...newTracks, ...prev]);
            setLibraryTab('LOCAL');
            setCurrentView(AppView.LIBRARY);
            showToast(`Imported ${newTracks.length} files`, "success");

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to import files", "error");
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleScanFolder = async () => {
        try {
            // @ts-ignore - File System Access API
            const dirHandle = await window.showDirectoryPicker();

            const files: File[] = [];

            async function scanDir(handle: any) {
                for await (const entry of handle.values()) {
                    if (entry.kind === 'file') {
                        const file = await entry.getFile();
                        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
                            files.push(file);
                        }
                    } else if (entry.kind === 'directory') {
                        // Optional: Recursive? For now, let's stick to flat or verify performance
                        // await scanDir(entry); 
                        // Recursion can be heavy. Let's do 1 level deep or just root for safety, 
                        // or recursive if user expects "device scan". Let's do recursive.
                        await scanDir(entry);
                    }
                }
            }

            showToast("Scanning folder...");
            await scanDir(dirHandle);

            if (files.length === 0) {
                showToast("No media files found in selected folder", "info");
                return;
            }

            const newTracks: MediaItem[] = files.map((file: File, index) => {
                const isVideo = file.type.startsWith('video');
                const objectUrl = URL.createObjectURL(file);
                let title = file.name.replace(/\.[^/.]+$/, "");
                let artist = 'Local Artist';
                if (title.includes('-')) {
                    const parts = title.split('-');
                    if (parts.length >= 2) {
                        artist = parts[0].trim();
                        title = parts.slice(1).join('-').trim();
                    }
                }

                return {
                    id: `local-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                    title: title,
                    artist: artist,
                    album: 'Local Scan',
                    coverUrl: isVideo ? '' : 'https://picsum.photos/400/400?grayscale',
                    mediaUrl: objectUrl,
                    type: isVideo ? MediaType.VIDEO : MediaType.MUSIC,
                    duration: 0,
                    moods: ['Local']
                };
            });

            setLocalLibrary(prev => [...newTracks, ...prev]);
            setLibraryTab('LOCAL');
            setCurrentView(AppView.LIBRARY);
            showToast(`Scanned ${newTracks.length} files`, "success");

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error(err);
                showToast("Folder scan failed or not supported", "error");
            }
        }
    };

    const togglePlay = () => {
        if (!currentTrack) return;
        if (isPlaying) {
            if (currentTrack.type !== MediaType.VIDEO && audioRef.current) {
                audioRef.current.pause();
            }
            setIsPlaying(false);
        } else {
            if (currentTrack.type !== MediaType.VIDEO && audioRef.current) {
                audioRef.current.play().catch(e => {
                    // Error handling in listener or logic, but standard play call usually works if loaded
                });
            }
            setIsPlaying(true);
        }
    };

    const handleSeek = (time: number) => {
        setCurrentTime(time);
        if (currentTrack?.type !== MediaType.VIDEO && audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const updateGesture = (type: GestureType, action: GestureAction) => {
        setGestureSettings(prev => ({ ...prev, [type]: action }));
        showToast("Gesture settings updated");
    };

    if (!session && !isGuest) {
        return <AuthView onLogin={handleLogin} />;
    }

    if (showSplash) {
        return (
            <div className={theme === 'light' ? 'light-theme' : ''}>
                <SplashScreen onComplete={() => setShowSplash(false)} />
            </div>
        );
    }

    // --- Temporary Library View Render Helper (until extracted) ---
    const renderLibrary = () => {
        // NOTE: This logic is massive. Ideally, we move this to <LibraryView />
        // For now, I will use a dummy wrapper to illustrate the structure.
        return (
            <LibraryView
                libraryTab={libraryTab}
                setLibraryTab={setLibraryTab}
                playlists={playlists}
                openCreatePlaylistModal={openCreatePlaylistModal}
                deletePlaylist={deletePlaylist}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                allMedia={allMedia}
                filteredMedia={filteredMedia}
                albums={albums}
                artists={artists}
                selectedCollection={selectedCollection}
                setSelectedCollection={setSelectedCollection}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                playTrack={playTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                clearLocalLibrary={clearLocalLibrary}
                triggerFileUpload={triggerFileUpload}
                removeFromLibrary={removeFromLibrary}
                setTrackToAction={setTrackToAction}
                localLibrary={localLibrary}
                isOnline={isOnline}
                setShuffleOn={setShuffleOn}
                removeFromPlaylist={removeFromPlaylist}
                addToPlaylist={addToPlaylist}
                scanFolder={handleScanFolder}
            />
        )
    };

    return (
        <div className={`${theme === 'light' ? 'light-theme' : ''} h-full w-full`}>
            <div className="flex flex-col h-screen bg-app-bg text-app-text overflow-hidden relative font-sans selection:bg-brand-accent selection:text-white transition-colors duration-300">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*,video/*" multiple className="hidden" />

                <SyncStatus status={syncStatus} />

                {/* Offline Banner */}
                {!isOnline && (
                    <div className="bg-red-600 text-white text-xs font-bold text-center py-1 absolute top-0 w-full z-[60] shadow-md animate-slide-up">
                        You are currently offline. Some features may be limited.
                    </div>
                )}

                <ProfileModal
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    userName={userName}
                    setUserName={setUserName}
                    playlists={playlists}
                    favorites={favorites}
                    localLibrary={localLibrary}
                    setCurrentView={setCurrentView}
                />

                <CreatePlaylistModal
                    isOpen={showPlaylistModal}
                    onClose={() => setShowPlaylistModal(false)}
                    newPlaylistName={newPlaylistName}
                    setNewPlaylistName={setNewPlaylistName}
                    handleCreatePlaylist={handleCreatePlaylist}
                />

                <AddToPlaylistModal
                    trackToAction={trackToAction}
                    setTrackToAction={setTrackToAction}
                    openCreatePlaylistModal={openCreatePlaylistModal}
                    playlists={playlists}
                    addToPlaylist={addToPlaylist}
                />

                <main className={`flex-1 overflow-y-auto pb-24 md:pb-0 md:pl-20 scroll-smooth ${!isOnline ? 'pt-6' : ''}`}>
                    {currentView === AppView.HOME && (
                        <HomeView
                            onPlayDemo={() => showToast("Demo media has been cleared", "info")}
                            onOpenProfile={() => setShowProfileModal(true)}
                            userName={userName}
                            isOnline={isOnline}
                            recentlyPlayed={recentlyPlayed}
                            onPlayTrack={playTrack}
                            onShuffleAll={handleShuffleAll}
                            stats={{
                                tracks: allMedia.length,
                                artists: artists.size,
                                playlists: playlists.length
                            }}
                            favorites={Array.from(favorites).map(id => allMedia.find(m => m.id === id)).filter(Boolean) as MediaItem[]}
                            onOpenHistory={() => {
                                setLibraryTab('HISTORY');
                                setCurrentView(AppView.LIBRARY);
                            }}
                            onCreatePlaylist={openCreatePlaylistModal}
                            onOpenStats={() => setCurrentView(AppView.STATS)}
                            onStartParty={() => setShowPartyModal(true)}
                            onVoiceCommand={handleVoiceCommand}
                            isVoiceProcessing={isVoiceProcessing}
                        />
                    )}
                    {/* Using the component extraction logic, we assume we have a LibraryView now */}
                    {currentView === AppView.LIBRARY && renderLibrary({ onEditMetadata: handleEditMetadata })}


                    {currentView === AppView.AI_CHAT && (
                        <AIChatView currentTrack={currentTrack} />
                    )}
                    {currentView === AppView.RADIO && (
                        <RadioView onPlay={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} />
                    )}
                    {currentView === AppView.SETTINGS && (
                        <SettingsView
                            theme={theme}
                            toggleTheme={toggleTheme}
                            gestureSettings={gestureSettings}
                            updateGesture={updateGesture}
                            isGuest={isGuest}
                            onLogout={handleLogout}
                            onShowSupport={() => setShowSupportModal(true)}
                        />
                    )}
                    {currentView === AppView.STATS && (
                        <StatsView allMedia={allMedia} onClose={() => setCurrentView(AppView.HOME)} />
                    )}
                </main>

                {currentTrack && currentView !== AppView.PLAYER && (
                    <MiniPlayer
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
                        togglePlay={togglePlay}
                        toggleFavorite={toggleFavorite}
                        favorites={favorites}
                        currentTime={currentTime}
                        duration={duration}
                        setCurrentView={setCurrentView}
                        AppView={AppView}
                    />
                )}

                <BottomNavigation currentView={currentView} setCurrentView={setCurrentView} />

                {currentView === AppView.PLAYER && currentTrack && (
                    <PlayerView
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
                        onPlayPause={togglePlay}
                        onNext={() => handleNext(false)}
                        onPrev={handlePrev}
                        audioElement={audioRef.current}
                        onClose={() => setCurrentView(AppView.HOME)}
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeek}
                        isFavorite={favorites.has(currentTrack.id)}
                        onToggleFavorite={() => toggleFavorite(currentTrack.id)}
                        shuffleOn={shuffleOn}
                        repeatMode={repeatMode}
                        onToggleShuffle={toggleShuffle}
                        onToggleRepeat={toggleRepeat}
                        onUpdateDuration={setDuration}
                        onUpdateTime={setCurrentTime}
                        gestureSettings={gestureSettings}
                        eqSettings={eqSettings}
                        onUpdateEq={setEqSettings}
                        sleepTimerActive={sleepTimer.active}
                        onSetSleepTimer={setTimer}
                        partyState={partyState}
                        accentColor={SKINS.find(s => s.id === theme)?.colors.accent}
                    />
                )}
            </div>
            {/* Modals */}
            {showPartyModal && (
                <PartyModeModal
                    isOpen={showPartyModal}
                    onClose={() => { setShowPartyModal(false); setPendingPartyId(undefined); }}
                    userName={userName}
                    onSessionStart={() => setCurrentView(AppView.PLAYER)}
                    initialRoomId={pendingPartyId}
                />
            )}
            {showPlaylistModal && (
                <CreatePlaylistModal
                    isOpen={showPlaylistModal}
                    onClose={() => setShowPlaylistModal(false)}
                    newPlaylistName={newPlaylistName}
                    setNewPlaylistName={setNewPlaylistName}
                    handleCreatePlaylist={handleCreatePlaylist}
                />
            )}

            {showSupportModal && <SupportModal onClose={() => setShowSupportModal(false)} />}

        </div>
    );
};

// Root App that renders Providers
// Force Rebuild
const App = () => {
    // console.log("App Root Mounting");
    return (
        <React.StrictMode>
            <ErrorBoundary>
                <AppContent />
            </ErrorBoundary>
        </React.StrictMode>
    )
}

export default App;
