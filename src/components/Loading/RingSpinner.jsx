import React from 'react';
import './RingSpinner.css';

const RingSpinner = ({ 
  size = 24, 
  text = "", 
  className = "",
  theme = "blue"
}) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32
  };

  const actualSize = typeof size === 'string' ? sizeMap[size] || 24 : size;

  const themeColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    indigo: 'text-indigo-600',
    pink: 'text-pink-600',
    gray: 'text-gray-600'
  };

  const colorClass = themeColors[theme] || themeColors.blue;

  return (
    <div className={`ring-spinner-container ${className}`}>
      <svg
        height={actualSize}
        stroke="currentColor"
        viewBox="0 0 44 44"
        width={actualSize}
        xmlns="http://www.w3.org/2000/svg"
        className={`ring-spinner ${colorClass}`}
      >
        <title>Loading...</title>
        <g fill="none" fillRule="evenodd" strokeWidth="2">
          <circle cx="22" cy="22" r="1">
            <animate
              attributeName="r"
              begin="0s"
              calcMode="spline"
              dur="1.8s"
              keySplines="0.165, 0.84, 0.44, 1"
              keyTimes="0; 1"
              repeatCount="indefinite"
              values="1; 20"
            />
            <animate
              attributeName="stroke-opacity"
              begin="0s"
              calcMode="spline"
              dur="1.8s"
              keySplines="0.3, 0.61, 0.355, 1"
              keyTimes="0; 1"
              repeatCount="indefinite"
              values="1; 0"
            />
          </circle>
          <circle cx="22" cy="22" r="1">
            <animate
              attributeName="r"
              begin="-0.9s"
              calcMode="spline"
              dur="1.8s"
              keySplines="0.165, 0.84, 0.44, 1"
              keyTimes="0; 1"
              repeatCount="indefinite"
              values="1; 20"
            />
            <animate
              attributeName="stroke-opacity"
              begin="-0.9s"
              calcMode="spline"
              dur="1.8s"
              keySplines="0.3, 0.61, 0.355, 1"
              keyTimes="0; 1"
              repeatCount="indefinite"
              values="1; 0"
            />
          </circle>
        </g>
      </svg>
      {text && (
        <span className={`ring-spinner-text ${colorClass}`}>
          {text}
        </span>
      )}
    </div>
  );
};

export default RingSpinner;
