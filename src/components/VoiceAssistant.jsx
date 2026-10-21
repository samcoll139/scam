import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, VolumeX, Radio, Compass, RefreshCw } from 'lucide-react';

export default function VoiceAssistant({ 
  status, // 'idle' | 'listening' | 'processing' | 'speaking'
  onStartRecording, 
  onStopRecording, 
  errorMessage 
}) {
  const [silenceTimeout, setSilenceTimeout] = useState(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Status mapping for Tamil display
  const statusConfig = {
    idle: {
      text: 'நான் தயார், பேசுங்கள்',
      subtext: 'மைக் பொத்தானை அழுத்தவும்',
      glow: 'shadow-rose-500/20 border-rose-500/30 bg-rose-500/5',
      faceGlow: 'from-slate-800 to-slate-900 border-slate-700'
    },
    listening: {
      text: 'கேட்டுக் கொண்டிருக்கிறேன்...',
      subtext: 'பேசி முடித்ததும் தானாகவோ அல்லது மீண்டும் அழுத்தவோ நிறுத்தப்படும்',
      glow: 'shadow-rose-500/60 border-rose-500/80 bg-rose-900/10 mic-pulse',
      faceGlow: 'from-rose-950/20 to-slate-900 border-rose-500/30'
    },
    processing: {
      text: 'செயலாக்குகிறது...',
      subtext: 'உங்கள் பேச்சை உரை வடிவாக்கி பதில் தேடுகிறது',
      glow: 'shadow-violet-500/40 border-violet-500/60 bg-violet-900/10',
      faceGlow: 'from-violet-950/20 to-slate-900 border-violet-500/30'
    },
    speaking: {
      text: 'பதிலளிக்கிறது...',
      subtext: 'தமிழ் குரல் உதவியாளர் பேசுகிறார்',
      glow: 'shadow-emerald-500/40 border-emerald-500/60 bg-emerald-900/10',
      faceGlow: 'from-emerald-950/20 to-slate-900 border-emerald-500/30'
    }
  };

  const currentConfig = statusConfig[status] || statusConfig.idle;

  // Cleanup Web Audio context on unmount
  useEffect(() => {
    return () => {
      stopAudioMonitoring();
    };
  }, []);

  // Monitor microphone level when status becomes 'listening' for auto-silence detection
  useEffect(() => {
    if (status === 'listening') {
      startAudioMonitoring();
    } else {
      stopAudioMonitoring();
    }
  }, [status]);

  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let lowVolumeStart = null;
      const SILENCE_THRESHOLD = 8; // Adjust threshold based on testing
      const SILENCE_DURATION_MS = 2200; // Auto-stop after 2.2 seconds of silence

      const checkVolume = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const average = total / bufferLength;

        // If below threshold, we start timer
        if (average < SILENCE_THRESHOLD) {
          if (!lowVolumeStart) {
            lowVolumeStart = Date.now();
          } else if (Date.now() - lowVolumeStart > SILENCE_DURATION_MS) {
            console.log("Silence detected. Auto-stopping recording...");
            onStopRecording();
            return;
          }
        } else {
          // Reset timer when speech is detected
          lowVolumeStart = null;
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn("Could not start audio monitoring for silence detection:", err);
    }
  };

  const stopAudioMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const handleMicClick = () => {
    if (status === 'listening') {
      onStopRecording();
    } else if (status === 'idle' || status === 'speaking') {
      onStartRecording();
    }
  };

  return (
    <div className="flex flex-col items-center justify-between p-6 h-full bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
      
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Header Status Bar */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
          <Radio className={`w-3.5 h-3.5 ${status === 'listening' ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
          <span>நிலை: {status === 'idle' ? 'காத்திருப்பு' : status === 'listening' ? 'கேட்கிறது' : status === 'processing' ? 'யோசிக்கிறது' : 'பேசுகிறது'}</span>
        </div>
      </div>

      {/* Holographic AI Face Avatar Container */}
      <div className="my-auto py-6 flex flex-col items-center justify-center z-10">
        <div className={`w-48 h-48 rounded-full flex items-center justify-center bg-gradient-to-b border transition-all duration-700 shadow-2xl relative ${currentConfig.faceGlow}`}>
          
          {/* Avatar Outer Pulsing Rings */}
          <div className={`absolute inset-0 rounded-full border border-dashed border-rose-500/10 animate-spin`} style={{ animationDuration: '30s' }}></div>
          <div className={`absolute -inset-2 rounded-full border border-rose-500/5 animate-reverse-spin`} style={{ animationDuration: '40s', animationDirection: 'reverse' }}></div>

          {/* SVG Robot Avatar Face */}
          <svg className="w-24 h-24 text-slate-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Holographic head shape */}
            <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" fill="url(#avatarGrad)" />
            <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.1" />
            
            {/* Blinking Eyes */}
            <g className="avatar-eye">
              {/* Left Eye */}
              <circle cx="35" cy="42" r="6" fill="#F43F5E" className="drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <circle cx="35" cy="42" r="2" fill="#FFFFFF" />
              {/* Right Eye */}
              <circle cx="65" cy="42" r="6" fill="#F43F5E" className="drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <circle cx="65" cy="42" r="2" fill="#FFFFFF" />
            </g>

            {/* Speaking/Listening Mouth */}
            {status === 'speaking' ? (
              <rect 
                x="40" 
                y="60" 
                width="20" 
                height="8" 
                rx="4" 
                fill="#F43F5E" 
                className="avatar-mouth-speaking drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" 
              />
            ) : status === 'listening' ? (
              <circle 
                cx="50" 
                cy="64" 
                r="4" 
                fill="#F43F5E" 
                className="animate-ping" 
              />
            ) : (
              <rect 
                x="44" 
                y="63" 
                width="12" 
                height="3" 
                rx="1.5" 
                fill="#94A3B8" 
              />
            )}

            {/* Futuristic Details */}
            <path d="M50 15 L50 22" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
            <path d="M28 72 C 35 78, 65 78, 72 72" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" />

            <defs>
              <radialGradient id="avatarGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) rotate(90) scale(40)">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.8" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Real-time Voice Waveform Visualizer */}
        <div className="h-10 flex items-center justify-center gap-1.5 mt-8 w-64">
          {status === 'listening' || status === 'speaking' ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-1 rounded-full wave-bar ${
                  status === 'listening' ? 'bg-rose-500' : 'bg-emerald-400'
                }`}
                style={{ 
                  height: `${[24, 40, 28, 48, 20, 36, 18, 44, 30, 22][i]}px`,
                  animationDuration: `${[1.0, 1.2, 0.9, 1.4, 0.8, 1.1, 1.3, 1.0, 1.2, 0.9][i]}s`
                }}
              />
            ))
          ) : (
            <div className="w-full text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              <span>அமைதியாக உள்ளது (System Idle)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
            </div>
          )}
        </div>

        {/* Dynamic Status Text */}
        <div className="text-center mt-4 space-y-1">
          <h3 className="text-base font-bold text-slate-200">{currentConfig.text}</h3>
          <p className="text-xs text-slate-400 px-4 max-w-xs">{currentConfig.subtext}</p>
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="w-full absolute bottom-28 left-0 right-0 px-6 z-20">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs shadow-lg animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="line-clamp-2">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Microphone Button */}
      <div className="w-full pb-4 flex justify-center z-10">
        <button
          onClick={handleMicClick}
          disabled={status === 'processing'}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white border transition-all duration-300 ${
            status === 'listening'
              ? 'bg-rose-500 hover:bg-rose-600 border-rose-400'
              : status === 'processing'
              ? 'bg-slate-800 border-slate-700 cursor-wait'
              : 'bg-rose-600 hover:bg-rose-500 border-rose-500/50 hover:scale-105 shadow-lg shadow-rose-900/30'
          } ${currentConfig.glow}`}
        >
          {status === 'listening' ? (
            <MicOff className="w-8 h-8 animate-pulse" />
          ) : status === 'processing' ? (
            <RefreshCw className="w-8 h-8 animate-spin text-slate-500" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>
      </div>

    </div>
  );
}
