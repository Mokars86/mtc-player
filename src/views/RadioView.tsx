
import React, { useState, useEffect } from 'react';
import { MediaItem } from '../types';
import { searchStations, getTopTags } from '../services/radioService';
import { Icons } from '../components/Icon';


interface RadioViewProps {
    onPlay: (track: MediaItem) => void;
    currentTrack?: MediaItem;
    isPlaying: boolean;
}

export const RadioView: React.FC<RadioViewProps> = ({ onPlay, currentTrack, isPlaying }) => {
    const [stations, setStations] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        getTopTags().then(setTags);
        loadStations(); // Initial Load
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 500);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        loadStations();
    }, [debouncedQuery, selectedTag]);

    const loadStations = async () => {
        setLoading(true);
        try {
            const results = await searchStations(debouncedQuery, selectedTag || undefined);
            setStations(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 pb-32 animate-fade-in h-full flex flex-col">
            <div className="flex flex-col gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 mb-1">
                        Worldwide Radio
                    </h1>
                    <p className="text-app-subtext">Tune in to thousands of live stations.</p>
                </div>

                {/* Search & Tags */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-app-subtext" />
                        <input
                            type="text"
                            placeholder="Search stations..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-app-card border border-app-border rounded-full pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>

                {/* Tags Scroller */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setSelectedTag(null)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${!selectedTag ? 'bg-orange-500 text-white' : 'bg-app-card border border-app-border hover:bg-app-card/80'}`}
                    >
                        All Styles
                    </button>
                    {tags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${selectedTag === tag ? 'bg-orange-500 text-white' : 'bg-app-card border border-app-border hover:bg-app-card/80'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stations Grid */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-20"><Icons.Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {stations.map(station => {
                            const active = currentTrack?.id === station.id;
                            const playing = active && isPlaying;
                            return (
                                <div
                                    key={station.id}
                                    onClick={() => onPlay(station)}
                                    className={`group relative bg-app-card border border-app-border hover:border-orange-500/50 rounded-xl p-3 flex items-center gap-4 cursor-pointer transition-all hover:shadow-lg ${active ? 'border-orange-500 bg-orange-500/10' : ''}`}
                                >
                                    <div className="w-16 h-16 rounded-lg bg-black/20 flex-shrink-0 overflow-hidden relative">
                                        <img src={station.coverUrl} className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3075/3075848.png')} />
                                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            {playing ? <Icons.Pause className="w-6 h-6 text-white" /> : <Icons.Play className="w-6 h-6 text-white" />}
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className={`font-bold truncate ${active ? 'text-orange-500' : 'text-app-text'}`}>{station.title}</h3>
                                        <p className="text-xs text-app-subtext truncate flex items-center gap-1">
                                            <Icons.Globe className="w-3 h-3" /> {station.artist}
                                        </p>
                                        <div className="flex gap-1 mt-1 overflow-hidden">
                                            {station.tags?.slice(0, 3).map(t => (
                                                <span key={t} className="text-[10px] bg-app-bg px-1.5 py-0.5 rounded text-app-subtext/80">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {active && (
                                        <div className="absolute right-3 top-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
                {!loading && stations.length === 0 && (
                    <div className="text-center py-20 text-app-subtext">No stations found. Try a different search.</div>
                )}
            </div>
        </div>
    );
};
