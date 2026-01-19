import React from 'react';

export const DefaultDisc = () => {
    return (
        <div className="w-full h-full relative overflow-hidden rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-[#101010] border-[6px] border-[#181818]">
            {/* Outer Ring / Platter Edge with Strobe Dots */}
            <div className="absolute inset-0 rounded-full border-2 border-white/5 opacity-50"></div>
            <div className="absolute inset-2 rounded-full border border-white/10 opacity-30 box-border"
                style={{
                    background: 'repeating-conic-gradient(from 0deg, transparent 0deg, transparent 2deg, rgba(255,255,255,0.1) 2.1deg, rgba(255,255,255,0.1) 4deg)'
                }}
            ></div>

            {/* Main Platter Surface - Brushed Metal Effect */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#2a2a2a] via-[#111] to-[#050505] shadow-inner">
                {/* Radial Shine */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-40"></div>
            </div>

            {/* Inner Control Ring (Theme Colored) */}
            <div className="absolute inset-[25%] rounded-full border-[3px] border-brand-accent/30 bg-black/80 flex items-center justify-center shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
                {/* Waveform Visualization (Simulated) */}
                <div className="absolute inset-1 rounded-full opacity-60 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent_0,transparent_2px,var(--brand-accent)_3px,transparent_4px)] opacity-50 animate-pulse-slow"></div>
                </div>

                {/* Center Info Hub */}
                <div className="z-10 flex flex-col items-center justify-center text-center">
                    <div className="w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_10px_var(--brand-accent)] mb-1"></div>
                    <span className="text-[0.6rem] font-bold text-gray-400 font-mono tracking-widest">VIRTUAL</span>
                    <span className="text-xs font-black text-white tracking-wider italic">DECK</span>
                </div>
            </div>

            {/* Position Marker / Needle (Virtual DJ Style) */}
            <div className="absolute inset-0 pointer-events-none animate-spin-slow">
                {/* The main white line indicator */}
                <div className="absolute top-0 left-1/2 w-[2px] h-[50%] bg-gradient-to-b from-white via-white to-transparent -translate-x-1/2 opacity-90 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>

                {/* Red cue point marker on the rim */}
                <div className="absolute top-[8%] left-1/2 w-3 h-3 bg-red-600 rounded-full -translate-x-1/2 shadow-md border border-red-900"></div>
            </div>
        </div>
    );
};
