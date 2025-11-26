import React from 'react';
import RingSpinner from './RingSpinner';

const InlineLoader = ({ 
  text = "Loading", 
  size = "small",
  theme = "blue",
  centered = true,
  className = ""
}) => {
  return (
    <div className={`inline-loader ${centered ? 'centered' : ''} ${className}`}>
      <RingSpinner 
        text={text} 
        size={size} 
        theme={theme}
      />
      
      <style jsx>{`
        .inline-loader {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 1rem;
        }
        
        .inline-loader.centered {
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default InlineLoader;
