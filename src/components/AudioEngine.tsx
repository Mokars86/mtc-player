
import React, { useEffect, useRef } from 'react';
import { EqSettings, ReverbSettings } from '../types';


interface AudioEngineProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  color?: string;
  eqSettings: EqSettings;
  reverbSettings?: ReverbSettings;
  onAnalyserReady?: (analyser: AnalyserNode) => void;
}

// Global Singletons to ensure context consistency across re-renders
let globalCtx: AudioContext | null = null;
const sourceCache = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

const getGlobalContext = () => {
  if (!globalCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    globalCtx = new AudioContextClass();
    // Resume context if suspended (often needed after first interaction)
    if (globalCtx && globalCtx.state === 'suspended') {
      globalCtx.resume();
    }
  }
  return globalCtx;
};

// Helper: Create Impulse Response for Reverb
const createImpulseResponse = (ctx: AudioContext, duration: number, decay: number) => {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    // Exponential decay
    const n = i / length;
    const e = Math.pow(1 - n, decay);
    // Random white noise * decay
    left[i] = (Math.random() * 2 - 1) * e;
    right[i] = (Math.random() * 2 - 1) * e;
  }
  return impulse;
};

const AudioEngine: React.FC<AudioEngineProps> = ({
  audioElement,
  isPlaying,
  color = '#14b8a6',
  eqSettings,
  reverbSettings,
  onAnalyserReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  // Refs for nodes specific to this component instance
  const analyserRef = useRef<AnalyserNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);

  // Reverb Refs
  const convolverRef = useRef<ConvolverNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);

  // Initialize Audio Graph
  useEffect(() => {
    if (!audioElement) return;

    const ctx = getGlobalContext();

    // Create Analyser
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    if (onAnalyserReady) onAnalyserReady(analyser);

    // Create EQ Filters (60, 250, 1000, 4000, 16000 Hz)
    const freqs = [60, 250, 1000, 4000, 16000];
    const filters = freqs.map((f, i) => {
      const filter = ctx.createBiquadFilter();
      if (i === 0) filter.type = 'lowshelf';
      else if (i === freqs.length - 1) filter.type = 'highshelf';
      else filter.type = 'peaking';
      filter.frequency.value = f;
      return filter;
    });
    filtersRef.current = filters;

    // Create Reverb Nodes
    const convolver = ctx.createConvolver();
    // Default impulse
    convolver.buffer = createImpulseResponse(ctx, 2.0, 2.0);
    convolverRef.current = convolver;

    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    dryGain.gain.value = 1.0;
    wetGain.gain.value = 0.0;
    dryGainRef.current = dryGain;
    wetGainRef.current = wetGain;


    // Get or Create Source
    let source: MediaElementAudioSourceNode;
    if (sourceCache.has(audioElement)) {
      source = sourceCache.get(audioElement)!;
    } else {
      try {
        source = ctx.createMediaElementSource(audioElement);
        sourceCache.set(audioElement, source);
      } catch (e) {
        console.warn("Could not create MediaElementSource", e);
        return;
      }
    }

    // Connect Graph: 
    // Source -> Filters -> [Split] 
    //            |-> DryGain -> Analyser -> Dest
    //            |-> Convolver -> WetGain -> Analyser -> Dest
    try {
      source.disconnect();

      // 1. Source to EQ chain start
      source.connect(filters[0]);

      // 2. EQ Chain Internal connections
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      const eqOutput = filters[filters.length - 1];

      // 3. Connect EQ Output to Dry/Wet Split
      eqOutput.connect(dryGain);
      eqOutput.connect(convolver);

      // 4. Connect Reverb path
      convolver.connect(wetGain);

      // 5. Connect Gains to Analyser (Merger)
      dryGain.connect(analyser);
      wetGain.connect(analyser);

      // 6. Analyser to Speakers
      analyser.connect(ctx.destination);

    } catch (e) {
      console.error("Audio Graph Connection Error:", e);
    }

    // Apply initial EQ settings
    const gains = eqSettings.gains;
    filters[0].gain.value = gains[60];
    filters[1].gain.value = gains[250];
    filters[2].gain.value = gains[1000];
    filters[3].gain.value = gains[4000];
    filters[4].gain.value = gains[16000];

    // Cleanup on unmount
    return () => {
      try {
        source.disconnect();
        filters.forEach(f => f.disconnect());
        convolver.disconnect();
        dryGain.disconnect();
        wetGain.disconnect();
        analyser.disconnect();

        // Reconnect source directly to destination
        source.connect(ctx.destination);
      } catch (e) {
        // Ignore disconnect errors
      }
    };

  }, [audioElement]);

  // Update EQ Gains Dynamically
  useEffect(() => {
    if (filtersRef.current.length === 5) {
      const ctx = getGlobalContext();
      const gains = eqSettings.gains;
      const filterNodes = filtersRef.current;
      const now = ctx.currentTime;
      // Smooth transition
      filterNodes[0].gain.setTargetAtTime(gains[60], now, 0.1);
      filterNodes[1].gain.setTargetAtTime(gains[250], now, 0.1);
      filterNodes[2].gain.setTargetAtTime(gains[1000], now, 0.1);
      filterNodes[3].gain.setTargetAtTime(gains[4000], now, 0.1);
      filterNodes[4].gain.setTargetAtTime(gains[16000], now, 0.1);
    }
  }, [eqSettings]);

  // Update Reverb Settings Dynamically
  useEffect(() => {
    if (!dryGainRef.current || !wetGainRef.current || !convolverRef.current) return;
    const ctx = getGlobalContext();
    const now = ctx.currentTime;

    if (reverbSettings && reverbSettings.active) {
      // Check if decay changed, regenerate buffer (expensive, maybe debounce or just do it)
      // We can just regenerate, it's fast enough for small buffs usually
      // Optimization: only regenerate if decay actually changed significantly or buffer is null
      if (convolverRef.current.buffer && Math.abs(convolverRef.current.buffer.duration - reverbSettings.decay) > 0.1) {
        convolverRef.current.buffer = createImpulseResponse(ctx, reverbSettings.decay, reverbSettings.decay > 1 ? 4 : 2);
      } else if (!convolverRef.current.buffer) {
        convolverRef.current.buffer = createImpulseResponse(ctx, reverbSettings.decay, 3);
      }

      // Mix (Equal Power Crossfade is often better, but linear is fine for basic)
      // Wet = mix, Dry = 1 - mix
      dryGainRef.current.gain.setTargetAtTime(1 - reverbSettings.mix, now, 0.1);
      wetGainRef.current.gain.setTargetAtTime(reverbSettings.mix, now, 0.1);
    } else {
      // Reverb Off
      dryGainRef.current.gain.setTargetAtTime(1.0, now, 0.1);
      wetGainRef.current.gain.setTargetAtTime(0.0, now, 0.1);
    }

  }, [reverbSettings]);


  // Visualizer Loop
  useEffect(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const ctx = getGlobalContext();

    // Resume context if suspended (browser policy)
    if (isPlaying && ctx.state === 'suspended') {
      ctx.resume();
    }

    const renderFrame = () => {
      if (!canvasRef.current || !analyserRef.current) return;

      const canvas = canvasRef.current;
      const context2D = canvas.getContext('2d');
      if (!context2D) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      context2D.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height; // Scale to canvas height

        const gradient = context2D.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(255,255,255,0.4)');

        context2D.fillStyle = gradient;

        context2D.beginPath();
        if (context2D.roundRect) {
          context2D.roundRect(x, height - barHeight, barWidth, barHeight, 5);
        } else {
          context2D.rect(x, height - barHeight, barWidth, barHeight);
        }
        context2D.fill();

        x += barWidth + 2;
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    if (isPlaying) {
      renderFrame();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, color]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className="w-full h-full"
    />
  );
};

export default AudioEngine;
