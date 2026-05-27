import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient, EventType } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'
import { loadScoringConfig } from '../src/common/config/loadScoringConfig'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const PASSWORD_HASH = bcrypt.hashSync('Demo1234!', 10)

interface DemoUser {
  id: string
  email: string
  name: string
  role: 'MANAGER' | 'SALES_REP'
  crmExternalId?: string
}

interface DemoUsersFile {
  passwordHint: string
  users: DemoUser[]
}

function loadDemoUsers(): DemoUsersFile {
  const path = join(__dirname, '../../demo/users.json')
  return JSON.parse(readFileSync(path, 'utf-8')) as DemoUsersFile
}

async function main(): Promise<void> {
  console.log('Seeding base fixtures (users, CRM, scoring config)...')
  const demoUsers = loadDemoUsers()

  await prisma.$transaction(async (tx) => {
    const scoringConfig = loadScoringConfig(
      join(__dirname, '../src/common/config/scoring-config.json'),
    )

    for (const [eventType, points] of Object.entries(scoringConfig.pointRules)) {
      await tx.scoringRule.upsert({
        where: { eventType: eventType as EventType },
        create: { eventType: eventType as EventType, points },
        update: { points },
      })
    }

    for (const [eventType, cap] of Object.entries(scoringConfig.dailyCaps)) {
      await tx.dailyCapConfig.upsert({
        where: { eventType: eventType as EventType },
        create: { eventType: eventType as EventType, maxCount: cap.maxCount, isActive: cap.isActive },
        update: { maxCount: cap.maxCount, isActive: cap.isActive },
      })
    }

    for (const level of scoringConfig.levels) {
      await tx.levelConfig.upsert({
        where: { level: level.level },
        create: { level: level.level, minXP: level.minXP, label: level.label },
        update: { minXP: level.minXP, label: level.label },
      })
    }

    await tx.crmIntegration.upsert({
      where: { id: 'generic' },
      create: {
        id: 'generic',
        displayName: 'Generic Webhook',
        webhookSecret: 'demo-secret-change-in-production',
      },
      update: {},
    })

    for (const u of demoUsers.users) {
      await tx.user.upsert({
        where: { email: u.email },
        create: {
          id: u.id,
          email: u.email,
          passwordHash: PASSWORD_HASH,
          name: u.name,
          role: u.role,
        },
        update: { name: u.name, role: u.role },
      })

      if (u.crmExternalId) {
        await tx.crmUserMap.upsert({
          where: { provider_externalId: { provider: 'generic', externalId: u.crmExternalId } },
          create: { userId: u.id, provider: 'generic', externalId: u.crmExternalId },
          update: { userId: u.id },
        })
      }
    }
  })

  console.log('Base seed complete.')
  console.log(`\nDemo accounts (password: ${demoUsers.passwordHint}):`)
  for (const u of demoUsers.users) {
    console.log(`  ${u.email} — ${u.role}`)
  }
  console.log('\nLoad gamification demo data: npm run demo:seed:clean (from api/)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
