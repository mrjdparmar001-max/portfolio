import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { useTheme } from '../context/ThemeContext';
import { FiGithub, FiLinkedin, FiMail, FiDownload, FiTwitter } from 'react-icons/fi';
import { getProfile } from '../api/api';

const BASE = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const FALLBACK_AVATAR =
  'https://api.dicebear.com/9.x/avataaars/svg?seed=JaydipParmar&backgroundColor=transparent&style=transparent&accessories=prescription02&clothing=blazerAndShirt&eyes=happy&eyebrows=default&facialHair=beardMedium&facialHairColor=2c1b18&hair=short02&hairColor=2c1b18&skinColor=f8d25c';



const PARTICLE_DATA = Array.from({ length: 5 }, (_, i) => ({
  size: 3 + (i % 4) * 1.5,
  startX: (i * 137.5) % 100,
  duration: 8 + (i % 5) * 2.4,
  delay: (i * 0.7) % 5,
  colorIdx: i % 3,
}));

function Particle({ theme, data }) {
  const color = data.colorIdx === 0 ? theme.primary : data.colorIdx === 1 ? theme.secondary : theme.accent;
  return (
    <motion.div
      initial={{ opacity: 0, y: '100vh', x: `${data.startX}vw` }}
      animate={{ opacity: [0, 0.7, 0.7, 0], y: [null, '-10vh'], x: [`${data.startX}vw`, `${data.startX + (data.colorIdx - 1) * 14}vw`] }}
      transition={{ duration: data.duration, delay: data.delay, repeat: Infinity, ease: 'easeOut' }}
      style={{ position: 'absolute', width: data.size, height: data.size, borderRadius: '50%', background: color, filter: data.size > 6 ? 'blur(2px)' : 'none', pointerEvents: 'none', zIndex: 0, willChange: 'transform, opacity' }}
    />
  );
}

function HoloRing({ theme, size, opacity, delay, rotateDir = 1 }) {
  return (
    <motion.div
      animate={{ rotateZ: [0, 360 * rotateDir] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'linear', delay }}
      style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', border: `1px solid ${theme.primary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', willChange: 'transform' }}
    />
  );
}

function OrbitDot({ color, radius = 18, duration = 1.4 }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', inset: -radius, pointerEvents: 'none', willChange: 'transform' }}
    >
      <div style={{ position: 'absolute', top: 0, left: '50%', width: 4, height: 4, borderRadius: '50%', background: color, boxShadow: `0 0 6px 2px ${color}80`, transform: 'translateX(-50%)' }} />
    </motion.div>
  );
}

function SocialIconHero({ icon, href, theme, color, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 14 }}
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.a
        href={href} target="_blank" rel="noreferrer"
        whileHover={{ scale: 1.2, y: -5 }} whileTap={{ scale: 0.9 }}
        style={{ color: hovered ? color : theme.textMuted, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, padding: 0, borderRadius: 10, border: `1px solid ${hovered ? color + '60' : theme.primary + '20'}`, background: hovered ? `${color}15` : `${theme.primary}08`, boxShadow: hovered ? `0 0 20px ${color}40, 0 0 40px ${color}20` : 'none', transition: 'all 0.22s ease', position: 'relative', zIndex: 1 }}
      >{icon}</motion.a>
      <AnimatePresence>{hovered && <OrbitDot color={color} radius={18} duration={1.2} />}</AnimatePresence>
    </motion.div>
  );
}

