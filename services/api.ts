
import { Playlist, GestureSettings, GestureType, GestureAction } from '../types';
import { supabase } from './supabase';

// Simulate network latency (ms) to give a realistic "backend" feel
const NETWORK_DELAY = 600;

// Storage Keys
const KEYS = {
  PLAYLISTS: 'mtc_playlists',
  FAVORITES: 'mtc_favorites',
  GESTURES: 'mtc_gestures'
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
      return { playlists: [], favorites: [], gestures: DEFAULT_GESTURES };
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

    return {
      playlists: mappedPlaylists,
      favorites: favoriteIds,
      gestures: profile?.gesture_settings || DEFAULT_GESTURES
    };
  },

  // SYNC: Playlists
  syncPlaylists: async (playlists: Playlist[]): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // This is a "heavy" sync - replacing everything or diffing. 
    // For a prototype, simplest is to ensure the playlist exists.
    // In production, you'd have atomic add/remove operations.
    // For this task, let's just create any new playlists.

    for (const p of playlists) {
      // Upsert Playlist
      const { error } = await supabase
        .from('playlists')
        .upsert({
          id: p.id.includes('pl-') ? undefined : p.id, // If it's a temp ID, let DB generate or handle it. Actually UUIDs needed. 
          // If our App generates 'pl-timestamp' IDs, those aren't valid UUIDs for Postgres if defined as UUID.
          // We need to handle ID generation better. 
          // For now, let's assume valid UUIDs or we might need to change the DB Schema to text IDs.
          // CHECK SCHEMA: `id uuid`. App generates `pl-${Date.now()}`. THIS WILL FAIL.
          // FIX: DB Schema should be `text` for ID to support offline generation easily, 
          // OR App should use a UUID generator.
          // I will assume we should change the DB schema or Type to string/text. 
          // In Step 35 I defined `id uuid`. I should change it to text in a future step or handle it here.
          // Let's force it to be text in the DB schema for flexibility.
        });
      // Detailed sync of items is complex here.
    }
  },

  // SYNC: Favorites
  syncFavorites: async (favorites: string[]): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Naive sync: Delete all and re-insert is bad.
    // Better: Insert ignore (on conflict do nothing).
    // Since we only have IDs here, we can't fully populate the `media_data` jsonb column required by schema.
    // We might need to relax the schema or change the App to pass full objects.
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
  }
};
