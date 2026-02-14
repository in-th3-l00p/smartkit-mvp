import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis()
  if (!r) return null
  try {
    return (await r.get(key)) as T | null
  } catch {
    return null
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.set(key, JSON.stringify(value), { ex: ttlSeconds })
  } catch {
    // Cache failures are non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.del(key)
  } catch {
    // Cache failures are non-fatal
  }
}

// Predefined TTLs
export const TTL = {
  WALLET_DETAILS: 60,
  TX_STATUS: 10,
  DASHBOARD_STATS: 30,
  API_KEY_VALIDATION: 300,
} as const
