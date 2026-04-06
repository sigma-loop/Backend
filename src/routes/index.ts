import { Router } from 'express'
import healthRoutes from './health.routes'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import courseRoutes from './course.routes'
import lessonRoutes from './lesson.routes'
import challengeRoutes from './challenge.routes'
import executionRoutes from './execution.routes'
import chatRoutes from './chat.routes'
import aiGenerationRoutes from './ai-generation.routes'

const router = Router()

router.use('/v1/health', healthRoutes)
router.use('/v1/auth', authRoutes)
router.use('/v1/users', userRoutes)
router.use('/v1/courses', courseRoutes)
router.use('/v1/lessons', lessonRoutes)
router.use('/v1/challenges', challengeRoutes)
router.use('/v1/execution', executionRoutes)
router.use('/v1/chat', chatRoutes)
router.use('/v1/ai', aiGenerationRoutes)

export default router
