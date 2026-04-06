import mongoose, { Document, Schema } from 'mongoose'

export interface IGeneratedTestCase {
  input: string
  expectedOutput: string
  isHidden: boolean
}

export interface IStarterCodes {
  python?: string
  cpp?: string
  java?: string
  javascript?: string
  typescript?: string
  go?: string
  rust?: string
}

export interface IGeneratedChallenge extends Document {
  generatedLessonId: mongoose.Types.ObjectId
  title: string
  starterCodes: IStarterCodes
  solutionCodes: IStarterCodes
  testCases: IGeneratedTestCase[]
}

const GeneratedChallengeSchema = new Schema<IGeneratedChallenge>({
  generatedLessonId: {
    type: Schema.Types.ObjectId,
    ref: 'GeneratedLesson',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  starterCodes: {
    type: {
      python: { type: String },
      cpp: { type: String },
      java: { type: String },
      javascript: { type: String },
      typescript: { type: String },
      go: { type: String },
      rust: { type: String }
    },
    required: true
  },
  solutionCodes: {
    type: {
      python: { type: String },
      cpp: { type: String },
      java: { type: String },
      javascript: { type: String },
      typescript: { type: String },
      go: { type: String },
      rust: { type: String }
    },
    required: true
  },
  testCases: {
    type: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
        isHidden: { type: Boolean, required: true, default: false }
      }
    ],
    default: []
  }
})

GeneratedChallengeSchema.index({ generatedLessonId: 1 })

export const GeneratedChallenge = mongoose.model<IGeneratedChallenge>(
  'GeneratedChallenge',
  GeneratedChallengeSchema
)
