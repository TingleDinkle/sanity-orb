import React, { useState, useRef, useEffect } from 'react';
import { getSanityLabel, getSanityDescription, getGradientColor } from '../../utils/sanityUtils';

interface StatusPanelProps {
  sanity: number;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ sanity }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

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
      className={`absolute text-center pointer-events-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: position.x || '50%',
        top: position.y || '32px',
        transform: position.x ? 'none' : 'translateX(-50%)',
        zIndex: 1000
      }}
      onMouseDown={handleMouseDown}
      ref={panelRef}
    >
      <div className={`bg-gradient-to-br ${getGradientColor(sanity)} backdrop-blur-xl rounded-3xl px-10 py-5 border border-white/10 shadow-2xl transition-all duration-700 select-none`}>
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2 font-light">
          Internet Sanity Orb Status
        </div>
        <h1 className="text-white text-5xl font-extralight tracking-wider mb-3 transition-all duration-500">
          {getSanityLabel(sanity)}
        </h1>
        <p className="text-white/50 text-sm tracking-wide leading-relaxed max-w-md">
          {getSanityDescription(sanity)}
        </p>
      </div>
    </div>
  );
};

export default StatusPanel;
