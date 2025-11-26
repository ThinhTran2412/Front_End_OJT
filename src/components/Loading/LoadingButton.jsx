import React from 'react';
import RingSpinner from './RingSpinner';

const LoadingButton = ({ 
  loading = false,
  children,
  loadingText = "Loading...",
  size = "small",
  theme = "blue",
  className = "",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`${className} ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <RingSpinner size={size} text="" theme={theme} />
          {loadingText && <span>{loadingText}</span>}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
