import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { error } from '../utils/jsend'
import { User } from '../models'

/**
 * Extended Express Request interface with authenticated user information
 *
 * @interface AuthRequest
 * @extends {Request}
 * @property {Object} [user] - Authenticated user information populated by authenticate middleware
 * @property {string} user.id - User's database ID
 * @property {string} user.email - User's email address
 * @property {string} user.role - User's role (STUDENT, INSTRUCTOR, ADMIN)
 */
export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

/**
 * Middleware to authenticate JWT token from Authorization header
 *
 * Validates the JWT token from the Authorization header (Bearer token),
 * verifies the user exists in the database, and populates req.user with
 * user information for downstream middleware and route handlers.
 *
 * @param req - AuthRequest object to be populated with user info
 * @param res - Express response object
 * @param next - Express next function to pass control to the next middleware
 * @returns Promise<void> - Calls next() on success, sends 401/500 error response on failure
 *
 * @throws {401} UNAUTHORIZED - If token is missing, invalid, or user not found
 * @throws {500} INTERNAL_ERROR - If authentication process fails
 *
 * @example
 * // Usage in routes
 * router.get('/dashboard', authenticate, getDashboard)
 *
 * @example
 * // Request headers
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(error('No token provided', 'UNAUTHORIZED'))
      return
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string
        email: string
        role: string
      }

      // Verify user still exists
      const user = await User.findById(decoded.id)
      if (!user) {
        res.status(401).json(error('User not found', 'UNAUTHORIZED'))
        return
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }

      next()
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      res.status(401).json(error('Invalid token', 'UNAUTHORIZED'))
    }
  } catch (authError) {
    console.error('Authentication error:', authError)
    res.status(500).json(error('Authentication error', 'INTERNAL_ERROR'))
  }
}

/**
 * Middleware factory to check if authenticated user has required role(s)
 *
 * Creates a middleware that verifies the authenticated user has one of the
 * specified roles. Must be used after the authenticate middleware.
 *
 * @param roles - Variable number of role strings that are allowed (STUDENT, INSTRUCTOR, ADMIN)
 * @returns Express middleware function that checks user role
 *
 * @throws {401} UNAUTHORIZED - If user is not authenticated
 * @throws {403} FORBIDDEN - If user doesn't have required role
 *
 * @example
 * // Allow only ADMIN and INSTRUCTOR roles
 * router.post('/courses', authenticate, authorize('ADMIN', 'INSTRUCTOR'), createCourse)
 *
 * @example
 * // Allow only ADMIN role
 * router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser)
 */
/**
 * Optional authentication middleware — populates req.user if a valid token
 * is present, but does NOT reject the request when the token is missing or
 * invalid. Use this on public routes that return extra data for logged-in users.
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as {
          id: string
          email: string
          role: string
        }
        const user = await User.findById(decoded.id)
        if (user) {
          req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
          }
        }
      } catch {
        // Invalid token — proceed as unauthenticated
      }
    }
  } catch {
    // Ignore errors — proceed as unauthenticated
  }
  next()
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json(error('Insufficient permissions', 'FORBIDDEN'))
      return
    }

    next()
  }
}
