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
    // Phase 5: Text appears (6.0-7.5s)
    if (time >= MIND_ASSEMBLY_CONFIG.phases.textStabilization.start && 
        time < MIND_ASSEMBLY_CONFIG.phases.textStabilization.start + MIND_ASSEMBLY_CONFIG.phases.textStabilization.duration) {
      if (!textVisible) {
        setTextVisible(true);
      }
      const textProgress = (time - MIND_ASSEMBLY_CONFIG.phases.textStabilization.start) / MIND_ASSEMBLY_CONFIG.phases.textStabilization.duration;
      setTextOpacity(Math.pow(textProgress, 2));
    }

    // Phase 6: Fade out text (7.5-8.0s)
    if (time >= MIND_ASSEMBLY_CONFIG.phases.finalState.start) {
      const finalProgress = (time - MIND_ASSEMBLY_CONFIG.phases.finalState.start) / MIND_ASSEMBLY_CONFIG.phases.finalState.duration;
      setTextOpacity(1 - finalProgress);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 will-change-transform will-change-opacity z-50">
      <MindAssemblyScene onComplete={onComplete} onTextUpdate={handleAnimationUpdate} />
      <MindAssemblyText visible={textVisible} opacity={textOpacity} />
    </div>
  );
};

export default OpeningAnimation;