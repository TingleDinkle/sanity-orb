import React, { useState, useRef, useEffect } from 'react';

interface SystemIndicatorsProps {
  sanity: number;
}

const SystemIndicators: React.FC<SystemIndicatorsProps> = ({ sanity }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const getIndicatorColor = () => {
    if (sanity >= 75) return 'bg-green-400';
    if (sanity >= 50) return 'bg-yellow-400';
    if (sanity >= 25) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div 
      className={`absolute pointer-events-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: position.x || '32px',
        top: position.y || '32px',
        zIndex: 1000
      }}
      onMouseDown={handleMouseDown}
      ref={panelRef}
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10 shadow-2xl space-y-3 select-none">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${getIndicatorColor()} animate-pulse`} />
          <span className="text-white/50 text-xs tracking-wider">Digital Consciousness</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-white/50 text-xs tracking-wider">Network Stability</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-white/50 text-xs tracking-wider">Data Flow Sync</span>
        </div>
      </div>
    </div>
  );
};

export default SystemIndicators;
