import { Router } from 'express'
import {
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  getChallengesByLesson
} from '../controllers/challenge.controller'
import { authenticate, optionalAuthenticate, authorize } from '../middlewares/auth.middleware'
import { apiLimiter } from '../middlewares/rateLimit.middleware'

const router = Router()

// Public routes
router.get('/:challengeId', apiLimiter, optionalAuthenticate, getChallengeById)
router.get('/lesson/:lessonId', apiLimiter, getChallengesByLesson)

// Protected routes (admin/instructor only)
router.post('/', apiLimiter, authenticate, authorize('ADMIN', 'INSTRUCTOR'), createChallenge)
router.put(
  '/:challengeId',
  apiLimiter,
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR'),
  updateChallenge
)
router.delete(
  '/:challengeId',
  apiLimiter,
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR'),
  deleteChallenge
)

export default router
