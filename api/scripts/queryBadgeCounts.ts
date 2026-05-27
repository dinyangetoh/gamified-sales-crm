import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/AppModule'
import { PrismaService } from '../src/common/prisma/PrismaService'

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const prisma = app.get(PrismaService)

  const awards = await prisma.badgeAward.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ userId: 'asc' }, { badgeType: 'asc' }, { awardedAt: 'asc' }],
  })

  const counts = new Map<string, number>()
  for (const a of awards) {
    const k = `${a.userId}|${a.badgeType}`
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  console.log(`Total badge award rows: ${awards.length}`)
  const multi = [...counts.entries()].filter(([, c]) => c > 1)
  console.log(`User+badge pairs with count > 1: ${multi.length}`)

  if (multi.length === 0) {
    console.log('\nNo multi-awards in DB. Each earned badge is 1x only.')
    console.log('\nSample earned badges per rep:')
    const byUser = new Map<string, typeof awards>()
    for (const a of awards) {
      const list = byUser.get(a.userId) ?? []
      list.push(a)
      byUser.set(a.userId, list)
    }
    for (const [, list] of byUser) {
      const name = list[0]?.user.name
      const types = [...new Set(list.map((a) => a.badgeType))]
      console.log(`  ${name}: ${types.join(', ')} (${list.length} total rows)`)
    }
  } else {
    for (const [k, c] of multi.sort((a, b) => b[1] - a[1])) {
      const [uid, bt] = k.split('|')
      const u = awards.find((a) => a.userId === uid)?.user
      console.log(`  ${u?.name} (${u?.email}): ${bt} × ${c}`)
    }
  }

  await app.close()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
