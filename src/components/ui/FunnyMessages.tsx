import React, { useState, useEffect } from 'react';

interface FunnyMessagesProps {
  sanity: number;
}

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
  "have you tried sudo pacman -S brain",
  
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
  "Have you tried turning it off and on again? (But harder)",
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

const getMessageColors = () => {
  return {
    bg: 'from-orange-500/30 to-orange-600/20',
    border: 'border-orange-400/40',
    accent: 'bg-orange-400/60',
    text: 'text-orange-100',
    pulse: 'bg-orange-400/10'
  };
};

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

const FunnyMessages: React.FC<FunnyMessagesProps> = ({ sanity }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageId, setMessageId] = useState(0);

  // Floating animation effect - much less frequent to reduce CPU load
  useEffect(() => {
    const floatInterval = setInterval(() => {
      setMessages(prev => prev.map(msg => {
        const timeSinceCreated = (Date.now() - msg.createdAt) * 0.001;
        const floatOffset = Math.sin(timeSinceCreated * 2) * 8; // Gentle floating
        return { ...msg, floatOffset };
      }));
    }, 200); // Reduced from 50ms to 200ms (4x less frequent)

    return () => clearInterval(floatInterval);
  }, [messages]);

  useEffect(() => {
    // Only show messages in WARNING range (25-50)
    if (sanity >= 25 && sanity < 50) {
      let timeoutId: NodeJS.Timeout;
      
      const showMessage = () => {
        const randomMessage = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
        
        // Generate random position around the orb (center of screen) - avoid top area
        const angle = Math.random() * Math.PI * 2;
        const distance = 180 + Math.random() * 200; // 180-380px from center
        
        // Avoid the top 200px where status bar is located
        let x = Math.cos(angle) * distance;
        let y = Math.sin(angle) * distance;
        
        // If message would appear in top area, adjust it down
        if (y < -100) { // Top half of screen
          y = Math.abs(y) + 50; // Move it to bottom half
        }
        
        const newMessage: Message = {
          id: messageId,
          text: randomMessage,
          x: x,
          y: y,
          opacity: 0,
          scale: 0.5,
          rotation: (Math.random() - 0.5) * 0.3, // Slight random rotation
          floatOffset: 0,
          createdAt: Date.now()
        };
        
        // Only add message if we don't have any already (max 1 message)
        setMessages(prev => {
          if (prev.length >= 1) {
            return prev; // Don't add more messages
          }
          return [...prev, newMessage];
        });
        setMessageId(prev => prev + 1);
        
        // Animate in
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, opacity: 1, scale: 1 }
              : msg
          ));
        }, 50);
        
        // Animate out after 2 seconds
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, opacity: 0, scale: 0.8 }
              : msg
          ));
          
          // Remove from array after fade out
          setTimeout(() => {
            setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
          }, 500);
        }, 2000);
        
        // Schedule next message - 8-12 seconds between messages
        const nextDelay = 8000 + Math.random() * 4000;
        timeoutId = setTimeout(showMessage, nextDelay);
      };
      
      showMessage();
      
      // Cleanup function to clear timeout
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    } else {
      // Clear all messages when not in warning range
      setMessages([]);
    }
  }, [sanity, messageId]);

  // Only show messages in WARNING range (25-50)
  if (sanity < 25 || sanity >= 50) return null;

  const colors = getMessageColors();

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {messages.map((message) => (
        <div
          key={message.id}
          className="absolute transform transition-all duration-700 ease-out"
          style={{
            left: `50%`,
            top: `50%`,
            transform: `translate(calc(-50% + ${message.x}px), calc(-50% + ${message.y + message.floatOffset}px)) rotate(${message.rotation}rad)`,
            opacity: message.opacity,
            scale: message.scale,
            filter: 'drop-shadow(0 0 10px rgba(255, 165, 0, 0.3))',
          }}
        >
          <div className={`bg-gradient-to-br ${colors.bg} backdrop-blur-xl rounded-lg px-3 py-2 border-2 ${colors.border} shadow-2xl max-w-xs relative`}>
            {/* Minecraft-style corner accents */}
            <div className={`absolute -top-1 -left-1 w-2 h-2 ${colors.accent} rounded-sm`}></div>
            <div className={`absolute -top-1 -right-1 w-2 h-2 ${colors.accent} rounded-sm`}></div>
            <div className={`absolute -bottom-1 -left-1 w-2 h-2 ${colors.accent} rounded-sm`}></div>
            <div className={`absolute -bottom-1 -right-1 w-2 h-2 ${colors.accent} rounded-sm`}></div>
            
            <div className={`${colors.text} text-sm font-medium text-center tracking-wide whitespace-nowrap relative z-10`}>
              {message.text}
            </div>
            
            {/* Subtle pulsing effect */}
            <div 
              className={`absolute inset-0 rounded-lg ${colors.pulse} animate-pulse`}
              style={{ animationDuration: '2s' }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FunnyMessages;