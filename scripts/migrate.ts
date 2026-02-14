import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  console.log('Running migrations...')

  const sql = neon(databaseUrl)
  const db = drizzle(sql)

  await migrate(db, { migrationsFolder: './drizzle' })

  console.log('Migrations complete.')
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
