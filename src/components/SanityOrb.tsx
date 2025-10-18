import React, { useState, useEffect } from 'react';
import ThreeScene from './three/ThreeScene';
import StatusPanel from './ui/StatusPanel';
import CoherenceIndex from './ui/CoherenceIndex';
import SystemIndicators from './ui/SystemIndicators';
import ControlPanel from './ui/ControlPanel';
import HelpOverlay from './ui/HelpOverlay';

const SanityOrb: React.FC = () => {
  const [sanity, setSanity] = useState(100);
  const [isControlPanelVisible, setIsControlPanelVisible] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'h':
          setIsControlPanelVisible(!isControlPanelVisible);
          break;
        case '1':
          setSanity(100);
          break;
        case '2':
          setSanity(75);
          break;
        case '3':
          setSanity(50);
          break;
        case '4':
          setSanity(25);
          break;
        case '5':
          setSanity(10);
          break;
        case 'arrowup':
          event.preventDefault();
          setSanity(prev => Math.min(100, prev + 5));
          break;
        case 'arrowdown':
          event.preventDefault();
          setSanity(prev => Math.max(0, prev - 5));
          break;
        case ' ':
          event.preventDefault();
          setIsControlPanelVisible(!isControlPanelVisible);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isControlPanelVisible]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      
      <ThreeScene sanity={sanity} isControlPanelVisible={isControlPanelVisible} />
      
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
        }} 
      />

      <StatusPanel sanity={sanity} />
      <CoherenceIndex sanity={sanity} />
      <SystemIndicators sanity={sanity} />
      <ControlPanel 
        sanity={sanity} 
        onSanityChange={setSanity}
        isVisible={isControlPanelVisible}
        onToggleVisibility={() => setIsControlPanelVisible(!isControlPanelVisible)}
      />
      <HelpOverlay />

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

export default SanityOrb;
