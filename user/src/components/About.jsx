import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useInView, useMotionValue, useSpring, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getSkills, getProjects, getProfile } from '../api/api';

/* ─── CountUp ─────────────────────────────────────────────────────────────── */
function CountUp({ to, duration = 1.5 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState(0);
  useEffect(() => { if (inView) motionVal.set(to); }, [inView, to, motionVal]);
  useEffect(() => spring.on('change', v => setDisplay(Math.round(v))), [spring]);
  return <span ref={ref}>{display}</span>;
}

// FIX: Deterministic particle data computed once (no Math.random inside component body)
const PARTICLE_DATA = Array.from({ length: 12 }, (_, i) => ({  // FIX: 18→12
  size: 3 + (i % 4) * 2,
  x: (i * 137.5) % 100,
  duration: 6 + (i % 5) * 2,
  delay: (i * 0.4) % 3,
  colorIdx: i % 3,
}));

function Particle({ theme, data }) {
  const color = data.colorIdx === 0 ? theme.primary : data.colorIdx === 1 ? theme.secondary : theme.accent;
  return (
    <motion.div
      style={{
        position: 'absolute', left: `${data.x}%`, bottom: '-10px',
        width: data.size, height: data.size, borderRadius: '50%',
        background: color, opacity: 0.35, pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
      animate={{ y: [0, -(180 + (data.colorIdx) * 80)], opacity: [0, 0.5, 0] }}
      transition={{ duration: data.duration, delay: data.delay, repeat: Infinity, ease: 'easeOut' }}
    />
  );
}

/* ─── Morphing blob — FIX: slower animation to ease CPU ─────────────────── */
function MorphBlob({ theme, style }) {
  return (
    <motion.div
      style={{
        position: 'absolute', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        filter: 'blur(60px)', opacity: 0.1, pointerEvents: 'none',
        willChange: 'transform, border-radius', ...style,
      }}
      animate={{
        borderRadius: [
          '60% 40% 30% 70% / 60% 30% 70% 40%',
          '30% 60% 70% 40% / 50% 60% 30% 60%',
          '60% 40% 30% 70% / 60% 30% 70% 40%',
        ],
        scale: [1, 1.06, 1],
      }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} // FIX: 10→14s, less frequent
    />
  );
}

/* ─── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ value, label, index, theme, expLabel, stats }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const isExp = label === 'Experience';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay: 0.1 + index * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.03 }} // FIX: reduced hover motion
      style={{
        position: 'relative', background: theme.bgCard,
        border: `1px solid ${theme.border}`, borderRadius: 20,
        padding: '28px 16px', textAlign: 'center', overflow: 'hidden', cursor: 'default',
      }}
    >
      {/* Shimmer sweep */}
      <motion.div
        initial={{ x: '-120%', opacity: 0 }}
        whileHover={{ x: '120%', opacity: 1 }}
        transition={{ duration: 0.55 }}
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(105deg, transparent 40%, ${theme.primary}18 50%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />
      <motion.div
        initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
        style={{ position: 'absolute', inset: -1, borderRadius: 20, border: `1.5px solid ${theme.primary}50`, pointerEvents: 'none' }}
      />

      <div style={{ fontSize: isExp ? 28 : 38, fontWeight: 900, background: theme.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
        {value === null ? (
          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}>…</motion.span>
        ) : isExp ? <>{expLabel}+</> : <><CountUp to={value} />+</>}
      </div>

      {isExp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.35 + index * 0.12 }}
          style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 8 }}
        >
          {stats.expYears > 0 && <span style={{ background: theme.primary + '20', color: theme.primary, borderRadius: 8, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}><CountUp to={stats.expYears} /> yr</span>}
          {stats.expMonths > 0 && <span style={{ background: theme.secondary + '20', color: theme.secondary, borderRadius: 8, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}><CountUp to={stats.expMonths} /> mo</span>}
          {stats.expDays > 0 && <span style={{ background: theme.accent + '20', color: theme.accent, borderRadius: 8, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}><CountUp to={stats.expDays} /> d</span>}
        </motion.div>
      )}
      <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 8, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </motion.div>
  );
}

/* ─── Skill pill ──────────────────────────────────────────────────────────── */
function SkillPill({ skill, theme, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.1, y: -2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? theme.primary : theme.primary + '15',
        color: hovered ? '#fff' : theme.primary,
        border: `1px solid ${theme.primary}35`, borderRadius: 20,
        padding: '5px 14px', fontSize: 13, fontWeight: 600,
        cursor: 'default', transition: 'background 0.25s, color 0.25s', overflow: 'hidden',
      }}
    >
      {skill}
    </motion.span>
  );
}

