type Bucket = { count: number; resetAt: number }

const globalStore = globalThis as typeof globalThis & {
  __rl?: Map<string, Bucket>
}
const store = globalStore.__rl ?? new Map<string, Bucket>()
globalStore.__rl = store

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterMs: number
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 }
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: existing.resetAt - now }
  }

  existing.count += 1
  return { ok: true, remaining: limit - existing.count, retryAfterMs: 0 }
}