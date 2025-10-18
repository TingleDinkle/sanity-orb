import React from 'react';
import { getSanityLabel, getSanityDescription, getGradientColor } from '../../utils/sanityUtils';

interface StatusPanelProps {
  sanity: number;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ sanity }) => {
  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
      <div className={`bg-gradient-to-br ${getGradientColor(sanity)} backdrop-blur-xl rounded-3xl px-10 py-5 border border-white/10 shadow-2xl transition-all duration-700`}>
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2 font-light">
          System Status
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
