import React from 'react';

interface SystemIndicatorsProps {
  sanity: number;
  onHide: () => void;
}

const SystemIndicators: React.FC<SystemIndicatorsProps> = ({ sanity, onHide }) => {
  const getIndicatorColor = () => {
    if (sanity >= 75) return 'bg-green-400';
    if (sanity >= 50) return 'bg-yellow-400';
    if (sanity >= 25) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div 
      className="absolute pointer-events-auto"
      style={{
        left: '32px',
        bottom: '32px',
        zIndex: 1000
      }}
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10 shadow-2xl space-y-3 select-none relative group">
        <button
          onClick={onHide}
          className="absolute -top-2 -right-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
          title="Hide System Indicators"
        >
          <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${getIndicatorColor()} animate-pulse`} />
          <span className="text-white/50 text-xs tracking-wider">Digital Consciousness</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-white/50 text-xs tracking-wider">Network Stability</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-white/50 text-xs tracking-wider">Data Flow Sync</span>
        </div>
      </div>
    </div>
  );
};

export default SystemIndicators;