import { Response } from 'express'
import { Challenge, Submission, LessonProgress, User } from '../models'
import { success, error } from '../utils/jsend'
import { AuthRequest } from '../middlewares/auth.middleware'
import axios from 'axios'
import { getJudge0LanguageId } from '../utils/judge0-mapper'
/**
 * Execute code and return results (dummy implementation)
 *
 * Simulates code execution for challenges. This is a placeholder implementation
 * that returns mock results. In production, this should integrate with a
 * sandboxed code execution service.
 *
 * If authenticated and a challengeId is provided, saves the submission to database.
 *
 * @param req - AuthRequest with optional user and code/challengeId in body
 * @param res - Express response object
 * @returns Promise<void> - Sends 200 with execution results on success, 400/500 on error
 *
 * @example
 * // Request body
 * {
 *   "challengeId": "challenge_id",
 *   "code": "print('Hello World')",
 *   "language": "python"
 * }
 *
 * @example
 * // Response
 * {
 *   "success": true,
 *   "data": {
 *     "status": "PASS",
 *     "stdout": "Code executed successfully\nAll test cases passed!\n",
 *     "stderr": null,
 *     "metrics": {
 *       "runtime": "0.05s"
 *     }
 *   }
 * }
 *
 * @remarks
 * This is a dummy implementation. Replace with actual code execution service
 * integration for production use.
 */
export const runCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { challengeId, code, language } = req.body
    console.log('[RUN] Input:', { challengeId, language, codeLength: code?.length })

    if (!challengeId) {
      res.status(400).json(error('Challenge ID is required', 'VALIDATION_ERROR'))
      return
    }
    if (!code) {
      res.status(400).json(error('Code is required', 'VALIDATION_ERROR'))
      return
    }

    if (!language) {
      res.status(400).json(error('Language is required', 'VALIDATION_ERROR'))
      return
    }
    const normalizedLanguage = String(language || '').toLowerCase()

    // Validate Challenge
    const challenge = await Challenge.findById(challengeId)
    if (!challenge) {
      console.log('[RUN] Challenge not found:', challengeId)
      res.status(404).json(error('Challenge Not Found', 'NOT_FOUND'))
      return
    }
    console.log('[RUN] Challenge:', challenge.title)

    const testcases = challenge.testCases.filter(el => el.isHidden === false)
    if (!testcases || testcases.length === 0) {
      console.log('[RUN] No public test cases for challenge:', challengeId)
      res.status(400).json(error('Challenge has no public test cases', 'VALIDATION_ERROR'))
      return
    }
    // Validate language
    const languageId = getJudge0LanguageId(normalizedLanguage)
    if (!languageId) {
      console.log('[RUN] Unsupported language:', normalizedLanguage)
      res.status(400).json(error(`Unsupported language: ${normalizedLanguage}`, 'VALIDATION_ERROR'))
      return
    }
    const url: string = process.env.JUDGE0_DASHBOARD || 'http://localhost:2358'

    // Combine user code with injected wrapper code
    const injected =
      challenge.injectedCodes?.[normalizedLanguage as keyof typeof challenge.injectedCodes] || ''
    const sourceCode = injected ? `${code}\n${injected}` : code
    console.log(
      '[RUN] Judge0 URL:',
      url,
      '| Language ID:',
      languageId,
      '| Test cases:',
      testcases.length,
      '| Injected:',
      injected.length > 0
    )

    // Execute against all public test cases via Judge0
    const judge0Results = await Promise.all(
      testcases.map(async (testCase, i) => {
        console.log(`[RUN] Sending test case ${i + 1}:`, {
          stdin: testCase.input?.substring(0, 100),
          expectedOutput: testCase.expectedOutput?.substring(0, 100)
        })
        const response = await axios.post(`${url}/submissions?wait=true`, {
          source_code: sourceCode,
          language_id: languageId,
          expected_output: testCase.expectedOutput,
          stdin: testCase.input
        })
        console.log(`[RUN] Test case ${i + 1} result:`, {
          status: response.data.status?.description,
          stdout: response.data.stdout?.substring(0, 100),
          stderr: response.data.stderr?.substring(0, 100),
          time: response.data.time,
          memory: response.data.memory
        })
        return response.data
      })
    )

    const testResults: any[] = []
    let passedCount = 0
    let maxTime = 0
    let maxMemory = 0

    judge0Results.forEach((result: any, index: number) => {
      const statusId = result.status?.id
      const statusDescription = result.status?.description || 'Unknown'
      const passed = statusId === 3
      if (passed) passedCount += 1

      const timeValue = parseFloat(result.time || '0')
      if (!Number.isNaN(timeValue)) maxTime = Math.max(maxTime, timeValue)

      const memoryValue = Number(result.memory || 0)
      if (!Number.isNaN(memoryValue)) maxMemory = Math.max(maxMemory, memoryValue)

      const stderrParts = [result.stderr, result.compile_output, result.message].filter(Boolean)

      testResults.push({
        index: index + 1,
        passed,
        status: statusDescription,
        input: testcases[index].input || '',
        expectedOutput: testcases[index].expectedOutput || '',
        actualOutput: (result.stdout || '').replace(/\n$/, ''),
        stderr: stderrParts.length > 0 ? stderrParts.join('\n') : null,
        time: result.time || null,
        memory: result.memory || null
      })
    })

    const allPassed = passedCount === judge0Results.length
    const metrics = {
      runtime: `${maxTime.toFixed(3)}s`,
      memoryUsed: `${maxMemory}KB`,
      passed: passedCount,
      total: judge0Results.length
    }

    console.log('[RUN] Result:', { status: allPassed ? 'PASSED' : 'FAILED', ...metrics })

    res.status(200).json(
      success({
        status: allPassed ? 'PASSED' : 'FAILED',
        testResults,
        metrics
      })
    )
  } catch (err: any) {
    console.error('[RUN] Error:', err?.message || err)
    if (err?.response?.data) console.error('[RUN] Judge0 response:', err.response.data)
    res.status(500).json(error('Failed to execute code', 'INTERNAL_ERROR'))
  }
}

