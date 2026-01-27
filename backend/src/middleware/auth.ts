import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';

import { verifyToken } from '../utils/jwt';
import { UserRole } from '../utils/utils';

export interface AuthenticatedUser {
  userId: number;
  email?: string;
  role: UserRole;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export function authenticateToken(
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction,
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token missing' });
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Token invalid or expired' });
    return;
  }

  req.user = decoded;

  next();
}

export const requireRole =
  (roles: Array<UserRole>) => (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    const user = req.user;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
