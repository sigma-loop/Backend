import { Router } from 'express'
import {
  listThreads,
  createThread,
  getThreadMessages,
  sendMessage,
  deleteThread,
  updateThread
} from '../controllers/chat.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/threads', authenticate, listThreads)
router.post('/threads', authenticate, createThread)
router.get('/threads/:threadId/messages', authenticate, getThreadMessages)
router.post('/threads/:threadId/messages', authenticate, sendMessage)
router.patch('/threads/:threadId', authenticate, updateThread)
router.delete('/threads/:threadId', authenticate, deleteThread)

export default router
