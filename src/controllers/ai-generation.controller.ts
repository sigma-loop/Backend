import { Response } from 'express'
import {
  User,
  Course,
  Lesson,
  Enrollment,
  GeneratedCourse,
  GeneratedLesson,
  GeneratedChallenge
} from '../models'
import { success, error } from '../utils/jsend'
import { AuthRequest } from '../middlewares/auth.middleware'
import { aiService } from '../services/ai.service'
import { AI_NOT_CONFIGURED, AI_SERVICE_ERROR, NOT_FOUND } from '../constants'

// ──────────────────────────────────────────
// Generate a lesson for an existing course
// ──────────────────────────────────────────

export const generateMoreLessons = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    if (!aiService.isConfigured()) {
      res.status(503).json(error('AI service is not configured', AI_NOT_CONFIGURED))
      return
    }

    const { courseId } = req.params

    // Verify course exists
    const course = await Course.findById(courseId).lean()
    if (!course) {
      res.status(404).json(error('Course not found', NOT_FOUND))
      return
    }

    // Verify user is enrolled
    const enrollment = await Enrollment.findOne({ userId: req.user.id, courseId }).lean()
    if (!enrollment) {
      res.status(403).json(error('You must be enrolled in this course', 'FORBIDDEN'))
      return
    }

    const lessons = await Lesson.find({ courseId }).sort({ orderIndex: 1 }).lean()

    // Get existing generated lesson titles too
    const generatedLessons = await GeneratedLesson.find({
      userId: req.user.id,
      courseId,
      isGeneratedCourse: false
    })
      .sort({ orderIndex: 1 })
      .lean()

    const allTitles = [...lessons.map(l => l.title), ...generatedLessons.map(l => l.title)]

    // User can optionally specify what they want to learn
    const userPrompt = req.body.prompt?.trim() || ''

    // Generate lesson via AI
    const generated = await aiService.generateLessonContent(
      course.title,
      course.description,
      allTitles,
      course.difficulty,
      userPrompt
    )

    const nextOrderIndex =
      generatedLessons.length > 0
        ? generatedLessons[generatedLessons.length - 1].orderIndex + 1
        : lessons[lessons.length - 1].orderIndex + 1

    // Save generated lesson
    const genLesson = await GeneratedLesson.create({
      userId: req.user.id,
      courseId,
      isGeneratedCourse: false,
      title: generated.title,
      contentMarkdown: generated.contentMarkdown,
      orderIndex: nextOrderIndex
    })

    // Save generated challenges
    const savedChallenges = []
    for (const challenge of generated.challenges) {
      const genChallenge = await GeneratedChallenge.create({
        generatedLessonId: genLesson._id,
        title: challenge.title,
        starterCodes: challenge.starterCodes,
        solutionCodes: challenge.solutionCodes,
        testCases: challenge.testCases
      })
      savedChallenges.push({
        id: genChallenge._id.toString(),
        title: genChallenge.title,
        starterCodes: genChallenge.starterCodes,
        solutionCodes: genChallenge.solutionCodes,
        testCases: genChallenge.testCases.filter(tc => !tc.isHidden)
      })
    }

    res.status(201).json(
      success({
        id: genLesson._id.toString(),
        courseId: genLesson.courseId.toString(),
        title: genLesson.title,
        contentMarkdown: genLesson.contentMarkdown,
        orderIndex: genLesson.orderIndex,
        challenges: savedChallenges,
        generatedAt: genLesson.generatedAt
      })
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate lesson'
    console.error('Generate lesson error:', msg)
    const status = msg.includes('rate limit') ? 429 : 500
    res.status(status).json(error(msg, status === 429 ? 'RATE_LIMITED' : AI_SERVICE_ERROR))
  }
}

// ──────────────────────────────────────────
// List generated lessons for a course
// ──────────────────────────────────────────

