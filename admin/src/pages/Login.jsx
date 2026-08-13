import { useState } from 'react';
import { motion } from 'framer-motion';
import { login } from '../api/api';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      localStorage.setItem('admin-token', res.data.token);
      onLogin();
    } catch {
      setError('Invalid credentials. Try admin@jaydip.com / admin123');
    }
    setLoading(false);
  };

  return (
    <div className="admin-login-wrap">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="admin-login-card"
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, margin: '0 auto 16px',
            }}
          >
            🔐
          </motion.div>
          <h1 className="admin-page-title" style={{ textAlign: 'center', marginBottom: 8 }}>Admin Panel</h1>
          <p style={{ color: '#a0a0b0', fontSize: 14 }}>Jaydip Parmar Portfolio</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email"
            required
            placeholder="Admin Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
          />
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: '#ff6584', fontSize: 13, background: '#ff658415', padding: '10px 14px', borderRadius: 8 }}
            >
              {error}
            </motion.p>
          )}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
              border: 'none', borderRadius: 12, padding: '16px',
              color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: 8,
            }}
          >
            {loading ? 'Logging in...' : 'Login →'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

const inputStyle = {
  background: '#12121a',
  border: '1px solid #2a2a3e',
  borderRadius: 12,
  padding: '14px 16px',
  color: '#fff',
  fontSize: 15,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};
