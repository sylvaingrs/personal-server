import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Router } from 'express';

import { pool } from '../app';
import { comparePassword, hashPassword } from '../utils/hash';
import { generateToken, verifyToken } from '../utils/jwt';
import { authenticateToken, requireRole } from '../middleware/auth';
import { REFRESH_TOKEN_MAX_AGE, REFRESH_TOKEN_OPTIONS } from '../utils/cookie.config';
import { UserRole } from '../utils/utils';

type UserEmailHashPasswordRow = RowDataPacket & {
  id: number;
  email: string;
  hash_password: string;
  role: UserRole;
};

type RefreshTokenRow = RowDataPacket & {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
};

type EmailAndRoleRow = RowDataPacket & {
  email: string;
  role: UserRole;
};

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool!.query<UserEmailHashPasswordRow[]>(
      `SELECT id, email, hash_password, role FROM users WHERE users.email = ?`,
      [email],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = {
      id: rows[0].id,
      email: rows[0].email,
      hashPassword: rows[0].hash_password,
      role: rows[0].role,
    };

    console.log('user : ', user);

    if (!user) {
      return res.status(401).json({ error: 'Email incorrect' });
    }

    const isPasswordCorrect = await comparePassword(password, user.hashPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Password incorrect' });
    }

    const tokenExpiry = Number(process.env.JWT_EXPIRES_IN) || 300;
    const refreshTokenExpiry = Number(process.env.JWT_REFRESH_EXPIRES_IN) || 10080;

    const accessToken = generateToken(
      { userId: user.id, email: user.email, type: 'access', role: user.role },
      tokenExpiry,
    );

    const refreshToken = generateToken(
      { userId: user.id, type: 'refresh', role: user.role },
      refreshTokenExpiry,
    );

    await pool!.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [user.id, refreshToken],
    );

    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_TOKEN_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    res.json({
      message: 'Login successful',
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: `Database error: ${error}` });
  }
});

type UserEmail = RowDataPacket & { email: string };

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [rows] = await pool!.query<UserEmail[]>(
      `SELECT email, role FROM users WHERE users.email = ?`,
      [email],
    );

    if (rows.length > 0) {
      return res.status(400).json({ message: 'user already registered' });
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await pool!.query<ResultSetHeader>(
      `INSERT INTO users (name, email, hash_password, created_at, updated_at, role) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
      [name, email, hashedPassword, 'user'],
    );

    const userId = result.insertId;

    const tokenExpiry = Number(process.env.JWT_EXPIRES_IN) || 300;
    const refreshTokenExpiry = Number(process.env.JWT_REFRESH_EXPIRES_IN) || 10080;

    const accessToken = generateToken({ userId, email, type: 'access', role: 'user' }, tokenExpiry);

    const refreshToken = generateToken(
      { userId, type: 'refresh', role: 'user' },
      refreshTokenExpiry,
    );

    await pool!.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [userId, refreshToken],
    );
    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_TOKEN_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return res.status(201).json({ message: 'Account successfully created', accessToken });
  } catch (err) {
    console.log('error : ', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/verify', authenticateToken, requireRole(['admin', 'user']), (req, res) => {
  res.json({
    authenticated: true,
    user: req.user,
  });
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token missing' });
  }

  const decoded = verifyToken(refreshToken);

  if (!decoded || decoded.type !== 'refresh') {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  try {
    const [rows] = await pool!.query<RefreshTokenRow[]>(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [refreshToken],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token expired or revoked' });
    }

    const [userRows] = await pool!.query<EmailAndRoleRow[]>(
      'SELECT email, role FROM users WHERE id = ?',
      [decoded.userId],
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userEmail = userRows[0].email;

    const tokenExpiry = Number(process.env.JWT_EXPIRES_IN) || 300;
    const newAccessToken = generateToken(
      { userId: decoded.userId, email: userEmail, type: 'access', role: userRows[0].role },
      tokenExpiry,
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('/refresh: Refresh error:', error);
    return res.status(500).json({ message: 'Database error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', REFRESH_TOKEN_OPTIONS);
  res.json({ message: 'Logged out successfully' });
});

export default router;
