import express from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../config/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { 
  validateUserRegistration, 
  validateUserLogin, 
  sanitizeInput 
} from '../middleware/validation.js';

const router = express.Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const pool = getPool();

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password with stronger salt rounds
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userId = generateId();
    const result = await pool.query(
      `INSERT INTO users (id, email, name, password_hash, salt) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, created_at, last_login_at`,
      [userId, email.toLowerCase(), name.trim(), passwordHash, salt]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    // Log successful registration (without sensitive data)
    console.log(`✅ User registered: ${user.email} (ID: ${user.id})`);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const pool = getPool();

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      console.log(`❌ Login attempt with non-existent email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log(`❌ Invalid password attempt for user: ${user.email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user.id);

    // Log successful login
    console.log(`✅ User logged in: ${user.email} (ID: ${user.id})`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        lastLoginAt: new Date()
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Get fresh user data from database
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, name, created_at, last_login_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Name must not exceed 100 characters' });
    }

    const pool = getPool();
    const result = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name, created_at, last_login_at',
      [name.trim(), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    console.log(`✅ User profile updated: ${user.email} (ID: ${user.id})`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const pool = getPool();

    // Get current user with password
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, salt = $2 WHERE id = $3',
      [passwordHash, salt, req.user.id]
    );

    console.log(`✅ Password changed for user: ${user.email} (ID: ${user.id})`);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateToken, (req, res) => {
  console.log(`✅ User logged out: ${req.user.email} (ID: ${req.user.id})`);
  res.json({ message: 'Logged out successfully' });
});

export default router; 