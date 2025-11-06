import React from 'react';

const DataAnalyticsButton = ({ onClick, isConnected }) => {
  return (
    <div className="absolute bottom-8 right-8 pointer-events-auto z-50">
      <button
        onClick={onClick}
        className="group relative bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-2xl transition-all duration-300 hover:scale-110 hover:from-blue-500/30 hover:to-purple-600/30 active:scale-95"
        title="Open Data Analytics"
      >
        {/* Connection Status Indicator */}
        {isConnected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
        )}
        
        {/* Icon */}
        <div className="relative">
          <svg className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          
          {/* Pulse Animation */}
          <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping" />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-xl rounded-lg border border-white/20 text-white/90 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Data Analytics
          {!isConnected && (
            <div className="text-xs text-yellow-400 mt-0.5">⚠️ Offline Mode</div>
          )}
        </div>
      </button>

      {/* Optional: Quick Stats Preview */}
      <div className="mt-3 bg-white/5 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Quick Access</div>
        <div className="text-white/80 text-xs">
          View trends & predictions
        </div>
      </div>
    </div>
  );
};

export default DataAnalyticsButton;