import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let _db: NeonHttpDatabase<typeof schema> | null = null

function createDb(): NeonHttpDatabase<typeof schema> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Please configure it in your .env file.\n' +
        'See .env.example for the required format.'
    )
  }
  const sql = neon(process.env.DATABASE_URL)
  return drizzle(sql, { schema })
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    if (!_db) {
      _db = createDb()
    }
    return Reflect.get(_db, prop, receiver)
  },
})
