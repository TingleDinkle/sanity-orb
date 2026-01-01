import React, { memo } from 'react';
import { useStore } from '../../store/store';
import { getSanityLabel, getSanityDescription, getGradientColor } from '../../utils/sanityUtils';
import GlassPanel from './GlassPanel';
import ScrambleText from './ScrambleText';

const StatusPanel: React.FC = () => {
  const sanity = useStore(state => state.sanity);
  const setShowStatusPanel = useStore(state => state.setShowStatusPanel);

  return (
    <div 
      className="absolute text-center pointer-events-auto"
      style={{
        left: '50%',
        top: '32px',
        transform: 'translateX(-50%)',
        zIndex: 1000
      }}
      data-ui-element="true"
    >
      <GlassPanel 
        intensity="medium" 
        className={`group transition-all duration-700 hover:scale-[1.02] hover:bg-white/[0.09] active:scale-[0.98] ${getGradientColor(sanity)}`}
      >
        <div className="px-10 py-5 relative">
          <button
            onClick={() => setShowStatusPanel(false)}
            className="absolute top-2 right-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Hide Status Panel"
          >
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-white/30 text-[10px] uppercase tracking-[0.4em] mb-2 font-mono">
            System Coherence Status
          </div>
          <h1 className="text-white text-5xl font-bold tracking-tighter mb-3 transition-all duration-500">
            <ScrambleText text={getSanityLabel(sanity)} trigger={sanity} />
          </h1>
          <p className="text-white/40 text-xs font-mono tracking-wider max-w-md mx-auto">
            {getSanityDescription(sanity)}
          </p>
        </div>
      </GlassPanel>
    </div>
  );
};

export default memo(StatusPanel);