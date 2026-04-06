import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || ''
  },
  jwt: {
    secret: (() => {
      if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required in production')
      }
      return process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    })(),
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.AI_MODEL || 'gemini-2.5-flash',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '65536', 10)
  }
}

export default config
