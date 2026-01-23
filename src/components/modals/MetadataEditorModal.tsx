import React, { useState } from 'react';
import { MediaItem } from '../../types';
import { Icons } from '../Icon';
import { useToast } from '../Toast';
import { getGenAI } from '../../services/geminiService'; // Direct import or via service wrapper if available
import { fetchCoverArt } from '../../services/coverArtService';

interface MetadataEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    track: MediaItem;
    onSave: (id: string, updates: Partial<MediaItem>) => void;
}

export const MetadataEditorModal: React.FC<MetadataEditorModalProps> = ({ isOpen, onClose, track, onSave }) => {
    const [title, setTitle] = useState(track.title);
    const [artist, setArtist] = useState(track.artist);
    const [album, setAlbum] = useState(track.album || '');
    const [coverUrl, setCoverUrl] = useState(track.coverUrl || '');
    const [genre, setGenre] = useState(''); // Not in MediaItem type currently but useful to add later
    const [isThinking, setIsThinking] = useState(false);
    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(track.id, { title, artist, album, coverUrl });
        onClose();
    };

    const handleFetchCover = async () => {
        if (!artist || !title) {
            showToast("Please enter Artist and Title first", "error");
            return;
        }
        setIsThinking(true);
        try {
            const url = await fetchCoverArt(artist, title, album);
            if (url) {
                setCoverUrl(url);
                showToast("Cover art found!", "success");
            } else {
                showToast("No cover found online", "error");
            }
        } catch (e) {
            showToast("Search failed", "error");
        } finally {
            setIsThinking(false);
        }
    };

    const handleAutoTag = async () => {
        const ai = getGenAI();
        if (!ai) {
            showToast("AI Key missing", "error");
            return;
        }
        setIsThinking(true);
        try {
            // Heuristic prompt based on filename if available or current metadata
            const prompt = `Based on the vague metadata: Title="${title}", Artist="${artist}", Album="${album}", suggest the correct Title, Artist, and Album. Return JSON { "title": "...", "artist": "...", "album": "..." }.`;

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const text = result.response.text();
            const json = JSON.parse(text);

            if (json.title) setTitle(json.title);
            if (json.artist) setArtist(json.artist);
            if (json.album) setAlbum(json.album);
            showToast("Metadata auto-filled!", "success");
        } catch (e) {
            showToast("Could not find better tags", "error");
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-app-card border border-app-border rounded-2xl shadow-2xl overflow-hidden animate-scale-up">

                {/* Header */}
                <div className="p-6 border-b border-app-border flex justify-between items-center bg-app-surface/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                            <Icons.Sliders className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-app-text">Edit Metadata</h2>
                            <p className="text-xs text-app-subtext">Refine your library details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-app-bg rounded-full transition-colors">
                        <Icons.X className="w-5 h-5 text-app-subtext" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={handleAutoTag}
                            disabled={isThinking}
                            className="text-xs font-bold text-brand-accent hover:text-brand-light flex items-center gap-1 transition-colors"
                        >
                            {isThinking ? <Icons.Loader className="w-3 h-3 animate-spin" /> : <Icons.Wand2 className="w-3 h-3" />}
                            Auto-Tag
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-app-subtext uppercase">Title</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-brand-accent outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-app-subtext uppercase">Artist</label>
                        <input
                            value={artist}
                            onChange={e => setArtist(e.target.value)}
                            className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-brand-accent outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-app-subtext uppercase">Album</label>
                        <input
                            value={album}
                            onChange={e => setAlbum(e.target.value)}
                            className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-brand-accent outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-app-subtext uppercase">Cover Art URL</label>
                        <div className="flex gap-2">
                            <input
                                value={coverUrl}
                                onChange={e => setCoverUrl(e.target.value)}
                                className="flex-1 bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-brand-accent outline-none"
                                placeholder="http://..."
                            />
                            <button
                                onClick={handleFetchCover}
                                disabled={isThinking}
                                className="px-4 bg-app-card border border-app-border rounded-xl hover:bg-app-surface transition-colors text-brand-accent"
                                title="Search Online"
                            >
                                <Icons.Search className="w-5 h-5" />
                            </button>
                        </div>
                        {coverUrl && (
                            <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-app-border">
                                <img src={coverUrl} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-app-border bg-app-surface/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-medium text-app-text hover:bg-app-surface transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 rounded-xl font-bold bg-brand-accent text-white hover:bg-brand-light shadow-lg shadow-brand-accent/20 transition-all hover:scale-105 active:scale-95"
                    >
                        Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
};
