import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { sendMessage, getProfile } from '../api/api';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheck } from 'react-icons/fi';

/* ─── Global CSS (particles, shimmer, ripple, cursor, inputs) ──────────── */
const STYLES = `
  @keyframes floatUp {
    0%   { transform: translateY(0) scale(0);      opacity: 0;    }
    10%  { opacity: 0.3; }
    90%  { opacity: 0.1; }
    100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
  }
  @keyframes shimmerSlide {
    0%   { left: -40%; }
    100% { left: 120%;  }
  }
  @keyframes rippleOut {
    to { transform: scale(4); opacity: 0; }
  }
  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes spinIcon {
    to { transform: rotate(360deg); }
  }

  .ct-particle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    animation: floatUp linear infinite;
  }
  .ct-cursor {
    display: inline-block;
    width: 3px; height: 0.82em;
    border-radius: 2px;
    margin-left: 6px;
    vertical-align: middle;
    animation: cursorBlink 1s step-end infinite;
  }
  .ct-card {
    display: flex;
    align-items: center;
    gap: 16px;
    text-decoration: none;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid;
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    position: relative;
  }
  .ct-card:hover { transform: translateX(8px); }
  .ct-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
    transition: transform 0.3s ease;
  }
  .ct-card:hover .ct-icon { transform: rotate(-10deg) scale(1.12); }

  .ct-input-wrap { position: relative; }
  .ct-input {
    width: 100%; border-radius: 12px;
    padding: 13px 16px; font-size: 15px;
    outline: none; box-sizing: border-box;
    font-family: inherit; resize: none;
    transition: border-color 0.2s ease, background 0.2s ease;
  }
  .ct-focus-bar {
    position: absolute; bottom: 1px; left: 0;
    width: 100%; height: 2px; border-radius: 2px;
    transform: scaleX(0); transform-origin: left;
    opacity: 0; pointer-events: none;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .ct-input-wrap:focus-within .ct-focus-bar {
    transform: scaleX(1); opacity: 1;
  }
  .ct-shimmer-wrap {
    position: absolute; top: 0; left: 0; right: 0;
    height: 2px; overflow: hidden;
    border-radius: 24px 24px 0 0;
  }
  .ct-shimmer-bar {
    position: absolute; top: 0; height: 100%; width: 40%;
    animation: shimmerSlide 2.6s ease-in-out infinite;
  }
  .ct-btn {
    width: 100%; border: none; border-radius: 12px;
    padding: 16px; color: #fff; font-size: 16px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; gap: 8px;
    position: relative; overflow: hidden;
    transition: transform 0.15s ease, opacity 0.2s;
  }
  .ct-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .ct-btn:active:not(:disabled) { transform: scale(0.98); }
  .ct-btn:disabled { opacity: 0.72; cursor: not-allowed; }
  .ct-spin { display: inline-block; animation: spinIcon 0.75s linear infinite; }
`;

function injectStyles() {
  if (document.getElementById('ct-styles')) return;
  const s = document.createElement('style');
  s.id = 'ct-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ─── Particles ─────────────────────────────────────────────────────────── */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left:     `${(i * 5.7 + 3) % 100}%`,
  size:     `${2.5 + (i % 4)}px`,
  duration: `${9 + (i % 7) * 2}s`,
  delay:    `${(i * 1.3) % 11}s`,
}));

function Particles({ color }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {PARTICLES.map(({ id, left, size, duration, delay }) => (
        <div
          key={id}
          className="ct-particle"
          style={{ bottom: '-8px', left, width: size, height: size, background: color, animationDuration: duration, animationDelay: delay }}
        />
      ))}
    </div>
  );
}

