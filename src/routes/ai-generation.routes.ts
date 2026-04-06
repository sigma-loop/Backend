import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import {
  generateMoreLessons,
  getGeneratedLessons,
  getGeneratedLessonById,
  generateCourse,
  getGeneratedCourses,
  getGeneratedCourseById,
  adminGetGeneratedContentOverview,
  adminGetUserGeneratedCourses,
  adminGetUserGeneratedLessons,
  adminGetUserGeneratedContent
} from '../controllers/ai-generation.controller'

const router = Router()

// ── User endpoints ──

// Generated lessons for existing courses
router.post('/courses/:courseId/generate-lesson', authenticate, generateMoreLessons)
router.get('/courses/:courseId/generated-lessons', authenticate, getGeneratedLessons)
router.get('/generated-lessons/:lessonId', authenticate, getGeneratedLessonById)

// AI-generated courses
router.post('/generate-course', authenticate, generateCourse)
router.get('/generated-courses', authenticate, getGeneratedCourses)
router.get('/generated-courses/:courseId', authenticate, getGeneratedCourseById)

// ── Admin endpoints ──

// Overview: all users with generated content
router.get('/admin/overview', authenticate, authorize('ADMIN'), adminGetGeneratedContentOverview)

// View a specific user's generated content
router.get(
  '/admin/users/:userId/content',
  authenticate,
  authorize('ADMIN'),
  adminGetUserGeneratedContent
)

// View a user's generated courses
router.get(
  '/admin/users/:userId/generated-courses',
  authenticate,
  authorize('ADMIN'),
  adminGetUserGeneratedCourses
)

// View a user's generated lessons for a specific original course
router.get(
  '/admin/users/:userId/courses/:courseId/generated-lessons',
  authenticate,
  authorize('ADMIN'),
  adminGetUserGeneratedLessons
)

export default router
