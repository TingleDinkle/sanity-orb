import React, { useState, useEffect } from 'react';
import ThreeScene from './three/ThreeScene';
import StatusPanel from './ui/StatusPanel';
import CoherenceIndex from './ui/CoherenceIndex';
import SystemIndicators from './ui/SystemIndicators';
import ControlPanel from './ui/ControlPanel';
import HelpOverlay from './ui/HelpOverlay';
import FunnyMessages from './ui/FunnyMessages';
import AudioControls from './ui/AudioControls';
import RestoreComponentsMenu from './ui/RestoreComponentsMenu';
import { audioManager } from '../utils/audioManager';
import DataAnalyticsPanel from './ui/DataAnalyticsPanel';
import DataAnalyticsButton from './ui/DataAnalyticsButton';
import { api } from '../services/api';

const SanityOrb: React.FC = () => {
  const [sanity, setSanity] = useState(100);
  const [isControlPanelVisible, setIsControlPanelVisible] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(true);
  const [showCoherenceIndex, setShowCoherenceIndex] = useState(true);
  const [showSystemIndicators, setShowSystemIndicators] = useState(true);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [showDataAnalytics, setShowDataAnalytics] = useState(false);
  
  // Backend integration state
  const [globalMood, setGlobalMood] = useState<number | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Screen shake effect for critical level
  useEffect(() => {
    if (sanity < 25) {
      // Increase shake intensity as sanity decreases
      const intensity = (25 - sanity) / 25; // 0 to 1
      setShakeIntensity(intensity * 8); // Max 8px shake
      
      const shakeInterval = setInterval(() => {
        setShakeIntensity(prev => {
          // Random shake with current intensity
          return (Math.random() - 0.5) * 2 * ((25 - sanity) / 25) * 8;
        });
      }, 50); // Update shake every 50ms
      
      return () => clearInterval(shakeInterval);
    } else {
      setShakeIntensity(0);
    }
  }, [sanity]);

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
  }, [audioInitialized]);

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
  }, []);

  // Save sanity snapshots periodically (for global mood tracking)
  useEffect(() => {
    if (!isBackendConnected) return;

    const interval = setInterval(async () => {
      try {
        await api.saveSnapshot(sanity);
      } catch (error) {
        console.error('Failed to save snapshot:', error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [sanity, isBackendConnected]);

  // Fetch global mood periodically
  useEffect(() => {
    if (!isBackendConnected) return;

    const fetchGlobalMood = async () => {
      try {
        const response = await api.getCurrentMood();
        if (response.success) {
          setGlobalMood(response.currentMood);
        }
      } catch (error) {
        console.error('Failed to fetch global mood:', error);
      }
    };

    fetchGlobalMood();
    const interval = setInterval(fetchGlobalMood, 60000); // Every minute

    return () => clearInterval(interval);
  }, [isBackendConnected]);

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

    // Debounce saves to avoid too many API calls
    const timeoutId = setTimeout(saveSession, 2000);
    return () => clearTimeout(timeoutId);
  }, [sanity, isBackendConnected]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't handle shortcuts if help is visible (except for ? key which is handled by HelpOverlay)
      if (isHelpVisible && event.key !== '?' && event.key !== '/') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'h':
          setIsControlPanelVisible(!isControlPanelVisible);
          break;
        case '1':
          setSanity(100);
          break;
        case '2':
          setSanity(50);
          break;
        case '3':
          setSanity(25);
          break;
        case '4':
          setSanity(10);
          break;
        case '5':
          setSanity(10);
          break;
        case 'arrowup':
          event.preventDefault();
          setSanity(prev => Math.min(100, prev + 5));
          break;
        case 'arrowdown':
          event.preventDefault();
          setSanity(prev => Math.max(0, prev - 5));
          break;
        case ' ':
          event.preventDefault();
          setIsControlPanelVisible(!isControlPanelVisible);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isControlPanelVisible, isHelpVisible]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950"
      style={{
        transform: `translate(${shakeIntensity * (Math.random() - 0.5) * 2}px, ${shakeIntensity * (Math.random() - 0.5) * 2}px)`,
        transition: 'transform 0.05s ease-out'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      
      {/* Critical level ominous overlay */}
      {sanity < 25 && (
        <div 
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: `radial-gradient(circle at center, transparent 20%, rgba(139, 0, 0, ${(25 - sanity) / 25 * 0.3}) 100%)`,
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
      )}
      
      {/* Apply blur to scene when help is visible */}
      <div className={`absolute inset-0 transition-all duration-300 ${isHelpVisible ? 'blur-sm scale-[0.98]' : ''}`}>
        <ThreeScene sanity={sanity} isControlPanelVisible={isControlPanelVisible} />
      </div>
      
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
        }} 
      />

      {/* UI Components - blur and hide status panel when help is visible */}
      <div className={`absolute inset-0 transition-all duration-300 ${isHelpVisible ? 'blur-sm opacity-0 pointer-events-none' : ''}`}>
        {showStatusPanel && (
          <StatusPanel 
            sanity={sanity} 
            onHide={() => setShowStatusPanel(false)}
          />
        )}
        
        {showCoherenceIndex && (
          <CoherenceIndex 
            sanity={sanity}
            onHide={() => setShowCoherenceIndex(false)}
          />
        )}
        
        {showSystemIndicators && (
          <SystemIndicators 
            sanity={sanity}
            onHide={() => setShowSystemIndicators(false)}
          />
        )}
        
        <RestoreComponentsMenu
          showStatusPanel={showStatusPanel}
          showCoherenceIndex={showCoherenceIndex}
          showSystemIndicators={showSystemIndicators}
          onRestoreStatusPanel={() => setShowStatusPanel(true)}
          onRestoreCoherenceIndex={() => setShowCoherenceIndex(true)}
          onRestoreSystemIndicators={() => setShowSystemIndicators(true)}
        />
        
        <ControlPanel 
          sanity={sanity} 
          onSanityChange={setSanity}
          isVisible={isControlPanelVisible}
          onToggleVisibility={() => setIsControlPanelVisible(!isControlPanelVisible)}
        />
        
        {/* Funny messages only show in warning range (25-50) */}
        <FunnyMessages sanity={sanity} />
      </div>

      {/* Global Mood Indicator - shows when backend is connected */}
      {globalMood !== null && isBackendConnected && (
        <div className={`absolute top-20 left-4 bg-white/5 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10 pointer-events-auto z-50 transition-all duration-300 ${isHelpVisible ? 'blur-sm opacity-0' : ''}`}>
          <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
            Global Internet Mood
          </div>
          <div className="text-white text-2xl font-light">
            {globalMood}%
          </div>
          <div className="text-white/30 text-xs mt-1">
            Collective consciousness
          </div>
        </div>
      )}

      {/* Audio controls - blur when help is visible but keep visible */}
      <div className={`transition-all duration-300 ${isHelpVisible ? 'blur-sm' : ''}`}>
        <AudioControls />
      </div>
      
      {/* Help overlay - always on top, no blur */}
      <HelpOverlay onVisibilityChange={setIsHelpVisible} />

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(255, 255, 255, 0.8);
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* Data Analytics Button - visible when help is not shown */}
    {!isHelpVisible && (
      <div className={`transition-all duration-300 ${isHelpVisible ? 'blur-sm' : ''}`}>
        <DataAnalyticsButton 
          onClick={() => setShowDataAnalytics(true)}
          isConnected={isBackendConnected}
        />
      </div>
    )}

    {/* Data Analytics Panel - always on top, no blur */}
    <DataAnalyticsPanel 
      isVisible={showDataAnalytics}
      onClose={() => setShowDataAnalytics(false)}
      currentSanity={sanity}
    />
    </div>
  );
};

export default SanityOrb;