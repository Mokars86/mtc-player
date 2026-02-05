import React from 'react';
import { Icons } from '../components/Icon';

export const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--brand-accent)_0%,_transparent_70%)] opacity-5 pointer-events-none animate-pulse-slow"></div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo Mark - Pulsing Disc */}
                <div className="relative mb-8">
                    {/* Outer Rings */}
                    <div className="absolute inset-[-20px] rounded-full border border-white/5 animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-[-10px] rounded-full border border-white/10 animate-[spin_15s_linear_infinite_reverse]"></div>

                    {/* Core Glow */}
                    <div className="absolute inset-0 bg-brand-accent/20 blur-xl rounded-full animate-pulse"></div>

                    {/* Icon */}
                    <Icons.Disc className="w-20 h-20 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" strokeWidth={1.5} />
                </div>

                {/* Brand Text */}
                <div className="text-center space-y-4">
                    <h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 drop-shadow-xl animate-fade-in-up">
                        MTC
                    </h1>

                    <div className="flex items-center justify-center gap-3 opacity-0 animate-[fadeIn_1s_ease-out_0.5s_forwards]">
                        <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-brand-accent"></div>
                        <p className="text-brand-accent text-xs font-bold tracking-[0.5em] uppercase text-shadow-glow">
                            Sonic Intelligence
                        </p>
                        <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-brand-accent"></div>
                    </div>
                </div>
            </div>

            {/* Laser Progress Line */}
            <div className="absolute bottom-0 w-full h-[2px] bg-gray-900 overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-transparent via-brand-accent to-transparent animate-[shimmer_2s_infinite] translate-x-[-100%]"></div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .text-shadow-glow {
                    text-shadow: 0 0 10px var(--brand-accent);
                }
            `}</style>
        </div>
    );
};
