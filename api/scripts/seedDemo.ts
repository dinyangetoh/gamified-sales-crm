import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import Redis from 'ioredis'
import { EventType } from '@db'
import { AppModule } from '../src/AppModule'
import { ScoringService } from '../src/modules/scoring/ScoringService'
import { PrismaService } from '../src/common/prisma/PrismaService'
import { loadAllDemoEvents } from '../src/demo/loadDemoEvents'

const args = new Set(process.argv.slice(2))
const shouldClean = args.has('--clean')
const dryRun = args.has('--dry-run')

async function cleanGamificationData(prisma: PrismaService, redis: Redis): Promise<void> {
  await prisma.$transaction([
    prisma.awardTimeline.deleteMany(),
    prisma.badgeProgress.deleteMany(),
    prisma.badgeAward.deleteMany(),
    prisma.weeklyStat.deleteMany(),
    prisma.dailyCap.deleteMany(),
    prisma.event.deleteMany(),
    prisma.userStats.deleteMany(),
    prisma.notificationLog.deleteMany(),
  ])

  const patterns = ['dedup:*', 'leaderboard:*', 'scoring-config']
  for (const pattern of patterns) {
    let cursor = '0'
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200)
      cursor = next
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== '0')
  }

  console.log('Cleaned gamification tables and Redis caches (dedup, leaderboard, scoring-config).')
}

async function main(): Promise<void> {
  const events = loadAllDemoEvents()
  console.log(`Loaded ${events.length} demo events from demo/events/`)

  if (dryRun) {
    console.log('Dry run OK — all events validated.')
    return
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })

  try {
    const prisma = app.get(PrismaService)
    const scoringService = app.get(ScoringService)
    const redis = app.get<Redis>('REDIS_CLIENT')

    if (shouldClean) {
      await cleanGamificationData(prisma, redis)
    }

    let processed = 0
    let capped = 0
    let duplicates = 0
    let errors = 0

    for (const event of events) {
      try {
        const result = await scoringService.processEvent({
          eventId: event.eventId,
          userId: event.userId,
          eventType: event.eventType as EventType,
          entityId: event.entityId,
          timestamp: event.timestamp,
          provider: event.provider ?? 'generic',
          metadata: event.metadata,
        })

        if (result.duplicate) duplicates++
        else if (result.capReached) capped++
        else processed++
      } catch (err) {
        errors++
        console.error(`Failed ${event.eventId}:`, err)
      }
    }

    console.log('\nDemo seed complete.')
    console.log(`  Scored:     ${processed}`)
    console.log(`  Capped:     ${capped}`)
    console.log(`  Duplicate:  ${duplicates}`)
    console.log(`  Errors:     ${errors}`)

    if (errors > 0) process.exit(1)
  } finally {
    await app.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
