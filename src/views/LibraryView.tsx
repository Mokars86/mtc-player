import React, { Dispatch, SetStateAction } from 'react';
import { Icons } from '../components/Icon';
import { MediaType, MediaItem, Playlist, AppView } from '../types';

// Props Interface
interface LibraryViewProps {
    libraryTab: 'ALL' | 'AUDIO' | 'FAVORITES' | 'PLAYLISTS' | 'ALBUMS' | 'ARTISTS' | 'LOCAL' | 'HISTORY';
    setLibraryTab: Dispatch<SetStateAction<'ALL' | 'AUDIO' | 'FAVORITES' | 'PLAYLISTS' | 'ALBUMS' | 'ARTISTS' | 'LOCAL' | 'HISTORY'>>;
    playlists: Playlist[];
    openCreatePlaylistModal: () => void;
    deletePlaylist: (id: string, e: React.MouseEvent) => void;
    favorites: Set<string>;
    toggleFavorite: (id: string, e?: React.MouseEvent) => void;
    allMedia: MediaItem[];
    filteredMedia: MediaItem[];
    albums: Map<string, MediaItem[]>;
    artists: Map<string, MediaItem[]>;
    selectedCollection: { type: 'PLAYLIST' | 'ALBUM' | 'ARTIST', id: string, title: string } | null;
    setSelectedCollection: Dispatch<SetStateAction<{ type: 'PLAYLIST' | 'ALBUM' | 'ARTIST', id: string, title: string } | null>>;
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    playTrack: (track: MediaItem) => void;
    currentTrack: MediaItem | null;
    isPlaying: boolean;
    clearLocalLibrary: () => void;
    triggerFileUpload: () => void;
    removeFromLibrary: (id: string, e?: React.MouseEvent) => void;
    setTrackToAction: Dispatch<SetStateAction<MediaItem | null>>;
    localLibrary: MediaItem[];
    isOnline: boolean;
    setShuffleOn: Dispatch<SetStateAction<boolean>>;
    removeFromPlaylist: (playlistId: string, trackId: string, e?: React.MouseEvent) => void;
    addToPlaylist: (playlistId: string, trackId: string) => void;
    scanFolder: () => void;
    onEditMetadata?: (track: MediaItem) => void;
}

