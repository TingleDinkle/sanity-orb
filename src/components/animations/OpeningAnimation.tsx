import React, { useState, useEffect } from 'react';
import MindAssemblyScene from '../three/MindAssemblyScene';
import MindAssemblyText from '../ui/MindAssemblyText';
import { MIND_ASSEMBLY_CONFIG } from '../../constants/sanityConstants';

interface OpeningAnimationProps {
  onComplete: () => void;
}

const OpeningAnimation: React.FC<OpeningAnimationProps> = ({ onComplete }) => {
  const [textVisible, setTextVisible] = useState(false);
  const [textOpacity, setTextOpacity] = useState(0);

  const handleAnimationUpdate = (time: number) => {
    // Phase 5: Text appears (6.0-6.8s) - Quick fade in
    if (time >= MIND_ASSEMBLY_CONFIG.phases.textStabilization.start && 
        time < MIND_ASSEMBLY_CONFIG.phases.textStabilization.start + 0.8) {
      if (!textVisible) {
        setTextVisible(true);
      }
      const textProgress = (time - MIND_ASSEMBLY_CONFIG.phases.textStabilization.start) / 0.8;
      // Quick smooth fade in
      const smoothOpacity = textProgress * textProgress;
      setTextOpacity(smoothOpacity);
    }

    // Phase 6: Text at full opacity (6.8-7.3s) - Brief hold
    if (time >= MIND_ASSEMBLY_CONFIG.phases.textStabilization.start + 0.8 && 
        time < MIND_ASSEMBLY_CONFIG.phases.textStabilization.start + 1.3) {
      setTextOpacity(1);
    }

    // Phase 7: Text fades out with overlay (7.3s+) - Fade with everything else
    if (time >= MIND_ASSEMBLY_CONFIG.phases.textStabilization.start + 1.3) {
      const fadeProgress = (time - (MIND_ASSEMBLY_CONFIG.phases.textStabilization.start + 1.3)) / 0.7;
      // Use linear fade instead of squared fade for more consistent fading
      const fadeOut = Math.max(0, 1 - fadeProgress);
      setTextOpacity(fadeOut);

      // Ensure text is completely hidden by animation end
      if (time >= MIND_ASSEMBLY_CONFIG.totalDuration - 0.1) {
        setTextOpacity(0);
        setTextVisible(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#02040a] will-change-opacity z-50 overflow-hidden">
      {/* Texture Layer - Grain/Noise */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* Grid Layer - Subtle Tech Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
        }}
      />

      {/* Vignette Layer */}
      <div className="absolute inset-0 z-[2] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      <MindAssemblyScene onComplete={onComplete} onTextUpdate={handleAnimationUpdate} />
      <MindAssemblyText visible={textVisible} opacity={textOpacity} />
    </div>
  );
};

export default OpeningAnimation;
