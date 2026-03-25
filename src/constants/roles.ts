/**
 * User roles for authorization.
 */

export const ROLES = {
  STUDENT: 'STUDENT',
  INSTRUCTOR: 'INSTRUCTOR',
  ADMIN: 'ADMIN'
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const ALL_ROLES: UserRole[] = [ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN]

/**
 * Roles that can manage content (courses, lessons, challenges).
 */
export const CONTENT_MANAGERS: UserRole[] = [ROLES.ADMIN, ROLES.INSTRUCTOR]
