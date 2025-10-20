import React from 'react';

interface MindAssemblyTextProps {
  visible: boolean;
  opacity: number;
}

const MindAssemblyText: React.FC<MindAssemblyTextProps> = ({ visible, opacity }) => {
  if (!visible) return null;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity }}
    >
      <div className="text-center">
        <h1 className="text-6xl font-extralight text-white tracking-wider mb-4">
          Mind
        </h1>
        <p className="text-2xl font-light text-white/60 tracking-wide">
          assembled
        </p>
      </div>
    </div>
  );
};

export default MindAssemblyText;
