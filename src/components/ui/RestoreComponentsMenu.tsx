import React, { memo } from 'react';
import { useStore } from '../../store/store';

const RestoreComponentsMenu: React.FC = () => {
  const {
    showStatusPanel,
    showCoherenceIndex,
    showSystemIndicators,
    showMicroUniverseIndicator,
    setShowStatusPanel,
    setShowCoherenceIndex,
    setShowSystemIndicators,
    setShowMicroUniverseIndicator,
  } = useStore(state => ({
    showStatusPanel: state.showStatusPanel,
    showCoherenceIndex: state.showCoherenceIndex,
    showSystemIndicators: state.showSystemIndicators,
    showMicroUniverseIndicator: state.showMicroUniverseIndicator,
    setShowStatusPanel: state.setShowStatusPanel,
    setShowCoherenceIndex: state.setShowCoherenceIndex,
    setShowSystemIndicators: state.setShowSystemIndicators,
    setShowMicroUniverseIndicator: state.setShowMicroUniverseIndicator,
  }));

  const hiddenComponents = [
    { name: 'Status Panel', shown: showStatusPanel, restore: () => setShowStatusPanel(true) },
    { name: 'Coherence Index', shown: showCoherenceIndex, restore: () => setShowCoherenceIndex(true) },
    { name: 'System Indicators', shown: showSystemIndicators, restore: () => setShowSystemIndicators(true) },
    { name: 'Micro-Universe Indicator', shown: showMicroUniverseIndicator, restore: () => setShowMicroUniverseIndicator(true) },
  ].filter(component => !component.shown);

  if (hiddenComponents.length === 0) return null;

  return (
    <div className="absolute top-20 right-8 pointer-events-auto z-50" data-ui-element="true">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10 shadow-2xl">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-3 font-light">
          Restore Components
        </div>
        <div className="space-y-2">
          {hiddenComponents.map((component) => (
            <button
              key={component.name}
              onClick={component.restore}
              className="w-full flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white/90 text-sm tracking-wide transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {component.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(RestoreComponentsMenu);
