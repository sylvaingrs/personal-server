import { generateToken, verifyToken } from '../../src/utils/jwt';

describe('JWT utils', () => {
  const OLD_ENV = process.env;
  const tokenExpiry = Number(OLD_ENV.JWT_EXPIRES_IN) || 300;
  const refreshTokenExpiry = Number(process.env.JWT_REFRESH_EXPIRES_IN) || 10080;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      JWT_SECRET: 'test-secret',
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('generateToken', () => {
    it('should generate a valid access token', () => {
      const token = generateToken(
        {
          userId: 1,
          email: 'test@test.com',
          type: 'access',
          role: 'user',
        },
        tokenExpiry,
      );

      expect(typeof token).toBe('string');
    });

    it('should throw if JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      expect(() =>
        generateToken(
          {
            userId: 1,
            email: 'test@test.com',
            type: 'access',
            role: 'user',
          },
          tokenExpiry,
        ),
      ).toThrow('JWT_SECRET is not defined');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid access token', () => {
      const token = generateToken(
        {
          userId: 1,
          email: 'test@test.com',
          type: 'access',
          role: 'user',
        },
        tokenExpiry,
      );

      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.type).toBe('access');
      expect(decoded).toHaveProperty('userId', 1);
      expect(decoded).toHaveProperty('email', 'test@test.com');
    });

    it('should verify a valid refresh token', () => {
      const token = generateToken(
        {
          userId: 1,
          type: 'refresh',
          role: 'user',
        },
        refreshTokenExpiry,
      );

      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.type).toBe('refresh');
      expect(decoded).toHaveProperty('userId', 1);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    it('should return null if payload is malformed', () => {
      const token = generateToken(
        {
          userId: 1,
          type: 'refresh',
          role: 'user',
        },
        refreshTokenExpiry,
      );

      // altère le token
      const badToken = token + 'broken';
      expect(verifyToken(badToken)).toBeNull();
    });
  });
});
