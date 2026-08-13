  import { useState, useEffect, useRef } from 'react';
  import { motion } from 'framer-motion';
  import { FiMail, FiPhone, FiMapPin, FiSave, FiUpload, FiFileText, FiExternalLink, FiCamera, FiGithub, FiLinkedin, FiTwitter, FiTrendingUp, FiSmile, FiAward } from 'react-icons/fi';
  import { getProfile, updateProfile, uploadResume, uploadAvatar } from '../api/api';
  import { removeBackground, preload } from '@imgly/background-removal';
 

  const fields = [
    { key: 'email', label: 'Email', icon: <FiMail />, type: 'email', placeholder: 'admin@example.com' },
    { key: 'phone', label: 'Phone', icon: <FiPhone />, type: 'text', placeholder: '+91 98765 43210' },
    { key: 'location', label: 'Location', icon: <FiMapPin />, type: 'text', placeholder: 'City, Country' },
  ];

  const BASE = import.meta.env.VITE_API_URL;

  // ─── Helper: PNG Blob → WebP Blob ────────────────────────────────────────────
  // Re-encodes the transparent PNG (from bg removal) to WebP for smaller file
  // size and faster browser cache hits on cold loads.
  function pngBlobToWebP(pngBlob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(pngBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);

        // Check WebP support; fall back to PNG if not supported
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 1;
        testCanvas.height = 1;
        const supportsWebP = testCanvas.toDataURL('image/webp').startsWith('data:image/webp');

        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ blob, mimeType: supportsWebP ? 'image/webp' : 'image/png' });
            else reject(new Error('Image conversion failed'));
          },
          supportsWebP ? 'image/webp' : 'image/png',
          0.88 // quality — good balance of size vs clarity
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image load failed during conversion'));
      };

      img.src = objectUrl;
    });
  }

  export default function Profile() {
    const [form, setForm] = useState({
      email: '', phone: '', location: '',
      github: '', linkedin: '', twitter: '',
      yearsExperience: 3, expYears: 3, expMonths: 0, expDays: 0,
      happyClients: 20, awardsWon: 5,
    });
    
    const [avatarVersion, setAvatarVersion] = useState(Date.now()); // cache-buster
    const [resume, setResume] = useState('');
const [resumeName, setResumeName] = useState('');
const [avatar, setAvatar] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [resumeUploading, setResumeUploading] = useState(false);
    const [resumeStatus, setResumeStatus] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarStatus, setAvatarStatus] = useState('');
    const [bgRemoving, setBgRemoving] = useState(false);
    const [bgProgress, setBgProgress] = useState(0);
    const avatarInputRef = useRef();

    useEffect(() => {
      getProfile().then(r => {
        setForm({
          email: r.data.email,
          phone: r.data.phone,
          location: r.data.location,
          github: r.data.github || '',
          linkedin: r.data.linkedin || '',
          twitter: r.data.twitter || '',
          yearsExperience: r.data.yearsExperience ?? 3,
          expYears: r.data.expYears ?? r.data.yearsExperience ?? 3,
          expMonths: r.data.expMonths ?? 0,
          expDays: r.data.expDays ?? 0,
          happyClients: r.data.happyClients ?? 20,
          awardsWon: r.data.awardsWon ?? 5,
        });
      setResume(r.data.resume || '');
  setResumeName(r.data.resumeName || '');
  setAvatar(r.data.avatar || '');
      }).catch(() => { });

      // Preload the small model in background so first upload is faster
      preload({ model: 'small' }).catch(() => { });
    }, []);

    const handleSave = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await updateProfile(form);
        setStatus('success');
      } catch {
        setStatus('error');
      }
      setLoading(false);
      setTimeout(() => setStatus(''), 4000);
    };

    const handleResumeUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setResumeUploading(true);
      try {
        const res = await uploadResume(file);
        setResume(res.data.url);
        setResumeName(file.name);
        setResumeStatus('success');
      } catch {
        setResumeStatus('error');
      }
      setResumeUploading(false);
      setTimeout(() => setResumeStatus(''), 4000);
    };

    const handleAvatarUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // ── Step 1: Remove background (accepts any image format) ─────────────
        setBgRemoving(true);
        setBgProgress(0);

        const bgRemovedBlob = await removeBackground(file, {
          model: 'small',
          output: { format: 'image/png', quality: 1 }, // full quality before re-encode
          progress: (key, current, total) => {
            if (total > 0) setBgProgress(Math.round((current / total) * 100));
          },
        });
        setBgRemoving(false);

        // ── Step 2: Re-encode to WebP (smaller file, faster cold load) ────────
        const { blob: webpBlob, mimeType } = await pngBlobToWebP(bgRemovedBlob);
        const ext = mimeType === 'image/webp' ? '.webp' : '.png';

        // ── Step 3: Upload ────────────────────────────────────────────────────
        setAvatarUploading(true);
        const uploadFile = new File(
          [webpBlob],
          file.name.replace(/\.[^.]+$/, ext),
          { type: mimeType }
        );

        const res = await uploadAvatar(uploadFile);
        console.log("UPLOAD RESPONSE:", res.data);

  const imageUrl = res.data.url;

        // ── Step 4: Update state — bump version to bust browser cache ─────────
      setAvatar(imageUrl);
        setAvatarVersion(Date.now());
        setAvatarStatus('success');
      } catch (error) {
        console.error('Avatar processing failed:', error);
        setAvatarStatus('error');
      } finally {
        setBgRemoving(false);
        setAvatarUploading(false);
        setBgProgress(0);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
        setTimeout(() => setAvatarStatus(''), 4000);
      }
    };

    // Busy state covers both bg removal and uploading
    const avatarBusy = avatarUploading || bgRemoving;

    // Label shown on the upload button
    const avatarBtnLabel = bgRemoving
      ? `Removing background… ${bgProgress > 0 ? bgProgress + '%' : ''}`
      : avatarUploading
        ? 'Uploading…'
        : avatar
          ? 'Change Photo'
          : 'Upload Photo';

    return (
      <div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="admin-page-title" style={{ marginBottom: 8 }}>Profile</h1>
          <p className="admin-page-subtitle" style={{ marginBottom: 40 }}>
            Manage your profile photo, contact info and resume.
          </p>

          {/* ── Avatar Upload Card ── */}
          <div className="admin-profile-card">
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Profile Photo</h2>
            <p style={{ color: '#a0a0b0', fontSize: 13, marginBottom: 24 }}>
              This photo is shown on the user-facing portfolio hero section.
            </p>

            <div className="admin-profile-avatar-row">
              {/* Preview */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                  border: '3px solid #6c63ff',
                  background: '#0a0a0f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {avatar ? (
                    <img
                      key={`${avatar}-${avatarVersion}`}
                      src={`${avatar}?v=${Date.now()}`}
                      alt="Avatar"
                      loading="eager"       // above the fold — load immediately
                      decoding="async"      // decode off main thread
                      width={100}
                      height={100}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        console.log("Image Failed");
                        console.log(e.target.src);
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 36 }}>🧑‍💻</span>
                  )}
                </div>
                {/* Camera overlay button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => avatarInputRef.current.click()}
                  disabled={avatarBusy}
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
                    border: '2px solid #12121a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: avatarBusy ? 'not-allowed' : 'pointer',
                    color: '#fff', fontSize: 13,
                  }}
                >
                  <FiCamera />
                </motion.button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"  // any format: JPG, PNG, WebP, GIF, AVIF, etc.
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => avatarInputRef.current.click()}
                  disabled={avatarBusy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'transparent', border: '1px dashed #6c63ff',
                    borderRadius: 12, padding: '12px 20px',
                    color: '#6c63ff', fontSize: 14, fontWeight: 600,
                    cursor: avatarBusy ? 'not-allowed' : 'pointer',
                    opacity: avatarBusy ? 0.6 : 1, width: '100%', justifyContent: 'center',
                  }}
                >
                  <FiUpload />
                  {avatarBtnLabel}
                </motion.button>

                {/* Progress bar during bg removal */}
                {bgRemoving && bgProgress > 0 && (
                  <div style={{ marginTop: 8, background: '#0a0a0f', borderRadius: 6, overflow: 'hidden', height: 4 }}>
                    <div style={{
                      height: '100%',
                      width: `${bgProgress}%`,
                      background: 'linear-gradient(90deg, #6c63ff, #ff6584)',
                      transition: 'width 0.3s ease',
                      borderRadius: 6,
                    }} />
                  </div>
                )}

                <p style={{ color: '#a0a0b0', fontSize: 12, marginTop: 8 }}>
                  Any format (JPG, PNG, WebP, GIF…) — background removed &amp; saved as WebP.
                </p>
              </div>
            </div>

            {avatarStatus === 'success' && (
              <div style={{ marginTop: 16, background: '#43e97b20', border: '1px solid #43e97b40', borderRadius: 10, padding: '10px 14px', color: '#43e97b', fontSize: 14 }}>
                ✅ Background removed &amp; photo updated on the user site!
              </div>
            )}
            {avatarStatus === 'error' && (
              <div style={{ marginTop: 16, background: '#ff658420', border: '1px solid #ff658440', borderRadius: 10, padding: '10px 14px', color: '#ff6584', fontSize: 14 }}>
                ❌ Failed. Try a clearer photo (any image format, max 5MB).
              </div>
            )}
          </div>

          {/* ── Contact Info Card ── */}
          <div className="admin-profile-card">
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {fields.map(({ key, label, icon, type, placeholder }) => (
                <div key={key}>
                  <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ color: '#6c63ff' }}>{icon}</span> {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: '#0a0a0f', border: '1px solid #2a2a3e',
                      borderRadius: 12, padding: '13px 16px',
                      color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                    onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                  />
                </div>
              ))}

              {status === 'success' && (
                <div style={{ background: '#43e97b20', border: '1px solid #43e97b40', borderRadius: 10, padding: '10px 14px', color: '#43e97b', fontSize: 14 }}>
                  ✅ Profile updated successfully!
                </div>
              )}
              {status === 'error' && (
                <div style={{ background: '#ff658420', border: '1px solid #ff658440', borderRadius: 10, padding: '10px 14px', color: '#ff6584', fontSize: 14 }}>
                  ❌ Failed to update. Try again.
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
                  border: 'none', borderRadius: 12, padding: '14px',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </form>
          </div>

          {/* ── Social Links Card ── */}
          <div className="admin-profile-card">
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Social Links</h2>
            <p style={{ color: '#a0a0b0', fontSize: 13, marginBottom: 24 }}>These links power the icons in the Hero and Footer sections.</p>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { key: 'github', label: 'GitHub URL', icon: <FiGithub />, placeholder: 'https://github.com/yourusername' },
                { key: 'linkedin', label: 'LinkedIn URL', icon: <FiLinkedin />, placeholder: 'https://linkedin.com/in/yourusername' },
                { key: 'twitter', label: 'Twitter / X URL', icon: <FiTwitter />, placeholder: 'https://twitter.com/yourusername' },
                { key: 'email', label: 'Email', icon: <FiMail />, placeholder: 'you@example.com', type: 'email' },
              ].map(({ key, label, icon, placeholder, type = 'url' }) => (
                <div key={key}>
                  <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ color: '#6c63ff' }}>{icon}</span> {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                    onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                  />
                </div>
              ))}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ background: 'linear-gradient(135deg, #6c63ff, #ff6584)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <FiSave /> {loading ? 'Saving...' : 'Save Social Links'}
              </motion.button>
            </form>
          </div>

          {/* ── About Stats Card ── */}
          <div className="admin-profile-card">
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>About Stats</h2>
            <p style={{ color: '#a0a0b0', fontSize: 13, marginBottom: 24 }}>These numbers appear in the About section stat cards on the user site.</p>

            {/* Live preview */}
            <div className="admin-stats-grid">
              {[
                {
                  icon: <FiTrendingUp />, label: 'Experience',
                  value: [
                    form.expYears > 0 ? `${form.expYears}y` : '',
                    form.expMonths > 0 ? `${form.expMonths}m` : '',
                    form.expDays > 0 ? `${form.expDays}d` : '',
                  ].filter(Boolean).join(' ') || '0d',
                  suffix: '+',
                },
                { icon: <FiSmile />, label: 'Happy Clients', value: form.happyClients, suffix: '+' },
                { icon: <FiAward />, label: 'Awards Won', value: form.awardsWon, suffix: '+' },
              ].map(({ icon, label, value, suffix }) => (
                <div key={label} style={{ background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 14, padding: '16px 8px', textAlign: 'center' }}>
                  <div style={{ color: '#6c63ff', fontSize: 20, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg,#6c63ff,#ff6584)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
                    {value}{suffix}
                  </div>
                  <div style={{ color: '#a0a0b0', fontSize: 11, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Experience */}
              <div>
                <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ color: '#6c63ff' }}><FiTrendingUp /></span> Experience
                </label>
                <div className="admin-exp-grid">
                  <div>
                    <label style={{ color: '#a0a0b0', fontSize: 11, marginBottom: 6, display: 'block' }}>Years</label>
                    <input type="number" min={0} max={50} value={form.expYears}
                      onChange={e => setForm({ ...form, expYears: Number(e.target.value), yearsExperience: Number(e.target.value) })}
                      style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                      onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#a0a0b0', fontSize: 11, marginBottom: 6, display: 'block' }}>Months (0–11)</label>
                    <input type="number" min={0} max={11} value={form.expMonths}
                      onChange={e => setForm({ ...form, expMonths: Math.min(11, Number(e.target.value)) })}
                      style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                      onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#a0a0b0', fontSize: 11, marginBottom: 6, display: 'block' }}>Days (0–30)</label>
                    <input type="number" min={0} max={30} value={form.expDays}
                      onChange={e => setForm({ ...form, expDays: Math.min(30, Number(e.target.value)) })}
                      style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                      onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                    />
                  </div>
                </div>
                <p style={{ color: '#a0a0b0', fontSize: 11, marginTop: 6 }}>
                  Preview: <strong style={{ color: '#6c63ff' }}>
                    {[
                      form.expYears > 0 ? `${form.expYears} year${form.expYears !== 1 ? 's' : ''}` : '',
                      form.expMonths > 0 ? `${form.expMonths} month${form.expMonths !== 1 ? 's' : ''}` : '',
                      form.expDays > 0 ? `${form.expDays} day${form.expDays !== 1 ? 's' : ''}` : '',
                    ].filter(Boolean).join(' ') || '0 days'}+
                  </strong>
                </p>
              </div>

              {/* Happy Clients */}
              <div>
                <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ color: '#6c63ff' }}><FiSmile /></span> Happy Clients
                </label>
                <input type="number" min={0} value={form.happyClients}
                  onChange={e => setForm({ ...form, happyClients: Number(e.target.value) })}
                  style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                />
              </div>

              {/* Awards Won */}
              <div>
                <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ color: '#6c63ff' }}><FiAward /></span> Awards Won
                </label>
                <input type="number" min={0} value={form.awardsWon}
                  onChange={e => setForm({ ...form, awardsWon: Number(e.target.value) })}
                  style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                />
              </div>

              {status === 'success' && <div style={{ background: '#43e97b20', border: '1px solid #43e97b40', borderRadius: 10, padding: '10px 14px', color: '#43e97b', fontSize: 14 }}>✅ Stats updated!</div>}
              {status === 'error' && <div style={{ background: '#ff658420', border: '1px solid #ff658440', borderRadius: 10, padding: '10px 14px', color: '#ff6584', fontSize: 14 }}>❌ Failed to save.</div>}

              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ background: 'linear-gradient(135deg,#6c63ff,#ff6584)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FiSave /> {loading ? 'Saving...' : 'Save Stats'}
              </motion.button>
            </form>
          </div>

          {/* ── Resume Upload Card ── */}
          <div className="admin-profile-card" style={{ marginBottom: 0 }}>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Resume / CV</h2>
            <p style={{ color: '#a0a0b0', fontSize: 13, marginBottom: 24 }}>Upload a PDF — users can download it directly from the Hero section.</p>

            {resume && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                <FiFileText style={{ color: '#6c63ff', fontSize: 22, flexShrink: 0 }} />
                <span style={{ color: '#fff', fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {resumeName || "No Resume Uploaded"}
                </span>
                <a
                  href={resume}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#6c63ff',
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FiExternalLink />
                </a>
              </div>
            )}

            <label style={{
              display: 'flex', alignItems: 'center', gap: 10, cursor: resumeUploading ? 'not-allowed' : 'pointer',
              background: resumeUploading ? '#1a1a2e' : '#0a0a0f',
              border: '1px dashed #2a2a3e', borderRadius: 12,
              padding: '14px 16px', color: '#a0a0b0', fontSize: 14,
              opacity: resumeUploading ? 0.6 : 1,
            }}>
              <FiUpload style={{ color: '#6c63ff', fontSize: 18 }} />
              {resumeUploading ? 'Uploading...' : resume ? 'Replace PDF' : 'Upload PDF (max 10MB)'}
              <input type="file" accept="application/pdf" onChange={handleResumeUpload} disabled={resumeUploading} style={{ display: 'none' }} />
            </label>

            {resumeStatus === 'success' && (
              <div style={{ marginTop: 12, background: '#43e97b20', border: '1px solid #43e97b40', borderRadius: 10, padding: '10px 14px', color: '#43e97b', fontSize: 14 }}>
                ✅ Resume uploaded successfully!
              </div>
            )}
            {resumeStatus === 'error' && (
              <div style={{ marginTop: 12, background: '#ff658420', border: '1px solid #ff658440', borderRadius: 10, padding: '10px 14px', color: '#ff6584', fontSize: 14 }}>
                ❌ Upload failed. Only PDF files allowed.
              </div>
            )}
          </div>

        </motion.div>
      </div>
    );
  }
