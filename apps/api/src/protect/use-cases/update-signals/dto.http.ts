import { z } from 'zod';

const count = z.number().int().min(0);

/** Every signal of a draft report, sent on every change. */
export const HttpUpdateSignalsBodyDto = z.object({
  phishingClickRatePct: count.max(100),
  leakedPasswords: count,
  unhandledAlerts: count,
});
export type HttpUpdateSignalsBodyDto = z.infer<typeof HttpUpdateSignalsBodyDto>;