/**
 * Get submission history for authenticated user
 *
 * Retrieves the most recent 50 code submissions for the authenticated user.
 * Can be filtered by challengeId to get submissions for a specific challenge.
 *
 * @param req - AuthRequest with authenticated user and optional challengeId query param
 * @param res - Express response object
 * @returns Promise<void> - Sends 200 with submissions array on success, 401/500 on error
 *
 * @example
 * // Request: GET /execution/submissions?challengeId=challenge_id
 *
 * @example
 * // Response
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "submission_id",
 *       "challengeId": "challenge_id",
 *       "status": "PASSED",
 *       "createdAt": "2025-12-10T...",
 *       "metrics": {
 *         "runtime": "0.05s",
 *         "memoryUsed": "512KB"
 *       }
 *     }
 *   ]
 * }
 */
export const getSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { challengeId } = req.query

    const filter: any = { userId: req.user.id }
    if (challengeId) {
      filter.challengeId = challengeId
    }

    const submissions = await Submission.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('challengeId')

    const submissionsData = submissions.map(sub => ({
      id: sub._id.toString(),
      challengeId: sub.challengeId.toString(),
      language: sub.language,
      status: sub.status,
      createdAt: sub.createdAt,
      metrics: sub.metrics
    }))

    res.status(200).json(success(submissionsData))
  } catch (err) {
    console.error('Get submissions error:', err)
    res.status(500).json(error('Failed to get submissions', 'INTERNAL_ERROR'))
  }
}

