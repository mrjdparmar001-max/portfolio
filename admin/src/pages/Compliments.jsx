import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllCompliments, approveCompliment, deleteCompliment } from '../api/api';
import { FiStar, FiCheck, FiTrash2 } from 'react-icons/fi';

export default function Compliments() {
  const [compliments, setCompliments] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const load = () => getAllCompliments().then(r => setCompliments(r.data)).catch(() => {});

  useEffect(() => {
    load();
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 480;

  const handleApprove = async (id) => {
    await approveCompliment(id);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this compliment?')) return;
    await deleteCompliment(id);
    load();
  };

  return (
    <div>
      <h2 className="admin-page-title" style={{ marginBottom: 4 }}>Compliments</h2>
      <p className="admin-page-subtitle" style={{ marginBottom: 24 }}>
        {compliments.filter(c => !c.approved).length} pending approval
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {compliments.map((c, i) => (
          <motion.div
            key={c._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: '#1a1a2e',
              border: `1px solid ${c.approved ? '#43e97b30' : '#f6c90e30'}`,
              borderRadius: 16,
              // FIX 1: responsive padding using clamp
              padding: `16px clamp(12px, 4vw, 24px)`,
              display: 'flex',
              alignItems: 'flex-start',
              // FIX 2: allow wrapping on narrow screens
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{
              // FIX 4: smaller avatar on mobile
              width: isMobile ? 36 : 44,
              height: isMobile ? 36 : 44,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: isMobile ? 14 : 16,
            }}>
              {c.name[0].toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>  {/* minWidth:0 prevents flex overflow */}
              {/* FIX 3: wrap the header row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 6,
                rowGap: 4,
                marginBottom: 6,
              }}>
                <span style={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: isMobile ? 13 : 14,
                  whiteSpace: 'nowrap',
                }}>
                  {c.name}
                </span>
                <span style={{
                  background: c.approved ? '#43e97b20' : '#f6c90e20',
                  color: c.approved ? '#43e97b' : '#f6c90e',
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  {c.approved ? 'APPROVED' : 'PENDING'}
                </span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, j) => (
                    <FiStar
                      key={j}
                      style={{
                        fontSize: 11,
                        color: j < c.rating ? '#f6c90e' : '#2a2a3e',
                        fill: j < c.rating ? '#f6c90e' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <p style={{
                color: '#a0a0b0',
                fontSize: isMobile ? 13 : 14,
                lineHeight: 1.7,
                margin: 0,
                wordBreak: 'break-word',  // prevents long words overflowing
              }}>
                "{c.message}"
              </p>
              <p style={{ color: '#555', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                {new Date(c.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* FIX 2: buttons in their own row when wrapped */}
            <div style={{
              display: 'flex',
              gap: 8,
              flexShrink: 0,
              alignSelf: isMobile ? 'flex-end' : 'flex-start',
              marginLeft: isMobile ? 'auto' : 0,
            }}>
              {!c.approved && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleApprove(c._id)}
                  style={{
                    background: '#43e97b20',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: '#43e97b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 0 : 4,
                    fontSize: 13,
                  }}
                >
                  <FiCheck />
                  {/* FIX 4: icon-only on mobile */}
                  {!isMobile && ' Approve'}
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => handleDelete(c._id)}
                style={{
                  background: '#ff658420',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#ff6584',
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FiTrash2 />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}