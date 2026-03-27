import express, { Application, Request, Response, NextFunction } from 'express'
import routes from './routes'
import { error } from './utils/jsend'

const app: Application = express()

// CORS middleware (manual — cors@2.8.x doesn't set Access-Control-Allow-Origin with Express 5)
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin
  res.setHeader('X-Debug-Origin', origin || 'none')
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,X-Requested-With,Accept'
  )
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  const { method, originalUrl } = req

  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m'
    const reset = '\x1b[0m'
    console.log(`${color}${method} ${originalUrl} ${status}${reset} ${duration}ms`)
  })

  next()
})

// Routes
app.use('/api', routes)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json(error('Route not found', 'NOT_FOUND'))
})

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json(error('Internal server error', 'INTERNAL_ERROR', err.message))
})

export default app
