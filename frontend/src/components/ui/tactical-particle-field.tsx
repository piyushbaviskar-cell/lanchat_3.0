"use client";

import { useEffect, useRef } from "react";

interface ParticlePiece {
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
  shape: "square" | "dot" | "chevron" | "diamond";
  color: string;
  floatPhase: number;
  swayAmplitude: number;
  bobAmplitude: number;
  fadeStart: number;
  isFading: boolean;
}

export default function TacticalParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<ParticlePiece[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const tacticalColors = [
      "rgba(16, 185, 129, 0.35)",
      "rgba(34, 197, 94, 0.30)",
      "rgba(34, 211, 238, 0.28)",
      "rgba(56, 189, 248, 0.22)",
      "rgba(245, 158, 11, 0.18)",
    ];

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 90; i++) {
        particlesRef.current.push({
          x: -canvas.width * 0.2 + Math.random() * canvas.width * 1.4,
          y: -Math.random() * canvas.height * 0.3,
          z: Math.random() * 1500 + 800,
          velocityX: (Math.random() - 0.5) * 0.4,
          velocityY: Math.random() * 0.2 + 0.05,
          velocityZ: -(Math.random() * 0.5 + 0.25),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          baseSize: Math.random() * 8 + 3,
          opacity: 1,
          shape: ["square", "dot", "chevron", "diamond"][
            Math.floor(Math.random() * 4)
          ] as "square" | "dot" | "chevron" | "diamond",
          color: tacticalColors[Math.floor(Math.random() * tacticalColors.length)],
          floatPhase: Math.random() * Math.PI * 2,
          swayAmplitude: Math.random() * 0.4 + 0.15,
          bobAmplitude: Math.random() * 0.25 + 0.08,
          fadeStart: 0,
          isFading: false,
        });
      }
    };

    const drawParticle = (p: ParticlePiece) => {
      const perspective = 800;
      const scale = perspective / (perspective + p.z);
      const projectedX = p.x + (p.x - canvas.width / 2) * (1 - scale);
      const projectedY = p.y + (p.y - canvas.height / 2) * (1 - scale);
      if (scale <= 0.01 || scale > 2) return;

      const size = p.baseSize * scale;
      const opacity = Math.min(p.opacity * scale * 1.3, 1);

      ctx.save();
      ctx.translate(projectedX, projectedY);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = opacity;
      ctx.shadowColor = "rgba(16, 185, 129, 0.15)";
      ctx.shadowBlur = scale * 3;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;

      switch (p.shape) {
        case "square":
          ctx.strokeRect(-size / 2, -size / 2, size, size);
          break;
        case "dot":
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "chevron":
          ctx.beginPath();
          ctx.moveTo(-size * 0.5, -size * 0.4);
          ctx.lineTo(0, size * 0.4);
          ctx.lineTo(size * 0.5, -size * 0.4);
          ctx.stroke();
          break;
        case "diamond":
          ctx.beginPath();
          ctx.moveTo(0, -size * 0.6);
          ctx.lineTo(size * 0.4, 0);
          ctx.lineTo(0, size * 0.6);
          ctx.lineTo(-size * 0.4, 0);
          ctx.closePath();
          ctx.stroke();
          break;
      }
      ctx.restore();
    };

    const updateParticles = () => {
      particlesRef.current.forEach((p) => {
        p.floatPhase += 0.015;
        const swayX = Math.sin(p.floatPhase) * p.swayAmplitude * 0.3;
        const bobY = Math.cos(p.floatPhase * 0.7) * p.bobAmplitude * 0.2;

        p.x += p.velocityX + swayX;
        p.y += p.velocityY + bobY;
        p.z += p.velocityZ;
        p.rotation += p.rotationSpeed;

        const turbulence = Math.max(0, 1 - p.z / 1500) * 0.05;
        p.velocityX += (Math.random() - 0.5) * turbulence * 0.4;
        p.velocityY += (Math.random() - 0.5) * turbulence * 0.4;
        p.velocityX *= 0.999;
        p.velocityY *= 0.999;
        p.velocityY += 0.0004;
        p.velocityZ *= 1.0004;

        if (
          !p.isFading &&
          (p.z <= 200 ||
            p.x < -150 ||
            p.x > canvas.width + 150 ||
            p.y > canvas.height + 150)
        ) {
          p.isFading = true;
          p.fadeStart = p.opacity;
        }
        if (p.isFading) p.opacity -= 0.015;

        if (p.opacity <= 0) {
          p.x = -canvas.width * 0.2 + Math.random() * canvas.width * 1.4;
          p.y = -Math.random() * canvas.height * 0.3;
          p.z = Math.random() * 800 + 1200;
          p.velocityX = (Math.random() - 0.5) * 0.4;
          p.velocityY = Math.random() * 0.2 + 0.05;
          p.velocityZ = -(Math.random() * 0.5 + 0.25);
          p.floatPhase = Math.random() * Math.PI * 2;
          p.opacity = 1;
          p.isFading = false;
          p.fadeStart = 0;
        }
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateParticles();
      particlesRef.current.forEach(drawParticle);
      animationRef.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}
