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
      const fadeOut = Math.max(0, 1 - (fadeProgress * fadeProgress));
      setTextOpacity(fadeOut);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 will-change-opacity z-50">
      <MindAssemblyScene onComplete={onComplete} onTextUpdate={handleAnimationUpdate} />
      <MindAssemblyText visible={textVisible} opacity={textOpacity} />
    </div>
  );
};

export default OpeningAnimation;