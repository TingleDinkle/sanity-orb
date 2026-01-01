import React, { memo } from 'react';
import { useStore } from '../../store/store';
import { SANITY_PRESETS } from '../../constants/sanityConstants';
import GlassPanel from './GlassPanel';
import ScrambleText from './ScrambleText';

const ControlPanel: React.FC = () => {
  const sanity = useStore(state => state.sanity);
  const setSanity = useStore(state => state.setSanity);
  const isVisible = useStore(state => state.isControlPanelVisible);
  const toggleVisibility = useStore(state => state.toggleControlPanel);

  if (!isVisible) {
    return (
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <button
          onClick={toggleVisibility}
          className="group relative"
          title="Show Controls"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <GlassPanel intensity="low" className="rounded-full p-4 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </GlassPanel>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-8 pointer-events-auto">
      <GlassPanel intensity="medium" className="p-8 group">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-mono">
                Neural Interface v2.0
              </span>
            </div>
            <h2 className="text-white text-xl font-bold tracking-tight">
              COHERENCE <span className="text-emerald-400">CONTROL</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5 px-3 py-1.5 bg-black/20 rounded-full border border-white/5">
              {[75, 50, 25, 1].map((threshold) => (
                <div 
                  key={threshold}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                    sanity >= threshold 
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' 
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={toggleVisibility}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-2 transition-all duration-200"
            >
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="relative mb-6 px-1">
          <input
            type="range"
            min="0"
            max="100"
            value={sanity}
            onChange={(e) => setSanity(Number(e.target.value))}
            className="w-full h-1.5 bg-white/5 appearance-none cursor-pointer rounded-full slider-thumb-custom overflow-hidden"
            style={{
              background: `linear-gradient(to right, rgb(16, 185, 129) ${sanity}%, rgba(255,255,255,0.05) ${sanity}%)`
            }}
          />
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            .slider-thumb-custom::-webkit-slider-thumb {
              appearance: none;
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: white;
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
              cursor: pointer;
              border: 4px solid #064e3b;
            }
            .slider-thumb-custom::-moz-range-thumb {
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: white;
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
              cursor: pointer;
              border: 4px solid #064e3b;
            }
          `
        }} />
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          {SANITY_PRESETS.map(preset => {
            const isActive = sanity === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => setSanity(preset.value)}
                className={`group relative py-3 px-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                } border`}
              >
                <div className={`text-[9px] uppercase tracking-widest mb-1 ${isActive ? 'text-emerald-400' : 'text-white/30'}`}>
                  Preset
                </div>
                <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-white/60'}`}>
                  {preset.label}
                </div>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center px-2 py-3 bg-black/20 rounded-lg border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/20 uppercase tracking-widest font-mono">Current Logic</span>
            <span className="text-xs text-white/60 font-mono">
              <ScrambleText text={sanity.toString().padStart(3, '0')} trigger={sanity} scrambleCount={2} />.00_INDEX
            </span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-white/20 uppercase tracking-widest font-mono">Stability Status</span>
            <span className={`text-xs font-mono ${sanity > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {sanity > 50 ? 'NOMINAL' : 'COMPROMISED'}
            </span>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

export default memo(ControlPanel);

