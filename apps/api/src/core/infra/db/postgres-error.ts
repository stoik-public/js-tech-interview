/** The Postgres error codes the adapters turn into domain errors. */
export const PostgresErrorCode = {
  UniqueViolation: '23505',
  SerializationFailure: '40001',
  DeadlockDetected: '40P01',
} as const;

type PostgresErrorCode = (typeof PostgresErrorCode)[keyof typeof PostgresErrorCode];

/**
 * True when the database refused the query with one of these codes. Drizzle wraps the driver's
 * error in its own, so the code is looked for along the causes.
 */
export function isPostgresError(error: unknown, ...codes: PostgresErrorCode[]): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ('code' in current && codes.includes(current.code as PostgresErrorCode)) return true;
  }
  return false;
}
