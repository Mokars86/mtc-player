import React from 'react';
import { Icons } from '../components/Icon';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-app-bg flex flex-col items-center justify-center animate-fade-in overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Logo Container */}
            <div className="relative w-32 h-32 mb-8 group perspective-1000">
                <div className="absolute inset-0 bg-brand-accent/20 rounded-3xl blur-xl animate-pulse"></div>

                <div className="relative w-full h-full bg-gradient-to-br from-brand-dark to-black rounded-3xl shadow-2xl flex items-center justify-center border border-white/10 overflow-hidden">
                    {/* Abstract geometric shapes */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-light/20 rounded-full blur-md"></div>
                    <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-brand-accent/20 rounded-full blur-md"></div>

                    {/* Center Icon */}
                    <div className="relative z-10 flex flex-col items-center">
                        <Icons.Disc className="w-14 h-14 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-[spin_8s_linear_infinite]" />
                    </div>

                    {/* Waveform at bottom */}
                    <div className="absolute bottom-3 flex gap-1 items-end h-8 opacity-60">
                        {[10, 20, 15, 25, 12].map((h, i) => (
                            <div key={i} className="w-1.5 bg-brand-light/80 rounded-t-full animate-bounce" style={{ height: `${h}px`, animationDuration: `${0.6 + i * 0.1}s`, animationDelay: `${i * 0.1}s` }}></div>
                        ))}
                    </div>
                </div>

                {/* Floating 'Play' badge */}
                <div className="absolute -right-3 -bottom-3 bg-app-surface border border-app-border p-2 rounded-xl shadow-lg">
                    <Icons.Play className="w-5 h-5 text-brand-accent fill-brand-accent" />
                </div>
            </div>

            <div className="text-center z-10">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-light tracking-tighter mb-2 drop-shadow-sm">MTc</h1>
                <p className="text-brand-accent text-xs tracking-[0.4em] uppercase font-bold">Sonic Intelligence</p>
            </div>

            <div className="absolute bottom-12 w-64 h-1 bg-app-card rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent animate-[slideUp_2s_ease-in-out_infinite] w-full origin-left scale-x-0" style={{ animationName: 'progress' }}></div>
            </div>

            <style>{`
        @keyframes progress {
            0% { transform: scaleX(0); }
            100% { transform: scaleX(1); }
        }
      `}</style>
        </div>
    );
};