/**
 * Submit code for a challenge
 *
 * This endpoint handles official challenge submissions. It validates the submission,
 * executes the code, saves the submission to the database, and returns the results.
 *
 * @param req - AuthRequest with authenticated user, challengeId, code, and language in body
 * @param res - Express response object
 * @returns Promise<void> - Sends 200 with execution results and submission ID on success
 *
 * @example
 * // Request body
 * {
 *   "challengeId": "challenge_id",
 *   "code": "def two_sum(nums, target):\n    return [0, 1]",
 *   "language": "python"
 * }
 *
 * @example
 * // Response
 * {
 *   "success": true,
 *   "data": {
 *     "submissionId": "submission_id",
 *     "status": "PASSED",
 *     "stdout": "Code executed successfully\nAll test cases passed!\n",
 *     "stderr": null,
 *     "metrics": {
 *       "runtime": "0.03s",
 *       "memoryUsed": "512KB"
 *     }
 *   }
 * }
 */
export const submitChallenge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Authentication is required for submissions
    if (!req.user) {
      res.status(401).json(error('Authentication required to submit challenges', 'UNAUTHORIZED'))
      return
    }

    const { challengeId, code, language } = req.body
    console.log('[SUBMIT] Input:', {
      userId: req.user.id,
      challengeId,
      language,
      codeLength: code?.length
    })

    // Validate required fields
    if (!challengeId) {
      res.status(400).json(error('Challenge ID is required', 'VALIDATION_ERROR'))
      return
    }

    if (!code) {
      res.status(400).json(error('Code is required', 'VALIDATION_ERROR'))
      return
    }

    if (!language) {
      res.status(400).json(error('Language is required', 'VALIDATION_ERROR'))
      return
    }
    const normalizedLanguage = String(language || '').toLowerCase()

    // Verify challenge exists
    const challenge = await Challenge.findById(challengeId)
    if (!challenge) {
      console.log('[SUBMIT] Challenge not found:', challengeId)
      res.status(404).json(error('Challenge not found', 'NOT_FOUND'))
      return
    }
    console.log('[SUBMIT] Challenge:', challenge.title)

    // Verify the language has starter code for this challenge
    if (!challenge.starterCodes[normalizedLanguage as keyof typeof challenge.starterCodes]) {
      console.log('[SUBMIT] Language not supported for challenge:', normalizedLanguage)
      res
        .status(400)
        .json(error(`This challenge does not support ${normalizedLanguage}`, 'VALIDATION_ERROR'))
      return
    }

    if (!challenge.testCases || challenge.testCases.length === 0) {
      console.log('[SUBMIT] No test cases for challenge:', challengeId)
      res.status(400).json(error('Challenge has no test cases', 'VALIDATION_ERROR'))
      return
    }

    // Validate language
    const languageId = getJudge0LanguageId(normalizedLanguage)
    if (!languageId) {
      console.log('[SUBMIT] Unsupported language:', normalizedLanguage)
      res.status(400).json(error(`Unsupported language: ${normalizedLanguage}`, 'VALIDATION_ERROR'))
      return
    }
    const url: string = process.env.JUDGE0_DASHBOARD || 'http://localhost:2358'

    // Combine user code with injected wrapper code
    const injected =
      challenge.injectedCodes?.[normalizedLanguage as keyof typeof challenge.injectedCodes] || ''
    const sourceCode = injected ? `${code}\n${injected}` : code
    console.log(
      '[SUBMIT] Judge0 URL:',
      url,
      '| Language ID:',
      languageId,
      '| Test cases:',
      challenge.testCases.length,
      '(all, including hidden)',
      '| Injected:',
      injected.length > 0
    )

    // Execute against all test cases via Judge0
    const judge0Results = await Promise.all(
      challenge.testCases.map(async (testCase, i) => {
        console.log(`[SUBMIT] Sending test case ${i + 1} (hidden: ${testCase.isHidden}):`, {
          stdin: testCase.input?.substring(0, 100),
          expectedOutput: testCase.expectedOutput?.substring(0, 100)
        })
        const response = await axios.post(`${url}/submissions?wait=true`, {
          source_code: sourceCode,
          language_id: languageId,
          expected_output: testCase.expectedOutput,
          stdin: testCase.input
        })
        console.log(`[SUBMIT] Test case ${i + 1} result:`, {
          status: response.data.status?.description,
          stdout: response.data.stdout?.substring(0, 100),
          stderr: response.data.stderr?.substring(0, 100),
          time: response.data.time,
          memory: response.data.memory
        })
        return response.data
      })
    )

    const testResults: any[] = []
    let passedCount = 0
    let maxTime = 0
    let maxMemory = 0

    judge0Results.forEach((result: any, index: number) => {
      const statusId = result.status?.id
      const statusDescription = result.status?.description || 'Unknown'
      const passed = statusId === 3
      if (passed) passedCount += 1

      const timeValue = parseFloat(result.time || '0')
      if (!Number.isNaN(timeValue)) maxTime = Math.max(maxTime, timeValue)

      const memoryValue = Number(result.memory || 0)
      if (!Number.isNaN(memoryValue)) maxMemory = Math.max(maxMemory, memoryValue)

      const stderrParts = [result.stderr, result.compile_output, result.message].filter(Boolean)
      const tc = challenge.testCases[index]

      testResults.push({
        index: index + 1,
        passed,
        status: statusDescription,
        isHidden: tc.isHidden,
        input: tc.isHidden ? null : tc.input || '',
        expectedOutput: tc.isHidden ? null : tc.expectedOutput || '',
        actualOutput: tc.isHidden ? null : (result.stdout || '').replace(/\n$/, ''),
        stderr: tc.isHidden ? null : stderrParts.length > 0 ? stderrParts.join('\n') : null,
        time: result.time || null,
        memory: result.memory || null
      })
    })

    const allPassed = passedCount === judge0Results.length
    const metrics = {
      runtime: `${maxTime.toFixed(3)}s`,
      memoryUsed: `${maxMemory}KB`,
      passed: passedCount,
      total: judge0Results.length
    }

    // Build outputLog for DB storage
    const outputLog = testResults
      .map((t: any) => `Test ${t.index}: ${t.status}${t.actualOutput ? '\n' + t.actualOutput : ''}`)
      .join('\n\n')

    // Save the submission
    const submission = await Submission.create({
      userId: req.user.id,
      challengeId,
      userCode: code,
      language: normalizedLanguage,
      outputLog,
      status: allPassed ? 'PASSED' : 'FAILED',
      metrics
    })

    console.log('[SUBMIT] Saved submission:', {
      submissionId: submission._id.toString(),
      status: submission.status,
      ...metrics
    })

    // Mark lesson as complete if all tests passed
    let lessonCompleted = false
    if (allPassed) {
      const lessonId = challenge.lessonId
      const existingProgress = await LessonProgress.findOne({
        userId: req.user.id,
        lessonId
      })

      if (!existingProgress?.isCompleted) {
        await LessonProgress.findOneAndUpdate(
          { userId: req.user.id, lessonId },
          { isCompleted: true, completedAt: new Date() },
          { upsert: true }
        )
        await User.findByIdAndUpdate(req.user.id, {
          $inc: { 'stats.lessonsCompleted': 1, 'stats.totalXp': 50 }
        })
        lessonCompleted = true
        console.log('[SUBMIT] Lesson marked complete, +50 XP for user:', req.user.id)
      }
    }

    // Return the execution results along with the submission ID
    res.status(200).json(
      success({
        submissionId: submission._id.toString(),
        status: submission.status,
        testResults,
        metrics: submission.metrics,
        lessonCompleted
      })
    )
  } catch (err: any) {
    console.error('[SUBMIT] Error:', err?.message || err)
    if (err?.response?.data) console.error('[SUBMIT] Judge0 response:', err.response.data)
    res.status(500).json(error('Failed to submit challenge', 'INTERNAL_ERROR'))
  }
}
