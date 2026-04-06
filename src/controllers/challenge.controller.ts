import { Request, Response } from 'express'
import { Challenge, Lesson } from '../models'
import { success, error } from '../utils/jsend'
import { AuthRequest } from '../middlewares/auth.middleware'

/**
 * Get challenge by ID
 */
export const getChallengeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { challengeId } = req.params

    const challenge = await Challenge.findById(challengeId).populate('lessonId')

    if (!challenge) {
      res.status(404).json(error('Challenge not found', 'NOT_FOUND'))
      return
    }

    // Filter test cases based on user role
    const user = req.user
    const isAdminOrInstructor = user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR')

    const filteredTestCases = isAdminOrInstructor
      ? challenge.testCases
      : challenge.testCases.filter(tc => !tc.isHidden)

    const responseData: any = {
      id: challenge._id.toString(),
      lessonId: challenge.lessonId.toString(),
      title: challenge.title,
      description: challenge.description || '',
      starterCodes: challenge.starterCodes,
      testCases: filteredTestCases
    }

    // Only admins/instructors can see injected and solution codes
    if (isAdminOrInstructor) {
      responseData.solutionCodes = challenge.solutionCodes
      responseData.injectedCodes = challenge.injectedCodes || {}
    }

    res.status(200).json(success(responseData))
  } catch (err) {
    console.error('Get challenge error:', err)
    res.status(500).json(error('Failed to get challenge', 'INTERNAL_ERROR'))
  }
}

/**
 * Create a new challenge (admin/instructor only)
 */
export const createChallenge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId, title, description, starterCodes, solutionCodes, injectedCodes, testCases } =
      req.body

    if (!lessonId || !title || !starterCodes || !solutionCodes) {
      res
        .status(400)
        .json(
          error(
            'Lesson ID, title, starter codes, and solution codes are required',
            'VALIDATION_ERROR'
          )
        )
      return
    }

    // Verify lesson exists
    const lesson = await Lesson.findById(lessonId)
    if (!lesson) {
      res.status(404).json(error('Lesson not found', 'NOT_FOUND'))
      return
    }

    const challenge = await Challenge.create({
      lessonId,
      title,
      description: description || '',
      starterCodes,
      solutionCodes,
      injectedCodes: injectedCodes || {},
      testCases: testCases || []
    })

    // Add challenge to lesson
    await Lesson.findByIdAndUpdate(lessonId, {
      $push: { challengeIds: challenge._id }
    })

    res.status(201).json(success({ challengeId: challenge._id.toString() }))
  } catch (err) {
    console.error('Create challenge error:', err)
    res.status(500).json(error('Failed to create challenge', 'INTERNAL_ERROR'))
  }
}

/**
 * Update a challenge (admin/instructor only)
 */
export const updateChallenge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { challengeId } = req.params
    const { title, description, starterCodes, solutionCodes, injectedCodes, testCases } = req.body

    const challenge = await Challenge.findByIdAndUpdate(
      challengeId,
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(starterCodes && { starterCodes }),
        ...(solutionCodes && { solutionCodes }),
        ...(injectedCodes !== undefined && { injectedCodes }),
        ...(testCases && { testCases })
      },
      { new: true }
    )

    if (!challenge) {
      res.status(404).json(error('Challenge not found', 'NOT_FOUND'))
      return
    }

    res.status(200).json(success({ challengeId: challenge._id.toString() }))
  } catch (err) {
    console.error('Update challenge error:', err)
    res.status(500).json(error('Failed to update challenge', 'INTERNAL_ERROR'))
  }
}

/**
 * Delete a challenge (admin/instructor only)
 */
export const deleteChallenge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { challengeId } = req.params

    const challenge = await Challenge.findByIdAndDelete(challengeId)

    if (!challenge) {
      res.status(404).json(error('Challenge not found', 'NOT_FOUND'))
      return
    }

    res.status(200).json(success({ message: 'Challenge deleted successfully' }))
  } catch (err) {
    console.error('Delete challenge error:', err)
    res.status(500).json(error('Failed to delete challenge', 'INTERNAL_ERROR'))
  }
}

/**
 * Get all challenges for a lesson
 */
export const getChallengesByLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params

    const challenges = await Challenge.find({ lessonId })

    const challengesData = challenges.map(challenge => {
      // Get list of available languages for this challenge
      const availableLanguages = Object.keys(challenge.starterCodes).filter(
        lang => challenge.starterCodes[lang as keyof typeof challenge.starterCodes]
      )

      return {
        id: challenge._id.toString(),
        title: challenge.title,
        availableLanguages
      }
    })

    res.status(200).json(success(challengesData))
  } catch (err) {
    console.error('Get challenges error:', err)
    res.status(500).json(error('Failed to get challenges', 'INTERNAL_ERROR'))
  }
}
