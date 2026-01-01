import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  withNoise?: boolean;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  className = '', 
  intensity = 'medium',
  withNoise = true
}) => {
  const intensityStyles = {
    low: 'bg-white/[0.03] backdrop-blur-md border-white/5',
    medium: 'bg-white/[0.07] backdrop-blur-xl border-white/10',
    high: 'bg-white/[0.12] backdrop-blur-2xl border-white/20'
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border shadow-2xl transition-all duration-500 ${intensityStyles[intensity]} ${className}`}>
      {/* Texture Layer - Grain/Noise */}
      {withNoise && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <filter id="noiseFilterGlass">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilterGlass)" />
          </svg>
        </div>
      )}

      {/* Glossy Reflection Highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-0" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassPanel;
