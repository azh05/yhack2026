'use client';

import { useEffect, useRef, useCallback } from 'react';
import createGlobe from 'cobe';

interface GlobeMarker {
  location: [number, number];
  size: number;
}

interface CobeGlobeProps {
  markers?: GlobeMarker[];
  className?: string;
  speed?: number;
}

const CONFLICT_MARKERS: GlobeMarker[] = [
  { location: [31.35, 34.31], size: 0.08 },
  { location: [15.50, 32.56], size: 0.07 },
  { location: [48.38, 31.17], size: 0.06 },
  { location: [19.76, 96.07], size: 0.05 },
  { location: [12.36, -1.52], size: 0.05 },
  { location: [-1.66, 29.22], size: 0.05 },
  { location: [9.15, 40.49], size: 0.04 },
  { location: [15.35, 44.21], size: 0.04 },
  { location: [2.05, 45.32], size: 0.03 },
  { location: [34.80, 38.99], size: 0.03 },
  { location: [18.97, -72.29], size: 0.03 },
  { location: [30.38, 69.35], size: 0.03 },
  { location: [9.08, 7.49], size: 0.04 },
];

export default function CobeGlobe({
  markers = CONFLICT_MARKERS,
  className = '',
  speed = 0.002,
}: CobeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const phiRef = useRef(0.3);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = e.clientX;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  }, []);

  const onPointerUp = useCallback(() => {
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let width = canvas.offsetWidth;
    if (width === 0) width = 500;

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      width: width * 2,
      height: width * 2,
      phi: 0.3,
      theta: 0.15,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 20000,
      mapBrightness: 3,
      baseColor: [0.15, 0.18, 0.25],
      markerColor: [0.9, 0.3, 0.15],
      glowColor: [0.08, 0.08, 0.12],
      markers: markers.map(m => ({ location: m.location, size: m.size })),
    });

    let animId: number;

    const animate = () => {
      if (pointerInteracting.current === null) {
        phiRef.current += speed;
      }
      globe.update({ phi: phiRef.current });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        const delta = e.clientX - pointerInteracting.current;
        pointerInteracting.current = e.clientX;
        phiRef.current += delta / 200;
      }
    };

    const handlePointerUp = () => {
      pointerInteracting.current = null;
      if (canvas) canvas.style.cursor = 'grab';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const handleResize = () => {
      const w = canvas.offsetWidth;
      if (w > 0) globe.update({ width: w * 2, height: w * 2 });
    };
    window.addEventListener('resize', handleResize);

    setTimeout(() => { canvas.style.opacity = '1'; }, 100);

    return () => {
      cancelAnimationFrame(animId);
      globe.destroy();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [markers, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerOut={onPointerUp}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
        opacity: 0,
        transition: 'opacity 1.5s ease',
        aspectRatio: '1',
      }}
    />
  );
}
