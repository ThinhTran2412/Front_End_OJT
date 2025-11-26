import React from 'react';
import RingSpinner from './RingSpinner';

const LoadingOverlay = ({ 
  isVisible = false, 
  text = "Loading", 
  size = "large",
  theme = "blue",
  backdrop = true,
  className = ""
}) => {
  if (!isVisible) return null;

  return (
    <div className={`loading-overlay ${backdrop ? 'with-backdrop' : ''} ${className}`}>
      <div className="loading-content">
        <RingSpinner 
          text={text} 
          size={size} 
          theme={theme}
        />
      </div>
      
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .loading-overlay.with-backdrop {
          background-color: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(4px);
        }
        
        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          border-radius: 1rem;
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .loading-overlay:not(.with-backdrop) .loading-content {
          background: transparent;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;
