import React from 'react';

/**
 * BloodTestAnimation Component
 * Displays an animated SVG showing the blood test analysis process
 * Used during loading states to represent data collection from various services
 */
const BloodTestAnimation = ({ 
  className = "", 
  showTitle = true, 
  size = "large",
  message = "Collecting data from laboratory services..."
}) => {
  const sizeClasses = {
    small: "w-64 h-40",
    medium: "w-96 h-64", 
    large: "w-96 h-96",
    full: "w-full h-full"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {showTitle && (
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Laboratory Analysis in Progress
          </h3>
          <p className="text-sm text-gray-600 animate-pulse">
            {message}
          </p>
        </div>
      )}
      
      <div className={`${sizeClasses[size]} ${size === 'large' ? 'max-w-none' : 'max-w-6xl'} mx-auto`}>
        <svg 
          viewBox="0 0 1200 800" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="machineBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#e8eef5", stopOpacity:1}}/>
              <stop offset="50%" style={{stopColor:"#f8f9fa", stopOpacity:1}}/>
              <stop offset="100%" style={{stopColor:"#d3dce6", stopOpacity:1}}/>
            </linearGradient>
            
            <linearGradient id="screenGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"#1e3a5f", stopOpacity:1}}/>
              <stop offset="100%" style={{stopColor:"#0f1c2e", stopOpacity:1}}/>
            </linearGradient>
            
            <linearGradient id="bloodSample" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"#ff6b6b", stopOpacity:0.9}}/>
              <stop offset="100%" style={{stopColor:"#c92a2a", stopOpacity:1}}/>
            </linearGradient>
            
            <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor:"#2c5282", stopOpacity:1}}/>
              <stop offset="100%" style={{stopColor:"#1a365d", stopOpacity:1}}/>
            </linearGradient>

            <radialGradient id="buttonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{stopColor:"#4ade80", stopOpacity:1}}/>
              <stop offset="100%" style={{stopColor:"#22c55e", stopOpacity:1}}/>
            </radialGradient>
            
            {/* Filters */}
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
              <feOffset dx="3" dy="3" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.4"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background - removed, using transparent */}
          
          {/* Main Machine Body */}
          <g id="beckmanMachine" filter="url(#shadow)">
            {/* Base */}
            <rect x="350" y="550" width="450" height="100" fill="#5a6f8f" rx="5"/>
            <rect x="360" y="560" width="430" height="15" fill="#4a5f7f" rx="3"/>
            
            {/* Main Body */}
            <rect x="350" y="200" width="450" height="350" fill="url(#machineBody)" rx="8"/>
            <rect x="355" y="205" width="440" height="340" fill="none" stroke="#b0bec5" strokeWidth="2" rx="8"/>
            
            {/* Front Panel */}
            <rect x="370" y="220" width="410" height="60" fill="url(#panelGradient)" rx="5"/>
            <text x="575" y="255" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#ffffff" textAnchor="middle">
              Hematology Analyzer System
            </text>
            
            {/* Main Screen */}
            <rect x="390" y="300" width="370" height="220" rx="8" fill="url(#screenGlow)" stroke="#1e3a5f" strokeWidth="3"/>
            
            {/* Screen Content - Data Display */}
            <g id="screenData">
              {/* Header */}
              <rect x="400" y="310" width="350" height="30" fill="#2c5282" opacity="0.8"/>
              <text x="575" y="330" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="#4ade80" textAnchor="middle">
                ANALYSIS RESULTS
                <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite"/>
              </text>
              
              {/* Data Rows */}
              <g id="dataRows">
                <text x="410" y="360" fontFamily="monospace" fontSize="11" fill="#60a5fa">WBC: 7,250 cells/μL
                  <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="1.5s" repeatCount="indefinite"/>
                </text>
                <rect x="550" y="350" width="180" height="4" fill="#3b82f6" rx="2">
                  <animate attributeName="width" values="0;180;180;0;0" dur="15s" begin="1.7s" repeatCount="indefinite"/>
                </rect>
                
                <text x="410" y="380" fontFamily="monospace" fontSize="11" fill="#f87171">RBC: 5.2 M/μL
                  <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="1.9s" repeatCount="indefinite"/>
                </text>
                <rect x="550" y="370" width="160" height="4" fill="#ef4444" rx="2">
                  <animate attributeName="width" values="0;160;160;0;0" dur="15s" begin="2.1s" repeatCount="indefinite"/>
                </rect>
                
                <text x="410" y="400" fontFamily="monospace" fontSize="11" fill="#fb923c">HGB: 15.3 g/dL
                  <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="2.3s" repeatCount="indefinite"/>
                </text>
                <rect x="550" y="390" width="170" height="4" fill="#f97316" rx="2">
                  <animate attributeName="width" values="0;170;170;0;0" dur="15s" begin="2.5s" repeatCount="indefinite"/>
                </rect>
                
                <text x="410" y="420" fontFamily="monospace" fontSize="11" fill="#a78bfa">HCT: 45.2%
                  <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="2.7s" repeatCount="indefinite"/>
                </text>
                <rect x="550" y="410" width="165" height="4" fill="#8b5cf6" rx="2">
                  <animate attributeName="width" values="0;165;165;0;0" dur="15s" begin="2.9s" repeatCount="indefinite"/>
                </rect>
                
                <text x="410" y="440" fontFamily="monospace" fontSize="11" fill="#fbbf24">PLT: 245K/μL
                  <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="3.1s" repeatCount="indefinite"/>
                </text>
                <rect x="550" y="430" width="175" height="4" fill="#f59e0b" rx="2">
                  <animate attributeName="width" values="0;175;175;0;0" dur="15s" begin="3.3s" repeatCount="indefinite"/>
                </rect>
                
                <text x="410" y="460" fontFamily="monospace" fontSize="11" fill="#34d399">MCV: 88.5 fL
                  <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="3.5s" repeatCount="indefinite"/>
                </text>
                <rect x="550" y="450" width="155" height="4" fill="#10b981" rx="2">
                  <animate attributeName="width" values="0;155;155;0;0" dur="15s" begin="3.7s" repeatCount="indefinite"/>
                </rect>
                
                <text x="410" y="480" fontFamily="monospace" fontSize="11" fill="#38bdf8">MCH: 29.8 pg
                  <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="3.9s" repeatCount="indefinite"/>
                </text>
                <rect x="550" y="470" width="168" height="4" fill="#0ea5e9" rx="2">
                  <animate attributeName="width" values="0;168;168;0;0" dur="15s" begin="4.1s" repeatCount="indefinite"/>
                </rect>
                
                <text x="410" y="500" fontFamily="monospace" fontSize="11" fill="#c084fc">MCHC: 33.7 g/dL
                  <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="4.3s" repeatCount="indefinite"/>
                </text>
                <rect x="550" y="490" width="172" height="4" fill="#a855f7" rx="2">
                  <animate attributeName="width" values="0;172;172;0;0" dur="15s" begin="4.5s" repeatCount="indefinite"/>
                </rect>
              </g>
              
              {/* Status Indicator */}
              <circle cx="730" cy="320" r="6" fill="#4ade80" filter="url(#glow)">
                <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <text x="710" y="325" fontFamily="monospace" fontSize="10" fill="#4ade80">●</text>
            </g>
            
            {/* Control Panel */}
            <g id="controlPanel">
              {/* Power Button */}
              <circle cx="390" cy="565" r="12" fill="url(#buttonGlow)" stroke="#166534" strokeWidth="2">
                <animate attributeName="r" values="12;13;12" dur="2s" repeatCount="indefinite"/>
              </circle>
              <text x="390" y="570" fontFamily="Arial" fontSize="10" fill="#ffffff" textAnchor="middle" fontWeight="bold">⏻</text>
              
              {/* Status LEDs */}
              <circle cx="420" cy="565" r="5" fill="#3b82f6">
                <animate attributeName="fill" values="#3b82f6;#1d4ed8;#3b82f6" dur="1s" repeatCount="indefinite"/>
              </circle>
              <circle cx="435" cy="565" r="5" fill="#fbbf24">
                <animate attributeName="fill" values="#fbbf24;#f59e0b;#fbbf24" dur="1.2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="450" cy="565" r="5" fill="#22c55e">
                <animate attributeName="fill" values="#22c55e;#16a34a;#22c55e" dur="1.5s" repeatCount="indefinite"/>
              </circle>
            </g>
            
            {/* Sample Loader Arm */}
            <g id="loaderArm">
              {/* Main arm structure */}
              <rect x="320" y="350" width="25" height="120" fill="#607d8b" rx="3"/>
              <rect x="322" y="355" width="21" height="110" fill="#78909c" rx="2"/>
            </g>
            
            {/* Reagent Compartment */}
            <rect x="370" y="560" width="80" height="70" fill="#eceff1" stroke="#90a4ae" strokeWidth="2" rx="4"/>
            <text x="410" y="580" fontFamily="Arial" fontSize="9" fill="#546e7a" textAnchor="middle" fontWeight="bold">REAGENT</text>
            <circle cx="395" cy="605" r="8" fill="#4ade80" opacity="0.6"/>
            <circle cx="410" cy="605" r="8" fill="#60a5fa" opacity="0.6"/>
            <circle cx="425" cy="605" r="8" fill="#f87171" opacity="0.6"/>
            
            {/* Waste Container */}
            <rect x="700" y="560" width="80" height="70" fill="#eceff1" stroke="#90a4ae" strokeWidth="2" rx="4"/>
            <text x="740" y="580" fontFamily="Arial" fontSize="9" fill="#546e7a" textAnchor="middle" fontWeight="bold">WASTE</text>
            <rect x="710" y="590" width="60" height="30" fill="#ff6b6b" opacity="0.3" rx="2">
              <animate attributeName="height" values="5;30;5" dur="10s" repeatCount="indefinite"/>
              <animate attributeName="y" values="615;590;615" dur="10s" repeatCount="indefinite"/>
            </rect>
            
            {/* Ventilation Grills */}
            <g id="vents">
              <line x1="470" y1="565" x2="550" y2="565" stroke="#b0bec5" strokeWidth="1"/>
              <line x1="470" y1="575" x2="550" y2="575" stroke="#b0bec5" strokeWidth="1"/>
              <line x1="470" y1="585" x2="550" y2="585" stroke="#b0bec5" strokeWidth="1"/>
              <line x1="470" y1="595" x2="550" y2="595" stroke="#b0bec5" strokeWidth="1"/>
            </g>
          </g>
          
          {/* Sample Tubes on Rack (Left Side) */}
          <g id="tubeRack">
            {/* Rack Base with better design */}
            <rect x="80" y="450" width="200" height="120" fill="#f1f5f9" stroke="#475569" strokeWidth="2" rx="8" filter="url(#shadow)"/>
            <rect x="85" y="455" width="190" height="110" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" rx="6"/>
            
            {/* Rack slots */}
            <rect x="95" y="485" width="25" height="70" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" rx="3"/>
            <rect x="125" y="485" width="25" height="70" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" rx="3"/>
            <rect x="155" y="485" width="25" height="70" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" rx="3"/>
            <rect x="185" y="485" width="25" height="70" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" rx="3"/>
            <rect x="215" y="485" width="25" height="70" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" rx="3"/>
            
            <text x="180" y="475" fontFamily="Arial" fontSize="11" fill="#334155" textAnchor="middle" fontWeight="bold">SAMPLE RACK</text>
            
            {/* Tubes with improved design */}
            <g id="tubes">
              {/* Tube 1 - Moving */}
              <g>
                <rect x="100" y="490" width="15" height="55" fill="#ffffff" stroke="#374151" strokeWidth="2" rx="3">
                  <animateTransform attributeName="transform" type="translate" values="0,0; 225,-100; 225,-100; 0,0" dur="15s" repeatCount="indefinite" keyTimes="0; 0.07; 0.13; 1"/>
                  <animate attributeName="opacity" values="1;1;0;0;0;1" dur="15s" repeatCount="indefinite" keyTimes="0; 0.07; 0.13; 0.85; 0.92; 1"/>
                </rect>
                <rect x="100" y="525" width="15" height="20" fill="url(#bloodSample)" rx="2">
                  <animateTransform attributeName="transform" type="translate" values="0,0; 225,-100; 225,-100; 0,0" dur="15s" repeatCount="indefinite" keyTimes="0; 0.07; 0.13; 1"/>
                  <animate attributeName="opacity" values="1;1;0;0;0;1" dur="15s" repeatCount="indefinite" keyTimes="0; 0.07; 0.13; 0.85; 0.92; 1"/>
                </rect>
                {/* Tube cap */}
                <ellipse cx="107.5" cy="490" rx="7.5" ry="3" fill="#dc2626">
                  <animateTransform attributeName="transform" type="translate" values="0,0; 225,-100; 225,-100; 0,0" dur="15s" repeatCount="indefinite" keyTimes="0; 0.07; 0.13; 1"/>
                  <animate attributeName="opacity" values="1;1;0;0;0;1" dur="15s" repeatCount="indefinite" keyTimes="0; 0.07; 0.13; 0.85; 0.92; 1"/>
                </ellipse>
                {/* Tube label */}
                <rect x="102" y="500" width="11" height="8" fill="#ffffff" rx="1">
                  <animateTransform attributeName="transform" type="translate" values="0,0; 225,-100; 225,-100; 0,0" dur="15s" repeatCount="indefinite" keyTimes="0; 0.07; 0.13; 1"/>
                  <animate attributeName="opacity" values="1;1;0;0;0;1" dur="15s" repeatCount="indefinite" keyTimes="0; 0.07; 0.13; 0.85; 0.92; 1"/>
                </rect>
                <text x="107.5" y="506" fontFamily="Arial" fontSize="6" fill="#000000" textAnchor="middle">01</text>
              </g>
              
              {/* Static Tubes with improved design */}
              <g id="staticTubes">
                {/* Tube 2 */}
                <rect x="130" y="490" width="15" height="55" fill="#ffffff" stroke="#374151" strokeWidth="2" rx="3"/>
                <rect x="130" y="525" width="15" height="20" fill="url(#bloodSample)" rx="2"/>
                <ellipse cx="137.5" cy="490" rx="7.5" ry="3" fill="#2563eb"/>
                <rect x="132" y="500" width="11" height="8" fill="#ffffff" rx="1"/>
                <text x="137.5" y="506" fontFamily="Arial" fontSize="6" fill="#000000" textAnchor="middle">02</text>
                
                {/* Tube 3 */}
                <rect x="160" y="490" width="15" height="55" fill="#ffffff" stroke="#374151" strokeWidth="2" rx="3"/>
                <rect x="160" y="525" width="15" height="20" fill="url(#bloodSample)" rx="2"/>
                <ellipse cx="167.5" cy="490" rx="7.5" ry="3" fill="#059669"/>
                <rect x="162" y="500" width="11" height="8" fill="#ffffff" rx="1"/>
                <text x="167.5" y="506" fontFamily="Arial" fontSize="6" fill="#000000" textAnchor="middle">03</text>
                
                {/* Tube 4 */}
                <rect x="190" y="490" width="15" height="55" fill="#ffffff" stroke="#374151" strokeWidth="2" rx="3"/>
                <rect x="190" y="525" width="15" height="20" fill="url(#bloodSample)" rx="2"/>
                <ellipse cx="197.5" cy="490" rx="7.5" ry="3" fill="#d97706"/>
                <rect x="192" y="500" width="11" height="8" fill="#ffffff" rx="1"/>
                <text x="197.5" y="506" fontFamily="Arial" fontSize="6" fill="#000000" textAnchor="middle">04</text>
                
                {/* Tube 5 */}
                <rect x="220" y="490" width="15" height="55" fill="#ffffff" stroke="#374151" strokeWidth="2" rx="3"/>
                <rect x="220" y="525" width="15" height="20" fill="url(#bloodSample)" rx="2"/>
                <ellipse cx="227.5" cy="490" rx="7.5" ry="3" fill="#7c3aed"/>
                <rect x="222" y="500" width="11" height="8" fill="#ffffff" rx="1"/>
                <text x="227.5" y="506" fontFamily="Arial" fontSize="6" fill="#000000" textAnchor="middle">05</text>
              </g>
            </g>
          </g>
          
          {/* Lab Notebook (Right Side) */}
          <g id="notebook" filter="url(#shadow)">
            <rect x="850" y="350" width="280" height="380" fill="#fefce8" stroke="#854d0e" strokeWidth="3" rx="5"/>
            <rect x="855" y="355" width="270" height="370" fill="#fffef5" stroke="#a16207" strokeWidth="1" rx="3"/>
            
            {/* Spiral Binding */}
            <g id="spiral">
              <circle cx="865" cy="380" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
              <circle cx="865" cy="410" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
              <circle cx="865" cy="440" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
              <circle cx="865" cy="470" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
              <circle cx="865" cy="500" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
              <circle cx="865" cy="530" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
              <circle cx="865" cy="560" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
              <circle cx="865" cy="590" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
              <circle cx="865" cy="620" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
              <circle cx="865" cy="650" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
              <circle cx="865" cy="680" r="4" fill="none" stroke="#64748b" strokeWidth="2"/>
            </g>
            
            {/* Notebook Title */}
            <text x="990" y="385" fontFamily="'Courier New', monospace" fontSize="16" fill="#92400e" textAnchor="middle" fontWeight="bold">
              CBC TEST RESULTS
            </text>
            <line x1="880" y1="395" x2="1100" y2="395" stroke="#d97706" strokeWidth="2"/>
            
            {/* Notebook Entries */}
            <text x="880" y="420" fontFamily="'Courier New', monospace" fontSize="11" fill="#78350f" fontWeight="bold">
              Patient ID: PT-2024-1547
              <animate attributeName="opacity" values="0;1" dur="0.5s" begin="2.5s" fill="freeze"/>
            </text>
            
            <text x="880" y="445" fontFamily="'Courier New', monospace" fontSize="10" fill="#451a03">
              Date: Nov 27, 2025
              <animate attributeName="opacity" values="0;1" dur="0.5s" begin="3s" fill="freeze"/>
            </text>
            <text x="880" y="460" fontFamily="'Courier New', monospace" fontSize="10" fill="#451a03">
              Time: 14:32:15
              <animate attributeName="opacity" values="0;1" dur="0.5s" begin="3s" fill="freeze"/>
            </text>
            
            <line x1="880" y1="475" x2="1100" y2="475" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,3"/>
            
            {/* Results */}
            <g id="notebookResults">
              <text x="880" y="495" fontFamily="'Courier New', monospace" fontSize="10" fill="#0c4a6e">
                ✓ WBC: 7,250 cells/μL
                <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="6.5s" repeatCount="indefinite"/>
              </text>
              <text x="880" y="515" fontFamily="'Courier New', monospace" fontSize="10" fill="#0c4a6e">
                ✓ RBC: 5.2 million/μL
                <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="7s" repeatCount="indefinite"/>
              </text>
              <text x="880" y="535" fontFamily="'Courier New', monospace" fontSize="10" fill="#0c4a6e">
                ✓ HGB: 15.3 g/dL
                <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="7.5s" repeatCount="indefinite"/>
              </text>
              <text x="880" y="555" fontFamily="'Courier New', monospace" fontSize="10" fill="#0c4a6e">
                ✓ HCT: 45.2%
                <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="8s" repeatCount="indefinite"/>
              </text>
              <text x="880" y="575" fontFamily="'Courier New', monospace" fontSize="10" fill="#0c4a6e">
                ✓ PLT: 245,000 cells/μL
                <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="8.5s" repeatCount="indefinite"/>
              </text>
              <text x="880" y="595" fontFamily="'Courier New', monospace" fontSize="10" fill="#0c4a6e">
                ✓ MCV: 88.5 fL
                <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="9s" repeatCount="indefinite"/>
              </text>
              <text x="880" y="615" fontFamily="'Courier New', monospace" fontSize="10" fill="#0c4a6e">
                ✓ MCH: 29.8 pg
                <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="9.5s" repeatCount="indefinite"/>
              </text>
              <text x="880" y="635" fontFamily="'Courier New', monospace" fontSize="10" fill="#0c4a6e">
                ✓ MCHC: 33.7 g/dL
                <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="10s" repeatCount="indefinite"/>
              </text>
            </g>
            
            <line x1="880" y1="650" x2="1100" y2="650" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,3"/>
            
            <text x="880" y="670" fontFamily="'Courier New', monospace" fontSize="9" fill="#166534" fontWeight="bold">
              Status: ✓ ALL PARAMETERS NORMAL
              <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="10.5s" repeatCount="indefinite"/>
            </text>
            
            <text x="880" y="690" fontFamily="'Courier New', monospace" fontSize="9" fill="#92400e" fontStyle="italic">
              Technician: Dr. Nguyen
              <animate attributeName="opacity" values="0;1;1;0;0" dur="15s" begin="11s" repeatCount="indefinite"/>
            </text>
          </g>
          
          
          {/* Process Arrow */}
          <g id="processArrow">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#3b82f6"/>
              </marker>
            </defs>
            
            <path d="M 290 510 L 340 510" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)">
              <animate attributeName="strokeDasharray" values="0 100;50 50" dur="1s" repeatCount="indefinite"/>
            </path>
            
            <path d="M 810 510 L 840 510" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)">
              <animate attributeName="strokeDasharray" values="0 100;30 70" dur="1s" repeatCount="indefinite"/>
            </path>
          </g>
          
          {/* Process Labels */}
          <text x="180" y="420" fontFamily="Arial" fontSize="12" fill="#1e40af" textAnchor="middle" fontWeight="bold">
            1. SAMPLES
          </text>
          <text x="575" y="170" fontFamily="Arial" fontSize="12" fill="#1e40af" textAnchor="middle" fontWeight="bold">
            2. ANALYSIS
          </text>
          <text x="990" y="330" fontFamily="Arial" fontSize="12" fill="#1e40af" textAnchor="middle" fontWeight="bold">
            3. RESULTS LOG
          </text>
          
          {/* Particle Effects (blood cells flowing) */}
          <g id="flowingCells">
            <circle cx="300" cy="510" r="3" fill="#ff6b6b" opacity="0.6">
              <animate attributeName="cx" values="300;350" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="820" cy="510" r="3" fill="#3b82f6" opacity="0.6">
              <animate attributeName="cx" values="820;850" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite"/>
            </circle>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default BloodTestAnimation;
