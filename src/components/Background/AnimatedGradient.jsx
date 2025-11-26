import { useEffect, useRef } from 'react';
import { NeatGradient } from '@firecms/neat';

const AnimatedGradient = ({ className = "", style = {} }) => {
  const canvasRef = useRef(null);
  const gradientRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Neat gradient configuration
    const config = {
      colors: [
          {
              color: '#4646AD',
              enabled: true,
          },
          {
              color: '#599BE2',
              enabled: true,
          },
          {
              color: '#D8C3CB',
              enabled: true,
          },
          {
              color: '#DAE4E6',
              enabled: true,
          },
          {
              color: '#6FB2EF',
              enabled: false,
          },
      ],
      speed: 4.5,
      horizontalPressure: 3,
      verticalPressure: 6,
      waveFrequencyX: 2,
      waveFrequencyY: 4,
      waveAmplitude: 6,
      shadows: 0,
      highlights: 4,
      colorBrightness: 1,
      colorSaturation: 3,
      wireframe: false,
      colorBlending: 10,
      backgroundColor: '#003FFF',
      backgroundAlpha: 1,
      grainScale: 0,
      grainSparsity: 0,
      grainIntensity: 0,
      grainSpeed: 0,
      resolution: 2,
      yOffset: 0,
  };
  

    try {
      // Create the gradient
      gradientRef.current = new NeatGradient({
        ref: canvasRef.current,
        ...config
      });
    } catch (error) {
      console.error('Error initializing Neat gradient:', error);
    }

    // Cleanup function
    return () => {
      if (gradientRef.current && typeof gradientRef.current.destroy === 'function') {
        gradientRef.current.destroy();
      }
    };
  }, []);

  return (
    <div 
      className={`absolute inset-0 ${className}`}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          willChange: 'transform',
          transform: 'translateZ(0)', // Force hardware acceleration
          backfaceVisibility: 'hidden' // Optimize for animations
        }}
      />
    </div>
  );
};

export default AnimatedGradient;
