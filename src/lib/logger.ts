import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: { service: 'smartkit' },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId })
}
