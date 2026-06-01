import { useEffect, useRef } from 'react';

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FF69B4'];

    const createConfetti = () => {
      const confetti: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        color: string;
        rotation: number;
        rotationSpeed: number;
      }> = [];

      for (let i = 0; i < 100; i++) {
        confetti.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          vx: (Math.random() - 0.5) * 8,
          vy: Math.random() * 5 + 5,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
        });
      }

      return confetti;
    };

    let confetti = createConfetti();
    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2; // gravity
        particle.vx *= 0.99; // air resistance
        particle.rotation += particle.rotationSpeed;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      });

      // Reset particles that fall off screen
      confetti.forEach((particle) => {
        if (particle.y > canvas.height) {
          particle.y = -10;
          particle.x = Math.random() * canvas.width;
          particle.vx = (Math.random() - 0.5) * 8;
          particle.vy = Math.random() * 5 + 5;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
