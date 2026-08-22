import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages, markRead, replyMessage, deleteMessage } from '../api/api';
import { FiMail, FiTrash2, FiSend, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function Messages({ onUpdate }) {
  const [messages, setMessages] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [sending, setSending] = useState(null);

  const load = () => getMessages().then(r => { setMessages(r.data); onUpdate?.(); }).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleExpand = async (msg) => {
    if (expanded === msg._id) { setExpanded(null); return; }
    setExpanded(msg._id);
    if (!msg.read) { await markRead(msg._id); load(); }
  };

 const handleReply = async (id) => {
  if (!replyText[id]?.trim()) return;

  try {
    setSending(id);

    await replyMessage(id, replyText[id]);

    setReplyText(prev => ({
      ...prev,
      [id]: '',
    }));

    await load();

  } catch (err) {
    console.error("Reply Error:", err);
  } finally {
    setSending(null);
  }
};

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    await deleteMessage(id);
    load();
  };

  return (
    <div>
      <h2 className="admin-page-title">Messages</h2>
      <p className="admin-page-subtitle" style={{ marginBottom: 32 }}>{messages.filter(m => !m.read).length} unread messages</p>

      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#a0a0b0', padding: 80 }}>
          <FiMail style={{ fontSize: 48, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
          No messages yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: '#1a1a2e',
                border: `1px solid ${!msg.read ? '#6c63ff40' : '#2a2a3e'}`,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <div
                className="admin-message-header"
                onClick={() => handleExpand(msg)}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
                }}>
                  {msg.name[0].toUpperCase()}
                </div>
                <div className="admin-message-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{msg.name}</span>
                    {!msg.read && <span style={{ background: '#6c63ff', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>NEW</span>}
                    {msg.replied && <span style={{ background: '#43e97b20', color: '#43e97b', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>REPLIED</span>}
                  </div>
                  <div className="admin-message-email" style={{ color: '#a0a0b0', fontSize: 13 }}>{msg.email} · {msg.subject || 'No subject'}</div>
                </div>
                <div className="admin-message-actions">
                  <span style={{ color: '#a0a0b0', fontSize: 12 }}>
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={e => { e.stopPropagation(); handleDelete(msg._id); }}
                    style={{ background: '#ff658420', border: 'none', borderRadius: 8, padding: 8, color: '#ff6584', cursor: 'pointer', fontSize: 16 }}
                  >
                    <FiTrash2 />
                  </motion.button>
                  <span style={{ color: '#a0a0b0', fontSize: 18 }}>
                    {expanded === msg._id ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {expanded === msg._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 clamp(16px, 4vw, 24px) 24px', borderTop: '1px solid #2a2a3e' }}>
                      <p style={{ color: '#ccc', lineHeight: 1.8, padding: '20px 0', fontSize: 15 }}>
                        {msg.message}
                      </p>

                      {msg.adminReply && (
                        <div style={{ background: '#6c63ff15', border: '1px solid #6c63ff30', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                          <div style={{ color: '#6c63ff', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>YOUR REPLY</div>
                          <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7 }}>{msg.adminReply}</p>
                        </div>
                      )}

                      <div className="admin-reply-row">
                        <input
                          placeholder="Type your reply..."
                          value={replyText[msg._id] || ''}
                          onChange={e => setReplyText({ ...replyText, [msg._id]: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && handleReply(msg._id)}
                          style={{
                            flex: 1, background: '#12121a', border: '1px solid #2a2a3e',
                            borderRadius: 10, padding: '12px 14px', color: '#fff',
                            fontSize: 14, outline: 'none', fontFamily: 'inherit',
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: sending === msg._id ? 1 : 1.05 }}
                          whileTap={{ scale: sending === msg._id ? 1 : 0.95 }}
                          onClick={() => handleReply(msg._id)}
                          disabled={sending === msg._id || !replyText[msg._id]?.trim()}
                          style={{
                            background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
                            border: 'none', borderRadius: 10, padding: '12px 20px',
                            color: '#fff', cursor: (sending === msg._id || !replyText[msg._id]?.trim()) ? 'not-allowed' : 'pointer', fontSize: 18,
                            display: 'flex', alignItems: 'center', opacity: (sending === msg._id || !replyText[msg._id]?.trim()) ? 0.6 : 1,
                          }}
                        >
                          <FiSend />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
