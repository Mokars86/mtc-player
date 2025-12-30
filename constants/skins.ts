export interface Skin {
    id: string;
    name: string;
    colors: {
        bgApp: string;
        bgCard: string;
        bgSurface: string;
        textMain: string;
        textSub: string;
        border: string;
        accent: string;
        secondary: string;
    };
}

export const SKINS: Skin[] = [
    {
        id: 'cyberpunk',
        name: 'Cyberpunk (Default)',
        colors: {
            bgApp: '#050505',
            bgCard: '#121212',
            bgSurface: '#1a1a1a',
            textMain: '#ffffff',
            textSub: '#a1a1aa',
            border: '#27272a',
            accent: '#00f0ff',
            secondary: '#ff0055'
        }
    },
    {
        id: 'ocean',
        name: 'Ocean Depth',
        colors: {
            bgApp: '#0f172a',
            bgCard: '#1e293b',
            bgSurface: '#334155',
            textMain: '#f8fafc',
            textSub: '#94a3b8',
            border: '#475569',
            accent: '#38bdf8',
            secondary: '#818cf8'
        }
    },
    {
        id: 'sunset',
        name: 'Sunset Vibes',
        colors: {
            bgApp: '#2e1015',
            bgCard: '#4a1d24',
            bgSurface: '#6b2a34',
            textMain: '#fff1f2',
            textSub: '#fda4af',
            border: '#9f1239',
            accent: '#fb7185',
            secondary: '#f43f5e'
        }
    },
    {
        id: 'light',
        name: 'Clean Light',
        colors: {
            bgApp: '#ffffff',
            bgCard: '#f3f4f6',
            bgSurface: '#e5e7eb',
            textMain: '#111827',
            textSub: '#4b5563',
            border: '#d1d5db',
            accent: '#0d9488', // Teal
            secondary: '#db2777'
        }
    }
];
