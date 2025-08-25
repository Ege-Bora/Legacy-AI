import { FastifyInstance } from 'fastify';
import { authService } from '../services/authService';
import { authMiddleware } from '../middleware/authMiddleware';
import { RegisterData, LoginCredentials } from '../types/auth';

export async function authRoutes(fastify: FastifyInstance) {
  
  // Register new user
  fastify.post('/auth/register', async (request, reply) => {
    try {
      const data = request.body as RegisterData;
      
      // Basic validation
      if (!data.email || !data.password || !data.name) {
        return reply.status(400).send({
          error: 'Email, password, and name are required'
        });
      }

      if (data.password.length < 6) {
        return reply.status(400).send({
          error: 'Password must be at least 6 characters long'
        });
      }

      // Email validation (basic)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return reply.status(400).send({
          error: 'Invalid email format'
        });
      }

      const session = await authService.register(data);
      
      return reply.send({
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatar_url: session.user.avatar_url,
          subscription_status: session.user.subscription_status
        },
        tokens: session.tokens
      });

    } catch (error) {
      fastify.log.error(error);
      
      if (error instanceof Error && error.message === 'User with this email already exists') {
        return reply.status(409).send({ error: error.message });
      }
      
      return reply.status(500).send({ 
        error: 'Registration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Login with email/password
  fastify.post('/auth/login', async (request, reply) => {
    try {
      const credentials = request.body as LoginCredentials;
      
      if (!credentials.email || !credentials.password) {
        return reply.status(400).send({
          error: 'Email and password are required'
        });
      }

      const session = await authService.login(credentials);
      
      return reply.send({
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatar_url: session.user.avatar_url,
          subscription_status: session.user.subscription_status
        },
        tokens: session.tokens
      });

    } catch (error) {
      fastify.log.error(error);
      
      if (error instanceof Error && error.message === 'Invalid email or password') {
        return reply.status(401).send({ error: error.message });
      }
      
      return reply.status(500).send({ 
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Refresh access token
  fastify.post('/auth/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };
      
      if (!refreshToken) {
        return reply.status(400).send({
          error: 'Refresh token is required'
        });
      }

      const tokens = await authService.refreshToken(refreshToken);
      
      return reply.send({
        success: true,
        tokens
      });

    } catch (error) {
      fastify.log.error(error);
      
      return reply.status(401).send({ 
        error: 'Token refresh failed',
        details: error instanceof Error ? error.message : 'Invalid refresh token'
      });
    }
  });

  // Logout (invalidate refresh token)
  fastify.post('/auth/logout', async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      return reply.send({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      fastify.log.error(error);
      
      return reply.status(500).send({ 
        error: 'Logout failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get current user profile (protected route)
  fastify.get('/auth/me', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    try {
      if (!request.user?.userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }

      const user = await authService.getUserById(request.user.userId);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          subscription_status: user.subscription_status,
          subscription_expires_at: user.subscription_expires_at,
          created_at: user.created_at
        }
      });

    } catch (error) {
      fastify.log.error(error);
      
      return reply.status(500).send({ 
        error: 'Failed to get user profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check for auth service
  fastify.get('/auth/status', async (request, reply) => {
    try {
      // Clean expired tokens as maintenance
      await authService.cleanExpiredTokens();
      
      return reply.send({
        success: true,
        message: 'Auth service is healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error(error);
      
      return reply.status(500).send({
        error: 'Auth service unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

}