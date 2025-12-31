import React from 'react';
import { Icons } from '../components/Icon';
import { GestureType, GestureAction, GestureSettings, Theme } from '../types';
import { SKINS } from '../constants/skins';

interface SettingsViewProps {
    theme: Theme;
    toggleTheme: (theme: Theme) => void;
    gestureSettings: GestureSettings;
    updateGesture: (type: GestureType, action: GestureAction) => void;
    isGuest: boolean;
    onLogout: () => void;
    onShowSupport: () => void;
}

export const SettingsView = ({ theme, toggleTheme, gestureSettings, updateGesture, isGuest, onLogout, onShowSupport }: SettingsViewProps) => {
    return (
        <div className="p-6 animate-slide-up pb-24">
            <h1 className="text-3xl font-bold mb-6 text-app-text">Settings</h1>
            <div className="space-y-6">

                {/* Account Section */}
                <section className="glass-panel p-4 rounded-xl space-y-4">
                    <h2 className="text-sm text-app-subtext uppercase font-bold tracking-wider mb-2">Account</h2>
                    <div className="flex flex-col md:flex-row justify-between md:items-center bg-app-surface/50 p-3 rounded-lg gap-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isGuest ? 'bg-orange-500/10 text-orange-500' : 'bg-brand-accent/10 text-brand-accent'}`}>
                                <Icons.User className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-app-text font-medium leading-tight">{isGuest ? 'Guest Account' : 'Logged In'}</span>
                                <span className="text-xs text-app-subtext leading-snug">{isGuest ? 'Limited features' : 'Full access'}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={onShowSupport}
                                className="flex-1 md:flex-none px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 whitespace-nowrap"
                            >
                                <Icons.Coffee className="w-4 h-4 flex-shrink-0" />
                                <span>Support</span>
                            </button>
                            <button
                                onClick={onLogout}
                                className="flex-1 md:flex-none px-4 py-2 bg-app-card hover:bg-app-border border border-app-border rounded-lg text-sm font-bold text-app-text transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Icons.LogOut className="w-4 h-4 flex-shrink-0" />
                                {isGuest ? 'Sign In' : 'Sign Out'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Skins / Appearance Section */}
                <section className="glass-panel p-4 rounded-xl space-y-4">
                    <h2 className="text-sm text-app-subtext uppercase font-bold tracking-wider mb-2">Appearance & Skins</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SKINS.map(skin => (
                            <button
                                key={skin.id}
                                onClick={() => toggleTheme(skin.id as Theme)}
                                className={`relative group p-3 rounded-xl border transition-all duration-300 ${theme === skin.id ? 'border-brand-accent bg-app-surface ring-2 ring-brand-accent/20' : 'border-app-border bg-app-card hover:border-app-subtext'}`}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="h-20 rounded-lg w-full shadow-inner flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: skin.colors.bgApp }}>
                                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full shadow-lg border border-white/10" style={{ backgroundColor: skin.colors.accent }}></div>
                                        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/5"></div>
                                        {/* Preview Elements */}
                                        <div className="w-full h-1/2 absolute bottom-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                        {theme === skin.id && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                                <Icons.Check className="w-8 h-8 text-white drop-shadow-md" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs font-bold truncate ${theme === skin.id ? 'text-brand-accent' : 'text-app-text'}`}>{skin.name}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Gesture Controls Section */}
                <section className="glass-panel p-4 rounded-xl space-y-4">
                    <h2 className="text-sm text-app-subtext uppercase font-bold tracking-wider mb-2">Gesture Controls</h2>
                    {[{ type: GestureType.SWIPE, label: "Swipe Horizontal", icon: <Icons.SkipForward className="w-4 h-4" /> },
                    { type: GestureType.PINCH, label: "Pinch Scale", icon: <Icons.Maximize2 className="w-4 h-4" /> },
                    { type: GestureType.CIRCLE, label: "Circular Motion", icon: <Icons.Volume2 className="w-4 h-4" /> }
                    ].map((gesture) => (
                        <div key={gesture.type} className="flex justify-between items-center p-2">
                            <div className="flex items-center gap-3 text-app-text">
                                <div className="p-2 rounded-full bg-brand-accent/10 text-brand-accent">{gesture.icon}</div>
                                <span>{gesture.label}</span>
                            </div>
                            <select
                                value={gestureSettings[gesture.type as GestureType]}
                                onChange={(e) => updateGesture(gesture.type as GestureType, e.target.value as GestureAction)}
                                className="bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm text-app-text focus:ring-1 focus:ring-brand-accent outline-none"
                            >
                                <option value={GestureAction.SEEK}>Seek</option>
                                <option value={GestureAction.VOLUME}>Volume</option>
                                <option value={GestureAction.ZOOM}>Zoom</option>
                                <option value={GestureAction.NONE}>None</option>
                            </select>
                        </div>
                    ))}
                </section>

                {/* Audio Section */}
                <section className="glass-panel p-4 rounded-xl space-y-4">
                    <h2 className="text-sm text-app-subtext uppercase font-bold tracking-wider mb-2">Audio</h2>
                    <div className="flex justify-between items-center p-2">
                        <span className="text-app-text">High Quality Streaming</span>
                        <div className="w-10 h-6 bg-brand-accent rounded-full relative cursor-pointer shadow-inner">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow"></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-2">
                        <span className="text-app-text">Smart Crossfade (AI)</span>
                        <div className="w-10 h-6 bg-app-card rounded-full relative cursor-pointer border border-app-border">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-app-subtext rounded-full shadow"></div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};