/* ─── Skill category card ─────────────────────────────────────────────────── */
function SkillCard({ category, items, index, theme }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }} // FIX: removed rotateX for perf
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden' }}
    >
      <motion.div
        initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
        transition={{ delay: 0.2 + index * 0.08, duration: 0.5 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: theme.gradient, transformOrigin: 'left', borderRadius: '0 0 2px 0' }}
      />
      <h4 style={{ color: theme.primary, fontSize: 13, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14, marginTop: 4 }}>
        {category}
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((skill, si) => (
          <SkillPill key={skill} skill={skill} theme={theme} delay={0.25 + index * 0.06 + si * 0.03} />
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Section header ──────────────────────────────────────────────────────── */
function SectionHeader({ theme }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      style={{ textAlign: 'center', marginBottom: 80 }}
    >
      <p style={{ color: theme.primary, fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 14 }}>About Me</p>
      <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: theme.text, marginBottom: 18, lineHeight: 1.15 }}>
        {/* FIX: reduced per-char animation overhead — animating words, not chars */}
        {'Who Am I?'.split(' ').map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
            style={{ display: 'inline-block', marginRight: '0.25em' }}
          >
            {word}
          </motion.span>
        ))}
      </h2>
      <motion.div
        initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.55 }}
        style={{ width: 60, height: 4, background: theme.gradient, borderRadius: 2, margin: '0 auto', transformOrigin: 'center' }}
      />
    </motion.div>
  );
}

/* ─── Bio text — FIX: animate paragraphs not individual words ─────────────── */
function BioText({ theme }) {
  const tags = useMemo(() => ['Open Source', 'UI/UX Design', 'Problem Solver', 'Clean Code'], []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.p
        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        style={{ color: theme.textMuted, fontSize: 16, lineHeight: 1.95, marginBottom: 20 }}
      >
        Hi! I'm <strong style={{ color: theme.primary }}>Jaydip Parmar,</strong> a passionate Full Stack Developer with expertise in the MERN stack.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        style={{ color: theme.textMuted, fontSize: 16, lineHeight: 1.95 }}
      >
        I love building scalable, beautiful web applications that solve real problems.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.35 }}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}
      >
        {tags.map((tag, i) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.07 }}
            whileHover={{ scale: 1.06, y: -2 }}
            style={{
              background: `linear-gradient(135deg, ${theme.primary}18, ${theme.secondary}18)`,
              color: theme.primary, border: `1px solid ${theme.primary}30`,
              borderRadius: 30, padding: '5px 16px', fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
            }}
          >
            #{tag}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ─── Main About ──────────────────────────────────────────────────────────── */
export default function About() {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState({
    expYears: 3, expMonths: 0, expDays: 0,
    projectCount: null, happyClients: 20, awardsWon: 5,
  });

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  // FIX: reduced parallax range for smoother scroll
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

  // Merged API calls into Promise.all using centralized API client
  useEffect(() => {
    Promise.all([
      getSkills().catch(() => ({ data: [] })),
      getProjects().catch(() => ({ data: [] })),
      getProfile().catch(() => ({ data: {} })),
    ]).then(([skillsRes, projectsRes, profileRes]) => {
      setSkills(skillsRes.data);
      const p = profileRes.data;
      setStats(s => ({
        ...s,
        projectCount: projectsRes.data.length,
        expYears:     p.expYears      ?? p.yearsExperience ?? 3,
        expMonths:    p.expMonths     ?? 0,
        expDays:      p.expDays       ?? 0,
        happyClients: p.happyClients  ?? 20,
        awardsWon:    p.awardsWon     ?? 5,
      }));
    });
  }, []);

  const expLabel = useMemo(() => {
    return [
      stats.expYears  > 0 ? `${stats.expYears}y`  : '',
      stats.expMonths > 0 ? `${stats.expMonths}m` : '',
      stats.expDays   > 0 ? `${stats.expDays}d`   : '',
    ].filter(Boolean).join(' ') || '0d';
  }, [stats.expYears, stats.expMonths, stats.expDays]);

  const statCards = useMemo(() => [
    { value: stats.expYears, label: 'Experience' },
    { value: stats.projectCount, label: 'Projects Done' },
    { value: stats.happyClients, label: 'Happy Clients' },
    { value: stats.awardsWon, label: 'Awards Won' },
  ], [stats]);

  return (
    <section
      ref={sectionRef}
      id="about"
      style={{ padding: '100px 5% 90px', background: theme.bgSecondary, position: 'relative', overflow: 'hidden' }}
    >
      {/* Parallax blobs */}
      <motion.div style={{ y: bgY, position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <MorphBlob theme={theme} style={{ width: 500, height: 500, top: -100, right: -120, background: theme.primary }} />
        <MorphBlob theme={theme} style={{ width: 350, height: 350, bottom: 80, left: -80, background: theme.secondary }} />
      </motion.div>

      {/* Particles — deterministic, no Math.random */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {PARTICLE_DATA.map((data, i) => <Particle key={i} theme={theme} data={data} />)}
      </div>

      {/* Grid dot overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
        backgroundImage: `radial-gradient(circle, ${theme.text} 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <SectionHeader theme={theme} />

        {/* Bio + stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, marginBottom: 90 }}>
          <BioText theme={theme} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {statCards.map(({ value, label }, i) => (
              <StatCard key={label} value={value} label={label} index={i} theme={theme} expLabel={expLabel} stats={stats} />
            ))}
          </div>
        </div>

        {/* Skills section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          id="skills"
        >
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h3 style={{ fontSize: 30, fontWeight: 700, color: theme.text, marginBottom: 8 }}>Tech Stack</h3>
            <motion.div
              initial={{ width: 0 }} whileInView={{ width: 40 }} viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{ height: 3, background: theme.gradient, borderRadius: 2, margin: '0 auto' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {skills.map(({ category, items }, i) => (
              <SkillCard key={category} category={category} items={items} index={i} theme={theme} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
