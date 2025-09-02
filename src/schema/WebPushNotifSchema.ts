import z from 'zod'

const base64Url = z
  .string()
  .min(1, 'wajib diisi')
//   .regex(/^[A-Za-z0-9\-_]+$/, 'harus base64url valid (A–Z a–z 0–9 - _)')

export const PushKeysSchema = z.object({
  p256dh: base64Url.describe('public key p256dh'),
  auth: base64Url.describe('auth secret'),
})

export const WebPushSubscriptionSchema = z.object({
  endpoint: z.string().url('endpoint harus URL valid').max(2048),
  keys: PushKeysSchema,
  // Browser biasanya kirim epoch ms (number) atau null; biarkan optional juga.
  expirationTime: z.union([z.number().int().nonnegative(), z.null()]).optional(),
  userAgent: z.string().max(512).optional(),
})
