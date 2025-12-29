import React, { useState, useEffect } from 'react';
import './InitialLoader.css';

const InitialLoader = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const LOOPS = 3;
  const ANIMATION_DURATION = 1200; // ms per loop

  useEffect(() => {
    // Wait for all loops to complete
    const totalDuration = LOOPS * ANIMATION_DURATION;
    
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Wait for fade out transition before calling onComplete
      setTimeout(() => {
        onComplete();
      }, 600); // matches CSS fade transition
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`initial-loader ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loader-content">
        <div className="basketball-animation">
          <div className="player">
            <div className="player-body"></div>
            <div className="player-arm"></div>
          </div>
          <div className="basketball"></div>
          <div className="hoop">
            <div className="hoop-rim"></div>
            <div className="hoop-net"></div>
          </div>
        </div>
        <div className="loader-text">Loading NBA Analyzer...</div>
        <div className="loader-subtext">Preparing predictions</div>
      </div>
    </div>
  );
};

export default InitialLoader;
