import React, { useState } from 'react';
import ThreeScene from './three/ThreeScene';
import StatusPanel from './ui/StatusPanel';
import CoherenceIndex from './ui/CoherenceIndex';
import SystemIndicators from './ui/SystemIndicators';
import ControlPanel from './ui/ControlPanel';

const SanityOrbNew: React.FC = () => {
  const [sanity, setSanity] = useState(100);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      
      <ThreeScene sanity={sanity} />
      
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
        }} 
      />

      <StatusPanel sanity={sanity} />
      <CoherenceIndex sanity={sanity} />
      <SystemIndicators sanity={sanity} />
      <ControlPanel sanity={sanity} onSanityChange={setSanity} />

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(255, 255, 255, 0.8);
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
};

export default SanityOrbNew;
