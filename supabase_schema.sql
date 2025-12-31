-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Stores user settings & preferences)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  username text,
  avatar_url text,
  gesture_settings jsonb default '{"SWIPE": "SEEK", "PINCH": "ZOOM", "CIRCLE": "VOLUME"}'::jsonb,
  theme_preference text default 'dark',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- PLAYLISTS
create table playlists (
  id text primary key, -- Changed to text to support client-generated IDs (e.g. 'pl-123')
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- PLAYLIST_ITEMS (Junction table for tracks in playlists)
create table playlist_items (
  id uuid default uuid_generate_v4() primary key,
  playlist_id text references playlists(id) on delete cascade not null,
  media_id text not null, -- External ID or Local ID if we support cloud storage later
  title text not null,
  artist text,
  album text,
  cover_url text,
  media_url text not null,
  media_type text not null, -- 'MUSIC', 'VIDEO', etc.
  duration integer,
  added_at timestamp with time zone default timezone('utc'::text, now()),
  position integer not null default 0
);

-- FAVORITES
create table favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  media_id text not null,
  media_data jsonb not null, -- Store full metadata snapshot
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, media_id)
);

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table playlists enable row level security;
alter table playlist_items enable row level security;
alter table favorites enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

create policy "Users can view own playlists." on playlists for select using ( auth.uid() = user_id );
create policy "Users can insert own playlists." on playlists for insert with check ( auth.uid() = user_id );
create policy "Users can update own playlists." on playlists for update using ( auth.uid() = user_id );
create policy "Users can delete own playlists." on playlists for delete using ( auth.uid() = user_id );

create policy "Users can view own playlist items." on playlist_items for select using ( exists ( select 1 from playlists where id = playlist_items.playlist_id and user_id = auth.uid() ) );
create policy "Users can insert own playlist items." on playlist_items for insert with check ( exists ( select 1 from playlists where id = playlist_items.playlist_id and user_id = auth.uid() ) );
create policy "Users can delete own playlist items." on playlist_items for delete using ( exists ( select 1 from playlists where id = playlist_items.playlist_id and user_id = auth.uid() ) );

create policy "Users can view own favorites." on favorites for select using ( auth.uid() = user_id );
create policy "Users can insert own favorites." on favorites for insert with check ( auth.uid() = user_id );
create policy "Users can delete own favorites." on favorites for delete using ( auth.uid() = user_id );

-- PLAY HISTORY
create table play_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  media_id text not null,
  media_data jsonb not null, -- Store full metadata to reconstruct item
  played_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for History
alter table play_history enable row level security;

create policy "Users can view own history." on play_history for select using ( auth.uid() = user_id );
create policy "Users can insert own history." on play_history for insert with check ( auth.uid() = user_id );
create policy "Users can update own history." on play_history for update using ( auth.uid() = user_id );

