import React, { memo, useMemo, useCallback } from 'react';
import { useStore } from '../../store/store';

const RestoreComponentsMenu: React.FC = () => {
  const showStatusPanel = useStore(state => state.showStatusPanel);
  const showCoherenceIndex = useStore(state => state.showCoherenceIndex);
  const showSystemIndicators = useStore(state => state.showSystemIndicators);
  const showMicroUniverseIndicator = useStore(state => state.showMicroUniverseIndicator);
  const setShowStatusPanel = useStore(state => state.setShowStatusPanel);
  const setShowCoherenceIndex = useStore(state => state.setShowCoherenceIndex);
  const setShowSystemIndicators = useStore(state => state.setShowSystemIndicators);
  const setShowMicroUniverseIndicator = useStore(state => state.setShowMicroUniverseIndicator);

  const onRestoreStatusPanel = useCallback(() => setShowStatusPanel(true), [setShowStatusPanel]);
  const onRestoreCoherenceIndex = useCallback(() => setShowCoherenceIndex(true), [setShowCoherenceIndex]);
  const onRestoreSystemIndicators = useCallback(() => setShowSystemIndicators(true), [setShowSystemIndicators]);
  const onRestoreMicroUniverseIndicator = useCallback(() => setShowMicroUniverseIndicator(true), [setShowMicroUniverseIndicator]);

  const hiddenComponents = useMemo(() => [
    { name: 'Status Panel', shown: showStatusPanel, restore: onRestoreStatusPanel },
    { name: 'Coherence Index', shown: showCoherenceIndex, restore: onRestoreCoherenceIndex },
    { name: 'System Indicators', shown: showSystemIndicators, restore: onRestoreSystemIndicators },
    { name: 'Micro-Universe Indicator', shown: showMicroUniverseIndicator, restore: onRestoreMicroUniverseIndicator },
  ].filter(component => !component.shown), [
    showStatusPanel,
    showCoherenceIndex,
    showSystemIndicators,
    showMicroUniverseIndicator,
    onRestoreStatusPanel,
    onRestoreCoherenceIndex,
    onRestoreSystemIndicators,
    onRestoreMicroUniverseIndicator,
  ]);

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
