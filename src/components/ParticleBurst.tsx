import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

interface ParticleBurstProps {
  x: number;
  y: number;
  onComplete?: () => void;
  count?: number;
}

const COLORS = [
  '#FF6B4A', // Sunset Orange
  '#FF2D55', // Apple Magenta / Neon Rose
  '#007AFF', // Electric Blue
  '#34C759', // Apple Mint / Emerald
  '#FFD60A', // Warm Yellow
  '#AF52DE', // Purple
  '#FF9F0A', // Warm Amber
];

export const ParticleBurst: React.FC<ParticleBurstProps> = ({ x, y, onComplete, count = 28 }) => {
  const [particles, setParticles] = useState<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4.5;
      return {
        id: i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // slight upward bias
        size: 5 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 1,
      };
    });
  });

  useEffect(() => {
    let frameId: number;
    const startTime = performance.now();
    const duration = 850; // ms

    const animate = (currentTime: number) => {
      const elapsed = Math.max(0, currentTime - startTime);
      const progress = Math.max(0, Math.min(1, elapsed / duration));

      if (progress >= 1) {
        onComplete?.();
        return;
      }

      const calculatedOpacity = Math.max(0, Math.min(1, 1 - Math.pow(progress, 1.4)));

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy + 0.12, // subtle gravity
          vx: p.vx * 0.96,
          vy: p.vy * 0.96,
          opacity: calculatedOpacity,
          size: Math.max(0.5, p.size * (1 - progress * 0.4)),
        }))
      );

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: '9999px',
            opacity: p.opacity,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 10px ${p.color}88`,
          }}
        />
      ))}
    </div>
  );
};