export const getGeneratedLessons = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { courseId } = req.params

    const lessons = await GeneratedLesson.find({
      userId: req.user.id,
      courseId,
      isGeneratedCourse: false
    })
      .sort({ orderIndex: 1 })
      .lean()

    const lessonsData = lessons.map(l => ({
      id: l._id.toString(),
      courseId: l.courseId.toString(),
      title: l.title,
      orderIndex: l.orderIndex,
      generatedAt: l.generatedAt
    }))

    res.status(200).json(success(lessonsData))
  } catch (err) {
    console.error('Get generated lessons error:', err)
    res.status(500).json(error('Failed to get generated lessons', 'INTERNAL_ERROR'))
  }
}

// ──────────────────────────────────────────
// Get a single generated lesson with challenges
// ──────────────────────────────────────────

export const getGeneratedLessonById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { lessonId } = req.params

    const lesson = await GeneratedLesson.findOne({ _id: lessonId, userId: req.user.id }).lean()
    if (!lesson) {
      res.status(404).json(error('Generated lesson not found', NOT_FOUND))
      return
    }

    const challenges = await GeneratedChallenge.find({ generatedLessonId: lessonId }).lean()

    const challengesData = challenges.map(c => ({
      id: c._id.toString(),
      title: c.title,
      starterCodes: c.starterCodes,
      solutionCodes: c.solutionCodes,
      testCases: c.testCases.filter(tc => !tc.isHidden)
    }))

    res.status(200).json(
      success({
        id: lesson._id.toString(),
        courseId: lesson.courseId.toString(),
        isGeneratedCourse: lesson.isGeneratedCourse,
        title: lesson.title,
        contentMarkdown: lesson.contentMarkdown,
        orderIndex: lesson.orderIndex,
        challenges: challengesData,
        generatedAt: lesson.generatedAt
      })
    )
  } catch (err) {
    console.error('Get generated lesson error:', err)
    res.status(500).json(error('Failed to get generated lesson', 'INTERNAL_ERROR'))
  }
}

// ──────────────────────────────────────────
// Generate a new course
// ──────────────────────────────────────────

export const generateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    if (!aiService.isConfigured()) {
      res.status(503).json(error('AI service is not configured', AI_NOT_CONFIGURED))
      return
    }

    const { prompt, difficulty } = req.body
    if (!prompt || !prompt.trim()) {
      res
        .status(400)
        .json(error('A description of what you want to learn is required', 'VALIDATION_ERROR'))
      return
    }

    // Generate course via AI
    const generated = await aiService.generateCourseContent(prompt.trim(), difficulty)

    // Save generated course
    const genCourse = await GeneratedCourse.create({
      userId: req.user.id,
      title: generated.title,
      description: generated.description,
      difficulty: generated.difficulty,
      tags: generated.tags
    })

    // Save generated lessons and their challenges
    const lessonsData = []
    for (let i = 0; i < generated.lessons.length; i++) {
      const lessonData = generated.lessons[i]

      const genLesson = await GeneratedLesson.create({
        userId: req.user.id,
        courseId: genCourse._id,
        isGeneratedCourse: true,
        title: lessonData.title,
        contentMarkdown: lessonData.contentMarkdown,
        orderIndex: i + 1
      })

      const challengesData = []
      for (const challenge of lessonData.challenges) {
        const genChallenge = await GeneratedChallenge.create({
          generatedLessonId: genLesson._id,
          title: challenge.title,
          starterCodes: challenge.starterCodes,
          solutionCodes: challenge.solutionCodes,
          testCases: challenge.testCases
        })
        challengesData.push({
          id: genChallenge._id.toString(),
          title: genChallenge.title
        })
      }

      lessonsData.push({
        id: genLesson._id.toString(),
        title: genLesson.title,
        orderIndex: genLesson.orderIndex,
        challengeCount: challengesData.length,
        challenges: challengesData
      })
    }

    res.status(201).json(
      success({
        id: genCourse._id.toString(),
        title: genCourse.title,
        description: genCourse.description,
        difficulty: genCourse.difficulty,
        tags: genCourse.tags,
        lessons: lessonsData,
        generatedAt: genCourse.generatedAt
      })
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate course'
    console.error('Generate course error:', msg)
    const status = msg.includes('rate limit') ? 429 : 500
    res.status(status).json(error(msg, status === 429 ? 'RATE_LIMITED' : AI_SERVICE_ERROR))
  }
}