// ─── Avatar3D — receives breakpoint tier ─────────────────────────────────────
// tier: 'mobile' | 'tablet' | 'desktop'
function Avatar3D({ theme, avatarSrc, avatarRef, x, y, rotateX, rotateY, badgesVisible, tier }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) setImgLoaded(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { setGlitching(true); setTimeout(() => setGlitching(false), 200); }, 10000);
    return () => clearInterval(interval);
  }, []);

  const orbitDots = useMemo(() => [
    { color: theme.primary, size: 6, orbitSize: 400, duration: 10 },
    { color: theme.secondary, size: 8, orbitSize: 360, duration: 13 },
  ], [theme.primary, theme.secondary]);

  // ── Badge positions per tier ──────────────────────────────────────────────
  // desktop (≥1024): classic left/right side floats
  // tablet (768–1023): tighter side floats that stay on-screen
  // mobile (<768): top-left / top-right / bottom-left / bottom-right corners
  const techBadges =
    tier === 'desktop'
      ? [
        { label: 'React', icon: '⚛️', style: { left: -88, top: '18%' }, delay: 1.2 },
        { label: 'Node.js', icon: '🟢', style: { right: -96, top: '22%' }, delay: 1.5 },
        { label: 'MERN', icon: '🛢️', style: { left: -72, top: '62%' }, delay: 1.8 },
        { label: 'UI/UX', icon: '🎨', style: { right: -80, top: '58%' }, delay: 2.1 },
      ]
      : tier === 'tablet'
        ? [
          { label: 'React', icon: '⚛️', style: { left: -70, top: '18%' }, delay: 1.2 },
          { label: 'Node.js', icon: '🟢', style: { right: -76, top: '22%' }, delay: 1.5 },
          { label: 'MERN', icon: '🛢️', style: { left: -58, top: '62%' }, delay: 1.8 },
          { label: 'UI/UX', icon: '🎨', style: { right: -64, top: '58%' }, delay: 2.1 },
        ]
        : /* mobile */[
          { label: 'React', icon: '⚛️', style: { left: 0, top: '-40px' }, delay: 1.2 },
          { label: 'Node.js', icon: '🟢', style: { right: 0, top: '-40px' }, delay: 1.5 },
          { label: 'MERN', icon: '🛢️', style: { left: 0, top: 'unset', bottom: '-40px' }, delay: 1.8 },
          { label: 'UI/UX', icon: '🎨', style: { right: 0, top: 'unset', bottom: '-40px' }, delay: 2.1 },
        ];

  // Avatar box size per tier
  const avatarW = tier === 'desktop' ? 420 : 320;
  const avatarH = tier === 'desktop' ? 520 : 420;
  // "Available for work" bottom offset per tier
  const availBottom = tier === 'mobile' ? -86 : -10;

  return (
    <motion.div
      ref={avatarRef}
      initial={{ opacity: 0, scale: 0.7, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.1, delay: 0.5, type: 'spring', stiffness: 60 }}
      style={{
        position: 'relative',
        flexShrink: 0,
        width: avatarW,
        height: avatarH,
        overflow: 'visible',
        marginTop: tier === 'mobile' ? 44 : 0,
        marginBottom: tier === 'mobile' ? 100 : 0,
      }}
    >
      <HoloRing theme={theme} size={400} opacity={0.25} delay={0} rotateDir={1} />
      <HoloRing theme={theme} size={340} opacity={0.12} delay={1.5} rotateDir={-1} />

      {orbitDots.map((dot, i) => (
        <motion.div key={i}
          animate={{ rotateZ: [0, 360 * (i % 2 === 0 ? 1 : -1)] }}
          transition={{ duration: dot.duration, repeat: Infinity, ease: 'linear', delay: i * 1.5 }}
          style={{ position: 'absolute', top: '50%', left: '50%', width: dot.orbitSize, height: dot.orbitSize, marginTop: -(dot.orbitSize / 2), marginLeft: -(dot.orbitSize / 2), pointerEvents: 'none', willChange: 'transform' }}
        >
          <motion.div style={{ position: 'absolute', top: 0, left: '50%', width: dot.size, height: dot.size, borderRadius: '50%', background: dot.color, transform: 'translate(-50%, -50%)', boxShadow: `0 0 10px 3px ${dot.color}60` }} />
        </motion.div>
      ))}

      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: -30, background: `radial-gradient(ellipse at 50% 75%, ${theme.primary}50, ${theme.secondary}25, transparent 65%)`, filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none', willChange: 'transform, opacity' }}
      />

      <motion.div
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 5 }}
        style={{ position: 'absolute', left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, transparent, ${theme.primary}18, ${theme.primary}30, ${theme.primary}18, transparent)`, zIndex: 3, pointerEvents: 'none', borderRadius: 16, willChange: 'transform' }}
      />

      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d', position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
        {!imgLoaded && (
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, borderRadius: 20, background: `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}10, ${theme.primary}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}
          >
            <div style={{ textAlign: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${theme.primary}40`, borderTopColor: theme.primary, margin: '0 auto 12px' }}
              />
              <div style={{ color: theme.primary, fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Loading...</div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {glitching && imgLoaded && (
            <>
              <motion.img key="glitch-r" src={avatarSrc} initial={{ opacity: 0.7, x: 6, filter: 'hue-rotate(180deg) saturate(3)' }} animate={{ opacity: [0.7, 0], x: [6, -6] }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center', mixBlendMode: 'screen', zIndex: 4, pointerEvents: 'none' }} />
              <motion.img key="glitch-b" src={avatarSrc} initial={{ opacity: 0.5, x: -4, filter: 'hue-rotate(0deg) saturate(3)' }} animate={{ opacity: [0.5, 0], x: [-4, 4] }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center', mixBlendMode: 'screen', zIndex: 4, pointerEvents: 'none' }} />
            </>
          )}
        </AnimatePresence>

        <motion.img
          ref={imgRef}
          key={avatarSrc}
          src={avatarSrc}
          alt="Profile"
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            console.log("IMAGE FAILED");

            if (e.currentTarget.src !== FALLBACK_AVATAR) {
              e.currentTarget.src = FALLBACK_AVATAR;
            }

            setImgLoaded(true);
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "50% 20%",
            position: "absolute",
            inset: 0,
            zIndex: 2,
          }}
        />
      </motion.div>

      {/* Tech badges */}
      <AnimatePresence>
        {badgesVisible && techBadges.map(({ label, icon, style, delay }) => (
          <motion.div key={label}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
            transition={{ delay, type: 'spring', stiffness: 200, damping: 15 }}
            whileHover={{ scale: 1.12, zIndex: 10 }}
            style={{ position: 'absolute', ...style, background: `linear-gradient(135deg, ${theme.cardBg || theme.bg}ee, ${theme.cardBg || theme.bg}cc)`, backdropFilter: 'blur(12px)', border: `1px solid ${theme.primary}40`, borderRadius: 50, padding: tier === 'mobile' ? '5px 10px' : '6px 14px', fontSize: tier === 'mobile' ? 11 : 12, fontWeight: 700, color: theme.primary, display: 'flex', alignItems: 'center', gap: 5, boxShadow: `0 4px 24px ${theme.primary}20`, whiteSpace: 'nowrap', zIndex: 5, cursor: 'default', userSelect: 'none' }}
          >
            <motion.span animate={{ rotateY: [0, 360] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}>{icon}</motion.span>
            {label}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Available for work badge */}
      <AnimatePresence>
        {badgesVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 2.5, type: 'spring', stiffness: 200 }}
            style={{ position: 'absolute', bottom: availBottom, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${theme.cardBg || theme.bg}ee, ${theme.cardBg || theme.bg}dd)`, backdropFilter: 'blur(12px)', border: '1px solid #22c55e50', borderRadius: 50, padding: tier === 'mobile' ? '6px 14px' : '8px 20px', fontSize: tier === 'mobile' ? 11 : 12, fontWeight: 700, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 24px #22c55e25', whiteSpace: 'nowrap', zIndex: 5 }}
          >
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', willChange: 'transform, opacity' }} />
            Available for work
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── useMediaQuery hook ───────────────────────────────────────────────────────
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

// ─── Main Hero ────────────────────────────────────────────────────────────────
export default function Hero() {
  const { theme } = useTheme();
  const [resumePath, setResumePath] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [avatarPath, setAvatarPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [socials, setSocials] = useState({ github: '', linkedin: '', twitter: '', email: '' });
  const [badgesVisible, setBadgesVisible] = useState(false);

  // ── 3-tier breakpoints ────────────────────────────────────────────────────
  const isTabletUp = useMediaQuery('(min-width: 768px)');   // tablet + desktop
  const isDesktopUp = useMediaQuery('(min-width: 1024px)');  // desktop only
  // tier: 'mobile' | 'tablet' | 'desktop'
  const tier = isDesktopUp ? 'desktop' : isTabletUp ? 'tablet' : 'mobile';

  const avatarSrc = avatarPath || FALLBACK_AVATAR;
  const downloadResume = async () => {
    if (!resumePath) return;
    const fullUrl = /^https?:\/\//i.test(resumePath)
      ? resumePath
      : `${BASE}/${resumePath.replace(/^\/+/, '')}`;

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = resumeName || "Resume.pdf";

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Direct download failed, opening in new tab:", err);
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
  };
  const resumeHref = resumePath || '';

  const avatarRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-80, 80], [15, -15]), { stiffness: 120, damping: 22 });
  const rotateY = useSpring(useTransform(x, [-80, 80], [-15, 15]), { stiffness: 120, damping: 22 });

  useEffect(() => {
    setBadgesVisible(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const rect = avatarRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const r = await getProfile();

        console.log("PROFILE DATA:", r.data);
        console.log("AVATAR URL:", r.data.avatar);
        console.log("RESUME URL:", r.data.resume);
        setResumePath(r.data.resume || '');
        setResumeName(r.data.resumeName || 'Resume.pdf');
        setAvatarPath(r.data.avatar || '');

        setSocials({
          github: r.data.github || '',
          linkedin: r.data.linkedin || '',
          twitter: r.data.twitter || '',
          email: r.data.email || ''
        });

      } catch (err) {

        console.log("PROFILE ERROR:", err);

      } finally {

        setLoading(false);

      }
    };

    loadProfile();
  }, []);

  const socialList = useMemo(() => [
    { icon: <FiGithub />, href: socials.github, show: !!socials.github, color: '#e2e8f0' },
    { icon: <FiLinkedin />, href: socials.linkedin, show: !!socials.linkedin, color: '#0a66c2' },
    { icon: <FiTwitter />, href: socials.twitter, show: !!socials.twitter, color: '#1d9bf0' },
    { icon: <FiMail />, href: `mailto:${socials.email}`, show: !!socials.email, color: '#ef4444' },
  ].filter(s => s.show), [socials]);

  const blobs = useMemo(() => [
    { w: 600, h: 600, top: '-15%', left: '55%', color: theme.primary + '12', duration: 18 },
    { w: 500, h: 500, top: '35%', left: '-8%', color: theme.secondary + '0e', duration: 22 },
    { w: 450, h: 450, top: '55%', left: '65%', color: theme.accent + '0a', duration: 25 },
  ], [theme.primary, theme.secondary, theme.accent]);

  // ── Layout values per tier ────────────────────────────────────────────────
  const isMobile = tier === 'mobile';
  const isTablet = tier === 'tablet';

  const layout = {
    // tablet uses row layout but with tighter spacing than desktop
    sectionPadding: isMobile
      ? '100px 5% 60px'
      : isTablet
        ? '80px 4% 80px'
        : '80px 5% 40px',

    outerFlex: isMobile ? 'column' : 'row',
    outerAlign: 'center',
    outerGap: isMobile ? 40 : isTablet ? 24 : 60,

    textAlign: isMobile ? 'center' : 'left',
    textJustify: isMobile ? 'center' : 'flex-start',
    nameFlex: isMobile ? 'center' : 'flex-start',
    bioMargin: isMobile ? '0 auto 28px' : '0 0 28px',

    avatarMargin: isMobile ? '0 auto' : '0',

    // on tablet reduce padding around avatar so badges don't escape viewport
    avatarPaddingX: isTablet ? 80 : 0,
  };

  return (
    <section
      id="home"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: layout.sectionPadding,
        position: 'relative',
        overflow: 'clip',
        background: theme.bg,
      }}
    >
      {/* Particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {PARTICLE_DATA.map((data, i) => <Particle key={i} theme={theme} data={data} />)}
      </div>

      {/* Blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {blobs.map((b, i) => (
          <motion.div key={i}
            animate={{ x: [0, 60, -30, 0], y: [0, -40, 30, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ duration: b.duration, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(40px)', width: b.w, height: b.h, background: b.color, top: b.top, left: b.left, willChange: 'transform' }}
          />
        ))}
      </div>

      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: `linear-gradient(${theme.primary}06 1px, transparent 1px), linear-gradient(90deg, ${theme.primary}06 1px, transparent 1px)`, backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)' }} />

      {/* ── Main content row/column ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: layout.outerFlex,
        alignItems: layout.outerAlign,
        gap: layout.outerGap,
        width: '100%',
        maxWidth: isTablet ? 900 : 1280,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        // on tablet give horizontal padding so side-floating badges stay on-screen
        paddingLeft: isTablet ? layout.avatarPaddingX : 0,
        paddingRight: isTablet ? layout.avatarPaddingX : 0,
        boxSizing: 'border-box',
      }}>

        {/* ── Text block ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: isMobile ? 0 : -60, y: isMobile ? 40 : 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ flex: 1, minWidth: 0, textAlign: layout.textAlign }}
        >
          {/* Greeting pill */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}10)`, border: `1px solid ${theme.primary}30`, borderRadius: 50, padding: '6px 18px', marginBottom: 16 }}
          >
            <motion.span animate={{ rotate: [0, 20, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }} style={{ fontSize: 18 }}>👋</motion.span>
            <span style={{ color: theme.primary, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Hello, I'm</span>
          </motion.div>

          {/* Name */}
          <h1 style={{
            fontSize: isMobile ? 'clamp(28px, 8vw, 42px)' : isTablet ? 'clamp(32px, 5vw, 54px)' : 'clamp(40px, 5vw, 76px)',
            fontWeight: 900, lineHeight: 1.05, marginBottom: 16,
            fontFamily: "'Poppins', sans-serif",
            display: 'flex', flexWrap: 'wrap', justifyContent: layout.nameFlex, gap: '0 2px',
          }}>
            {'Jaydip Parmar'.split('').map((char, i) => (
              <motion.span key={i}
                initial={{ opacity: 0, y: 50, rotateX: -80 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.3 + i * 0.04, type: 'spring', stiffness: 180, damping: 18 }}
                whileHover={{ scale: 1.35, y: -8, transition: { type: 'spring', stiffness: 500, damping: 10 } }}
                style={{ display: 'inline-block', background: theme.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'default', transformOrigin: 'bottom center', whiteSpace: char === ' ' ? 'pre' : 'normal', minWidth: char === ' ' ? '0.3em' : undefined, filter: `drop-shadow(0 0 16px ${theme.primary}35)`, willChange: 'transform' }}
              >{char === ' ' ? '\u00a0' : char}</motion.span>
            ))}
          </h1>

          {/* Typewriter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : 'clamp(16px, 2.5vw, 26px)', marginBottom: 20, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: layout.textJustify, gap: 10 }}
          >
            <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 3, height: '1.2em', background: theme.primary, borderRadius: 2, willChange: 'opacity', flexShrink: 0 }} />
            <TypeAnimation sequence={['Full Stack Developer', 2000, 'MERN Stack Expert', 2000, 'UI/UX Enthusiast', 2000, 'Problem Solver', 2000]} repeat={Infinity} style={{ color: theme.secondary }} />
          </motion.div>

          {/* Bio */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ color: theme.textMuted, fontSize: isMobile ? '14px' : '15px', lineHeight: 1.9, maxWidth: isTablet ? 360 : 480, margin: layout.bioMargin }}
          >
            Passionate developer crafting beautiful, performant web experiences.
            I turn ideas into reality with clean code and creative design.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28, justifyContent: layout.textJustify }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: `0 0 36px ${theme.primary}50` }}
              whileTap={{ scale: 0.94 }}
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: theme.gradient, border: 'none', borderRadius: 50, padding: isTablet ? '11px 24px' : '13px 30px', color: '#fff', fontSize: isTablet ? 14 : 15, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, position: 'relative', overflow: 'hidden' }}
            >
              <motion.span animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)', pointerEvents: 'none', willChange: 'transform' }} />
              Hire Me 🚀
            </motion.button>

            <motion.button
              whileHover={{ scale: resumeHref ? 1.05 : 1 }}
              whileTap={{ scale: resumeHref ? 0.94 : 1 }}
              onClick={downloadResume}
              disabled={!resumeHref}
              style={{
                background: 'transparent',
                border: `2px solid ${resumeHref ? theme.primary : theme.border}`,
                borderRadius: 50,
                padding: isTablet ? '11px 24px' : '13px 30px',
                color: resumeHref ? theme.primary : theme.textMuted,
                fontSize: isTablet ? 14 : 15,
                fontWeight: 700,
                cursor: resumeHref ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: resumeHref ? 1 : 0.45
              }}
            >
              <FiDownload />
              {resumeHref ? 'Resume' : 'Resume (soon)'}
            </motion.button>
          </motion.div>

          {/* Socials */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: layout.textJustify }}
          >
            <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Follow</span>
            <div style={{ width: 28, height: 1, background: theme.primary + '40' }} />
            {socialList.map(({ icon, href, color }, i) => (
              <SocialIconHero key={i} icon={icon} href={href} theme={theme} color={color} delay={0.95 + i * 0.08} />
            ))}
          </motion.div>
        </motion.div>

        {/* ── Avatar ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: isMobile ? 0 : 60, y: isMobile ? -30 : 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flexShrink: 0, margin: layout.avatarMargin, overflow: 'visible' }}
        >
          <Avatar3D
            theme={theme} avatarSrc={avatarSrc}
            avatarRef={avatarRef} x={x} y={y}
            rotateX={rotateX} rotateY={rotateY}
            badgesVisible={badgesVisible}
            tier={tier}
          />

          {/* Mobile/Tablet: scroll hint flows below avatar in flex column */}
          {!isDesktopUp && (
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', zIndex: 10, marginTop: isTablet ? 24 : 32, paddingBottom: 8 }}
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase' }}>Scroll</span>
              <div style={{ width: 22, height: 32, border: `2px solid ${theme.primary}50`, borderRadius: 50, display: 'flex', justifyContent: 'center', paddingTop: 5 }}>
                <motion.div
                  animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  style={{ width: 3, height: 7, borderRadius: 50, background: theme.primary, willChange: 'transform, opacity' }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Desktop-only: absolute scroll indicator at bottom center */}
      {isDesktopUp && (
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', willChange: 'transform', zIndex: 10 }}
          onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: 24, height: 36, border: `2px solid ${theme.primary}50`, borderRadius: 50, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
            <motion.div
              animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{ width: 4, height: 8, borderRadius: 50, background: theme.primary, willChange: 'transform, opacity' }}
            />
          </div>
        </motion.div>
      )}
    </section>
  );
}
