import request from 'supertest';

import app, { pool } from '../../src/app';
import { generateToken } from '../../src/utils/jwt';
import { hashPassword } from '../../src/utils/hash';

describe('Protected routes', () => {
  beforeAll(async () => {
    const hashedPassword = await hashPassword('password123');

    await pool?.query(
      `
      INSERT INTO users (id, name, email, hash_password, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE email=email
      `,
      [1, 'Test user', 'test@test.com', hashedPassword],
    );
  });

  const OLD_ENV = process.env;
  const tokenExpiry = Number(OLD_ENV.JWT_EXPIRES_IN) || 300;

  describe('GET /api/me', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/api/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app).get('/api/me').set('Authorization', 'Bearer invalidtoken');

      expect(res.status).toBe(401);
    });

    it('should return user info with valid token', async () => {
      const token = generateToken(
        {
          userId: 1,
          email: 'test@test.com',
          type: 'access',
          role: 'user',
        },
        tokenExpiry,
      );

      const res = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@test.com');
    });
  });
});
