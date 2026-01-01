import React, { useState, useEffect, memo } from 'react';
import { useStore } from '../../store/store';
import GlassPanel from './GlassPanel';
import ScrambleText from './ScrambleText';

const FUNNY_MESSAGES = [
  // Tech Support Classics
  "Have you tried turning it off and on again?",
  "Is it plugged in?",
  "Did you check the cables?",
  "Have you tried a different browser?",
  "Clear your cache and cookies",
  "Restart your router",
  "Check your internet connection",
  
  // Error Messages
  "404: Sanity not found",
  "Error 500: Internal server error",
  "Blue screen of death incoming",
  "Error: Human.exe has stopped working",
  "Error: Cannot compute sanity",
  "Error: Reality not responding",
  "Error: Logic.exe has crashed",
  "Error: Common sense not found",
  
  // Internet Problems
  "The internet is having a bad day",
  "The servers are crying in binary",
  "The cloud is having thunderstorms",
  "The matrix is glitching",
  "The digital realm is experiencing turbulence",
  "The internet forgot to take its meds",
  "The internet is having a midlife crisis",
  "The internet is having a panic attack",
  "The internet is having an existential crisis",
  "The servers are having a bad day",
  "The internet needs a coffee break",
  "The matrix needs therapy",
  
  // Programming Humor
  "Ctrl+Alt+Delete your problems",
  "WiFi password: 'password123'",
  "It works on my machine",
  "That's not a bug, it's a feature",
  "Have you tried sudo?",
  "Just add more RAM",
  "Have you tried Stack Overflow?",
  "The code is self-documenting",
  "It's a known issue",
  "Works as intended",
  "Have you tried sudo pacman -S brain?",
  
  // System Messages
  "Please hold while we reboot reality",
  "System overload detected",
  "Memory leak in progress",
  "Buffer overflow imminent",
  "Stack overflow detected",
  "Null pointer exception",
  "Infinite loop detected",
  "Deadlock in progress",
  "Race condition detected",
  "Segmentation fault",
  
  // Funny Tech Terms
  "The flux capacitor is broken",
  "The quantum entanglement is unstable",
  "The neural network is having a breakdown",
  "The blockchain is corrupted",
  "The algorithm is confused",
  "The database is having trust issues",
  "The API is not responding to therapy",
  "The cache is having memory problems",
  "The firewall is being too protective",
  "The proxy server is hiding something",
  
  // Pop Culture References
  "Houston, we have a problem",
  "I'm sorry Dave, I'm afraid I can't do that",
  "The cake is a lie",
  "All your base are belong to us",
  "It's not a bug, it's a feature",
  "The system is down",
  "Please do not power off or unplug",
  "Loading... please wait",
  "This may take a while",
  "Please be patient",
  
  // Absurd Tech Support
  "Have you tried percussive maintenance?",
  "Did you check if it's Tuesday?",
  "Have you tried turning it upside down?",
  "Is it plugged into the right dimension?",
  "Have you tried asking it nicely?",
  "Did you try the magic smoke?",
  "Have you tried sacrificing a goat?",
  "Is it plugged into the internet?",
  "Did you check if it's a leap year?",
  
  // System Status Messages
  "Network stability compromised",
  "Digital consciousness destabilized",
  "Reality anchor disengaged",
  "Temporal sync lost",
  "Neural pathways fragmented",
  "Data integrity compromised",
  "System coherence failing",
  "Digital realm collapsing",
  "Internet consciousness fragmented",
  "Network reality breaking down"
];

interface Message {
  id: number;
  text: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotation: number;
  floatOffset: number;
  createdAt: number;
}

const FunnyMessages: React.FC = () => {
  const sanity = useStore(state => state.sanity);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageId, setMessageId] = useState(0);

  // Floating animation effect
  useEffect(() => {
    const floatInterval = setInterval(() => {
      setMessages(prev => prev.map(msg => {
        const timeSinceCreated = (Date.now() - msg.createdAt) * 0.001;
        const floatOffset = Math.sin(timeSinceCreated * 2) * 8;
        return { ...msg, floatOffset };
      }));
    }, 200);

    return () => clearInterval(floatInterval);
  }, []);

  useEffect(() => {
    if (sanity >= 25 && sanity < 50) {
      let timeoutId: NodeJS.Timeout;
      
      const showMessage = () => {
        const randomMessage = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 150;
        
        let x = Math.cos(angle) * distance;
        let y = Math.sin(angle) * distance;
        if (y < -100) y = Math.abs(y) + 50;
        
        const newMessage: Message = {
          id: messageId,
          text: randomMessage,
          x: x,
          y: y,
          opacity: 0,
          scale: 0.5,
          rotation: (Math.random() - 0.5) * 0.2,
          floatOffset: 0,
          createdAt: Date.now()
        };
        
        setMessages(prev => prev.length >= 1 ? prev : [...prev, newMessage]);
        setMessageId(prev => prev + 1);
        
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id ? { ...msg, opacity: 1, scale: 1 } : msg
          ));
        }, 50);
        
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id ? { ...msg, opacity: 0, scale: 0.8 } : msg
          ));
          setTimeout(() => {
            setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
          }, 500);
        }, 3000);
        
        const nextDelay = 8000 + Math.random() * 4000;
        timeoutId = setTimeout(showMessage, nextDelay);
      };
      
      showMessage();
      return () => { if (timeoutId) clearTimeout(timeoutId); };
    } else {
      setMessages([]);
    }
  }, [sanity, messageId]);

  if (sanity < 25 || sanity >= 50) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {messages.map((message) => (
        <div
          key={message.id}
          className="absolute transform transition-all duration-1000 ease-out"
          style={{
            left: `50%`,
            top: `50%`,
            transform: `translate(calc(-50% + ${message.x}px), calc(-50% + ${message.y + message.floatOffset}px)) rotate(${message.rotation}rad)`,
            opacity: message.opacity,
            scale: message.scale,
          }}
        >
          <GlassPanel intensity="low" className="px-4 py-2 border-orange-500/20 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
            <div className="flex flex-col items-center">
              <div className="text-[8px] text-orange-400/40 uppercase tracking-[0.2em] font-mono mb-1">
                Neural Glitch Detct
              </div>
              <div className="text-orange-200 text-xs font-mono font-medium text-center">
                <ScrambleText text={message.text} trigger={message.id} speed={40} />
              </div>
            </div>
          </GlassPanel>
        </div>
      ))}
    </div>
  );
};

export default memo(FunnyMessages);