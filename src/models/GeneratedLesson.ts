import mongoose, { Document, Schema } from 'mongoose'

export interface IGeneratedLesson extends Document {
  userId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  isGeneratedCourse: boolean
  title: string
  contentMarkdown: string
  orderIndex: number
  generatedAt: Date
}

const GeneratedLessonSchema = new Schema<IGeneratedLesson>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    courseId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    isGeneratedCourse: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    contentMarkdown: {
      type: String,
      required: true
    },
    orderIndex: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: { createdAt: 'generatedAt', updatedAt: false }
  }
)

GeneratedLessonSchema.index({ userId: 1, courseId: 1 })

export const GeneratedLesson = mongoose.model<IGeneratedLesson>(
  'GeneratedLesson',
  GeneratedLessonSchema
)
