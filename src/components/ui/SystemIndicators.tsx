import React from 'react';

interface SystemIndicatorsProps {
  sanity: number;
  onHide: () => void;
}

const SystemIndicators: React.FC<SystemIndicatorsProps> = ({ sanity, onHide }) => {
  const getIndicatorColor = () => {
    if (sanity >= 75) return 'bg-green-400';
    if (sanity >= 50) return 'bg-yellow-400';
    if (sanity >= 25) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div 
      className="absolute pointer-events-auto"
      style={{
        left: '32px',
        bottom: '32px',
        zIndex: 1000
      }}
    >
    </div>
  );
};

export default SystemIndicators;