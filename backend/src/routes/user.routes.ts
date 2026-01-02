import { Router } from 'express';
import { RowDataPacket } from 'mysql2/promise';

import { authenticateToken, requireRole } from '../middleware/auth';
import { pool } from '../app';

const router = Router();

router.get('/users', authenticateToken, requireRole(['user', 'admin']), async (req, res) => {
  try {
    const [rows] = await pool!.query(`SELECT * FROM users`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      error: 'Database query error',
      message: err instanceof Error ? err.message : 'Unknow error',
    });
  }
});

router.get('/test', authenticateToken, requireRole(['user', 'admin']), (req, res) => {
  const user = req.user;
  return res.json({
    email: user?.email,
  });
});

type UserData = RowDataPacket & {
  id: number;
  name: string;
  email: string;
};

router.get('/me', authenticateToken, requireRole(['user', 'admin']), async (req, res) => {
  const [rows] = await pool!.query<UserData[]>(
    `SELECT id, name, email, role FROM users WHERE users.id=?`,
    [req.user?.userId],
  );
  if (rows.length) {
    return res.json({
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role,
    });
  }
});

export default router;
