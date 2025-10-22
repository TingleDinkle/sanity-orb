import React, { useState } from "react";
import SanityOrb from "./components/SanityOrb";
import OpeningAnimation from "./components/animations/OpeningAnimation";

export default function App() {
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [mainAppOpacity, setMainAppOpacity] = useState(0);

  const handleOpeningComplete = () => {
    // Start fading in main app immediately when animation completes
    setMainAppOpacity(1);
    
    // Start fading out overlay with a slight overlap
    setTimeout(() => {
      setOverlayOpacity(0);
    }, 400); // Short delay for smooth crossfade
    
    // Remove overlay from DOM after fade completes
    setTimeout(() => {
      setOverlayVisible(false);
    }, 2400); // 400 + 2000 = 2400ms total
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Main app - fades in smoothly */}
      <div 
        className="absolute inset-0"
        style={{ 
          opacity: mainAppOpacity,
          transition: "opacity 2000ms cubic-bezier(0.4, 0.0, 0.2, 1)",
          willChange: "opacity"
        }}
      >
        <SanityOrb />
      </div>

      {/* Opening animation overlay - fades out with crossfade */}
      {overlayVisible && (
        <div
          className="absolute inset-0 z-50"
          style={{ 
            opacity: overlayOpacity,
            transition: "opacity 2000ms cubic-bezier(0.4, 0.0, 0.2, 1)",
            pointerEvents: "none",
            willChange: "opacity"
          }}
        >
          <OpeningAnimation onComplete={handleOpeningComplete} />
        </div>
      )}
    </div>
  );
}