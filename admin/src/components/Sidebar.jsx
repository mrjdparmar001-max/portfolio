import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiFolder, FiMail, FiStar,
  FiLogOut, FiUser, FiCode,
} from 'react-icons/fi';
import useBreakpoint from '../hooks/useBreakpoint';

const navItems = [
  { id: 'dashboard',   label: 'Dashboard',  icon: <FiGrid /> },
  { id: 'projects',    label: 'Projects',   icon: <FiFolder /> },
  { id: 'messages',    label: 'Messages',   icon: <FiMail /> },
  { id: 'compliments', label: 'Compliments',icon: <FiStar /> },
  { id: 'skills',      label: 'Tech Stack', icon: <FiCode /> },
  { id: 'profile',     label: 'Profile',    icon: <FiUser /> },
];

const mobileLabels = {
  dashboard: 'Home',
  projects: 'Projects',
  messages: 'Inbox',
  compliments: 'Reviews',
  skills: 'Skills',
  profile: 'Profile',
};

/* ── Tooltip (used in rail mode) ── */
function Tooltip({ label }) {
  return (
    <motion.span
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        left: 60,
        top: '50%',
        transform: 'translateY(-50%)',
        background: '#1e1e2e',
        color: '#e0e0f0',
        padding: '5px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        border: '1px solid #3a3a5e',
        pointerEvents: 'none',
        zIndex: 200,
      }}
    >
      {label}
    </motion.span>
  );
}

/* ── Desktop / Tablet sidebar ── */
function DesktopSidebar({ active, setActive, onLogout, counts, rail }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{
        width: rail ? 68 : 240,
        minHeight: '100vh',
        background: '#12121a',
        borderRight: '1px solid #2a2a3e',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        transition: 'width 0.3s cubic-bezier(.4,0,.2,1)',
        overflow: 'visible',
      }}
    >
      {/* Brand */}
      <div style={{
        padding: rail ? '0 12px 20px' : '0 24px 24px',
        borderBottom: '1px solid #2a2a3e',
        overflow: 'hidden',
        transition: 'padding 0.3s',
      }}>
        <div style={{
          fontSize: rail ? 16 : 22,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textAlign: rail ? 'center' : 'left',
          transition: 'font-size 0.3s',
        }}>
          {rail ? 'JD' : 'JD Admin'}
        </div>
        {!rail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: '#a0a0b0', fontSize: 12, marginTop: 4 }}
          >
            Portfolio Manager
          </motion.div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: rail ? '12px 8px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ id, label, icon }) => {
          const isActive = active === id;
          const isHovered = hoveredId === id;
          return (
            <div
              key={id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <motion.button
                whileHover={{ x: rail ? 0 : 4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActive(id)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: rail ? 'center' : 'flex-start',
                  gap: 12,
                  padding: rail ? '11px' : '11px 14px',
                  borderRadius: 12,
                  border: 'none',
                  background: isActive
                    ? (rail ? '#6c63ff22' : 'linear-gradient(135deg, #6c63ff18, #ff658418)')
                    : 'transparent',
                  color: isActive ? '#6c63ff' : '#a0a0b0',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  textAlign: 'left',
                  borderLeft: rail ? 'none' : (isActive ? '3px solid #6c63ff' : '3px solid transparent'),
                  transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                {!rail && <span>{label}</span>}
                {!rail && counts?.[id] > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    style={{
                      marginLeft: 'auto',
                      background: '#ff6584',
                      color: '#fff',
                      borderRadius: 20,
                      padding: '2px 7px',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {counts[id]}
                  </motion.span>
                )}
                {rail && counts?.[id] > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#ff6584', border: '1.5px solid #12121a',
                  }} />
                )}
              </motion.button>

              {/* Rail tooltip */}
              <AnimatePresence>
                {rail && isHovered && <Tooltip label={label} />}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: rail ? '12px 8px' : '16px 12px', borderTop: '1px solid #2a2a3e' }}>
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setHoveredId('__logout')}
          onMouseLeave={() => setHoveredId(null)}
        >
          <motion.button
            whileHover={{ x: rail ? 0 : 4 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: rail ? 'center' : 'flex-start',
              gap: 12,
              padding: rail ? '11px' : '11px 14px',
              borderRadius: 12,
              border: 'none',
              background: 'transparent',
              color: '#ff6584',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <FiLogOut />
            {!rail && <span>Logout</span>}
          </motion.button>
          <AnimatePresence>
            {rail && hoveredId === '__logout' && <Tooltip label="Logout" />}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}

/* ── Mobile bottom nav ── */
function BottomNav({ active, setActive, counts }) {
  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#12121a',
        borderTop: '1px solid #2a2a3e',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 2,
        padding: '8px 6px calc(10px + env(safe-area-inset-bottom))',
        zIndex: 100,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {navItems.map(({ id, label, icon }) => {
        const isActive = active === id;
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActive(id)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: isActive ? '#6c63ff' : '#a0a0b0',
              fontSize: 11, padding: '6px 4px', borderRadius: 10,
              minWidth: 52, flex: '1 1 0', position: 'relative',
              transition: 'color 0.2s',
            }}
          >
            <motion.span
              animate={{ scale: isActive ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{ fontSize: 20 }}
            >
              {icon}
            </motion.span>
            <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, lineHeight: 1.2, textAlign: 'center' }}>
              {mobileLabels[id] || label}
            </span>
            {counts?.[id] > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 8,
                width: 7, height: 7, borderRadius: '50%',
                background: '#ff6584', border: '1.5px solid #12121a',
              }} />
            )}
            {isActive && (
              <motion.span
                layoutId="bnav-indicator"
                style={{
                  position: 'absolute', bottom: -8, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24, height: 3, borderRadius: 3, background: '#6c63ff',
                }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

/* ── Main export ── */
export default function Sidebar({ active, setActive, onLogout, counts, bp: bpProp }) {
  const bp = bpProp || useBreakpoint();

  return (
    <>
      {bp !== 'mobile' && (
        <DesktopSidebar
          active={active}
          setActive={setActive}
          onLogout={onLogout}
          counts={counts}
          rail={bp === 'tablet'}
        />
      )}
      {bp === 'mobile' && (
        <BottomNav active={active} setActive={setActive} counts={counts} />
      )}
    </>
  );
}
