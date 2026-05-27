import { z } from 'zod'
import { EventType } from '@db'

const eventTypeValues = Object.values(EventType) as [string, ...string[]]

export const demoEventSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  eventType: z.enum(eventTypeValues),
  entityId: z.string().min(1),
  timestamp: z.string().datetime(),
  provider: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const demoWeekFileSchema = z.object({
  isoWeek: z.string().regex(/^\d{4}-W\d{2}$/),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  events: z.array(demoEventSchema),
})

export const demoManifestSchema = z.object({
  anchorDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().default('UTC'),
  currentWeekFile: z.string(),
  currentIsoWeek: z.string().regex(/^\d{4}-W\d{2}$/),
  weeks: z.array(
    z.object({
      file: z.string(),
      label: z.string().optional(),
      isoWeek: z.string().regex(/^\d{4}-W\d{2}$/),
      weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  ),
})

export type DemoEvent = z.infer<typeof demoEventSchema>
export type DemoWeekFile = z.infer<typeof demoWeekFileSchema>
export type DemoManifest = z.infer<typeof demoManifestSchema>
