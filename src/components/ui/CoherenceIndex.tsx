import React from 'react';

interface CoherenceIndexProps {
  sanity: number;
}

const CoherenceIndex: React.FC<CoherenceIndexProps> = ({ sanity }) => {
  return (
    <div className="absolute top-8 right-8 pointer-events-none">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-7 py-4 border border-white/10 shadow-2xl">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2 font-light">
          Coherence Index
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
