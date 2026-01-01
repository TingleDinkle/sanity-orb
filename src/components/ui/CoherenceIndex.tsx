import React, { memo } from 'react';
import { useStore } from '../../store/store';
import GlassPanel from './GlassPanel';
import ScrambleText from './ScrambleText';

const CoherenceIndex: React.FC = () => {
  const sanity = useStore(state => state.sanity);
  const setShowCoherenceIndex = useStore(state => state.setShowCoherenceIndex);

  return (
    <div 
      className="absolute pointer-events-auto"
      style={{
        left: '32px',
        bottom: '32px',
        zIndex: 1000
      }}
      data-ui-element="true"
    >
      <GlassPanel intensity="low" className="group">
        <div className="px-7 py-4 relative">
          <button
            onClick={() => setShowCoherenceIndex(false)}
            className="absolute top-2 right-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Hide Coherence Index"
          >
            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-white/30 text-[9px] uppercase tracking-[0.3em] mb-2 font-mono">
            COH_INDEX.EXE
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-white text-4xl font-bold tabular-nums tracking-tighter">
              <ScrambleText text={sanity.toString().padStart(3, '0')} trigger={sanity} scrambleCount={1} />
            </div>
            <span className="text-emerald-500/60 text-lg font-mono">%</span>
          </div>
          
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 w-2.5 rounded-sm transition-all duration-500 ${
                  sanity >= (i + 1) * 10 
                    ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' 
                    : 'bg-white/5'
                }`}
              />
            ))}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

export default memo(CoherenceIndex);