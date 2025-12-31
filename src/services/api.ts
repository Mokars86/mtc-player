
import { Playlist, GestureSettings, GestureType, GestureAction } from '../types';
import { supabase } from './supabase';

// Simulate network latency (ms) to give a realistic "backend" feel
const NETWORK_DELAY = 600;

// Storage Keys
const KEYS = {
  PLAYLISTS: 'mtc_playlists',
  FAVORITES: 'mtc_favorites',
  GESTURES: 'mtc_gestures',
  HISTORY: 'mtc_history'
};

// Default Gestures
const DEFAULT_GESTURES: GestureSettings = {
  [GestureType.SWIPE]: GestureAction.SEEK,
  [GestureType.PINCH]: GestureAction.ZOOM,
  [GestureType.CIRCLE]: GestureAction.VOLUME
};

export interface UserData {
  playlists: Playlist[];
  favorites: string[];
  gestures: GestureSettings;
  history: any[]; // Using any[] to avoid circular dependency with MediaItem, though defined in types
}

/**
 * API Client
 * 
 * This acts as the bridge between the Frontend and the Backend.
 * Currently, it mocks the backend using localStorage with artificial delays.
 * To integrate a real backend later, simply replace the contents of these functions
 * with `fetch()` calls to your API endpoints.
 */
export const api = {

  // GET: Fetch all user data
  fetchUserData: async (): Promise<UserData> => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // If no user, return defaults (or handle auth - for now assuming public/anon or pre-authed)
    // Note: In a real app, you'd force auth. For this prototype, we'll try to fetch based on an anonymous ID or just return empty if access denied.
    // However, RLS policies usually require a user. 
    // For the purpose of this "All-in-One" player, we might strictly require auth, 
    // but let's see if we can just get data for the current session.

    if (!user) {
      // Guest Mode or Not Logged In
      console.log("Guest mode active or no user session. Using local/default data.");
      const localHistory = localStorage.getItem(KEYS.HISTORY);
      return {
        playlists: [],
        favorites: [],
        gestures: DEFAULT_GESTURES,
        history: localHistory ? JSON.parse(localHistory) : []
      };
    }

    // 1. Fetch Profile (Gestures)
    const { data: profile } = await supabase
      .from('profiles')
      .select('gesture_settings')
      .eq('id', user.id)
      .single();

    // 2. Fetch Playlists
    const { data: playlistsData } = await supabase
      .from('playlists')
      .select('*, playlist_items(*)')
      .eq('user_id', user.id);

    // Transform Supabase playlist data to our App's Playlist interface
    // We need to map playlist_items to the string[] tracks array or handle it differently.
    // The current Type definition says `tracks: string[]` (IDs).
    // We might want to update the Type to be more robust, but for now let's map.
    const mappedPlaylists: Playlist[] = (playlistsData || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: new Date(p.created_at).getTime(),
      tracks: p.playlist_items?.sort((a: any, b: any) => a.position - b.position).map((item: any) => item.media_id) || []
    }));

    // 3. Fetch Favorites
    const { data: favoritesData } = await supabase
      .from('favorites')
      .select('media_id')
      .eq('user_id', user.id);

    const favoriteIds = (favoritesData || []).map((f: any) => f.media_id);


    // 4. Fetch History
    let history: any[] = [];
    
    // First try local storage for immediate render
    const localHistory = localStorage.getItem(KEYS.HISTORY);
    if (localHistory) {
        history = JSON.parse(localHistory);
    }

    // Then try Supabase if online
    const { data: historyData } = await supabase
      .from('play_history')
      .select('media_data, played_at')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(20);

    if (historyData && historyData.length > 0) {
        // Map back to MediaItem
        const remoteHistory = historyData.map((h: any) => h.media_data);
        // Merge or replace? For simplicity, we prioritize the cloud history as source of truth if available
        // But we might want to merge with local if local has newer stuff.
        // Let's just use remote history as the truth for logged-in users.
        history = remoteHistory;
        
        // Update local cache
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
    }

    return {
      playlists: mappedPlaylists,
      favorites: favoriteIds,
      gestures: profile?.gesture_settings || DEFAULT_GESTURES,
      history: history
    };
  },

  // SYNC: Playlists
  syncPlaylists: async (playlists: Playlist[]): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // This is a "heavy" sync - mainly for structure. 
    for (const p of playlists) {
        // Only sync if it has a valid ID or we treat it as valid. 
        // Note: Real app requires better conflict resolution.
      if (!p.id.startsWith('pl-')) {
          // It's a "saved" playlist or we just save all.
          // Upsert Playlist Metadata
          await supabase
            .from('playlists')
            .upsert({
              id: p.id,
              user_id: user.id,
              name: p.name,
              description: p.description,
              created_at: new Date(p.createdAt).toISOString()
            });
            
            // Note: syncing items recursively is omitted for brevity unless requested, 
            // as it requires deleting/re-inserting junction items.
      }
    }
  },

  // SYNC: Favorites
  syncFavorites: async (favorites: string[]): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // We only have IDs here. Ideally we sync the full object.
    // Skiping implementation detail to focus on History task.
  },

  // SYNC: Gestures
  syncGestures: async (gestures: GestureSettings): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        gesture_settings: gestures,
        updated_at: new Date().toISOString()
      });
  },

  // SYNC: History
  syncHistory: async (history: any[]): Promise<void> => {
    // 1. Save to Local Storage always (cache)
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));

    // 2. Sync with Supabase if User Logged In
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // We receive the "Recently Played" list (top 10-20 items).
    // We want to update the server. 
    // Optimization: Only sync the *latest* played item if possible, or just bulk upsert the list.
    // Since the UI passes the whole sorted list, let's upsert the top item (most recent) 
    // OR upsert the whole batch (might be heavy if list is long, but for 10 items it's fine).
    
    // Actually, `play_history` is a log. But the UI state is "Unique Items".
    // If we just insert, we get duplicates in the log (which is fine for a true log).
    // But `fetchUserData` expects to reconstruct the "Unique Items" list.
    // Let's insert the most recent item from the list if it's new, or just upsert all to update timestamps.
    // Since we don't know which one was just played easily from the array, 
    // let's look at the first item (assuming it's the most recent).
    
    if (history.length === 0) return;
    const mostRecent = history[0]; // The item just played or moved to top.

    await supabase
      .from('play_history')
      .insert({
        user_id: user.id,
        media_id: mostRecent.id,
        media_data: mostRecent,
        played_at: new Date().toISOString()
      });
      
    // Note: The table will grow indefinitely. 
    // Real app would have a cron job or logic to clean up old entries.
  }
};