export const LibraryView = ({
    libraryTab, setLibraryTab, playlists, openCreatePlaylistModal, deletePlaylist, favorites, toggleFavorite,
    allMedia, filteredMedia, albums, artists, selectedCollection, setSelectedCollection, searchQuery, setSearchQuery,
    playTrack, currentTrack, isPlaying, clearLocalLibrary, triggerFileUpload, removeFromLibrary, setTrackToAction,
    localLibrary, isOnline, setShuffleOn, removeFromPlaylist, addToPlaylist, scanFolder, onEditMetadata
}: LibraryViewProps) => {

    return (
        <div className="p-4 md:p-6 animate-slide-up min-h-full overflow-x-hidden w-full max-w-5xl mx-auto">
            {/* Library Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    {selectedCollection ? (
                        <button onClick={() => setSelectedCollection(null)} className="p-1 hover:bg-app-surface rounded-full"><Icons.SkipBack className="w-6 h-6 rotate-180" /></button>
                    ) : null}
                    <h1 className="text-3xl font-bold text-app-text truncate max-w-[200px] sm:max-w-none">{selectedCollection ? selectedCollection.title : 'Library'}</h1>
                </div>
                <div className="flex gap-2">
                    {libraryTab === 'LOCAL' && localLibrary.length > 0 && !selectedCollection && (
                        <button onClick={clearLocalLibrary} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg transition-colors border border-red-500/20">
                            <Icons.Trash2 className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm font-bold">Clear All</span>
                        </button>
                    )}
                    {!selectedCollection && (
                        <div className="flex gap-2">
                            <button onClick={scanFolder} className="flex items-center gap-2 bg-app-card hover:bg-app-surface border border-app-border text-app-text px-3 py-2 rounded-lg transition-colors shadow-sm" title="Scan Folder">
                                <Icons.FolderPlus className="w-5 h-5" /><span className="hidden sm:inline">Scan</span>
                            </button>
                            <button onClick={triggerFileUpload} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-3 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg" title="Import Files">
                                <Icons.PlusCircle className="w-5 h-5" /><span className="hidden sm:inline">Add</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {!selectedCollection && (
                <>
                    <div className="relative mb-6">
                        <Icons.Search className="absolute left-4 top-3.5 w-5 h-5 text-app-subtext" />
                        <input type="text" placeholder="Search tracks, artists, moods..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-app-surface border border-app-border rounded-xl py-3 pl-12 pr-4 text-app-text placeholder-app-subtext focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all shadow-sm" />
                    </div>

                    <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
                        {(['ALL', 'AUDIO', 'FAVORITES', 'PLAYLISTS', 'ALBUMS', 'ARTISTS', 'LOCAL', 'HISTORY'] as const).map(tab => (
                            <button key={tab} onClick={() => setLibraryTab(tab)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${libraryTab === tab ? 'bg-brand-accent text-white shadow-md transform scale-105' : 'bg-app-surface text-app-subtext hover:bg-app-card hover:text-app-text border border-app-border'}`}>
                                {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* PLAYLISTS TAB VIEW */}
            {!selectedCollection && libraryTab === 'PLAYLISTS' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
                    <button onClick={openCreatePlaylistModal} className="aspect-square bg-app-surface border-2 border-dashed border-app-border rounded-xl flex flex-col items-center justify-center text-app-subtext hover:text-brand-accent hover:border-brand-accent transition-colors group">
                        <Icons.FolderPlus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm">Create New</span>
                    </button>
                    {playlists.map(playlist => {
                        const covers = playlist.tracks.slice(0, 4).map(tid => allMedia.find(m => m.id === tid)?.coverUrl).filter(Boolean);
                        return (
                            <div key={playlist.id} onClick={() => setSelectedCollection({ type: 'PLAYLIST', id: playlist.id, title: playlist.name })} className="group relative aspect-square bg-app-card rounded-xl overflow-hidden cursor-pointer shadow-md border border-app-border hover:shadow-xl transition-all">
                                {covers.length > 0 ? (
                                    <div className="w-full h-full grid grid-cols-2">
                                        {covers.length === 1 ? (
                                            <img src={covers[0]} className="col-span-2 row-span-2 w-full h-full object-cover" />
                                        ) : (
                                            [0, 1, 2, 3].map(i => (
                                                <div key={i} className="w-full h-full relative">
                                                    {covers[i] ? <img src={covers[i]} className="w-full h-full object-cover" /> : <div className="bg-app-bg w-full h-full"></div>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-brand-dark/20 text-brand-light"><Icons.ListMusic className="w-10 h-10 opacity-50" /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                                    <h3 className="font-bold text-white truncate text-sm">{playlist.name}</h3>
                                    <p className="text-xs text-gray-300">{playlist.tracks.length} tracks</p>
                                </div>
                                <button onClick={(e) => deletePlaylist(playlist.id, e)} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icons.Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ALBUMS TAB VIEW */}
            {!selectedCollection && libraryTab === 'ALBUMS' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4">
                    {Array.from(albums.entries()).map(([albumName, tracks]) => (
                        <div key={albumName} onClick={() => setSelectedCollection({ type: 'ALBUM', id: albumName, title: albumName })} className="group cursor-pointer">
                            <div className="aspect-square bg-app-card rounded-xl overflow-hidden mb-2 shadow-sm relative border border-app-border">
                                <img src={tracks[0].coverUrl} alt={albumName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                            </div>
                            <h3 className="font-bold text-sm text-app-text truncate">{albumName}</h3>
                            <p className="text-xs text-app-subtext truncate">{tracks[0].artist}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ARTISTS TAB VIEW */}
            {!selectedCollection && libraryTab === 'ARTISTS' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4">
                    {Array.from(artists.entries()).map(([artistName, tracks]) => (
                        <div key={artistName} onClick={() => setSelectedCollection({ type: 'ARTIST', id: artistName, title: artistName })} className="group cursor-pointer flex flex-col items-center text-center p-4 bg-app-surface border border-app-border rounded-xl hover:bg-app-card transition-colors shadow-sm hover:shadow-md">
                            <div className="w-24 h-24 rounded-full overflow-hidden mb-3 shadow-md border-2 border-app-border group-hover:border-brand-accent transition-colors">
                                <img src={tracks[0].coverUrl} alt={artistName} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="font-bold text-sm text-app-text truncate w-full">{artistName}</h3>
                            <p className="text-xs text-app-subtext">{tracks.length} tracks</p>
                        </div>
                    ))}
                </div>
            )}

            {/* LIST OF TRACKS (Filtered / Details) */}
            {((!selectedCollection && !['PLAYLISTS', 'ALBUMS', 'ARTISTS'].includes(libraryTab)) || selectedCollection) && (
                <div className="space-y-1">
                    {filteredMedia.length > 0 ? (
                        <div className="grid gap-3">
                            {selectedCollection && (
                                <div className="flex justify-center gap-4 mb-6">
                                    <button onClick={() => { playTrack(filteredMedia[0]); }} className="flex items-center gap-2 bg-brand-accent text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-brand-light transition transform hover:scale-105 active:scale-95">
                                        <Icons.Play className="w-5 h-5 fill-current" /> Play All
                                    </button>
                                    <button onClick={() => setShuffleOn(true)} className="flex items-center gap-2 bg-app-surface text-app-text border border-app-border px-8 py-3 rounded-full font-bold hover:bg-app-card transition shadow-sm hover:shadow active:scale-95">
                                        <Icons.Shuffle className="w-5 h-5" /> Shuffle
                                    </button>
                                </div>
                            )}
                            {filteredMedia.map(media => (
                                <div key={`${media.id}-${selectedCollection?.id || 'list'}`} onClick={() => playTrack(media)} className={`group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border border-transparent ${currentTrack?.id === media.id ? 'bg-brand-accent/10 border-brand-accent/20' : 'bg-app-surface hover:bg-app-card hover:shadow-md border-app-border'} ${!isOnline && !media.id.startsWith('local-') && !media.mediaUrl.startsWith('blob:') ? 'opacity-50 grayscale' : ''}`}>
                                    <div className="relative w-12 h-12 flex-shrink-0">
                                        <div className="relative w-full h-full">
                                            {media.id.startsWith('local') ? (
                                                <div className="w-full h-full rounded-lg bg-brand-dark/30 flex items-center justify-center text-brand-light"><Icons.Music className="w-6 h-6" /></div>
                                            ) : (<img src={media.coverUrl} className="w-full h-full rounded-lg object-cover shadow-sm" alt={media.title} />)}
                                        </div>
                                        {currentTrack?.id === media.id && isPlaying && (
                                            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center z-20"><Icons.Activity className="w-5 h-5 text-brand-accent animate-pulse" /></div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-sm md:text-base truncate ${currentTrack?.id === media.id ? 'text-brand-accent' : 'text-app-text'}`}>{media.title}</h3>
                                        <p className="text-xs md:text-sm text-app-subtext truncate flex items-center gap-2">
                                            {media.artist}

                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button onClick={(e) => toggleFavorite(media.id, e)} className="p-2 rounded-full hover:bg-app-bg transition-colors">
                                            <Icons.Heart className={`w-5 h-5 transition-transform active:scale-90 ${favorites.has(media.id) ? 'fill-brand-accent text-brand-accent' : 'text-app-subtext group-hover:text-app-text'}`} />
                                        </button>
                                        {selectedCollection?.type === 'PLAYLIST' ? (
                                            <button onClick={(e) => removeFromPlaylist(selectedCollection.id, media.id, e)} className="p-2 rounded-full hover:bg-red-500/10 text-app-subtext hover:text-red-500 transition-colors" title="Remove from Playlist">
                                                <Icons.X className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button onClick={(e) => { e.stopPropagation(); setTrackToAction(media); }} className="p-2 rounded-full hover:bg-app-bg text-app-subtext hover:text-brand-accent transition-colors" title="Add to Playlist">
                                                <Icons.ListPlus className="w-5 h-5" />
                                            </button>
                                        )}
                                        {media.id.startsWith('local') && !selectedCollection && (
                                            <>
                                                {onEditMetadata && (
                                                    <button onClick={(e) => { e.stopPropagation(); onEditMetadata(media); }} className="p-2 rounded-full hover:bg-app-bg text-app-subtext hover:text-brand-accent transition-colors" title="Edit Metadata">
                                                        <Icons.Edit className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button onClick={(e) => removeFromLibrary(media.id, e)} className="p-2 rounded-full hover:bg-red-500/10 text-app-subtext hover:text-red-500 transition-colors" title="Delete File">
                                                    <Icons.Trash2 className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-app-subtext">
                            <Icons.Music className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No tracks found.</p>
                            {libraryTab === 'FAVORITES' && <p className="text-sm mt-2">Tap the heart icon on any song to add it here.</p>}
                            {libraryTab === 'LOCAL' && <p className="text-sm mt-2">Tap "Import" to add files from your device.</p>}
                            {selectedCollection?.type === 'PLAYLIST' && <p className="text-sm mt-2">This playlist is empty. Add songs from your library.</p>}
                            {libraryTab === 'AUDIO' && <p className="text-sm mt-2">Add some music to your library.</p>}

                            {libraryTab === 'HISTORY' && <p className="text-sm mt-2">Play some tracks to see them here.</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
