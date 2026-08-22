import React, { useState, useEffect } from 'react';
import { Rocket } from 'lucide-react';

export default function AnimatedLoader() {
  const [dots, setDots] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Accessing NASA LROC & LOLA Planetary Datasets...',
    'Evaluating 160,000 South Pole Polar Cells (80°S - 90°S)...',
    'Applying Multi-Criteria Heuristic Weight Vectors...',
    'Filtering Crater Slopes & Touchdown Hazards...',
    'Generating Optimal Lunar Site Rankings...'
  ];

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 700);

    return () => {
      clearInterval(dotInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-dark)]/90 backdrop-blur-2xl select-none font-sans transition-colors duration-200">
      {/* Outer ambient aura glow */}
      <div className="absolute w-96 h-96 bg-[#0066cc]/10 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>

      {/* Main Logo & Animated Ring Box */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Pulsing outer orbital ring 1 */}
        <div className="absolute w-28 h-28 rounded-full border-2 border-dashed border-[#0066cc]/30 animate-spin" style={{ animationDuration: '12s' }}></div>
        {/* Pulsing outer orbital ring 2 */}
        <div className="absolute w-36 h-36 rounded-full border border-[#0066cc]/20 animate-ping" style={{ animationDuration: '3.5s' }}></div>

        {/* Center Apple Capsule Card */}
        <div className="w-20 h-20 rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#0066cc] shadow-lg z-10">
          <Rocket className="w-9 h-9 text-[#0066cc] animate-bounce" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      {/* Brand Title */}
      <div className="text-center space-y-2 z-10">
        <div className="flex items-center justify-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            LunaAstra
          </h1>
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[var(--apple-parchment)] text-[#0066cc] border border-[var(--border-color)]">
            v2.5 AI
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] font-medium tracking-wide">
          AI Lunar South Pole Habitat Decision Workstation
        </p>
      </div>

      {/* Animated Step Loader & Progress Line */}
      <div className="mt-8 w-80 space-y-3 z-10 text-center">
        <div className="w-full h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
          <div className="h-full bg-[#0066cc] rounded-full animate-pulse w-full"></div>
        </div>

        <div className="text-xs text-[#0066cc] font-medium h-6 flex items-center justify-center">
          {steps[currentStep]}{dots}
        </div>
      </div>
    </div>
  );
}
