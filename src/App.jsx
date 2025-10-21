import React, { useState } from "react";
import SanityOrb from "./components/SanityOrb";
import OpeningAnimation from "./components/animations/OpeningAnimation";

export default function App() {
  const [overlayVisible, setOverlayVisible] = useState(true); // Enable opening animation
  const [overlayOpacity, setOverlayOpacity] = useState(1); // Start visible

  const handleOpeningComplete = () => {
    // Start crossfade: keep animation mounted while fading out
    setOverlayOpacity(0);
    // After fade-out completes, unmount the animation overlay
    setTimeout(() => setOverlayVisible(false), 750);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <SanityOrb />

      {overlayVisible && (
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{ opacity: overlayOpacity, transition: "opacity 700ms ease" }}
        >
          <OpeningAnimation onComplete={handleOpeningComplete} />
        </div>
      )}
    </div>
  );
}