import React, { useState, useEffect } from 'react';

interface HelpOverlayProps {
  onVisibilityChange?: (visible: boolean) => void;
}

const HelpOverlay: React.FC<HelpOverlayProps> = ({ onVisibilityChange }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === '?' || event.key === '/') {
        const newVisibility = !isVisible;
        setIsVisible(newVisibility);
        if (onVisibilityChange) {
          onVisibilityChange(newVisibility);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, onVisibilityChange]);

  const handleClose = () => {
    setIsVisible(false);
    if (onVisibilityChange) {
      onVisibilityChange(false);
    }
  };

  const handleToggle = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    if (onVisibilityChange) {
      onVisibilityChange(newVisibility);
    }
  };

  if (!isVisible) {
    return (
      <div className="absolute top-4 right-4 pointer-events-auto z-40">
        <button
          onClick={handleToggle}
          className="bg-white/5 backdrop-blur-xl rounded-full p-3 border border-white/10 shadow-2xl transition-all duration-300 hover:bg-white/10 hover:scale-110 active:scale-95"
          title="Show Help (Press ?)"
        >
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center pointer-events-auto z-[9999]">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl max-w-md mx-4 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-light">Internet Sanity Orb Controls</h2>
          <button
            onClick={handleClose}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-2 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4 text-white/80">
          <div className="flex justify-between items-center">
            <span className="text-sm">Hide/Show Controls</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">H</kbd>
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Space</kbd>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Coherence Presets</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">1</kbd>
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">2</kbd>
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">3</kbd>
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">4</kbd>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Fine Adjust</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">↑</kbd>
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">↓</kbd>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Show Help</span>
            <kbd className="px-2 py-1 bg-white/10 rounded text-xs">?</kbd>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-white/50 text-xs text-center">
            Use the slider or keyboard shortcuts to adjust digital consciousness coherence levels
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpOverlay;