import React from 'react';
import { SANITY_PRESETS } from '../../constants/sanityConstants';

interface ControlPanelProps {
  sanity: number;
  onSanityChange: (value: number) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ sanity, onSanityChange, isVisible, onToggleVisibility }) => {
  if (!isVisible) {
    return (
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <button
          onClick={onToggleVisibility}
          className="bg-white/10 backdrop-blur-xl rounded-full p-4 border border-white/20 shadow-2xl transition-all duration-300 hover:bg-white/20 hover:scale-110 active:scale-95"
          title="Show Controls"
        >
          <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-8 pointer-events-auto">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl transition-all duration-300 hover:bg-white/[0.07]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-white/60 text-sm tracking-wide font-light">
              Internet Sanity Orb Control Interface
            </span>
            <div className="text-white/40 text-xs mt-1 tracking-wider">
              Modulate digital consciousness coherence levels
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {[50, 25, 11, 0].map((threshold) => (
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
            <button
              onClick={onToggleVisibility}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-2 transition-all duration-200 hover:scale-110 active:scale-95"
              title="Hide Controls"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
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
          {/* Enhanced visual indicator */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 pointer-events-none">
            <div 
              className="w-1 h-8 bg-white/60 rounded-full transition-all duration-200"
              style={{ 
                left: `${sanity}%`,
                transform: 'translateX(-50%)',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
              }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-white/40 tracking-wider">
          <div className="flex flex-col items-start">
            <span className="font-light">Digital Chaos</span>
            <span className="text-xs text-white/30 mt-0.5">0-25%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-light">Network Instability</span>
            <span className="text-xs text-white/30 mt-0.5">25-50%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-light">Stable Connection</span>
            <span className="text-xs text-white/30 mt-0.5">50-75%</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-light">Optimal Flow</span>
            <span className="text-xs text-white/30 mt-0.5">75-100%</span>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-6 border-t border-white/10">
          {SANITY_PRESETS.map(preset => {
            const isActive = sanity === preset.value;
            const isNearby = Math.abs(sanity - preset.value) <= 5;
            
            return (
              <button
                key={preset.value}
                onClick={() => onSanityChange(preset.value)}
                className={`flex-1 py-2 px-4 rounded-xl text-xs tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isActive 
                    ? 'bg-white/20 text-white border border-white/30 shadow-lg' 
                    : isNearby
                    ? 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/15'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
