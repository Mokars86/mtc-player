
const BASE_URL = 'https://api.lyrics.ovh/v1';

export const fetchLyrics = async (artist: string, title: string): Promise<string | null> => {
    try {
        const response = await fetch(`${BASE_URL}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.lyrics;
    } catch (e) {
        console.error("Lyrics fetch failed", e);
        return null;
    }
};
