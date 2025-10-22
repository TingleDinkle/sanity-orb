import React, { useState } from "react";
import SanityOrb from "./components/SanityOrb";
import OpeningAnimation from "./components/animations/OpeningAnimation";

export default function App() {
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [mainAppOpacity, setMainAppOpacity] = useState(0);

  const handleOpeningComplete = () => {
    // Start fading in main app immediately
    setMainAppOpacity(1);
    
    // Start fading out animation overlay with slight delay for smoother crossfade
    setTimeout(() => {
      setOverlayOpacity(0);
    }, 100);
    
    // Remove animation overlay after fade completes
    setTimeout(() => {
      setOverlayVisible(false);
    }, 900); // 100ms delay + 800ms fade = 900ms total
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Main app - fades in smoothly */}
      <div 
        style={{ 
          opacity: mainAppOpacity, 
          transition: "opacity 800ms ease-in-out" 
        }}
      >
        <SanityOrb />
      </div>

      {/* Opening animation overlay - fades out smoothly */}
      {overlayVisible && (
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{ 
            opacity: overlayOpacity, 
            transition: "opacity 800ms ease-in-out" 
          }}
        >
          <OpeningAnimation onComplete={handleOpeningComplete} />
        </div>
      )}
    </div>
  );
}