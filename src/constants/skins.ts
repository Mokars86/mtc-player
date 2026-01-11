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
    },
    {
        id: 'orange',
        name: 'Neon Orange',
        colors: {
            bgApp: '#1a1005', // Deep rich brown-black
            bgCard: '#2c1810', // Darker earthy tone
            bgSurface: '#431407', // Rich rust
            textMain: '#fff7ed', // Warm white
            textSub: '#fdba74', // Soft orange
            border: '#c2410c', // Dark orange border
            accent: '#f97316', // Vibrant Orange
            secondary: '#ea580c' // Deep Orange
        }
    },
    {
        id: 'forest',
        name: 'Mystic Forest',
        colors: {
            bgApp: '#022c22', // Deep green
            bgCard: '#064e3b',
            bgSurface: '#065f46',
            textMain: '#ecfdf5',
            textSub: '#6ee7b7',
            border: '#047857',
            accent: '#10b981', // Emerald
            secondary: '#34d399'
        }
    },
    {
        id: 'dracula',
        name: 'Midnight Vampire',
        colors: {
            bgApp: '#0f0c29', // Dark Purple-Blue
            bgCard: '#1b1b3a',
            bgSurface: '#24244d',
            textMain: '#e0e0f5',
            textSub: '#9ca3af',
            border: '#4c1d95',
            accent: '#d946ef', // Fuchsia
            secondary: '#8b5cf6' // Violet
        }
    },
    {
        id: 'gold',
        name: 'Luxury Gold',
        colors: {
            bgApp: '#000000', // Pure Black
            bgCard: '#111111',
            bgSurface: '#1c1917',
            textMain: '#fafaf9',
            textSub: '#a8a29e',
            border: '#ca8a04', // Gold border
            accent: '#eab308', // Gold
            secondary: '#facc15' // Yellow Gold
        }
    }
];
