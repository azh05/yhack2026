'use client';

import { useTheme } from '@/components/ThemeProvider';

const PARTICLES = [
  { x: '15%', y: '20%', size: 3, color: 'rgba(249,115,22,0.3)', delay: 0, duration: 7 },
  { x: '80%', y: '35%', size: 2, color: 'rgba(59,130,246,0.25)', delay: 1.2, duration: 9 },
  { x: '45%', y: '70%', size: 3, color: 'rgba(239,68,68,0.2)', delay: 2.5, duration: 8 },
  { x: '25%', y: '55%', size: 2, color: 'rgba(20,184,166,0.2)', delay: 0.8, duration: 10 },
  { x: '70%', y: '15%', size: 2, color: 'rgba(249,115,22,0.25)', delay: 3, duration: 7.5 },
  { x: '55%', y: '85%', size: 3, color: 'rgba(59,130,246,0.2)', delay: 1.5, duration: 9.5 },
  { x: '90%', y: '60%', size: 2, color: 'rgba(239,68,68,0.15)', delay: 4, duration: 8.5 },
  { x: '35%', y: '40%', size: 2, color: 'rgba(20,184,166,0.15)', delay: 2, duration: 11 },
  { x: '10%', y: '80%', size: 3, color: 'rgba(249,115,22,0.2)', delay: 0.5, duration: 6.5 },
  { x: '60%', y: '25%', size: 2, color: 'rgba(239,68,68,0.2)', delay: 3.5, duration: 8 },
];

export default function ShaderBackground() {
  const { theme } = useTheme();

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500"
      style={{ opacity: theme === 'dark' ? 0.6 : 0.12 }}
    >
      {/* Molten orbs — large blurred drifting circles */}
      <div
        className="absolute rounded-full animate-orb-1"
        style={{
          width: 350, height: 350,
          top: '20%', left: '15%',
          background: 'rgba(180, 60, 10, 0.07)',
          filter: 'blur(80px)',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute rounded-full animate-orb-2"
        style={{
          width: 280, height: 280,
          top: '50%', right: '10%',
          background: 'rgba(200, 80, 20, 0.05)',
          filter: 'blur(70px)',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute rounded-full animate-orb-3"
        style={{
          width: 400, height: 400,
          bottom: '10%', left: '40%',
          background: 'rgba(140, 30, 10, 0.05)',
          filter: 'blur(90px)',
          willChange: 'transform',
        }}
      />

      {/* Aurora sweep elements */}
      <div
        className="absolute animate-aurora"
        style={{
          width: '150%', height: '25%',
          top: '15%', left: '-25%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.025) 30%, rgba(20,184,166,0.02) 60%, transparent 100%)',
          filter: 'blur(40px)',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute animate-aurora"
        style={{
          width: '140%', height: '20%',
          bottom: '25%', left: '-20%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.02) 40%, rgba(239,68,68,0.015) 70%, transparent 100%)',
          filter: 'blur(50px)',
          willChange: 'transform',
          animationDelay: '-20s',
          animationDuration: '50s',
        }}
      />

      {/* Grid layers */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 120, 40, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 120, 40, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'gridShift 45s linear infinite',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.01) 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px',
          animation: 'gridShift 70s linear infinite reverse',
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            left: p.x, top: p.y,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `particleFloat ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
