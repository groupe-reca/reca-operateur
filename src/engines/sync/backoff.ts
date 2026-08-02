import type { RetryPolicy } from './types';

// docs/07 "Réessais" — attempt 1 is immediate, then 5s/15s/30s/60s, then a
// growing plateau (the last configured value repeats, capped). Small random
// jitter avoids many devices retrying in perfect lockstep.
export function computeBackoffDelaySeconds(attemptNumber: number, policy: RetryPolicy): number {
  const table = policy.backoffSecondsByAttempt;
  const index = Math.min(Math.max(attemptNumber, 1), table.length) - 1;
  const base = table[index] ?? 0;
  const jitterSpan = base * policy.jitterRatio;
  const jitterOffset = (policy.jitter() * 2 - 1) * jitterSpan; // roughly [-jitterSpan, +jitterSpan)
  return Math.max(0, base + jitterOffset);
}
