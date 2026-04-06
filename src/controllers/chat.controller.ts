import { Response } from 'express'
import { ChatThread, ChatMessage, Lesson, Course } from '../models'
import { ChatScope } from '../models/ChatThread'
import { SenderRole } from '../models/ChatMessage'
import { success, error } from '../utils/jsend'
import { AuthRequest } from '../middlewares/auth.middleware'
import { aiService, ChatMessage as AIChatMessage } from '../services/ai.service'
import { AI_NOT_CONFIGURED } from '../constants'

// ──────────────────────────────────────────
// System prompt builders
// ──────────────────────────────────────────

function buildGeneralSystemPrompt(): string {
  return `You are SigmaLoop, an AI programming mentor on the SigmaLoop educational platform. You help students learn programming concepts, algorithms, data structures, and software development.

Rules:
1. Provide clear, educational explanations.
2. Use code examples with proper syntax highlighting (use Markdown code blocks with language identifiers).
3. Support mathematical notation using LaTeX ($inline$ and $$block$$).
4. Be encouraging and patient.
5. Cover any programming topic the student asks about.`
}

async function buildLessonSystemPrompt(lessonId: string): Promise<string> {
  const lesson = await Lesson.findById(lessonId).lean()
  if (!lesson) return buildGeneralSystemPrompt()

  const content =
    lesson.contentMarkdown.length > 8000
      ? lesson.contentMarkdown.slice(0, 8000) + '\n\n(content truncated)'
      : lesson.contentMarkdown

  return `You are a lesson assistant for the SigmaLoop educational platform. You are helping a student understand the following lesson:

**Lesson Title:** ${lesson.title}

**Lesson Content:**
${content}

---

Rules:
1. Only answer questions directly related to the lesson content above.
2. If the student asks about a topic not covered in this lesson, politely say: "That topic isn't covered in this lesson. Try asking the course mentor on the course page, or the general mentor."
3. Use examples and explanations that build on the lesson content.
4. Format your responses with Markdown. Use code blocks with language identifiers.
5. Be encouraging and educational in tone.`
}

async function buildCourseSystemPrompt(courseId: string): Promise<string> {
  const course = await Course.findById(courseId).lean()
  if (!course) return buildGeneralSystemPrompt()

  const lessons = await Lesson.find({ courseId }).sort({ orderIndex: 1 }).select('title').lean()
  const lessonList = lessons.map((l, i) => `${i + 1}. ${l.title}`).join('\n')

  return `You are a course mentor for the SigmaLoop educational platform. You are helping a student with the following course:

**Course:** ${course.title}
**Difficulty:** ${course.difficulty}
**Description:** ${course.description}

**Lessons in this course:**
${lessonList}

---

Rules:
1. Help the student understand the overall course structure and progression.
2. Answer questions about which lesson covers what topic.
3. Provide high-level explanations of course concepts.
4. If a student asks detailed questions about specific lesson content, suggest they use the lesson-specific assistant.
5. You may suggest a study path or order.
6. Format your responses with Markdown. Use code blocks with language identifiers.
7. Be encouraging and educational in tone.`
}

// ──────────────────────────────────────────
// Controllers
// ──────────────────────────────────────────

export const listThreads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const filter: Record<string, unknown> = { userId: req.user.id }

    const { scope, scopeId } = req.query
    if (scope) filter.scope = scope
    if (scopeId) filter.scopeId = scopeId

    const threads = await ChatThread.find(filter).sort({ updatedAt: -1 }).lean()

    const threadsData = threads.map(t => ({
      id: t._id.toString(),
      title: t.title,
      scope: t.scope || ChatScope.GENERAL,
      scopeId: t.scopeId?.toString() || null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }))

    res.status(200).json(success(threadsData))
  } catch (err) {
    console.error('List threads error:', err)
    res.status(500).json(error('Failed to list threads', 'INTERNAL_ERROR'))
  }
}

export const createThread = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { title, scope, scopeId } = req.body
    if (!title || !title.trim()) {
      res.status(400).json(error('Title is required', 'VALIDATION_ERROR'))
      return
    }

    if (scope && !Object.values(ChatScope).includes(scope)) {
      res.status(400).json(error('Invalid scope', 'VALIDATION_ERROR'))
      return
    }

    if ((scope === ChatScope.LESSON || scope === ChatScope.COURSE) && !scopeId) {
      res
        .status(400)
        .json(error('scopeId is required for LESSON and COURSE scopes', 'VALIDATION_ERROR'))
      return
    }

    const thread = await ChatThread.create({
      userId: req.user.id,
      title: title.trim(),
      scope: scope || ChatScope.GENERAL,
      scopeId: scopeId || null
    })

    res.status(201).json(
      success({
        id: thread._id.toString(),
        title: thread.title,
        scope: thread.scope,
        scopeId: thread.scopeId?.toString() || null,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      })
    )
  } catch (err) {
    console.error('Create thread error:', err)
    res.status(500).json(error('Failed to create thread', 'INTERNAL_ERROR'))
  }
}

