import React, { useEffect, Suspense, lazy } from 'react';
import { useStore } from '../store/store';
import StatusPanel from './ui/StatusPanel';
import CoherenceIndex from './ui/CoherenceIndex';
import SystemIndicators from './ui/SystemIndicators';
import ControlPanel from './ui/ControlPanel';
import HelpOverlay from './ui/HelpOverlay';
import FunnyMessages from './ui/FunnyMessages';
import AudioControls from './ui/AudioControls';
import RestoreComponentsMenu from './ui/RestoreComponentsMenu';
import { audioManager } from '../utils/audioManager';
import DataAnalyticsButton from './ui/DataAnalyticsButton';
import { api } from '../services/api';

// Lazy load heavy components
const ThreeScene = lazy(() => import('./three/ThreeScene'));
const DataAnalyticsPanel = lazy(() => import('./ui/DataAnalyticsPanel'));

const SanityOrb: React.FC = () => {
  // Select state and actions from the Zustand store
  const sanity = useStore(state => state.sanity);
  const setSanity = useStore(state => state.setSanity);
  const isBackendConnected = useStore(state => state.isBackendConnected);
  const setIsBackendConnected = useStore(state => state.setIsBackendConnected);
  const isHelpVisible = useStore(state => state.isHelpVisible);
  const setHelpVisible = useStore(state => state.setHelpVisible);
  const shakeIntensity = useStore(state => state.shakeIntensity);
  const setShakeIntensity = useStore(state => state.setShakeIntensity);
  const isInMicroUniverse = useStore(state => state.isInMicroUniverse);
  const setIsInMicroUniverse = useStore(state => state.setIsInMicroUniverse);
  const collectiveData = useStore(state => state.collectiveData);
  const setCollectiveData = useStore(state => state.setCollectiveData);
  const collectiveAverage = useStore(state => state.collectiveAverage);
  const setCollectiveAverage = useStore(state => state.setCollectiveAverage);
  const audioInitialized = useStore(state => state.audioInitialized);
  const setAudioInitialized = useStore(state => state.setAudioInitialized);
  
  const isControlPanelVisible = useStore(state => state.isControlPanelVisible);
  const showStatusPanel = useStore(state => state.showStatusPanel);
  const showCoherenceIndex = useStore(state => state.showCoherenceIndex);
  const showSystemIndicators = useStore(state => state.showSystemIndicators);
  const showMicroUniverseIndicator = useStore(state => state.showMicroUniverseIndicator);

  // Zoom handlers for LOD transitions
  const handleZoomIn = async () => {
    console.log('Zooming into micro-universe...');
    setIsInMicroUniverse(true);

    // Fetch collective data when entering micro-universe
    if (isBackendConnected) {
      try {
        const response = await api.getCollectiveData(1000, 24);
        if (response.success) {
          setCollectiveData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch collective data:', error);
      }
    }
  };

  const handleZoomOut = () => {
    console.log('Zooming out to macro view...');
    setIsInMicroUniverse(false);
  };

  // Screen shake effect for critical level
  useEffect(() => {
    if (sanity < 25) {
      const intensity = (25 - sanity) / 25; // 0 to 1
      setShakeIntensity(intensity * 8); // Max 8px shake
      
      const shakeInterval = setInterval(() => {
        setShakeIntensity((Math.random() - 0.5) * 2 * ((25 - sanity) / 25) * 8);
      }, 50);
      
      return () => clearInterval(shakeInterval);
    } else {
      setShakeIntensity(0);
    }
  }, [sanity, setShakeIntensity]);

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = async () => {
      if (!audioInitialized) {
        await audioManager.initialize();
        setAudioInitialized(true);
      }
    };

    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [audioInitialized, setAudioInitialized]);

  // Update audio based on sanity level
  useEffect(() => {
    if (audioInitialized) {
      audioManager.updateSanity(sanity);
    }
  }, [sanity, audioInitialized]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioManager.dispose();
    };
  }, []);

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      const health = await api.checkHealth();
      setIsBackendConnected(health.healthy);
      
      if (!health.healthy) {
        console.warn('Backend not available - running in offline mode');
      }
    };
    
    checkBackend();
  }, [setIsBackendConnected]);

  // Save sanity snapshots periodically
  useEffect(() => {
    if (!isBackendConnected) return;

    const interval = setInterval(async () => {
      try {
        await api.saveSnapshot(sanity);
      } catch (error) {
        console.error('Failed to save snapshot:', error);
      }
    }, 120000); 

    return () => clearInterval(interval);
  }, [sanity, isBackendConnected]);

  // Fetch collective data periodically
  useEffect(() => {
    if (!isBackendConnected) return;

    const fetchCollectiveData = async () => {
      try {
        const response = await api.getCollectiveData(1500, 48);
        if (response.success) {
          setCollectiveData(response.data);
          
          const avgResponse = await api.getCollectiveAverage(24);
          if (avgResponse.success) {
            setCollectiveAverage(avgResponse.data.average_sanity);
          }
        }
      } catch (error) {
        console.error('Failed to fetch collective data:', error);
      }
    };

    fetchCollectiveData(); 
    const interval = setInterval(fetchCollectiveData, 300000); 

    return () => clearInterval(interval);
  }, [isBackendConnected, setCollectiveData, setCollectiveAverage]);

  // Save session when user changes sanity significantly
  useEffect(() => {
    if (!isBackendConnected) return;

    const saveSession = async () => {
      try {
        await api.saveSession(sanity, {
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    };

    const timeoutId = setTimeout(saveSession, 2000);
    return () => clearTimeout(timeoutId);
  }, [sanity, isBackendConnected]);

  // Keyboard shortcuts
  useEffect(() => {
    const toggleControlPanel = useStore.getState().toggleControlPanel;
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isHelpVisible && event.key !== '?' && event.key !== '/') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'h':
          toggleControlPanel();
          break;
        case '1': setSanity(100); break;
        case '2': setSanity(50); break;
        case '3': setSanity(25); break;
        case '4': setSanity(10); break;
        case '5': setSanity(0); break; 
        case 'arrowup':
          event.preventDefault();
          setSanity(Math.min(100, useStore.getState().sanity + 5));
          break;
        case 'arrowdown':
          event.preventDefault();
          setSanity(Math.max(0, useStore.getState().sanity - 5));
          break;
        case ' ':
          event.preventDefault();
          toggleControlPanel();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isHelpVisible, setSanity]);

  return (
    <div
      className="sanity-orb-container relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950"
      style={{
        transform: `translate(${shakeIntensity * (Math.random() - 0.5) * 2}px, ${shakeIntensity * (Math.random() - 0.5) * 2}px)`,
        transition: 'transform 0.05s ease-out'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      
      {sanity < 25 && (
        <div 
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: `radial-gradient(circle at center, transparent 20%, rgba(139, 0, 0, ${(25 - sanity) / 25 * 0.3}) 100%)`,
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
      )}
      
      <div className={`absolute inset-0 transition-all duration-300 ${isHelpVisible ? 'blur-sm scale-[0.98]' : ''}`} style={{ zIndex: 0 }}>
        <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />}>
          <ThreeScene
            sanity={sanity}
            isControlPanelVisible={isControlPanelVisible}
            collectiveData={collectiveData}
            collectiveAverage={collectiveAverage}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        </Suspense>
      </div>
      
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
        }} 
      />

      <div className={`absolute inset-0 transition-all duration-300 ${isHelpVisible ? 'blur-sm opacity-0 pointer-events-none' : 'pointer-events-none'}`}>
        {showStatusPanel && <StatusPanel />}
        {showCoherenceIndex && <CoherenceIndex />}
        {showSystemIndicators && <SystemIndicators />}
        <RestoreComponentsMenu />
        <ControlPanel />
        <FunnyMessages />
      </div>

      {showMicroUniverseIndicator && isInMicroUniverse && collectiveData && (
        <div className={`absolute top-44 left-4 bg-purple-500/20 backdrop-blur-xl rounded-xl px-4 py-2 border border-purple-400/30 pointer-events-auto z-50 transition-all duration-300 hover:bg-purple-500/30 group ${isHelpVisible ? 'blur-sm opacity-0' : ''}`} data-ui-element="true">
          <div className="text-purple-300/60 text-xs uppercase tracking-wider mb-1">
            Micro-Universe Active
          </div>
          <div className="text-purple-200 text-lg font-light">
            {collectiveData.sessions.length + collectiveData.snapshots.length} minds
          </div>
          <div className="text-purple-300/40 text-xs mt-1">
            Collective consciousness
          </div>
          <button
            onClick={() => useStore.getState().setShowMicroUniverseIndicator(false)}
            className="absolute -top-2 -right-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
            title="Hide Micro-Universe Indicator"
          >
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className={`transition-all duration-300 ${isHelpVisible ? 'blur-sm' : ''}`}>
        <AudioControls />
      </div>
      
      <HelpOverlay onVisibilityChange={setHelpVisible} />

      <style>{/* ... css string ... */}</style>

      <DataAnalyticsButton />
      <DataAnalyticsPanel />
    </div>
  );
};

export default SanityOrb;