/* ─── Animated input ────────────────────────────────────────────────────── */
function Field({ as: Tag = 'input', theme, style = {}, ...props }) {
  return (
    <div className="ct-input-wrap">
      <Tag
        {...props}
        className="ct-input"
        style={{
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          color: theme.text,
          ...style,
        }}
      />
      <div className="ct-focus-bar" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}66)` }} />
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────── */
export default function Contact() {
  const { theme } = useTheme();
  const [form, setForm]   = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [contactInfo, setContactInfo] = useState([
    { icon: <FiMail />,   label: 'Email',    value: 'jaydip@example.com', href: 'mailto:jaydip@example.com' },
    { icon: <FiPhone />,  label: 'Phone',    value: '+91 98765 43210',    href: 'tel:+919876543210' },
    { icon: <FiMapPin />, label: 'Location', value: 'Gujarat, India',     href: '#' },
  ]);
  const btnRef = useRef(null);

  useEffect(() => { injectStyles(); }, []);

  /* fetch profile — updates only if API responds successfully */
  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        const { email, phone, location } = data;
        if (!email && !phone && !location) return; // guard empty response
        setContactInfo([
          { icon: <FiMail />,   label: 'Email',    value: email || 'jaydip@example.com', href: `mailto:${email || 'jaydip@example.com'}` },
          { icon: <FiPhone />,  label: 'Phone',    value: phone || '+91 98765 43210',    href: `tel:${(phone || '').replace(/\s+/g, '')}` },
          { icon: <FiMapPin />, label: 'Location', value: location || 'Gujarat, India',  href: '#' },
        ]);
      })
      .catch(() => { /* keep default values already set in useState */ });
  }, []);

  /* ripple + submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = btn.offsetWidth;
      const r = document.createElement('span');
      r.style.cssText = `position:absolute;border-radius:50%;width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;background:rgba(255,255,255,0.25);transform:scale(0);pointer-events:none;animation:rippleOut 0.55s linear;`;
      btn.appendChild(r);
      setTimeout(() => r.remove(), 560);
    }
    setStatus('sending');
    try {
      await sendMessage(form);
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
    setTimeout(() => setStatus('idle'), 5000);
  };

  /* variants */
  const stagger   = { hidden: {}, show: { transition: { staggerChildren: 0.13, delayChildren: 0.15 } } };
  const fadeUp    = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };
  const fromLeft  = { hidden: { opacity: 0, x: -28 }, show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } };
  const fromRight = { hidden: { opacity: 0, x: 28 },  show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <section
      id="contact"
      style={{ padding: '90px 5% 80px', background: theme.bg, position: 'relative', overflow: 'hidden' }}
    >
      <Particles color={theme.primary} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <motion.div
          initial="hidden" whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <motion.p variants={fadeUp} style={{ color: theme.primary, fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>
            Get In Touch
          </motion.p>

          <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: theme.text, marginBottom: 16 }}>
            Let's Work Together
            <span className="ct-cursor" style={{ background: theme.primary }} />
          </motion.h2>

          <motion.div
            variants={{ hidden: { width: 0 }, show: { width: 60, transition: { duration: 0.8, ease: 'easeOut', delay: 0.2 } } }}
            style={{ height: 4, background: theme.gradient, borderRadius: 2, margin: '0 auto' }}
          />
        </motion.div>

        {/* ── Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48 }}>

          {/* ── Left: info ── */}
          <motion.div
            initial="hidden" whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.h3 variants={fromLeft} style={{ color: theme.text, fontSize: 24, fontWeight: 700, marginBottom: 14 }}>
              Let's Talk! 🤝
            </motion.h3>
            <motion.p variants={fromLeft} style={{ color: theme.textMuted, lineHeight: 1.8, marginBottom: 36 }}>
              Have a project in mind? Looking for a developer? Or just want to say hi?
              My inbox is always open!
            </motion.p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {contactInfo.map(({ icon, label, value, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  variants={fromLeft}
                  className="ct-card"
                  style={{ background: theme.bgCard, borderColor: theme.border }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = theme.primary + '70';
                    e.currentTarget.style.boxShadow   = `-4px 0 0 0 ${theme.primary}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.boxShadow   = 'none';
                  }}
                >
                  <div className="ct-icon" style={{ background: theme.primary + '22', color: theme.primary }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ color: theme.textMuted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {label}
                    </div>
                    <div style={{ color: theme.text, fontSize: 15, fontWeight: 600 }}>
                      {value}
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* ── Right: form ── */}
          <motion.div
            initial="hidden" whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={fromRight}
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 24, padding: 40, position: 'relative', overflow: 'hidden' }}
          >
            {/* shimmer top bar */}
            <div className="ct-shimmer-wrap">
              <div className="ct-shimmer-bar" style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field theme={theme} required placeholder="Your Name"  value={form.name}  onChange={e => setForm({ ...form, name: e.target.value })} />
                <Field theme={theme} required type="email" placeholder="Your Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              <Field theme={theme} placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />

              <Field as="textarea" theme={theme} required placeholder="Your message..." rows={5}
                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                style={{ resize: 'vertical' }}
              />

              <AnimatePresence>
                {status === 'sent' && (
                  <motion.div key="ok"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{ background: theme.accent + '22', border: `1px solid ${theme.accent}55`, borderRadius: 12, padding: '12px 16px', color: theme.accent, fontSize: 14 }}
                  >
                    ✅ Message sent! I'll get back to you soon.
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div key="err"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{ background: theme.secondary + '22', border: `1px solid ${theme.secondary}55`, borderRadius: 12, padding: '12px 16px', color: theme.secondary, fontSize: 14 }}
                  >
                    ❌ Failed to send. Please try again.
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                ref={btnRef}
                type="submit"
                disabled={status === 'sending'}
                className="ct-btn"
                style={{ background: status === 'sent' ? theme.accent : theme.gradient }}
              >
                <AnimatePresence mode="wait">
                  {status === 'idle' && (
                    <motion.span key="i" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiSend /> Send Message
                    </motion.span>
                  )}
                  {status === 'sending' && (
                    <motion.span key="s" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="ct-spin"><FiSend /></span> Sending...
                    </motion.span>
                  )}
                  {status === 'sent' && (
                    <motion.span key="ok"
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiCheck /> Message Sent!
                    </motion.span>
                  )}
                  {status === 'error' && (
                    <motion.span key="er" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiSend /> Try Again
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