// ──────────────────────────────────────────
// List user's generated courses
// ──────────────────────────────────────────

export const getGeneratedCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const courses = await GeneratedCourse.find({ userId: req.user.id })
      .sort({ generatedAt: -1 })
      .lean()

    const coursesData = await Promise.all(
      courses.map(async c => {
        const lessonCount = await GeneratedLesson.countDocuments({
          courseId: c._id,
          isGeneratedCourse: true
        })
        return {
          id: c._id.toString(),
          title: c.title,
          description: c.description,
          difficulty: c.difficulty,
          tags: c.tags,
          lessonCount,
          generatedAt: c.generatedAt
        }
      })
    )

    res.status(200).json(success(coursesData))
  } catch (err) {
    console.error('Get generated courses error:', err)
    res.status(500).json(error('Failed to get generated courses', 'INTERNAL_ERROR'))
  }
}

// ──────────────────────────────────────────
// Get a single generated course with lessons
// ──────────────────────────────────────────

export const getGeneratedCourseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { courseId } = req.params

    const course = await GeneratedCourse.findOne({ _id: courseId, userId: req.user.id }).lean()
    if (!course) {
      res.status(404).json(error('Generated course not found', NOT_FOUND))
      return
    }

    const lessons = await GeneratedLesson.find({ courseId: course._id, isGeneratedCourse: true })
      .sort({ orderIndex: 1 })
      .lean()

    const lessonsData = await Promise.all(
      lessons.map(async l => {
        const challengeCount = await GeneratedChallenge.countDocuments({ generatedLessonId: l._id })
        return {
          id: l._id.toString(),
          title: l.title,
          orderIndex: l.orderIndex,
          challengeCount,
          generatedAt: l.generatedAt
        }
      })
    )

    res.status(200).json(
      success({
        id: course._id.toString(),
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        tags: course.tags,
        lessons: lessonsData,
        generatedAt: course.generatedAt
      })
    )
  } catch (err) {
    console.error('Get generated course error:', err)
    res.status(500).json(error('Failed to get generated course', 'INTERNAL_ERROR'))
  }
}

// ══════════════════════════════════════════
// Admin Endpoints
// ══════════════════════════════════════════

// ──────────────────────────────────────────
// Admin: List all users who have generated content
// ──────────────────────────────────────────

export const adminGetGeneratedContentOverview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    // Get all unique userIds from generated courses and lessons
    const [courseUserIds, lessonUserIds] = await Promise.all([
      GeneratedCourse.distinct('userId'),
      GeneratedLesson.distinct('userId', { isGeneratedCourse: false })
    ])

    const allUserIds = [...new Set([...courseUserIds, ...lessonUserIds].map(id => id.toString()))]

    const users = await User.find({ _id: { $in: allUserIds } })
      .select('email profileData role')
      .lean()

    const usersData = await Promise.all(
      users.map(async u => {
        const [generatedCourseCount, generatedLessonCount] = await Promise.all([
          GeneratedCourse.countDocuments({ userId: u._id }),
          GeneratedLesson.countDocuments({ userId: u._id, isGeneratedCourse: false })
        ])
        return {
          id: u._id.toString(),
          email: u.email,
          name: u.profileData?.name || null,
          role: u.role,
          generatedCourseCount,
          generatedLessonCount
        }
      })
    )

    res.status(200).json(success(usersData))
  } catch (err) {
    console.error('Admin get generated overview error:', err)
    res.status(500).json(error('Failed to get generated content overview', 'INTERNAL_ERROR'))
  }
}

// ──────────────────────────────────────────
// Admin: List generated courses by a specific user
// ──────────────────────────────────────────

