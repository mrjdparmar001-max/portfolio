import { motion } from 'framer-motion';
import { FiFolder, FiMail, FiStar, FiEye } from 'react-icons/fi';

export default function Dashboard({ stats }) {
  const cards = [
    { label: 'Total Projects', value: stats.projects, icon: <FiFolder />, color: '#6c63ff' },
    { label: 'Total Messages', value: stats.messages, icon: <FiMail />, color: '#ff6584' },
    { label: 'Unread Messages', value: stats.unread, icon: <FiEye />, color: '#f6c90e' },
    { label: 'Compliments', value: stats.compliments, icon: <FiStar />, color: '#43e97b' },
  ];

  return (
    <div>
      <h2 className="admin-page-title" style={{ marginBottom: 8 }}>Dashboard</h2>
      <p className="admin-page-subtitle" style={{ marginBottom: 40 }}>Welcome back, Jaydip! 👋</p>

      <div className="admin-grid-cards">
        {cards.map(({ label, value, icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4, boxShadow: `0 16px 48px ${color}20` }}
            style={{
              background: '#1a1a2e',
              border: `1px solid #2a2a3e`,
              borderRadius: 20,
              padding: 28,
              borderTop: `3px solid ${color}`,
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: color + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color, fontSize: 22, marginBottom: 16,
            }}>
              {icon}
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{value}</div>
            <div style={{ color: '#a0a0b0', fontSize: 14 }}>{label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: 40,
          background: '#1a1a2e',
          border: '1px solid #2a2a3e',
          borderRadius: 20,
          padding: 'clamp(20px, 4vw, 32)',
        }}
      >
        <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
        <p style={{ color: '#a0a0b0', fontSize: 14, lineHeight: 1.8 }}>
          Use the sidebar to manage your portfolio content. Add new projects, respond to messages, 
          and approve compliments from visitors.
        </p>
      </motion.div>
    </div>
  );
}
