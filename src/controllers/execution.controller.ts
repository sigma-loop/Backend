import { Response } from 'express'
import { Challenge, Submission } from '../models'
import { success, error } from '../utils/jsend'
import { AuthRequest } from '../middlewares/auth.middleware'
import axios from 'axios'
import { verifyJudge0Languages } from '../utils/judge0-mapper'
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
      res.status(404).json(error('Challenge Not Found', 'NOT_FOUND'))
      return
    }
    const testcases = challenge.testCases.filter(el => el.isHidden === false)
    if (!testcases || testcases.length === 0) {
      res.status(400).json(error('Challenge has no public test cases', 'VALIDATION_ERROR'))
      return
    }
    // Validate language
    const url: string = process.env.JUDGE0_DASHBOARD || 'http://localhost:2358'
    const judge0Languages = await verifyJudge0Languages(url)
    const lang = judge0Languages.find((el: any) => el.name?.toLowerCase() === normalizedLanguage)
    if (!lang) {
      res.status(404).json(error('Language Not Found', 'NOT_FOUND'))
      return
    }
    // Execute against all public test cases via Judge0
    const judge0Results = await Promise.all(
      testcases.map(async testCase => {
        const response = await axios.post(`${url}/submissions?wait=true`, {
          source_code: code,
          language_id: lang.id,
          expected_output: testCase.expectedOutput,
          stdin: testCase.input
        })
        return response.data
      })
    )

    const stdoutLines: string[] = []
    const stderrLines: string[] = []
    let passedCount = 0
    let maxTime = 0
    let maxMemory = 0

    judge0Results.forEach((result: any, index: number) => {
      const statusId = result.status?.id
      const statusDescription = result.status?.description || 'Unknown'
      const stdoutText = result.stdout || ''
      const stderrText = result.stderr || ''
      const compileOutput = result.compile_output || ''
      const messageOutput = result.message || ''

      if (statusId === 3) {
        passedCount += 1
      }

      const timeValue = parseFloat(result.time || '0')
      if (!Number.isNaN(timeValue)) {
        maxTime = Math.max(maxTime, timeValue)
      }

      const memoryValue = Number(result.memory || 0)
      if (!Number.isNaN(memoryValue)) {
        maxMemory = Math.max(maxMemory, memoryValue)
      }

      stdoutLines.push(`Test case ${index + 1}: ${statusDescription}\n${stdoutText}`.trim())

      const stderrParts = [stderrText, compileOutput, messageOutput].filter(Boolean)
      if (stderrParts.length > 0) {
        stderrLines.push(
          `Test case ${index + 1}: ${statusDescription}\n${stderrParts.join('\n')}`.trim()
        )
      }
    })

    const allPassed = passedCount === judge0Results.length
    const stdout = stdoutLines.join('\n\n')
    const stderr = stderrLines.length > 0 ? stderrLines.join('\n\n') : null
    const metrics = {
      runtime: `${maxTime.toFixed(3)}s`,
      memoryUsed: `${maxMemory}KB`,
      passed: passedCount,
      total: judge0Results.length
    }

    res.status(200).json(
      success({
        status: allPassed ? 'PASSED' : 'FAILED',
        stdout,
        stderr,
        metrics
      })
    )
  } catch (err) {
    console.error('Run code error:', err)
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

    // Validate language
    // const validLanguages = ['python', 'cpp', 'java', 'javascript', 'typescript', 'go', 'rust']
    // if (!validLanguages.includes(normalizedLanguage)) {
    //   res.status(400).json(error('Invalid language', 'VALIDATION_ERROR'))
    //   return
    // }

    // Verify challenge exists
    const challenge = await Challenge.findById(challengeId)
    if (!challenge) {
      res.status(404).json(error('Challenge not found', 'NOT_FOUND'))
      return
    }

    // Verify the language has starter code for this challenge
    if (!challenge.starterCodes[normalizedLanguage as keyof typeof challenge.starterCodes]) {
      res
        .status(400)
        .json(error(`This challenge does not support ${normalizedLanguage}`, 'VALIDATION_ERROR'))
      return
    }

    if (!challenge.testCases || challenge.testCases.length === 0) {
      res.status(400).json(error('Challenge has no test cases', 'VALIDATION_ERROR'))
      return
    }

    // Validate language with Judge0
    const url: string = process.env.JUDGE0_DASHBOARD || 'http://localhost:2358'
    const judge0Languages = await verifyJudge0Languages(url)
    const judge0Lang = judge0Languages.find(
      (el: any) => el.name?.toLowerCase() === normalizedLanguage
    )
    if (!judge0Lang) {
      res.status(404).json(error('Language Not Found', 'NOT_FOUND'))
      return
    }

    // Execute against all test cases via Judge0
    const judge0Results = await Promise.all(
      challenge.testCases.map(async testCase => {
        const response = await axios.post(`${url}/submissions?wait=true`, {
          source_code: code,
          language_id: judge0Lang.id,
          expected_output: testCase.expectedOutput,
          stdin: testCase.input
        })
        return response.data
      })
    )

    const stdoutLines: string[] = []
    const stderrLines: string[] = []
    let passedCount = 0
    let maxTime = 0
    let maxMemory = 0

    judge0Results.forEach((result: any, index: number) => {
      const statusId = result.status?.id
      const statusDescription = result.status?.description || 'Unknown'
      const stdoutText = result.stdout || ''
      const stderrText = result.stderr || ''
      const compileOutput = result.compile_output || ''
      const messageOutput = result.message || ''

      if (statusId === 3) {
        passedCount += 1
      }

      const timeValue = parseFloat(result.time || '0')
      if (!Number.isNaN(timeValue)) {
        maxTime = Math.max(maxTime, timeValue)
      }

      const memoryValue = Number(result.memory || 0)
      if (!Number.isNaN(memoryValue)) {
        maxMemory = Math.max(maxMemory, memoryValue)
      }

      stdoutLines.push(`Test case ${index + 1}: ${statusDescription}\n${stdoutText}`.trim())

      const stderrParts = [stderrText, compileOutput, messageOutput].filter(Boolean)
      if (stderrParts.length > 0) {
        stderrLines.push(
          `Test case ${index + 1}: ${statusDescription}\n${stderrParts.join('\n')}`.trim()
        )
      }
    })

    const allPassed = passedCount === judge0Results.length
    const stdout = stdoutLines.join('\n\n')
    const stderr = stderrLines.length > 0 ? stderrLines.join('\n\n') : null
    const metrics = {
      runtime: `${maxTime.toFixed(3)}s`,
      memoryUsed: `${maxMemory}KB`,
      passed: passedCount,
      total: judge0Results.length
    }

    // Save the submission
    const submission = await Submission.create({
      userId: req.user.id,
      challengeId,
      userCode: code,
      language: normalizedLanguage,
      outputLog: [stdout, stderr].filter(Boolean).join('\n\n'),
      status: allPassed ? 'PASSED' : 'FAILED',
      metrics
    })

    // Return the execution results along with the submission ID
    res.status(200).json(
      success({
        submissionId: submission._id.toString(),
        status: submission.status,
        stdout,
        stderr,
        metrics: submission.metrics
      })
    )
  } catch (err) {
    console.error('Submit challenge error:', err)
    res.status(500).json(error('Failed to submit challenge', 'INTERNAL_ERROR'))
  }
}
