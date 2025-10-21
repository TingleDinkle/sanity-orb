import React, { useState, useRef, useEffect } from 'react';

interface CoherenceIndexProps {
  sanity: number;
}

const CoherenceIndex: React.FC<CoherenceIndexProps> = ({ sanity }) => {
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
      className={`absolute pointer-events-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: position.x || 'calc(100% - 200px)',
        top: position.y || '32px',
        zIndex: 1000
      }}
      onMouseDown={handleMouseDown}
      ref={panelRef}
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-7 py-4 border border-white/10 shadow-2xl select-none">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2 font-light">
          Digital Coherence Index
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-white text-4xl font-extralight tabular-nums transition-all duration-300">
            {sanity}
          </div>
          <span className="text-white/30 text-xl font-light">%</span>
        </div>
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-white/60 to-white/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${sanity}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CoherenceIndex;
