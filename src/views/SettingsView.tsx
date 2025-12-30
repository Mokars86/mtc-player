import React from 'react';
import { Icons } from '../Icon';
import { GestureType, GestureAction, GestureSettings, Theme } from '../../types';

interface SettingsViewProps {
    theme: Theme;
    toggleTheme: () => void;
    gestureSettings: GestureSettings;
    updateGesture: (type: GestureType, action: GestureAction) => void;
}

export const SettingsView = ({ theme, toggleTheme, gestureSettings, updateGesture }: SettingsViewProps) => {
    return (
        <div className="p-6 animate-slide-up pb-24">
            <h1 className="text-3xl font-bold mb-6 text-app-text">Settings</h1>
            <div className="space-y-6">
                <section className="glass-panel p-4 rounded-xl space-y-4">
                    <h2 className="text-sm text-app-subtext uppercase font-bold tracking-wider mb-2">General</h2>
                    <div className="flex justify-between items-center cursor-pointer hover:bg-app-surface/50 p-2 rounded-lg transition-colors" onClick={toggleTheme}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-brand-dark/20 text-brand-light">{theme === 'dark' ? <Icons.Moon className="w-4 h-4" /> : <Icons.Sun className="w-4 h-4" />}</div>
                            <span className="text-app-text">Appearance</span>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} transition-colors`}><span className="text-xs font-bold text-app-text uppercase">{theme}</span></div>
                    </div>
                </section>

                <section className="glass-panel p-4 rounded-xl space-y-4">
                    <h2 className="text-sm text-app-subtext uppercase font-bold tracking-wider mb-2">Gesture Controls</h2>
                    {[{ type: GestureType.SWIPE, label: "Swipe Horizontal", icon: <Icons.SkipForward className="w-4 h-4" /> }, { type: GestureType.PINCH, label: "Pinch Scale", icon: <Icons.Maximize2 className="w-4 h-4" /> }, { type: GestureType.CIRCLE, label: "Circular Motion", icon: <Icons.Volume2 className="w-4 h-4" /> }].map((gesture) => (
                        <div key={gesture.type} className="flex justify-between items-center p-2">
                            <div className="flex items-center gap-3 text-app-text">
                                <div className="p-2 rounded-full bg-brand-accent/10 text-brand-accent">{gesture.icon}</div>
                                <span>{gesture.label}</span>
                            </div>
                            <select value={gestureSettings[gesture.type as GestureType]} onChange={(e) => updateGesture(gesture.type as GestureType, e.target.value as GestureAction)} className="bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm text-app-text focus:ring-1 focus:ring-brand-accent outline-none">
                                <option value={GestureAction.SEEK}>Seek</option>
                                <option value={GestureAction.VOLUME}>Volume</option>
                                <option value={GestureAction.ZOOM}>Zoom</option>
                                <option value={GestureAction.NONE}>None</option>
                            </select>
                        </div>
                    ))}
                </section>

                <section className="glass-panel p-4 rounded-xl space-y-4">
                    <h2 className="text-sm text-app-subtext uppercase font-bold tracking-wider mb-2">Audio</h2>
                    <div className="flex justify-between items-center p-2"><span className="text-app-text">High Quality Streaming</span><div className="w-10 h-6 bg-brand-accent rounded-full relative cursor-pointer shadow-inner"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow"></div></div></div>
                    <div className="flex justify-between items-center p-2"><span className="text-app-text">Smart Crossfade (AI)</span><div className="w-10 h-6 bg-app-card rounded-full relative cursor-pointer border border-app-border"><div className="absolute left-1 top-1 w-4 h-4 bg-app-subtext rounded-full shadow"></div></div></div>
                </section>
            </div>
        </div>
    );
};
