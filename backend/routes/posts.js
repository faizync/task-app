// routes/posts.js
// Full CRUD for posts — all routes require authentication (via authMiddleware)

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to ALL routes in this file
router.use(authMiddleware);

// ─── GET ALL POSTS (for the logged-in user) ─────────────────────────────────

router.get('/', async (req, res) => {
  try {
    // JOIN to also return the author's name
    const [posts] = await pool.execute(
      `SELECT p.id, p.title, p.content, p.created_at, u.name AS author_name
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ posts });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET SINGLE POST ─────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.title, p.content, p.created_at, u.name AS author_name
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ post: rows[0] });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── CREATE POST ──────────────────────────────────────────────────────────────

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;

    try {
      const [result] = await pool.execute(
        'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
        [req.user.id, title, content]
      );

      res.status(201).json({
        message: 'Post created',
        post: { id: result.insertId, title, content },
      });
    } catch (err) {
      console.error('Create post error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── UPDATE POST ──────────────────────────────────────────────────────────────

router.put(
  '/:id',
  [
    body('title').trim().notEmpty(),
    body('content').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;

    try {
      // Only update if the post belongs to the logged-in user
      const [result] = await pool.execute(
        'UPDATE posts SET title = ?, content = ? WHERE id = ? AND user_id = ?',
        [title, content, req.params.id, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Post not found or unauthorized' });
      }

      res.json({ message: 'Post updated' });
    } catch (err) {
      console.error('Update post error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── DELETE POST ──────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM posts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
