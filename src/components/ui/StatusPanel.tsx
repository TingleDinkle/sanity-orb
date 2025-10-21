import React from 'react';
import { getSanityLabel, getSanityDescription, getGradientColor } from '../../utils/sanityUtils';

interface StatusPanelProps {
  sanity: number;
  onHide: () => void;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ sanity, onHide }) => {
  return (
    <div 
      className="absolute text-center pointer-events-auto"
      style={{
        left: '50%',
        top: '32px',
        transform: 'translateX(-50%)',
        zIndex: 1000
      }}
    >
      <div className={`bg-gradient-to-br ${getGradientColor(sanity)} backdrop-blur-xl rounded-3xl px-10 py-5 border border-white/10 shadow-2xl transition-all duration-700 select-none relative group`}>
        <button
          onClick={onHide}
          className="absolute -top-2 -right-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
          title="Hide Status Panel"
        >
          <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2 font-light">
          Internet Sanity Orb Status
        </div>
        <h1 className="text-white text-5xl font-extralight tracking-wider mb-3 transition-all duration-500">
          {getSanityLabel(sanity)}
        </h1>
        <p className="text-white/50 text-sm tracking-wide leading-relaxed max-w-md">
          {getSanityDescription(sanity)}
        </p>
      </div>
    </div>
  );
};

export default StatusPanel;