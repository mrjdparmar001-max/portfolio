import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProjects, createProject, updateProject, deleteProject, uploadImage } from '../api/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiUpload, FiExternalLink, FiGithub } from 'react-icons/fi';

// ── Base URL from env (no trailing slash) ────────────────────────────────────
const BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

// ── Always returns a fully-qualified image URL ────────────────────────────────
function imgUrl(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (!s) return '';
  // already absolute
  if (/^https?:\/\//i.test(s)) return s;
  // base64 / blob
  if (s.startsWith('data:') || s.startsWith('blob:')) return s;
  // relative path → prepend BASE
  return `${BASE}/${s.replace(/^\/+/, '')}`;
}

const EMPTY = {
  title: '', description: '', techStack: '',
  liveUrl: '', githubUrl: '', image: '',
  category: 'Web', featured: false,
};

const inp = {
  background: '#12121a', border: '1px solid #2a2a3e',
  borderRadius: 10, padding: '12px 14px',
  color: '#fff', fontSize: 14, outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
};

export default function Projects() {
  const [projects,   setProjects]   = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [loading,    setLoading]    = useState(false);
  const [imgFile,    setImgFile]    = useState(null);
  const [preview,    setPreview]    = useState('');   // always a displayable URL
  const [uploading,  setUploading]  = useState(false);
  const [brokenImgs, setBrokenImgs] = useState({});   // track per-card broken imgs

  const load = () => getProjects().then(r => setProjects(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  // ── debug: log every project's image field on load ────────────────────────
  useEffect(() => {
    if (projects.length) {
      console.log('[Projects] loaded:', projects.map(p => ({ id: p._id, title: p.title, image: p.image })));
    }
  }, [projects]);

  const openAdd = () => {
    setForm(EMPTY); setEditing(null);
    setImgFile(null); setPreview('');
    setBrokenImgs({});
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({ ...p, techStack: Array.isArray(p.techStack) ? p.techStack.join(', ') : (p.techStack || '') });
    setEditing(p._id);
    setImgFile(null);
    setPreview(imgUrl(p.image));
    setShowForm(true);
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearImg = () => {
    setImgFile(null);
    setPreview('');
    setForm(f => ({ ...f, image: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = form.image;

      if (imgFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('image', imgFile);
        const res = await uploadImage(imgFile);
        console.log('[uploadImage] response:', res.data);
        // handle multiple possible response shapes
        imageUrl =
          res.data?.url ||
          res.data?.path ||
          res.data?.filename ||
          res.data?.imageUrl ||
          res.data?.secure_url ||   // cloudinary
          res.data?.Location ||     // S3
          '';
        setUploading(false);
        console.log('[uploadImage] resolved imageUrl:', imageUrl);
      }

      const data = {
        ...form,
        image: imageUrl,
        techStack: form.techStack.split(',').map(s => s.trim()).filter(Boolean),
      };

      if (editing) await updateProject(editing, data);
      else         await createProject(data);

      setShowForm(false);
      load();
    } catch (err) {
      console.error('[handleSubmit] error:', err);
      alert('Error saving project — check console for details.');
      setUploading(false);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    await deleteProject(id);
    load();
  };

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Projects</h2>
          <p className="admin-page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={openAdd}
          className="admin-btn-primary">
          <FiPlus /> Add Project
        </motion.button>
      </div>

      {/* ── Cards grid ─────────────────────────────────────────────────────── */}
      <div className="admin-grid-wide">
        {projects.map((p, i) => {
          const src = imgUrl(p.image);
          const broken = brokenImgs[p._id];

          return (
            <motion.div key={p._id}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.05 }}
              style={{ background:'#1a1a2e', border:'1px solid #2a2a3e', borderRadius:16, overflow:'hidden' }}
            >
              {/* Thumbnail */}
              <div style={{ height:160, background:'#12121a', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {src && !broken ? (
                  <img
                    src={src}
                    alt={p.title}
                    onLoad={() => console.log('[card img] loaded ok:', src)}
                    onError={(e) => {
                      console.warn('[card img] FAILED to load:', src, e);
                      setBrokenImgs(prev => ({ ...prev, [p._id]: true }));
                    }}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                  />
                ) : (
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:36 }}>💻</div>
                    {broken && src && (
                      <div style={{ fontSize:10, color:'#ff6584', marginTop:4, padding:'0 8px' }}>
                        Failed: {src.slice(0, 40)}…
                      </div>
                    )}
                  </div>
                )}
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noreferrer"
                    style={{ position:'absolute', top:10, right:10, background:'#6c63ff', borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14, textDecoration:'none' }}>
                    <FiExternalLink />
                  </a>
                )}
              </div>

              <div style={{ padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <h3 style={{ color:'#fff', fontSize:16, fontWeight:700 }}>{p.title}</h3>
                  <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                    {p.featured && <span style={{ background:'#6c63ff20', color:'#6c63ff', borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>Featured</span>}
                    <span style={{ background:'#ffffff10', color:'#a0a0b0', borderRadius:20, padding:'2px 10px', fontSize:11 }}>{p.category}</span>
                  </div>
                </div>
                <p style={{ color:'#a0a0b0', fontSize:13, lineHeight:1.6, marginBottom:12 }}>
                  {(p.description || '').slice(0, 90)}{p.description?.length > 90 ? '…' : ''}
                </p>
                {Array.isArray(p.techStack) && p.techStack.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                    {p.techStack.slice(0, 5).map(t => (
                      <span key={t} style={{ background:'#2a2a3e', color:'#a0a0b0', borderRadius:6, padding:'3px 8px', fontSize:11 }}>{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ display:'flex', gap:8 }}>
                  <motion.button whileHover={{ scale:1.07 }} onClick={() => openEdit(p)}
                    style={{ background:'#6c63ff20', border:'none', borderRadius:8, padding:'8px 14px', color:'#6c63ff', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:13, fontWeight:600 }}>
                    <FiEdit2 /> Edit
                  </motion.button>
                  <motion.button whileHover={{ scale:1.07 }} onClick={() => handleDelete(p._id)}
                    style={{ background:'#ff658420', border:'none', borderRadius:8, padding:'8px 14px', color:'#ff6584', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:13, fontWeight:600 }}>
                    <FiTrash2 /> Delete
                  </motion.button>
                  {p.githubUrl && (
                    <motion.a whileHover={{ scale:1.07 }} href={p.githubUrl} target="_blank" rel="noreferrer"
                      style={{ background:'#ffffff10', border:'none', borderRadius:8, padding:'8px 12px', color:'#a0a0b0', display:'flex', alignItems:'center', textDecoration:'none' }}>
                      <FiGithub />
                    </motion.a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Modal form ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale:0.9, y:40 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:40 }}
              className="admin-modal-panel"
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <h3 style={{ color:'#fff', fontSize:22, fontWeight:700 }}>{editing ? 'Edit Project' : 'Add New Project'}</h3>
                <motion.button whileHover={{ scale:1.1 }} onClick={() => setShowForm(false)}
                  style={{ background:'#2a2a3e', border:'none', borderRadius:8, padding:8, color:'#a0a0b0', cursor:'pointer', fontSize:18, display:'flex' }}>
                  <FiX />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <input required placeholder="Project Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inp} />
                <input placeholder="Live URL" value={form.liveUrl} onChange={e => setForm({ ...form, liveUrl: e.target.value })} style={inp} />
                <input placeholder="GitHub URL" value={form.githubUrl} onChange={e => setForm({ ...form, githubUrl: e.target.value })} style={inp} />
                <input placeholder="Tech Stack (e.g. React, Node.js, MongoDB)" value={form.techStack} onChange={e => setForm({ ...form, techStack: e.target.value })} style={inp} />

                {/* ── Image section ──────────────────────────────────────────── */}
                <div>
                  <label style={{ color:'#a0a0b0', fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:8 }}>
                    Project Image
                  </label>

                  {/* Preview */}
                  {preview && (
                    <div style={{ position:'relative', marginBottom:10, borderRadius:12, overflow:'hidden', height:180, background:'#12121a' }}>
                      <img src={preview} alt="preview"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      <button type="button" onClick={clearImg}
                        style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.7)', border:'none', borderRadius:'50%', width:28, height:28, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
                        <FiX />
                      </button>
                    </div>
                  )}

                  {/* Upload button */}
                  <label
                    style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', background:'#12121a', border:'2px dashed #3a3a5e', borderRadius:10, padding:14, color:'#a0a0b0', fontSize:14 }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6c63ff'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#3a3a5e'}
                  >
                    <FiUpload style={{ color:'#6c63ff', fontSize:20, flexShrink:0 }} />
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {imgFile ? imgFile.name : 'Click to upload image'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImgChange} style={{ display:'none' }} />
                  </label>

                  {/* OR paste URL */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, margin:'8px 0' }}>
                    <div style={{ flex:1, height:1, background:'#2a2a3e' }} />
                    <span style={{ color:'#555', fontSize:11 }}>OR</span>
                    <div style={{ flex:1, height:1, background:'#2a2a3e' }} />
                  </div>
                  <input
                    placeholder="Paste image URL (https://...)"
                    value={imgFile ? '' : (form.image || '')}
                    disabled={!!imgFile}
                    onChange={e => {
                      const val = e.target.value.trim();
                      setForm(f => ({ ...f, image: val }));
                      setPreview(val);
                    }}
                    style={{ ...inp, opacity: imgFile ? 0.4 : 1 }}
                  />
                </div>

                <textarea required placeholder="Description *" rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ ...inp, resize:'vertical' }} />

                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp}>
                  {['Web', 'Mobile', 'Backend', 'UI/UX'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <label style={{ display:'flex', alignItems:'center', gap:10, color:'#a0a0b0', cursor:'pointer', userSelect:'none' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })}
                    style={{ width:16, height:16, accentColor:'#6c63ff' }} />
                  Mark as Featured
                </label>

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                  style={{ background:'linear-gradient(135deg,#6c63ff,#ff6584)', border:'none', borderRadius:12, padding:14, color:'#fff', fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:8, opacity: loading ? 0.7 : 1 }}>
                  <FiCheck />
                  {uploading ? 'Uploading image…' : loading ? 'Saving…' : editing ? 'Update Project' : 'Add Project'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
