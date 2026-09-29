type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const entries = new Map<string, RateLimitEntry>();

function removeExpiredEntries(now: number) {
  if (entries.size < 500) {
    return;
  }

  for (const [key, entry] of entries) {
    if (entry.resetAt <= now) {
      entries.delete(key);
    }
  }
}

export function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existingEntry = entries.get(key);

  removeExpiredEntries(now);

  if (!existingEntry || existingEntry.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (existingEntry.count >= limit) {
    return true;
  }

  existingEntry.count += 1;
  return false;
}
