
import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './Icon';

interface VisualizerOverlayProps {
    analyser: AnalyserNode;
    onClose: () => void;
}

type VisualizerMode = 'BARS' | 'WAVE' | 'CIRCULAR';

export const VisualizerOverlay: React.FC<VisualizerOverlayProps> = ({ analyser, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const [mode, setMode] = useState<VisualizerMode>('BARS');

    useEffect(() => {
        if (!canvasRef.current || !analyser) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const floatData = new Float32Array(bufferLength); // For Waveform

        const render = () => {
            animationRef.current = requestAnimationFrame(render);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Fade effect
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            if (mode === 'BARS') {
                analyser.getByteFrequencyData(dataArray);
                const barWidth = (w / bufferLength) * 2.5;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * h * 0.8;
                    
                    const hue = (i / bufferLength) * 360 + (Date.now() / 50);
                    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                    
                    ctx.fillRect(x, h - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            } else if (mode === 'WAVE') {
                analyser.getByteTimeDomainData(dataArray);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#0d9488'; // Brand Accent
                ctx.beginPath();

                const sliceWidth = w * 1.0 / bufferLength;
                let x = 0;

                for(let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * h / 2;

                    if(i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    x += sliceWidth;
                }
                ctx.lineTo(canvas.width, canvas.height/2);
                ctx.stroke();

            } else if (mode === 'CIRCULAR') {
                 analyser.getByteFrequencyData(dataArray);
                 const radius = Math.min(w, h) / 4;
                 
                 ctx.translate(cx, cy);
                 ctx.rotate(Date.now() / 2000); // Slow rotation

                 for (let i = 0; i < bufferLength; i++) {
                     const barHeight = (dataArray[i] / 255) * (h/3);
                     const hue = (i / bufferLength) * 360;
                     
                     ctx.rotate((2 * Math.PI) / bufferLength);
                     
                     ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
                     ctx.fillRect(0, radius, (2 * Math.PI * radius) / bufferLength, barHeight);
                 }
                 
                 ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

                 // Inner beat circle
                 const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
                 ctx.beginPath();
                 ctx.arc(cx, cy, radius * 0.8 + (average/5), 0, 2 * Math.PI);
                 ctx.fillStyle = `rgba(13, 148, 136, ${average/255})`;
                 ctx.fill();
            }
        };

        render();

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [analyser, mode]);

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            <canvas ref={canvasRef} className="block w-full h-full" />
            
            {/* Controls */}
            <div className="absolute top-6 right-6 flex gap-4">
                 <button onClick={() => setMode('BARS')} className={`px-4 py-2 rounded-full backdrop-blur-md border ${mode === 'BARS' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white/10 text-white/70 border-white/20'}`}>
                    Bars
                 </button>
                 <button onClick={() => setMode('WAVE')} className={`px-4 py-2 rounded-full backdrop-blur-md border ${mode === 'WAVE' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white/10 text-white/70 border-white/20'}`}>
                    Wave
                 </button>
                 <button onClick={() => setMode('CIRCULAR')} className={`px-4 py-2 rounded-full backdrop-blur-md border ${mode === 'CIRCULAR' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white/10 text-white/70 border-white/20'}`}>
                    Orb
                 </button>
                 <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors">
                    <Icons.Minimize2 className="w-6 h-6" />
                 </button>
            </div>
            
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
                <p className="text-white/50 text-sm tracking-[0.5em] uppercase animate-pulse">Visualizer Mode</p>
            </div>
        </div>
    );
};
