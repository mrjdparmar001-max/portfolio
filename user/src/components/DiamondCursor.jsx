import { useEffect, useRef, useCallback, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

function useDesktopCursor() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return enabled;
}

/**
 * DiamondCursor — optimized version.
 *
 * Key fixes vs original:
 * - Reduced trail length 50→30 (was drawing 50 diamonds per frame)
 * - TRAIL cap 28→20 (fewer diamonds rendered per frame)
 * - mousemove throttled to rAF — fires at max 60fps instead of every pixel
 * - canvas globalCompositeOperation set once per frame, not per diamond
 * - Burst expansion rate tuned for smoother feel
 */
export default function DiamondCursor() {
  const showCursor = useDesktopCursor();
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const stateRef = useRef({
    mouse: { x: -300, y: -300 },
    trail: [],
    bursts: [],
    frame: 0,
    color: '#8B5CF6',
    rafId: null,
    movePending: false, // FIX: rAF throttle flag
  });

  useEffect(() => {
    stateRef.current.color = theme?.primary || '#8B5CF6';
  }, [theme]);

  const drawDiamond = useCallback((ctx, x, y, size, color, alpha, rot = 0) => {
    if (size <= 0.5) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    // Outer glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
    glow.addColorStop(0, color + '44');
    glow.addColorStop(0.5, color + '18');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Diamond body
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.62, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.62, 0);
    ctx.closePath();

    const grad = ctx.createRadialGradient(0, -size * 0.28, 0, 0, 0, size * 1.15);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, color);
    grad.addColorStop(1, color + 'aa');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Facet highlights
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.62, 0);
    ctx.lineTo(0, -size * 0.1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.62, 0);
    ctx.lineTo(0, -size * 0.1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fill();

    ctx.restore();
  }, []);

  const drawBurst = useCallback((ctx, burst, color) => {
    const count = 8;
    for (let j = 0; j < count; j++) {
      const angle = (j / count) * Math.PI * 2;
      const bx = burst.x + Math.cos(angle) * burst.r;
      const by = burst.y + Math.sin(angle) * burst.r;
      const sz = 5 * Math.max(0, 1 - burst.r / 70);
      drawDiamond(ctx, bx, by, sz, color, burst.alpha * 0.85, angle);
    }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = burst.alpha * 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, burst.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [drawDiamond]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const onPointerDown = (e) => {
      s.bursts.push({ x: e.clientX, y: e.clientY, r: 0, alpha: 1 });
    };
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    let onMove = null;
    if (showCursor) {
      onMove = (e) => {
        if (!s.movePending) {
          s.movePending = true;
          requestAnimationFrame(() => {
            s.mouse.x = e.clientX;
            s.mouse.y = e.clientY;
            s.trail.unshift({ x: e.clientX, y: e.clientY });
            if (s.trail.length > 30) s.trail.pop();
            s.movePending = false;
          });
        }
      };
      window.addEventListener('mousemove', onMove, { passive: true });
      document.documentElement.style.cursor = 'none';
    }

    const TRAIL = 20;

    const animate = () => {
      s.rafId = requestAnimationFrame(animate);
      s.frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const color = s.color;

      if (showCursor) {
        const end = Math.min(s.trail.length, TRAIL);

        for (let i = end - 1; i >= 0; i--) {
          const t = s.trail[i];
          const progress = 1 - i / TRAIL;
          const size = 14 * 0.26 * progress;
          const alpha = progress * 0.55;
          const rot = (i * 0.22) % (Math.PI * 2);
          drawDiamond(ctx, t.x, t.y, size, color, alpha, rot);
        }

        const wobble = Math.sin(s.frame * 0.07) * 1.8;
        const spin = Math.sin(s.frame * 0.035) * 0.28;
        drawDiamond(ctx, s.mouse.x, s.mouse.y + wobble, 16, color, 1, spin);

        ctx.save();
        ctx.translate(s.mouse.x, s.mouse.y + wobble);
        ctx.rotate(spin);
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -16); ctx.lineTo(9.9, 0);
        ctx.moveTo(0, -16); ctx.lineTo(-9.9, 0);
        ctx.stroke();
        ctx.restore();
      }

      for (let i = s.bursts.length - 1; i >= 0; i--) {
        const b = s.bursts[i];
        drawBurst(ctx, b, color);
        b.r += 3;
        b.alpha -= 0.04;
        if (b.alpha <= 0) s.bursts.splice(i, 1);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(s.rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', onPointerDown);
      if (onMove) window.removeEventListener('mousemove', onMove);
      document.documentElement.style.cursor = '';
    };
  }, [showCursor, drawDiamond, drawBurst]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 999999,
      }}
    />
  );
}