export const adminGetUserGeneratedCourses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { userId } = req.params

    const courses = await GeneratedCourse.find({ userId }).sort({ generatedAt: -1 }).lean()

    const coursesData = await Promise.all(
      courses.map(async c => {
        const lessonCount = await GeneratedLesson.countDocuments({
          courseId: c._id,
          isGeneratedCourse: true
        })
        return {
          id: c._id.toString(),
          userId: c.userId.toString(),
          title: c.title,
          description: c.description,
          difficulty: c.difficulty,
          tags: c.tags,
          lessonCount,
          generatedAt: c.generatedAt
        }
      })
    )

    res.status(200).json(success(coursesData))
  } catch (err) {
    console.error('Admin get user generated courses error:', err)
    res.status(500).json(error('Failed to get user generated courses', 'INTERNAL_ERROR'))
  }
}

// ──────────────────────────────────────────
// Admin: List generated lessons for a specific course by a user
// ──────────────────────────────────────────

export const adminGetUserGeneratedLessons = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { userId, courseId } = req.params

    const lessons = await GeneratedLesson.find({ userId, courseId, isGeneratedCourse: false })
      .sort({ orderIndex: 1 })
      .lean()

    // Also get the original course info
    const course = await Course.findById(courseId).select('title').lean()

    const lessonsData = lessons.map(l => ({
      id: l._id.toString(),
      courseId: l.courseId.toString(),
      title: l.title,
      orderIndex: l.orderIndex,
      generatedAt: l.generatedAt
    }))

    res.status(200).json(
      success({
        courseTitle: course?.title || 'Unknown Course',
        lessons: lessonsData
      })
    )
  } catch (err) {
    console.error('Admin get user generated lessons error:', err)
    res.status(500).json(error('Failed to get user generated lessons', 'INTERNAL_ERROR'))
  }
}

// ──────────────────────────────────────────
// Admin: Get all generated content for a user (courses + lessons per real course)
// ──────────────────────────────────────────

export const adminGetUserGeneratedContent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { userId } = req.params

    const targetUser = await User.findById(userId).select('email profileData role').lean()
    if (!targetUser) {
      res.status(404).json(error('User not found', NOT_FOUND))
      return
    }

    // Get generated courses
    const genCourses = await GeneratedCourse.find({ userId }).sort({ generatedAt: -1 }).lean()

    const coursesData = await Promise.all(
      genCourses.map(async c => {
        const lessonCount = await GeneratedLesson.countDocuments({
          courseId: c._id,
          isGeneratedCourse: true
        })
        return {
          id: c._id.toString(),
          title: c.title,
          description: c.description,
          difficulty: c.difficulty,
          lessonCount,
          generatedAt: c.generatedAt
        }
      })
    )

    // Get generated lessons grouped by original course
    const genLessons = await GeneratedLesson.find({ userId, isGeneratedCourse: false })
      .sort({ courseId: 1, orderIndex: 1 })
      .lean()

    // Group by courseId
    const lessonsByCourse: Record<string, typeof genLessons> = {}
    for (const lesson of genLessons) {
      const cid = lesson.courseId.toString()
      if (!lessonsByCourse[cid]) lessonsByCourse[cid] = []
      lessonsByCourse[cid].push(lesson)
    }

    // Fetch course titles
    const courseIds = Object.keys(lessonsByCourse)
    const originalCourses = await Course.find({ _id: { $in: courseIds } })
      .select('title')
      .lean()
    const courseMap = new Map(originalCourses.map(c => [c._id.toString(), c.title]))

    const lessonsPerCourse = courseIds.map(cid => ({
      courseId: cid,
      courseTitle: courseMap.get(cid) || 'Unknown Course',
      lessons: lessonsByCourse[cid].map(l => ({
        id: l._id.toString(),
        title: l.title,
        orderIndex: l.orderIndex,
        generatedAt: l.generatedAt
      }))
    }))

    res.status(200).json(
      success({
        user: {
          id: targetUser._id.toString(),
          email: targetUser.email,
          name: targetUser.profileData?.name || null,
          role: targetUser.role
        },
        generatedCourses: coursesData,
        generatedLessonsPerCourse: lessonsPerCourse
      })
    )
  } catch (err) {
    console.error('Admin get user generated content error:', err)
    res.status(500).json(error('Failed to get user generated content', 'INTERNAL_ERROR'))
  }
}
