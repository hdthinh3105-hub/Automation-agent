const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses simple duration strings ("15m", "7d", "30s") into milliseconds.
 * Used to compute refresh-token expiry from the JWT_REFRESH_EXPIRES_IN
 * env var without pulling in a full date-math library for Phase 1.
 */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration string: "${duration}" (expected e.g. "15m", "7d")`);
  }
  const [, amountStr, unit] = match;
  return parseInt(amountStr, 10) * UNIT_TO_MS[unit];
}
