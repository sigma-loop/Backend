import mongoose, { Document, Schema } from 'mongoose'

export enum ChatScope {
  GENERAL = 'GENERAL',
  LESSON = 'LESSON',
  COURSE = 'COURSE'
}

export interface IChatThread extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  scope: ChatScope
  scopeId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ChatThreadSchema = new Schema<IChatThread>(
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
    scope: {
      type: String,
      enum: Object.values(ChatScope),
      default: ChatScope.GENERAL
    },
    scopeId: {
      type: Schema.Types.ObjectId,
      default: null
    }
  },
  {
    timestamps: true
  }
)

ChatThreadSchema.index({ userId: 1, scope: 1, scopeId: 1 })

export const ChatThread = mongoose.model<IChatThread>('ChatThread', ChatThreadSchema)
