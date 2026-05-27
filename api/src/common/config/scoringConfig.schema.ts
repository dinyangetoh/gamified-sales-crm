import { z } from 'zod'
import { EventType } from '@db'

const eventTypeValues = Object.values(EventType) as [string, ...string[]]

export const scoringConfigSchema = z.object({
  pointRules: z.record(z.enum(eventTypeValues), z.number()),
  dailyCaps: z.record(
    z.enum(eventTypeValues),
    z.object({ maxCount: z.number().int().positive(), isActive: z.boolean() }),
  ),
  levels: z.array(
    z.object({
      level: z.number().int().positive(),
      minXP: z.number().int().min(0),
      label: z.string().min(1),
    }),
  ),
})

export type ScoringConfig = z.infer<typeof scoringConfigSchema>
