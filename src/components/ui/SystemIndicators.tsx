import React, { memo } from 'react';
import { useStore } from '../../store/store';

const SystemIndicators: React.FC = () => {
  const sanity = useStore(state => state.sanity);
  const setShowSystemIndicators = useStore(state => state.setShowSystemIndicators);

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
      data-ui-element="true"
    >
      {/* <button onClick={() => setShowSystemIndicators(false)}>Hide</button> */}
    </div>
  );
};

export default memo(SystemIndicators);