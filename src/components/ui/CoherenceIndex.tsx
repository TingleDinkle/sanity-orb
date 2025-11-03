import React from 'react';

interface CoherenceIndexProps {
  sanity: number;
  onHide: () => void;
}

const CoherenceIndex: React.FC<CoherenceIndexProps> = ({ sanity, onHide }) => {
  return (
    <div 
      className="absolute pointer-events-auto"
      style={{
        left: '32px',
        bottom: '32px',
        zIndex: 1000
      }}
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-7 py-4 border border-white/10 shadow-2xl select-none relative group">
        <button
          onClick={onHide}
          className="absolute -top-2 -right-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
          title="Hide Coherence Index"
        >
          <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2 font-light">
          Digital Coherence Index
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-white text-4xl font-extralight tabular-nums transition-all duration-300">
            {sanity}
          </div>
          <span className="text-white/30 text-xl font-light">%</span>
        </div>
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-white/60 to-white/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${sanity}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CoherenceIndex;