import React from 'react';

interface OpeningAnimationTextProps {
  visible: boolean;
  opacity: number;
}

const OpeningAnimationText: React.FC<OpeningAnimationTextProps> = ({ visible, opacity }) => {
  if (!visible) return null;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity }}
    >
      <div className="text-center">
        <h1 className="text-6xl font-extralight text-white tracking-wider mb-4">
          Sanity
        </h1>
        <p className="text-2xl font-light text-white/60 tracking-wide">
          reassembled
        </p>
      </div>
    </div>
  );
};

export default OpeningAnimationText;
