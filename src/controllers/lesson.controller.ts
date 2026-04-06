import { Request, Response } from 'express'
import { Lesson, Challenge, LessonProgress, Enrollment } from '../models'
import { success, error } from '../utils/jsend'
import { AuthRequest } from '../middlewares/auth.middleware'

/**
 * Get lesson by ID with details
 */
export const getLessonById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params

    const lesson = await Lesson.findById(lessonId).populate('challengeIds')
    if (!lesson) {
      res.status(404).json(error('Lesson not found', 'NOT_FOUND'))
      return
    }

    // Find next and previous lessons
    const nextLesson = await Lesson.findOne({
      courseId: lesson.courseId,
      orderIndex: { $gt: lesson.orderIndex }
    }).sort({ orderIndex: 1 })

    const prevLesson = await Lesson.findOne({
      courseId: lesson.courseId,
      orderIndex: { $lt: lesson.orderIndex }
    }).sort({ orderIndex: -1 })

    // Update last accessed if user is authenticated
    if (req.user) {
      // Update enrollment last accessed
      await Enrollment.findOneAndUpdate(
        {
          userId: req.user.id,
          courseId: lesson.courseId
        },
        {
          lastAccessedAt: new Date()
        }
      )
    }

    // Format challenges
    const challenges =
      (lesson.challengeIds as any[])?.map((challenge: any) => ({
        id: challenge._id.toString(),
        title: challenge.title,
        description: challenge.description || '',
        starterCodes: challenge.starterCodes,
        testCases: challenge.testCases.filter((tc: any) => !tc.isHidden)
      })) || []

    res.status(200).json(
      success({
        id: lesson._id.toString(),
        title: lesson.title,
        contentMarkdown: lesson.contentMarkdown,
        challenges,
        nextLessonId: nextLesson ? nextLesson._id.toString() : null,
        prevLessonId: prevLesson ? prevLesson._id.toString() : null
      })
    )
  } catch (err) {
    console.error('Get lesson error:', err)
    res.status(500).json(error('Failed to get lesson', 'INTERNAL_ERROR'))
  }
}

/**
 * Create a new lesson (admin/instructor only)
 */
export const createLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, title, orderIndex, contentMarkdown, type, challengeIds } = req.body

    if (!courseId || !title || orderIndex === undefined || !contentMarkdown) {
      res
        .status(400)
        .json(error('Course ID, title, orderIndex, and content are required', 'VALIDATION_ERROR'))
      return
    }

    const lesson = await Lesson.create({
      courseId,
      title,
      orderIndex,
      contentMarkdown,
      type: type || 'LESSON',
      challengeIds: challengeIds || []
    })

    res.status(201).json(success({ lessonId: lesson._id.toString() }))
  } catch (err) {
    console.error('Create lesson error:', err)
    res.status(500).json(error('Failed to create lesson', 'INTERNAL_ERROR'))
  }
}

/**
 * Update a lesson (admin/instructor only)
 */
export const updateLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params
    const { title, orderIndex, contentMarkdown, type, challengeIds } = req.body

    const lesson = await Lesson.findByIdAndUpdate(
      lessonId,
      {
        ...(title && { title }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(contentMarkdown && { contentMarkdown }),
        ...(type && { type }),
        ...(challengeIds && { challengeIds })
      },
      { new: true }
    )

    if (!lesson) {
      res.status(404).json(error('Lesson not found', 'NOT_FOUND'))
      return
    }

    res.status(200).json(success({ lessonId: lesson._id.toString() }))
  } catch (err) {
    console.error('Update lesson error:', err)
    res.status(500).json(error('Failed to update lesson', 'INTERNAL_ERROR'))
  }
}

/**
 * Delete a lesson (admin/instructor only)
 */
export const deleteLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params

    const lesson = await Lesson.findByIdAndDelete(lessonId)

    if (!lesson) {
      res.status(404).json(error('Lesson not found', 'NOT_FOUND'))
      return
    }

    // Delete related data
    await Challenge.deleteMany({ lessonId })
    await LessonProgress.deleteMany({ lessonId })

    res.status(200).json(success({ message: 'Lesson deleted successfully' }))
  } catch (err) {
    console.error('Delete lesson error:', err)
    res.status(500).json(error('Failed to delete lesson', 'INTERNAL_ERROR'))
  }
}

/**
 * Get all lessons for a course
 */
export const getLessonsByCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params

    const lessons = await Lesson.find({ courseId }).sort({ orderIndex: 1 })

    const lessonsData = lessons.map(lesson => ({
      id: lesson._id.toString(),
      title: lesson.title,
      orderIndex: lesson.orderIndex,
      type: lesson.type
    }))

    res.status(200).json(success(lessonsData))
  } catch (err) {
    console.error('Get lessons error:', err)
    res.status(500).json(error('Failed to get lessons', 'INTERNAL_ERROR'))
  }
}
