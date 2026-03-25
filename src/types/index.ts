import { Document, Types } from 'mongoose'

// ──────────────────────────────────────────
// User
// ──────────────────────────────────────────

export interface IProfileData {
  name?: string
  avatar?: string
  bio?: string
}

export interface IUserStats {
  streakDays: number
  totalXp: number
  lessonsCompleted: number
}

export interface IUser extends Document {
  email: string
  passwordHash: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  profileData: IProfileData
  stats: IUserStats
  createdAt: Date
  updatedAt: Date
}

// ──────────────────────────────────────────
// Course
// ──────────────────────────────────────────

export interface ICourse extends Document {
  title: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  tags: string[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

// ──────────────────────────────────────────
// Lesson
// ──────────────────────────────────────────

export interface ILesson extends Document {
  courseId: Types.ObjectId
  title: string
  orderIndex: number
  contentMarkdown: string
  type: 'LESSON' | 'CHALLENGE'
  challengeIds: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

// ──────────────────────────────────────────
// Challenge
// ──────────────────────────────────────────

export interface ITestCase {
  input: string
  expectedOutput: string
  isHidden: boolean
}

export interface IChallenge extends Document {
  lessonId: Types.ObjectId
  title: string
  description?: string
  starterCodes: Map<string, string>
  solutionCodes: Map<string, string>
  testCases: ITestCase[]
}

// ──────────────────────────────────────────
// Enrollment
// ──────────────────────────────────────────

export interface IEnrollment extends Document {
  userId: Types.ObjectId
  courseId: Types.ObjectId
  enrolledAt: Date
  lastAccessedAt: Date
}

// ──────────────────────────────────────────
// Lesson Progress
// ──────────────────────────────────────────

export interface ILessonProgress extends Document {
  userId: Types.ObjectId
  lessonId: Types.ObjectId
  isCompleted: boolean
  completedAt?: Date
}

// ──────────────────────────────────────────
// Submission
// ──────────────────────────────────────────

export type SubmissionStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED'

export interface ISubmission extends Document {
  userId: Types.ObjectId
  challengeId: Types.ObjectId
  userCode: string
  language: string
  outputLog: string
  status: SubmissionStatus
  metrics: {
    runtime?: string
    memoryUsed?: string
  }
  createdAt: Date
}

// ──────────────────────────────────────────
// Chat
// ──────────────────────────────────────────

export interface IChatThread extends Document {
  userId: Types.ObjectId
  title: string
  createdAt: Date
  updatedAt: Date
}

export type ChatMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'

export interface IChatMessage extends Document {
  threadId: Types.ObjectId
  role: ChatMessageRole
  content: string
  createdAt: Date
}

// ──────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
