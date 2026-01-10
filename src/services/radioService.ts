
import { MediaItem, MediaType } from '../types';

export interface RadioStation {
    changeuuid: string;
    stationuuid: string;
    name: string;
    url: string;
    url_resolved: string;
    homepage: string;
    favicon: string;
    tags: string;
    country: string;
    votes: number;
}

// Reliable public servers list (Pre-defined fallbacks to avoid single point of failure)
const FALLBACK_SERVERS = [
    "https://de1.api.radio-browser.info",
    "https://fr1.api.radio-browser.info",
    "https://at1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info"
];

// Helper to find a working server
const resolveBaseUrl = async (): Promise<string> => {
    // 1. Try DNS discovery
    try {
        const response = await fetch('https://all.api.radio-browser.info/json/servers', { signal: AbortSignal.timeout(3000) });
        if (response.ok) {
            const servers: { name: string; ip: string }[] = await response.json();
            if (servers.length > 0) {
                const randomServer = servers[Math.floor(Math.random() * servers.length)];
                return `https://${randomServer.name}/json/stations`;
            }
        }
    } catch (e) {
        console.warn("Radio DNS discovery failed, trying fallbacks...", e);
    }

    // 2. Try Fallbacks one by one
    for (const base of FALLBACK_SERVERS) {
        try {
            const testUrl = `${base}/json/stations/topvote/1`; // Lightweight test
            const res = await fetch(testUrl, { signal: AbortSignal.timeout(2000) });
            if (res.ok) {
                console.log(`Connected to radio server: ${base}`);
                return `${base}/json/stations`;
            }
        } catch (e) {
            console.warn(`Fallback server ${base} failed.`);
        }
    }

    // 3. Ultimate Fallback
    return 'https://de1.api.radio-browser.info/json/stations';
};

// Cache the base URL promise
let baseUrlPromise: Promise<string> | null = null;

const getBaseUrl = () => {
    if (!baseUrlPromise) {
        baseUrlPromise = resolveBaseUrl();
    }
    return baseUrlPromise;
};

export const searchStations = async (query: string, tag?: string): Promise<MediaItem[]> => {
    const baseUrl = await getBaseUrl();
    let url = `${baseUrl}/search?limit=25&hidebroken=true&order=clickcount&reverse=true`;

    if (query) {
        url += `&name=${encodeURIComponent(query)}`;
    }
    if (tag) {
        url += `&tag=${encodeURIComponent(tag)}`;
    } else if (!query) {
        // Default to top voted if no query
        url = `${baseUrl}/topvote/25`;
    }

    try {
        const response = await fetch(url);
        const data: RadioStation[] = await response.json();

        return data.map(station => ({
            id: station.stationuuid,
            title: station.name,
            artist: station.country || 'Unknown Location',
            album: 'Internet Radio',
            coverUrl: station.favicon || 'https://cdn-icons-png.flaticon.com/512/3075/3075848.png',
            mediaUrl: station.url_resolved || station.url,
            type: MediaType.RADIO,
            duration: 0,
            tags: station.tags.split(',').map(s => s.trim()).filter(Boolean)
        }));
    } catch (e) {
        console.error("Radio fetch failed", e);
        return [];
    }
};

export const getTopTags = async (): Promise<string[]> => {
    // Hardcoded for speed/reliability, or could fetch from API
    return ['Pop', 'Rock', 'Jazz', 'Classical', 'Hip Hop', 'News', 'Dance', 'Country', 'Electronic', 'Folk'];
};
