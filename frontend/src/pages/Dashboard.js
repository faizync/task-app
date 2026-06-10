// src/pages/Dashboard.js
// Full CRUD UI for Posts — communicates with the Node.js backend via axios

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load posts on mount
  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data.posts);
    } catch (err) {
      setError('Failed to load posts');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (editingId) {
        await api.put(`/posts/${editingId}`, form);
        setSuccess('Post updated!');
        setEditingId(null);
      } else {
        await api.post('/posts', form);
        setSuccess('Post created!');
      }
      setForm({ title: '', content: '' });
      fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setEditingId(post.id);
    setForm({ title: post.title, content: post.content });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      setSuccess('Post deleted');
      fetchPosts();
    } catch (err) {
      setError('Delete failed');
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>📝 AWS Demo App</span>
        <div>
          <span style={{ marginRight: 16 }}>Hello, {user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={styles.container}>
        {/* Form */}
        <div style={styles.card}>
          <h3>{editingId ? '✏️ Edit Post' : '➕ New Post'}</h3>
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label>Title</label>
              <input style={styles.input} name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div style={styles.field}>
              <label>Content</label>
              <textarea
                style={{ ...styles.input, height: 100, resize: 'vertical' }}
                name="content" value={form.content} onChange={handleChange} required
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={styles.primaryBtn} type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Post' : 'Create Post'}
              </button>
              {editingId && (
                <button style={styles.secondaryBtn} type="button"
                  onClick={() => { setEditingId(null); setForm({ title: '', content: '' }); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Posts list */}
        <div style={styles.card}>
          <h3>📋 Your Posts ({posts.length})</h3>
          {posts.length === 0 ? (
            <p style={{ color: '#888' }}>No posts yet. Create one above!</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} style={styles.postCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>{post.title}</h4>
                    <small style={{ color: '#888' }}>{new Date(post.created_at).toLocaleString()}</small>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={styles.editBtn} onClick={() => handleEdit(post)}>Edit</button>
                    <button style={styles.deleteBtn} onClick={() => handleDelete(post.id)}>Delete</button>
                  </div>
                </div>
                <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{post.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f2f5' },
  nav: { background: '#001529', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  container: { maxWidth: 800, margin: '0 auto', padding: 24 },
  card: { background: '#fff', borderRadius: 8, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  field: { marginBottom: 16 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 4, marginTop: 4, boxSizing: 'border-box', fontSize: 14 },
  primaryBtn: { padding: '8px 20px', background: '#1677ff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  secondaryBtn: { padding: '8px 20px', background: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer' },
  logoutBtn: { padding: '6px 16px', background: 'transparent', border: '1px solid #fff', color: '#fff', borderRadius: 4, cursor: 'pointer' },
  editBtn: { padding: '4px 12px', background: '#faad14', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  deleteBtn: { padding: '4px 12px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  postCard: { border: '1px solid #f0f0f0', borderRadius: 6, padding: 16, marginBottom: 12 },
  error: { background: '#fff2f0', border: '1px solid #ffccc7', padding: 8, borderRadius: 4, marginBottom: 12, color: '#cf1322' },
  success: { background: '#f6ffed', border: '1px solid #b7eb8f', padding: 8, borderRadius: 4, marginBottom: 12, color: '#389e0d' },
};
