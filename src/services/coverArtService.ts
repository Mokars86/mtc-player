
// Service to fetch high-quality album art from iTunes Search API

export const fetchCoverArt = async (artist: string, title: string, album?: string): Promise<string | null> => {
    try {
        // Construct query: prioritize artist + album, fallback to artist + title
        const term = album ? `${artist} ${album}` : `${artist} ${title}`;
        const encodedTerm = encodeURIComponent(term);

        // iTunes Search API: entity=song or album, limit=1
        const url = `https://itunes.apple.com/search?term=${encodedTerm}&media=music&entity=song&limit=1`;

        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();

        if (data.resultCount > 0) {
            // Get 100x100 url and modify to get higher res (600x600)
            const result = data.results[0];
            const artworkUrl100 = result.artworkUrl100;

            if (artworkUrl100) {
                return artworkUrl100.replace('100x100bb', '600x600bb');
            }
        }
        return null;
    } catch (error) {
        console.error("Error fetching cover art:", error);
        return null;
    }
};
