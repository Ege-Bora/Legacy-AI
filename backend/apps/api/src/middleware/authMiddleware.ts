import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/authService';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
    };
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authorization = request.headers.authorization;
    
    if (!authorization) {
      return reply.status(401).send({ error: 'Authorization header required' });
    }

    const token = authorization.replace('Bearer ', '');
    
    if (!token) {
      return reply.status(401).send({ error: 'Token required' });
    }

    // Verify token
    const payload = authService.verifyAccessToken(token);
    
    // Add user info to request
    request.user = {
      userId: payload.userId,
      email: payload.email
    };

  } catch (error) {
    return reply.status(401).send({ 
      error: 'Invalid or expired token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Optional auth middleware (doesn't fail if no token)
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authorization = request.headers.authorization;
    
    if (authorization) {
      const token = authorization.replace('Bearer ', '');
      if (token) {
        const payload = authService.verifyAccessToken(token);
        request.user = {
          userId: payload.userId,
          email: payload.email
        };
      }
    }
    // Continue regardless of auth status
  } catch (error) {
    // Silently continue without auth
    console.warn('Optional auth failed:', error);
  }
}