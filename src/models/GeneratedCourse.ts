import mongoose, { Document, Schema } from 'mongoose'

export interface IGeneratedCourse extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  tags: string[]
  generatedAt: Date
}

const GeneratedCourseSchema = new Schema<IGeneratedCourse>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER'
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: { createdAt: 'generatedAt', updatedAt: false }
  }
)

GeneratedCourseSchema.index({ userId: 1 })

export const GeneratedCourse = mongoose.model<IGeneratedCourse>(
  'GeneratedCourse',
  GeneratedCourseSchema
)
