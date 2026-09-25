"use client";

import { useEffect, useRef } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  z: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  rotation: number;
  rotationSpeed: number;
  baseSize: number;
  opacity: number;
  shape: 'rectangle' | 'circle' | 'star' | 'diamond';
  color: string;
  floatPhase: number;
  swayAmplitude: number;
  bobAmplitude: number;
  fadeStart: number;
  isFading: boolean;
}

/**
 * ConfettiBackground — LANCHAT APEX adaptation
 * 
 * Renders subtle floating "encrypted data fragments" as a fixed background layer.
 * Adapted from the original white confetti to use tactical emerald/cyan/slate colors
 * at low opacity so particles read as signal debris rather than celebration confetti.
 * 
 * - pointer-events-none: never intercepts clicks
 * - fixed inset-0: full viewport coverage
 * - z-0: lowest stacking layer
 * - Respects prefers-reduced-motion via matchMedia check
 */
export default function ConfettiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const confettiRef = useRef<ConfettiPiece[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const rootStyles = getComputedStyle(document.documentElement);
    const getColor = (token: string, alpha: string) => {
      const val = rootStyles.getPropertyValue(token).trim();
      return val ? `hsl(${val} / ${alpha})` : `rgba(34, 211, 238, ${alpha})`; // fallback
    };

    // Tactical signal-debris colors — using design system tokens
    const tacticalColors = [
      getColor('--accent', '0.65'),
      getColor('--surface-outline', '0.60'),
      getColor('--foreground', '0.40'),
      getColor('--surface-muted', '0.70'),
      getColor('--primary', '0.50'),
    ];

    const PARTICLE_COUNT = prefersReducedMotion ? 0 : 150;

    const initConfetti = () => {
      confettiRef.current = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        confettiRef.current.push({
          x: -canvas.width * 0.2 + Math.random() * canvas.width * 1.4,
          y: -Math.random() * canvas.height * 0.3,
          z: Math.random() * 1500 + 800,
          velocityX: (Math.random() - 0.5) * 0.6,
          velocityY: Math.random() * 0.3 + 0.1,
          velocityZ: -(Math.random() * 0.8 + 0.3),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          baseSize: Math.random() * 12 + 4,
          opacity: 1,
          shape: (['rectangle', 'circle', 'star', 'diamond'] as const)[Math.floor(Math.random() * 4)],
          color: tacticalColors[Math.floor(Math.random() * tacticalColors.length)],
          floatPhase: Math.random() * Math.PI * 2,
          swayAmplitude: Math.random() * 0.5 + 0.2,
          bobAmplitude: Math.random() * 0.3 + 0.1,
          fadeStart: 0,
          isFading: false,
        });
      }
    };

    const drawConfetti = (piece: ConfettiPiece) => {
      const perspective = 800;
      const scale = perspective / (perspective + piece.z);
      const projectedX = piece.x + (piece.x - canvas.width / 2) * (1 - scale);
      const projectedY = piece.y + (piece.y - canvas.height / 2) * (1 - scale);

      if (scale <= 0.01 || scale > 2) return;

      const size = piece.baseSize * scale;
      const opacity = Math.min(piece.opacity * scale * 1.5, 0.95);

      ctx.save();
      ctx.translate(projectedX, projectedY);
      ctx.rotate(piece.rotation);
      ctx.globalAlpha = opacity;

      // Glow effect (handles hsl(... / 0.65) format)
      ctx.shadowColor = piece.color.replace(/\/ [\d.]+\)$/, '/ 0.4)');
      ctx.shadowBlur = scale * 4;

      ctx.fillStyle = piece.color;
      ctx.strokeStyle = piece.color;
      ctx.lineWidth = 1.5;

      switch (piece.shape) {
        case 'rectangle': {
          const width = size * 1.2;
          const height = size * 0.5;
          // Outlined rectangles read as data fragments
          ctx.strokeRect(-width / 2, -height / 2, width, height);
          break;
        }

        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'star': {
          ctx.beginPath();
          const starSize = size * 0.5;
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * starSize;
            const y = Math.sin(angle) * starSize;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            const innerAngle = ((i + 0.5) * Math.PI) / 3;
            const innerX = Math.cos(innerAngle) * starSize * 0.5;
            const innerY = Math.sin(innerAngle) * starSize * 0.5;
            ctx.lineTo(innerX, innerY);
          }
          ctx.closePath();
          ctx.stroke();
          break;
        }

        case 'diamond': {
          ctx.beginPath();
          const diamondSize = size * 0.6;
          ctx.moveTo(0, -diamondSize);
          ctx.lineTo(diamondSize * 0.5, 0);
          ctx.lineTo(0, diamondSize);
          ctx.lineTo(-diamondSize * 0.5, 0);
          ctx.closePath();
          ctx.stroke();
          break;
        }
      }

      ctx.restore();
    };

    const updateConfetti = () => {
      confettiRef.current.forEach((piece) => {
        piece.floatPhase += 0.015;

        const swayX = Math.sin(piece.floatPhase) * piece.swayAmplitude * 0.25;
        const bobY = Math.cos(piece.floatPhase * 0.7) * piece.bobAmplitude * 0.15;

        piece.x += piece.velocityX + swayX;
        piece.y += piece.velocityY + bobY;
        piece.z += piece.velocityZ;
        piece.rotation += piece.rotationSpeed;

        const turbulence = Math.max(0, 1 - piece.z / 1500) * 0.05;
        piece.velocityX += (Math.random() - 0.5) * turbulence * 0.4;
        piece.velocityY += (Math.random() - 0.5) * turbulence * 0.4;

        piece.velocityX *= 0.999;
        piece.velocityY *= 0.999;

        piece.velocityY += 0.0003;
        piece.velocityZ *= 1.0003;

        if (
          !piece.isFading &&
          (
            piece.z <= 200 ||
            piece.x < -150 ||
            piece.x > canvas.width + 150 ||
            piece.y > canvas.height + 150
          )
        ) {
          piece.isFading = true;
          piece.fadeStart = piece.opacity;
        }

        if (piece.isFading) {
          piece.opacity -= 0.015;
        }

        if (piece.opacity <= 0) {
          piece.x = -canvas.width * 0.2 + Math.random() * canvas.width * 1.4;
          piece.y = -Math.random() * canvas.height * 0.3;
          piece.z = Math.random() * 800 + 1200;
          piece.velocityX = (Math.random() - 0.5) * 0.4;
          piece.velocityY = Math.random() * 0.2 + 0.06;
          piece.velocityZ = -(Math.random() * 0.5 + 0.2);
          piece.floatPhase = Math.random() * Math.PI * 2;
          piece.opacity = 1;
          piece.isFading = false;
          piece.fadeStart = 0;
        }
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateConfetti();
      confettiRef.current.forEach(drawConfetti);
      animationRef.current = requestAnimationFrame(animate);
    };

    initConfetti();

    if (!prefersReducedMotion) {
      animate();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
      style={{
        background: 'transparent',
      }}
    />
  );
}
