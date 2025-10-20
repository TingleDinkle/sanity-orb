import React, { useState } from 'react';
import OpeningAnimation from './animations/OpeningAnimation';

const OpeningAnimationDemo: React.FC = () => {
  const [showOpening, setShowOpening] = useState(true);

  return (
    <div className="w-full h-screen">
      {showOpening ? (
        <OpeningAnimation onComplete={() => setShowOpening(false)} />
      ) : (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
          <div className="text-center text-white">
            <h2 className="text-4xl font-light mb-4">Main Application</h2>
            <p className="text-white/60">Opening animation complete!</p>
            <button 
              onClick={() => setShowOpening(true)}
              className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
              Replay Animation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpeningAnimationDemo;
