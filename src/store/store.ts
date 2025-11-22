import { create } from 'zustand';
import { CollectiveData } from '../services/api';

// Define the state shape and actions
interface SanityOrbState {
  // Core State
  sanity: number;
  isBackendConnected: boolean;
  
  // UI Visibility
  isControlPanelVisible: boolean;
  isHelpVisible: boolean;
  showStatusPanel: boolean;
  showCoherenceIndex: boolean;
  showSystemIndicators: boolean;
  showMicroUniverseIndicator: boolean;
  showDataAnalytics: boolean;

  // Orb & Scene State
  shakeIntensity: number;
  cameraAngles: {
    azimuth: number;
    elevation: number;
    distance: number;
  };

  // Micro-universe State
  isInMicroUniverse: boolean;
  collectiveData: CollectiveData | null;
  collectiveAverage: number | null;

  // Audio State
  audioInitialized: boolean;

  // Actions
  setSanity: (level: number) => void;
  setIsBackendConnected: (isConnected: boolean) => void;

  toggleControlPanel: () => void;
  setHelpVisible: (isVisible: boolean) => void;
  setShowStatusPanel: (show: boolean) => void;
  setShowCoherenceIndex: (show: boolean) => void;
  setShowSystemIndicators: (show: boolean) => void;
  setShowMicroUniverseIndicator: (show: boolean) => void;
  toggleDataAnalytics: () => void;
  
  setShakeIntensity: (intensity: number) => void;
  setCameraAngles: (angles: React.SetStateAction<{ azimuth: number; elevation: number; distance: number; }>) => void;
  
  setIsInMicroUniverse: (isMicro: boolean) => void;
  setCollectiveData: (data: CollectiveData | null) => void;
  setCollectiveAverage: (avg: number | null) => void;

  setAudioInitialized: (initialized: boolean) => void;
}

// Create the store
export const useStore = create<SanityOrbState>((set, get) => ({
  // Initial State
  sanity: 100,
  isBackendConnected: false,

  isControlPanelVisible: true,
  isHelpVisible: false,
  showStatusPanel: true,
  showCoherenceIndex: true,
  showSystemIndicators: true,
  showMicroUniverseIndicator: true,
  showDataAnalytics: false,

  shakeIntensity: 0,
  cameraAngles: {
    azimuth: 0,
    elevation: 0,
    distance: 6,
  },

  isInMicroUniverse: false,
  collectiveData: null,
  collectiveAverage: null,

  audioInitialized: false,

  // Actions implementations
  setSanity: (level) => set({ sanity: level }),
  setIsBackendConnected: (isConnected) => set({ isBackendConnected: isConnected }),

  toggleControlPanel: () => set(state => ({ isControlPanelVisible: !state.isControlPanelVisible })),
  setHelpVisible: (isVisible) => set({ isHelpVisible: isVisible }),
  setShowStatusPanel: (show) => set({ showStatusPanel: show }),
  setShowCoherenceIndex: (show) => set({ showCoherenceIndex: show }),
  setShowSystemIndicators: (show) => set({ showSystemIndicators: show }),
  setShowMicroUniverseIndicator: (show) => set({ showMicroUniverseIndicator: show }),
  toggleDataAnalytics: () => set(state => ({ showDataAnalytics: !state.showDataAnalytics })),

  setShakeIntensity: (intensity) => set({ shakeIntensity: intensity }),
  setCameraAngles: (angles) => set(state => ({
    cameraAngles: typeof angles === 'function' ? angles(state.cameraAngles) : angles
  })),
  
  setIsInMicroUniverse: (isMicro) => set({ isInMicroUniverse: isMicro }),
  setCollectiveData: (data) => set({ collectiveData: data }),
  setCollectiveAverage: (avg) => set({ collectiveAverage: avg }),

  setAudioInitialized: (initialized) => set({ audioInitialized: initialized }),
}));
