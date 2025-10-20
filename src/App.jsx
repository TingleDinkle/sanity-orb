import React, { useState } from "react";
import SanityOrb from "./components/SanityOrb";
import OpeningAnimation from "./components/animations/OpeningAnimation";

export default function App() {
  const [showOpening, setShowOpening] = useState(true);

  return (
    <div className="w-full h-screen">
      {showOpening ? (
        <OpeningAnimation onComplete={() => setShowOpening(false)} />
      ) : (
        <SanityOrb />
      )}
    </div>
  );
}
