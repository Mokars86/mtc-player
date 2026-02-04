import React, { useState } from 'react';
import { Icons } from '../components/Icon';
import { MOODS } from '../constants';
import { generatePlaylistByMood, hasApiKey } from '../services/geminiService';
import { MediaItem } from '../types';
import { VoiceInput } from '../components/VoiceInput';

interface HomeViewProps {
  onPlayDemo: () => void;
  onOpenProfile: () => void;
  userName: string;
  isOnline: boolean;
  recentlyPlayed: MediaItem[];
  onPlayTrack: (track: MediaItem) => void;
  onShuffleAll: () => void;
  stats: { tracks: number, artists: number, playlists: number };
  favorites: MediaItem[];
  onOpenHistory: () => void;
  onOpenStats: () => void;
  onCreatePlaylist: () => void;
  onStartParty: () => void;
  onVoiceCommand: (text: string) => void;
  isVoiceProcessing: boolean;
}

const HomeView: React.FC<HomeViewProps> = ({
  onPlayDemo, onOpenProfile, userName, isOnline,
  recentlyPlayed, onPlayTrack, onShuffleAll, stats, favorites, onOpenHistory, onOpenStats, onCreatePlaylist, onStartParty,
  onVoiceCommand, isVoiceProcessing
}) => {
  const [aiSuggestions, setAiSuggestions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');

  React.useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting("Good Morning");
      else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
      else if (hour >= 17 && hour < 22) setGreeting("Good Evening");
      else setGreeting("Good Night");
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMoodSelect = async (mood: string) => {
    if (!isOnline) return;
    setSelectedMood(mood);
    setLoading(true);
    setAiSuggestions(null);

    const result = await generatePlaylistByMood(mood);
    try {
      const parsed = JSON.parse(result);
      setAiSuggestions(parsed);
    } catch (e) {
      console.error("Failed to parse AI response", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 pb-32 space-y-6 md:space-y-8 animate-fade-in relative">
      {/* Hero / Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-4 w-full">
          <div className="flex justify-between items-start w-full md:block">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-light tracking-tighter">
                {greeting}
              </h1>
              <p className="text-brand-light font-medium mt-1 text-lg">{userName.split(' ')[0]}</p>
            </div>

            <div className="flex items-center gap-3">
              <VoiceInput onCommand={onVoiceCommand} isProcessing={isVoiceProcessing} />
              <button onClick={onOpenProfile} className="md:hidden w-12 h-12 rounded-full bg-brand-dark overflow-hidden border-2 border-brand-accent hover:scale-105 transition-transform shadow-xl cursor-pointer flex-shrink-0">
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=0d9488&color=fff`} alt="Profile" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider text-app-subtext">
            <span className="flex items-center gap-1"><Icons.Music className="w-3 h-3" /> {stats.tracks} Tracks</span>
            <span className="flex items-center gap-1"><Icons.Mic2 className="w-3 h-3" /> {stats.artists} Artists</span>
            <span className="flex items-center gap-1"><Icons.ListMusic className="w-3 h-3" /> {stats.playlists} Playlists</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={onCreatePlaylist}
              className="px-6 py-3 bg-brand-accent hover:bg-brand-light text-white rounded-full font-bold shadow-lg shadow-brand-accent/25 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Icons.PlusCircle className="w-4 h-4 flex-shrink-0" /> New Playlist
            </button>

            <button
              onClick={onShuffleAll}
              className="px-6 py-3 bg-app-card hover:bg-app-card/80 border border-app-border text-app-text rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Icons.Shuffle className="w-4 h-4 flex-shrink-0" /> Lucky
            </button>

            <button
              onClick={onOpenStats}
              className="px-6 py-3 bg-app-card hover:bg-app-card/80 border border-app-border text-app-text rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Icons.BarChart2 className="w-4 h-4 flex-shrink-0" /> My Stats
            </button>

            <button
              onClick={onOpenHistory}
              className="px-6 py-3 bg-app-card hover:bg-app-card/80 border border-app-border text-app-text rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Icons.History className="w-4 h-4 flex-shrink-0" /> History
            </button>

            <button
              onClick={onStartParty}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-full font-bold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Icons.Users className="w-4 h-4 flex-shrink-0" /> Party
            </button>
          </div>
        </div>

        <button onClick={onOpenProfile} className="hidden md:block w-12 h-12 rounded-full bg-brand-dark overflow-hidden border-2 border-brand-accent hover:scale-105 transition-transform shadow-xl cursor-pointer">
          <img src={`https://ui-avatars.com/api/?name=${userName}&background=0d9488&color=fff`} alt="Profile" className="w-full h-full object-cover" />
        </button>
      </div>

      {/* Recently Played */}
      {
        recentlyPlayed.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-app-text flex items-center gap-2">
              <Icons.Timer className="w-5 h-5 text-brand-accent" /> Recently Played
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {recentlyPlayed.map((track) => (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="min-w-[140px] w-[140px] group cursor-pointer snap-start"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 relative shadow-lg">
                    <img
                      src={(!isOnline && (!track.coverUrl || track.coverUrl.startsWith('http'))) ? '/mtc-offline-cover.png' : (track.coverUrl || (isOnline ? 'https://picsum.photos/200' : '/mtc-offline-cover.png'))}
                      onError={(e) => { e.currentTarget.src = '/mtc-offline-cover.png'; }}
                      alt={track.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center text-white shadow-xl transform scale-50 group-hover:scale-100 transition-all">
                        <Icons.Play className="w-5 h-5 ml-1" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-app-text truncate text-sm">{track.title}</h3>
                  <p className="text-xs text-app-subtext truncate">{track.artist}</p>
                </div>
              ))}
            </div>
          </section>
        )
      }

      {/* Quick Favorites */}
      {
        favorites.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-app-text flex items-center gap-2">
              <Icons.Heart className="w-5 h-5 text-brand-accent" /> Quick Favorites
            </h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {favorites.slice(0, 4).map((track) => (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="flex items-center gap-3 p-3 bg-app-card hover:bg-app-card/80 border border-app-border rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img
                      src={(!isOnline && (!track.coverUrl || track.coverUrl.startsWith('http'))) ? '/mtc-offline-cover.png' : (track.coverUrl || (isOnline ? 'https://picsum.photos/200' : '/mtc-offline-cover.png'))}
                      onError={(e) => { e.currentTarget.src = '/mtc-offline-cover.png'; }}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icons.Play className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-app-text truncate text-sm">{track.title}</h3>
                    <p className="text-xs text-app-subtext truncate">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      }

      {/* Mood Selector */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icons.Wand2 className={`w-5 h-5 ${isOnline ? 'text-brand-accent' : 'text-gray-500'}`} />
            <h2 className={`text-xl font-semibold ${isOnline ? 'text-app-text' : 'text-gray-500'}`}>Mood Station {isOnline ? '' : '(Offline)'}</h2>
          </div>
          {!isOnline && <span className="text-xs text-red-400 border border-red-500/30 px-2 py-1 rounded-full bg-red-500/10">Internet required</span>}
        </div>
        <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 ${!isOnline ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          {MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => handleMoodSelect(m.label)}
              disabled={loading || !isOnline}
              className={`relative overflow-hidden rounded-xl h-24 p-4 flex flex-col justify-end transition-transform transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 ${selectedMood === m.label ? 'ring-2 ring-brand-light' : ''}`}
            >
              <div className={`absolute inset-0 ${m.color} opacity-90 z-0`}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0"></div>
              <span className="relative z-10 text-2xl mb-1">{m.icon}</span>
              <span className="relative z-10 font-bold text-white">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* AI Results Section */}
      {
        (loading || aiSuggestions) && (
          <section className="glass-panel rounded-2xl p-4 border-app-border border shadow-sm animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-app-text">
                {loading ? `Consulting AI for "${selectedMood}"...` : `AI Recommended for "${selectedMood}"`}
              </h2>
              {!loading && (
                <button onClick={() => setAiSuggestions(null)} className="text-xs text-app-subtext hover:text-brand-light">Clear</button>
              )}
            </div>

            <div className="space-y-3">
              {loading ? (
                // Skeleton Loading State
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-10 h-10 rounded bg-app-card animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-app-card rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-app-card rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : (
                aiSuggestions && aiSuggestions.map((track, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 hover:bg-app-text/5 rounded-lg group cursor-pointer" onClick={onPlayDemo}>
                    <div className="w-10 h-10 rounded bg-brand-dark/50 flex items-center justify-center text-brand-light font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-app-text group-hover:text-brand-accent">{track.title}</h3>
                      <p className="text-xs text-app-subtext">{track.artist}</p>
                    </div>
                    <p className="text-xs text-app-subtext italic hidden sm:block">"{track.reason}"</p>
                    <button className="p-2 rounded-full hover:bg-brand-accent/20 text-brand-accent">
                      <Icons.Play className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {!loading && !hasApiKey() && <p className="text-xs text-red-400 mt-2 text-center">API Key not detected. Using mock generation logic in production.</p>}
          </section>
        )
      }
    </div >
  );
};

export default HomeView;
