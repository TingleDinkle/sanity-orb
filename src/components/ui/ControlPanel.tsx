import React from 'react';
import { SANITY_PRESETS } from '../../constants/sanityConstants';

interface ControlPanelProps {
  sanity: number;
  onSanityChange: (value: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ sanity, onSanityChange }) => {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-8 pointer-events-auto">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl transition-all duration-300 hover:bg-white/[0.07]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-white/60 text-sm tracking-wide font-light">
              Sanity Modulation Interface
            </span>
            <div className="text-white/40 text-xs mt-1 tracking-wider">
              Adjust coherence parameters in real-time
            </div>
          </div>
          <div className="flex gap-2">
            {[75, 50, 25, 0].map((threshold) => (
              <div 
                key={threshold}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  sanity >= threshold 
                    ? 'bg-white/80 scale-100' 
                    : 'bg-white/20 scale-75'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="relative mb-6">
          <input
            type="range"
            min="0"
            max="100"
            value={sanity}
            onChange={(e) => onSanityChange(Number(e.target.value))}
            className="w-full h-3 bg-transparent appearance-none cursor-pointer relative z-10"
            style={{
              background: 'linear-gradient(to right, rgb(220, 38, 38) 0%, rgb(249, 115, 22) 25%, rgb(234, 179, 8) 50%, rgb(132, 204, 22) 75%, rgb(34, 197, 94) 100%)',
              borderRadius: '9999px'
            }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-white/40 tracking-wider">
          <div className="flex flex-col items-start">
            <span className="font-light">Critical</span>
            <span className="text-xs text-white/30 mt-0.5">0-25%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-light">Unstable</span>
            <span className="text-xs text-white/30 mt-0.5">25-50%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-light">Normal</span>
            <span className="text-xs text-white/30 mt-0.5">50-75%</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-light">Optimal</span>
            <span className="text-xs text-white/30 mt-0.5">75-100%</span>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-6 border-t border-white/10">
          {SANITY_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => onSanityChange(preset.value)}
              className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white/90 text-xs tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
