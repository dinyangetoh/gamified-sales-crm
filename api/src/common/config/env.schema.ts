import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  WEBHOOK_SECRET_GENERIC: z.string().min(1, 'WEBHOOK_SECRET_GENERIC is required'),
  WEBHOOK_SECRET_HUBSPOT: z.string().optional(),
  WEBHOOK_SECRET_PIPEDRIVE: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  PORT: z.coerce.number().default(3001),
})

export type Env = z.infer<typeof envSchema>
