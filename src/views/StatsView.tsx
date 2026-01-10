
import React, { useMemo } from 'react';
import { MediaItem } from '../types';
import { Icons } from '../components/Icon';

interface StatsViewProps {
    allMedia: MediaItem[];
    onClose: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ allMedia, onClose }) => {

    const stats = useMemo(() => {
        const totalTracks = allMedia.length;
        const totalDuration = allMedia.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const totalPlays = allMedia.reduce((acc, curr) => acc + (curr.playCount || 0), 0);

        // Top Artists
        const artistMap = new Map<string, number>();
        allMedia.forEach(m => {
            const count = m.playCount || 0;
            if (count > 0) {
                artistMap.set(m.artist, (artistMap.get(m.artist) || 0) + count);
            }
        });
        const topArtists = Array.from(artistMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Top Tracks
        const topTracks = [...allMedia]
            .filter(m => (m.playCount || 0) > 0)
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
            .slice(0, 5);

        // Listening Distribution (by hour? Need robust history. For now: "Most Played Genre")
        // Note: we don't have genre in MediaItem yet in Types, but we can assume ID3 might fill it later 
        // or just skip for now.

        return { totalTracks, totalDuration, totalPlays, topArtists, topTracks };
    }, [allMedia]);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="p-6 md:p-12 max-w-5xl mx-auto animate-fade-in relative pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">My Year in Music</h1>
                    <p className="text-app-subtext">Your listening stats and habits</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-app-text/10 rounded-full transition-colors">
                    <Icons.X className="w-6 h-6 text-app-subtext" />
                </button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-app-card p-6 rounded-2xl border border-app-border shadow-lg">
                    <div className="flex items-center gap-3 mb-2 text-teal-400">
                        <Icons.Music className="w-5 h-5" />
                        <span className="font-bold uppercase text-xs tracking-wider">Total Plays</span>
                    </div>
                    <p className="text-4xl font-bold text-app-text">{stats.totalPlays}</p>
                </div>
                <div className="bg-app-card p-6 rounded-2xl border border-app-border shadow-lg">
                    <div className="flex items-center gap-3 mb-2 text-blue-400">
                        <Icons.Clock className="w-5 h-5" />
                        <span className="font-bold uppercase text-xs tracking-wider">Collect. Duration</span>
                    </div>
                    <p className="text-4xl font-bold text-app-text">{formatDuration(stats.totalDuration)}</p>
                </div>
                <div className="bg-app-card p-6 rounded-2xl border border-app-border shadow-lg">
                    <div className="flex items-center gap-3 mb-2 text-purple-400">
                        <Icons.Disc className="w-5 h-5" />
                        <span className="font-bold uppercase text-xs tracking-wider">Collection Size</span>
                    </div>
                    <p className="text-4xl font-bold text-app-text">{stats.totalTracks}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Top Tracks */}
                <div className="bg-app-card p-6 rounded-2xl border border-app-border">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Icons.TrendingUp className="w-5 h-5 text-brand-accent" /> Top Tracks</h2>
                    <div className="space-y-4">
                        {stats.topTracks.length > 0 ? stats.topTracks.map((track, i) => (
                            <div key={track.id} className="relative">
                                <div className="flex justify-between items-center z-10 relative mb-1">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-xl font-bold text-app-subtext w-6 text-center">{i + 1}</span>
                                        <img src={track.coverUrl} className="w-10 h-10 rounded object-cover" />
                                        <div className="truncate">
                                            <p className="font-bold text-app-text truncate">{track.title}</p>
                                            <p className="text-xs text-app-subtext truncate">{track.artist}</p>
                                        </div>
                                    </div>
                                    <span className="font-mono font-bold text-brand-accent">{track.playCount} plays</span>
                                </div>
                                {/* Bar */}
                                <div className="absolute bottom-0 left-0 h-1 bg-app-border w-full rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-teal-500 to-blue-500"
                                        style={{ width: `${(track.playCount! / (stats.topTracks[0].playCount || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-app-subtext text-center py-10">Start listening to see your stats!</p>
                        )}
                    </div>
                </div>

                {/* Top Artists */}
                <div className="bg-app-card p-6 rounded-2xl border border-app-border">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Icons.Mic className="w-5 h-5 text-purple-400" /> Top Artists</h2>
                    <div className="space-y-6">
                        {stats.topArtists.length > 0 ? stats.topArtists.map(([artist, count], i) => (
                            <div key={artist} className="group">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-app-text">{artist}</span>
                                    <span className="text-xs font-mono text-app-subtext">{count} plays</span>
                                </div>
                                <div className="h-4 bg-app-bg rounded-lg overflow-hidden border border-app-border/50">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 group-hover:brightness-110 transition-all"
                                        style={{ width: `${(count / (stats.topArtists[0][1] || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-app-subtext text-center py-10">No artist data yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
