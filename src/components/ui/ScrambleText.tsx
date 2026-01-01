import React, { useState, useEffect, useRef } from 'react';

interface ScrambleTextProps {
  text: string;
  className?: string;
  speed?: number;
  scrambleCount?: number;
  trigger?: any;
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+<>?:{}|';

const ScrambleText: React.FC<ScrambleTextProps> = ({ 
  text, 
  className = '', 
  speed = 40, 
  scrambleCount = 3,
  trigger
}) => {
  const [displayText, setDisplayText] = useState(text);
  const frameRef = useRef<number | null>(null);
  const iterationRef = useRef(0);

  useEffect(() => {
    iterationRef.current = 0;
    
    const scramble = () => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (index < iterationRef.current) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iterationRef.current >= text.length) {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        return;
      }

      iterationRef.current += 1 / scrambleCount;
      frameRef.current = requestAnimationFrame(scramble);
    };

    scramble();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [text, trigger, scrambleCount]);

  return <span className={className}>{displayText}</span>;
};

export default ScrambleText;
