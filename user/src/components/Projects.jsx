import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getProjects } from '../api/api';
import { FiGithub, FiExternalLink, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

function imgUrl(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('data:') || s.startsWith('blob:')) return s;
  return `${BASE}/${s.replace(/^\/+/, '')}`;
}

const categories = ['All', 'Web', 'Mobile', 'Backend', 'UI/UX'];

function SpotlightCursor({ theme }) {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { damping: 25, stiffness: 200 });
  const sy = useSpring(y, { damping: 25, stiffness: 200 });
  useEffect(() => {
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);
  return (
    <motion.div style={{
      position: 'fixed', top: 0, left: 0, pointerEvents: 'none',
      zIndex: 0, width: 600, height: 600, borderRadius: '50%',
      background: `radial-gradient(circle, ${theme.primary}12 0%, transparent 70%)`,
      x: useTransform(sx, v => v - 300),
      y: useTransform(sy, v => v - 300),
    }} />
  );
}

function AmbientOrbs({ theme }) {
  const orbs = [
    { size: 300, x: '10%', y: '20%', delay: 0, dur: 8 },
    { size: 200, x: '75%', y: '60%', delay: 2, dur: 10 },
    { size: 150, x: '50%', y: '80%', delay: 4, dur: 7 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {orbs.map((orb, i) => (
        <motion.div key={i}
          animate={{ y: [0, -30, 0], scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: orb.dur, repeat: Infinity, delay: orb.delay, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: orb.x, top: orb.y, width: orb.size, height: orb.size, borderRadius: '50%', background: `radial-gradient(circle, ${theme.primary}18, transparent 70%)`, transform: 'translate(-50%,-50%)' }}
        />
      ))}
    </div>
  );
}

function ProjectCard({ project, theme, index, cardWidth = 320 }) {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const cardHeight = Math.round(cardWidth * 1.375);

  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springRotX = useSpring(rotX, { damping: 20, stiffness: 200 });
  const springRotY = useSpring(rotY, { damping: 20, stiffness: 200 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const onMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    rotX.set((cy / rect.height - 0.5) * -14);
    rotY.set((cx / rect.width - 0.5) * 14);
    glowX.set((cx / rect.width) * 100);
    glowY.set((cy / rect.height) * 100);
  }, [rotX, rotY, glowX, glowY]);

  const onMouseLeave = useCallback(() => {
    rotX.set(0); rotY.set(0);
    glowX.set(50); glowY.set(50);
    setHovered(false);
  }, [rotX, rotY, glowX, glowY]);

  const glowBg = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, ${theme.primary}22 0%, transparent 65%)`
  );

  const src = imgUrl(project.image);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: Math.min(index * 0.05, 0.25), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX: springRotX, rotateY: springRotY,
        transformStyle: 'preserve-3d', perspective: 800,
        position: 'relative',
        flexShrink: 0,
        width: cardWidth,
        height: cardHeight,
        display: 'flex',
        flexDirection: 'column',
        background: theme.bgCard,
        border: `1px solid ${hovered ? theme.primary + '66' : theme.border}`,
        borderRadius: 22,
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: hovered ? 10 : 1,
        boxShadow: hovered
          ? `0 28px 70px ${theme.primary}25, 0 0 0 1px ${theme.primary}33`
          : `0 4px 24px rgba(0,0,0,0.12)`,
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      <motion.div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 22, zIndex: 1, background: glowBg, opacity: hovered ? 1 : 0, transition: 'opacity 0.3s' }} />

      <motion.div
        animate={hovered ? { x: ['-100%', '220%'] } : { x: '-100%' }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        style={{ position: 'absolute', top: 0, left: 0, width: '55%', height: '100%', background: `linear-gradient(90deg, transparent, ${theme.primary}18, transparent)`, zIndex: 2, pointerEvents: 'none' }}
      />

      {/* Image — strictly 190px */}
      <div style={{ position: 'relative', height: 190, minHeight: 190, maxHeight: 190, overflow: 'hidden', background: theme.bgSecondary, flexShrink: 0 }}>
        {src && !imgBroken ? (
          <motion.img
            src={src} alt={project.title}
            onError={() => setImgBroken(true)}
            animate={{ scale: hovered ? 1.07 : 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <motion.div
            animate={{ scale: hovered ? 1.08 : 1 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${theme.primary}28, ${theme.secondary || theme.primary}18)`, fontSize: 52 }}
          >💻</motion.div>
        )}

        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.3 }}
          style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${theme.bgCard}dd 0%, transparent 55%)` }}
        />

        {project.featured && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: theme.gradient, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)', boxShadow: `0 4px 12px ${theme.primary}40` }}>
            ⭐ Featured
          </div>
        )}

        <motion.div
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
          transition={{ duration: 0.22 }}
          style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 8, zIndex: 3 }}
        >
          {project.githubUrl && (
            <motion.a href={project.githubUrl} target="_blank" rel="noreferrer"
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}
            ><FiGithub /></motion.a>
          )}
          {project.liveUrl && (
            <motion.a href={project.liveUrl} target="_blank" rel="noreferrer"
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 34, height: 34, borderRadius: '50%', background: theme.primary, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, boxShadow: `0 4px 14px ${theme.primary}55` }}
            ><FiExternalLink /></motion.a>
          )}
        </motion.div>
      </div>

      {/* Card body */}
      <div style={{ padding: '18px 20px 20px', position: 'relative', zIndex: 3, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
          <motion.h3
            animate={{ x: hovered ? 3 : 0 }} transition={{ duration: 0.2 }}
            style={{ color: theme.text, fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.3, flex: 1 }}
          >{project.title}</motion.h3>
          <span style={{ background: theme.primary + '22', color: theme.primary, borderRadius: 20, padding: '3px 11px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', border: `1px solid ${theme.primary}33`, flexShrink: 0 }}>
            {project.category}
          </span>
        </div>

        <p style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.7, marginBottom: 14, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {project.techStack?.slice(0, 4).map((tech) => (
            <motion.span key={tech}
              whileHover={{ scale: 1.08, background: theme.primary + '22', color: theme.primary }}
              transition={{ type: 'spring', stiffness: 400 }}
              style={{ background: theme.bgSecondary, color: theme.textMuted, borderRadius: 7, padding: '2px 9px', fontSize: 11.5, border: `1px solid ${theme.border}`, cursor: 'default', transition: 'background 0.2s, color 0.2s' }}
            >{tech}</motion.span>
          ))}
          {(project.techStack?.length ?? 0) > 4 && (
            <span style={{ background: theme.bgSecondary, color: theme.textMuted, borderRadius: 7, padding: '2px 9px', fontSize: 11.5, border: `1px solid ${theme.border}` }}>+{project.techStack.length - 4}</span>
          )}
        </div>
      </div>

      <motion.div
        animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: theme.gradient, transformOrigin: 'left' }}
      />
    </motion.div>
  );
}

function AnimatedCount({ value, theme }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 24));
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setCount(start);
      if (start >= value) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <span style={{ color: theme.primary }}>{count}</span>;
}

function useCardWidth() {
  const [cardWidth, setCardWidth] = useState(() => {
    if (typeof window === 'undefined') return 320;
    const w = window.innerWidth;
    if (w < 480) return Math.min(w - 56, 280);
    if (w < 768) return 300;
    if (w < 1024) return 320;
    return 340;
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setCardWidth(Math.min(w - 56, 280));
      else if (w < 768) setCardWidth(300);
      else if (w < 1024) setCardWidth(320);
      else setCardWidth(340);
    };

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return cardWidth;
}

function ProjectCarousel({ projects, theme }) {
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollStart = useRef(0);
  const touchAxis = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const cardWidth = useCardWidth();
  const cardGap = cardWidth < 300 ? 16 : 20;
  const edgePad = cardWidth < 300 ? 48 : 80;

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return undefined;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [projects, updateScrollState, cardWidth]);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    startX.current = e.pageX;
    scrollStart.current = trackRef.current.scrollLeft;
    trackRef.current.style.cursor = 'grabbing';
  };

  const onMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = 'grab';
  };

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    trackRef.current.scrollLeft = scrollStart.current - (e.pageX - startX.current) * 1.2;
  };

  const onTouchStart = (e) => {
    touchAxis.current = null;
    startX.current = e.touches[0].pageX;
    startY.current = e.touches[0].pageY;
    scrollStart.current = trackRef.current.scrollLeft;
  };

  const onTouchMove = (e) => {
    const touch = e.touches[0];
    const dx = touch.pageX - startX.current;
    const dy = touch.pageY - startY.current;

    if (touchAxis.current === null) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      touchAxis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (touchAxis.current === 'y') return;

    trackRef.current.scrollLeft = scrollStart.current - dx;
  };

  const onTouchEnd = () => {
    touchAxis.current = null;
    updateScrollState();
  };

  const scrollByCard = (dir) => {
    trackRef.current?.scrollBy({ left: dir * (cardWidth + cardGap), behavior: 'smooth' });
  };

  const btnBase = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: '50%',
    border: `1.5px solid ${theme.border}`,
    background: theme.bgCard,
    color: theme.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(0,0,0,0.15)',
    transition: 'all 0.2s',
  };

  if (projects.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: edgePad, background: `linear-gradient(to right, ${theme.bg} 20%, transparent)`, zIndex: 10, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: edgePad, background: `linear-gradient(to left, ${theme.bg} 20%, transparent)`, zIndex: 10, pointerEvents: 'none' }} />

      {projects.length > 1 && (
        <>
          <motion.button
            whileHover={canScrollLeft ? { scale: 1.12, background: theme.primary, color: '#fff', borderColor: 'transparent' } : {}}
            whileTap={canScrollLeft ? { scale: 0.9 } : {}}
            onClick={() => scrollByCard(-1)}
            disabled={!canScrollLeft}
            aria-label="Previous project"
            style={{
              ...btnBase,
              left: 10,
              opacity: canScrollLeft ? 1 : 0.35,
              cursor: canScrollLeft ? 'pointer' : 'not-allowed',
            }}
          ><FiChevronLeft /></motion.button>

          <motion.button
            whileHover={canScrollRight ? { scale: 1.12, background: theme.primary, color: '#fff', borderColor: 'transparent' } : {}}
            whileTap={canScrollRight ? { scale: 0.9 } : {}}
            onClick={() => scrollByCard(1)}
            disabled={!canScrollRight}
            aria-label="Next project"
            style={{
              ...btnBase,
              right: 10,
              opacity: canScrollRight ? 1 : 0.35,
              cursor: canScrollRight ? 'pointer' : 'not-allowed',
            }}
          ><FiChevronRight /></motion.button>
        </>
      )}

      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        className="projects-track"
        style={{
          display: 'flex',
          gap: cardGap,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: `24px ${edgePad}px 32px`,
          cursor: projects.length > 1 ? 'grab' : 'default',
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          touchAction: 'pan-y',
        }}
      >
        {projects.map((project, i) => (
          <div key={project._id ?? i} style={{ flexShrink: 0 }}>
            <ProjectCard project={project} theme={theme} index={i} cardWidth={cardWidth} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Projects() {
  const { theme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then(res => setProjects(res.data))
      .catch(() => setProjects(demoProjects))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? projects : projects.filter(p => p.category === filter);

  return (
    <section id="projects" style={{ position: 'relative', padding: '100px 0 90px', background: theme.bg, overflow: 'hidden' }}>
      <SpotlightCursor theme={theme} />
      <AmbientOrbs theme={theme} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.2em' }} whileInView={{ opacity: 1, letterSpacing: '0.25em' }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            style={{ color: theme.primary, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 14 }}
          >My Work</motion.p>

          <h2 style={{ fontSize: 'clamp(30px,4vw,52px)', fontWeight: 800, color: theme.text, marginBottom: 6 }}>
            Featured{' '}
            <motion.span
              initial={{ backgroundSize: '0% 4px' }} whileInView={{ backgroundSize: '100% 4px' }}
              viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.6 }}
              style={{ backgroundImage: theme.gradient, backgroundRepeat: 'no-repeat', backgroundPosition: 'left bottom 2px', paddingBottom: 4 }}
            >Projects</motion.span>
          </h2>

          {!loading && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ color: theme.textMuted, fontSize: 15, marginBottom: 36 }}>
              <AnimatedCount value={projects.length} theme={theme} /> projects shipped
            </motion.p>
          )}

          <motion.div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            {categories.map((cat, ci) => {
              const active = filter === cat;
              return (
                <motion.button key={cat} onClick={() => setFilter(cat)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.06 }}
                  whileHover={{ scale: 1.07, y: -2 }} whileTap={{ scale: 0.94 }}
                  style={{ position: 'relative', overflow: 'hidden', background: active ? theme.gradient : 'transparent', border: `2px solid ${active ? 'transparent' : theme.border}`, borderRadius: 50, padding: '9px 22px', color: active ? '#fff' : theme.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: active ? `0 8px 24px ${theme.primary}35` : 'none', transition: 'all 0.25s' }}>
                  {active && (
                    <motion.span animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2 }}
                      style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)', pointerEvents: 'none' }} />
                  )}
                  {cat}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: theme.textMuted, padding: 80 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 32, height: 32, border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: '50%', margin: '0 auto 16px' }} />
          Loading projects…
        </div>
      ) : filtered.length > 0 ? (
        <motion.div key={filter} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <ProjectCarousel projects={filtered} theme={theme} />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', color: theme.textMuted, padding: 80, fontSize: 15 }}>
          No projects in this category yet.
        </motion.div>
      )}

    </section>
  );
}

const demoProjects = [
  { _id: '1', title: 'E-Commerce Platform',  description: 'Full-stack e-commerce with React, Node.js, MongoDB. Features cart, payments, admin panel.', techStack: ['React', 'Node.js', 'MongoDB', 'Stripe'], category: 'Web',     featured: true,  githubUrl: '#', liveUrl: '#' },
  { _id: '2', title: 'Task Management App',  description: 'Real-time collaborative task manager with drag-and-drop, teams, and notifications.',         techStack: ['React', 'Socket.io', 'Express'],        category: 'Web',     featured: false, githubUrl: '#', liveUrl: '#' },
  { _id: '3', title: 'Portfolio CMS',        description: 'Custom CMS for managing portfolio content with rich text editor and media uploads.',          techStack: ['Next.js', 'MongoDB', 'AWS S3'],         category: 'Backend', featured: true,  githubUrl: '#', liveUrl: '#' },
  { _id: '4', title: 'Chat Application',     description: 'Real-time chat app with rooms, file sharing, and end-to-end encryption.',                    techStack: ['React', 'Socket.io', 'Node.js'],        category: 'Web',     featured: false, githubUrl: '#', liveUrl: '#' },
  { _id: '5', title: 'Weather Dashboard',    description: 'Beautiful weather app with forecasts, maps, and location-based alerts.',                     techStack: ['React', 'OpenWeather API'],             category: 'Web',     featured: false, githubUrl: '#', liveUrl: '#' },
  { _id: '6', title: 'REST API Service',     description: 'Scalable REST API with authentication, rate limiting, and comprehensive documentation.',     techStack: ['Node.js', 'Express', 'MongoDB', 'JWT'], category: 'Backend', featured: false, githubUrl: '#', liveUrl: '#' },
];
