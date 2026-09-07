// In-memory sliding-window rate limiter.
//
// This is intentionally simple and dependency-free so signup/login are
// protected out of the box. It is scoped to a single server process:
// on a multi-instance deployment (e.g. several Vercel/serverless
// instances or a load-balanced cluster) each instance keeps its own
// counters, so the effective limit is (perInstanceLimit * instanceCount)
// rather than a hard global cap. If you deploy behind multiple
// instances and need a strict shared limit, swap this for a Redis-backed
// limiter (e.g. Upstash's ratelimit package) using the same interface.

const attempts = new Map();

function cleanup(now) {
  for (const [key, entry] of attempts) {
    if (now - entry.windowStart > entry.windowMs) {
      attempts.delete(key);
    }
  }
}

/**
 * @param {string} key - unique key for the thing being limited (e.g. `login:<ip>`)
 * @param {number} limit - max attempts allowed within the window
 * @param {number} windowMs - window size in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
export function checkRateLimit(key, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  if (attempts.size > 5000) cleanup(now);

  const entry = attempts.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    attempts.set(key, { windowStart: now, windowMs, count: 1 });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - entry.windowStart),
    };
  }

  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
