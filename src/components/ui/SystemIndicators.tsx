import React from 'react';

interface SystemIndicatorsProps {
  sanity: number;
}

const SystemIndicators: React.FC<SystemIndicatorsProps> = ({ sanity }) => {
  const getIndicatorColor = () => {
    if (sanity >= 75) return 'bg-green-400';
    if (sanity >= 50) return 'bg-yellow-400';
    if (sanity >= 25) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="absolute top-8 left-8 pointer-events-none">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10 shadow-2xl space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${getIndicatorColor()} animate-pulse`} />
          <span className="text-white/50 text-xs tracking-wider">Neural Activity</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-white/50 text-xs tracking-wider">Reality Anchor</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-white/50 text-xs tracking-wider">Temporal Sync</span>
        </div>
      </div>
    </div>
  );
};

export default SystemIndicators;
