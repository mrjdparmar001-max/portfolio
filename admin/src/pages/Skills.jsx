import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiX, FiCheck, FiTag } from 'react-icons/fi';
import { getSkills, createSkill, updateSkill, deleteSkill } from '../api/api';

const emptyForm = { category: '', items: '' };

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const load = () => getSkills().then(r => setSkills(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowForm(true); };
  const openEdit = (s) => { setForm({ category: s.category, items: s.items.join(', ') }); setEditing(s._id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = { category: form.category, items: form.items.split(',').map(s => s.trim()).filter(Boolean) };
    try {
      if (editing) await updateSkill(editing, data);
      else await createSkill(data);
      setShowForm(false);
      load();
    } catch { alert('Error saving'); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    await deleteSkill(id);
    load();
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Tech Stack</h2>
          <p className="admin-page-subtitle">{skills.length} categories — changes reflect live on user site</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openAdd}
          className="admin-btn-primary">
          <FiPlus /> Add Category
        </motion.button>
      </div>

      <div className="admin-grid-wide">
        {skills.map((s, i) => (
          <motion.div key={s._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTag style={{ color: '#6c63ff' }} />
                <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{s.category}</h3>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => openEdit(s)}
                  style={{ background: '#6c63ff20', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#6c63ff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <FiEdit2 />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleDelete(s._id)}
                  style={{ background: '#ff658420', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#ff6584', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <FiTrash2 />
                </motion.button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {s.items.map(item => (
                <span key={item} style={{ background: '#6c63ff15', color: '#6c63ff', border: '1px solid #6c63ff30', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 500 }}>
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
              className="admin-modal-panel" style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{editing ? 'Edit Category' : 'Add Category'}</h3>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowForm(false)}
                  style={{ background: '#2a2a3e', border: 'none', borderRadius: 8, padding: 8, color: '#a0a0b0', cursor: 'pointer', fontSize: 18 }}>
                  <FiX />
                </motion.button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Category Name</label>
                  <input required placeholder="e.g. Frontend" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                    Skills <span style={{ color: '#555', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(comma separated)</span>
                  </label>
                  <textarea required placeholder="React.js, Node.js, MongoDB..." rows={4} value={form.items}
                    onChange={e => setForm({ ...form, items: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ background: 'linear-gradient(135deg, #6c63ff, #ff6584)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                  <FiCheck /> {loading ? 'Saving...' : editing ? 'Update' : 'Add Category'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputStyle = {
  background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 10,
  padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
};