export const getThreadMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { threadId } = req.params

    const thread = await ChatThread.findOne({ _id: threadId, userId: req.user.id })
    if (!thread) {
      res.status(404).json(error('Thread not found', 'NOT_FOUND'))
      return
    }

    const messages = await ChatMessage.find({ threadId }).sort({ createdAt: 1 }).lean()

    const messagesData = messages.map(m => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt
    }))

    res.status(200).json(success(messagesData))
  } catch (err) {
    console.error('Get thread messages error:', err)
    res.status(500).json(error('Failed to get messages', 'INTERNAL_ERROR'))
  }
}

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { threadId } = req.params
    const { content } = req.body

    if (!content || !content.trim()) {
      res.status(400).json(error('Message content is required', 'VALIDATION_ERROR'))
      return
    }

    const thread = await ChatThread.findOne({ _id: threadId, userId: req.user.id })
    if (!thread) {
      res.status(404).json(error('Thread not found', 'NOT_FOUND'))
      return
    }

    // Save user message
    const userMessage = await ChatMessage.create({
      threadId,
      role: SenderRole.USER,
      content: content.trim()
    })

    // Generate AI response
    if (!aiService.isConfigured()) {
      res.status(503).json(error('AI service is not configured', AI_NOT_CONFIGURED))
      return
    }

    // Build system prompt based on thread scope
    let systemPrompt: string
    switch (thread.scope) {
      case ChatScope.LESSON:
        systemPrompt = await buildLessonSystemPrompt(thread.scopeId!.toString())
        break
      case ChatScope.COURSE:
        systemPrompt = await buildCourseSystemPrompt(thread.scopeId!.toString())
        break
      default:
        systemPrompt = buildGeneralSystemPrompt()
    }

    // Fetch recent conversation history (last 20 messages)
    const recentMessages = await ChatMessage.find({ threadId })
      .sort({ createdAt: -1 })
      .limit(21) // 20 + the user message we just saved
      .lean()

    const history: AIChatMessage[] = recentMessages
      .reverse()
      .slice(0, -1) // exclude the message we just saved
      .map(m => ({
        role: m.role === SenderRole.USER ? ('user' as const) : ('model' as const),
        content: m.content
      }))
      .filter(m => m.role === 'user' || m.role === 'model')

    const aiResponse = await aiService.generateChatResponse(systemPrompt, history, content.trim())

    const assistantMessage = await ChatMessage.create({
      threadId,
      role: SenderRole.ASSISTANT,
      content: aiResponse
    })

    // Touch the thread's updatedAt
    thread.set('updatedAt', new Date())
    await thread.save()

    res.status(200).json(
      success({
        userMessage: {
          id: userMessage._id.toString(),
          role: userMessage.role,
          content: userMessage.content,
          createdAt: userMessage.createdAt
        },
        assistantMessage: {
          id: assistantMessage._id.toString(),
          role: assistantMessage.role,
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt
        }
      })
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send message'
    console.error('Send message error:', msg)
    const status = msg.includes('rate limit') ? 429 : 500
    res.status(status).json(error(msg, status === 429 ? 'RATE_LIMITED' : 'AI_SERVICE_ERROR'))
  }
}

export const deleteThread = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { threadId } = req.params

    const thread = await ChatThread.findOneAndDelete({ _id: threadId, userId: req.user.id })
    if (!thread) {
      res.status(404).json(error('Thread not found', 'NOT_FOUND'))
      return
    }

    // Delete all messages in the thread
    await ChatMessage.deleteMany({ threadId })

    res.status(200).json(success({ message: 'Thread deleted' }))
  } catch (err) {
    console.error('Delete thread error:', err)
    res.status(500).json(error('Failed to delete thread', 'INTERNAL_ERROR'))
  }
}

export const updateThread = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { threadId } = req.params
    const { title } = req.body

    if (!title || !title.trim()) {
      res.status(400).json(error('Title is required', 'VALIDATION_ERROR'))
      return
    }

    const thread = await ChatThread.findOneAndUpdate(
      { _id: threadId, userId: req.user.id },
      { title: title.trim() },
      { new: true }
    )

    if (!thread) {
      res.status(404).json(error('Thread not found', 'NOT_FOUND'))
      return
    }

    res.status(200).json(
      success({
        id: thread._id.toString(),
        title: thread.title,
        scope: thread.scope,
        scopeId: thread.scopeId?.toString() || null,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      })
    )
  } catch (err) {
    console.error('Update thread error:', err)
    res.status(500).json(error('Failed to update thread', 'INTERNAL_ERROR'))
  }
}
