import React from 'react';

interface MindAssemblyTextProps {
  visible: boolean;
  opacity: number;
}

const MindAssemblyText: React.FC<MindAssemblyTextProps> = ({ visible, opacity }) => {
  if (!visible) return null;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
      style={{ 
        opacity,
        transition: 'opacity 0.5s ease-out'
      }}
    >
      <style>{`
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        .glitch-text {
          animation: glitch 0.3s infinite;
          animation-play-state: paused;
        }
        .glitch-text:hover, .is-glitching {
          animation-play-state: running;
          text-shadow: 2px 0 #ff00c1, -2px 0 #00fff9;
        }
        .scanline {
          width: 100%;
          height: 2px;
          background: rgba(0, 255, 136, 0.1);
          position: absolute;
          top: 0;
          left: 0;
          z-index: 5;
          animation: scanline 6s linear infinite;
        }
        @keyframes scanline {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
      
      <div className="relative text-center px-6">
        <div className="scanline" />
        
        <div className="inline-block mb-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs font-mono tracking-[0.3em] uppercase">
          Neural Reassembly in Progress
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-4 glitch-text is-glitching">
          SANITY<span className="text-emerald-400">ORB</span>
        </h1>
        
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl md:text-2xl font-light text-blue-100/40 tracking-[0.2em] font-mono">
            COHERENCE RESTORATION ACTIVE
          </p>
          
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-emerald-500/50" 
              style={{ 
                width: '100%',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }} 
            />
          </div>
        </div>
        
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xs">
          <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">
            <div className="text-left">Kernel: Stable</div>
            <div className="text-right">Buffer: Optmz</div>
            <div className="text-left">Stream: Encrpt</div>
            <div className="text-right">Uptime: ∞</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindAssemblyText;

