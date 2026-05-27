import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@db'
import { PrismaService } from '../../common/prisma/PrismaService'
import { Roles } from '../../common/decorators/roles'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'

@ApiTags('manager')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('manager')
export class ManagerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('rules')
  @ApiOperation({ summary: 'View current scoring rules, caps, levels and badge definitions' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  async getRules() {
    const [scoringRules, levelConfigs, capConfigs] = await Promise.all([
      this.prisma.scoringRule.findMany({ orderBy: { eventType: 'asc' } }),
      this.prisma.levelConfig.findMany({ orderBy: { level: 'asc' } }),
      this.prisma.dailyCapConfig.findMany({ orderBy: { eventType: 'asc' } }),
    ])

    return {
      scoringRules: scoringRules.map((r) => ({
        eventType: r.eventType,
        points: r.points,
        isActive: r.isActive,
        updatedAt: r.updatedAt,
      })),
      dailyCapRules: capConfigs.map((c) => ({
        eventType: c.eventType,
        maxCount: c.maxCount,
        isActive: c.isActive,
        updatedAt: c.updatedAt,
      })),
      levelConfig: levelConfigs.map((l) => ({
        level: l.level,
        minXP: l.minXP,
        label: l.label,
      })),
      badges: BADGE_DEFINITIONS.map((d) => ({
        type: d.type,
        displayName: d.displayName,
        description: d.description,
        iconUrl: d.iconUrl,
        targetCount: d.targetCount,
        windowType: d.windowType,
      })),
    }
  }

  @Get('reps')
  @ApiOperation({ summary: 'List all sales rep summaries' })
  @ApiResponse({ status: 200 })
  async getReps() {
    const users = await this.prisma.user.findMany({
      where: { role: Role.SALES_REP },
      include: { stats: true, badgeAwards: true },
      orderBy: { name: 'asc' },
    })

    return users.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      totalXP: u.stats?.totalXP ?? 0,
      level: u.stats?.level ?? 1,
      currentStreak: u.stats?.currentStreak ?? 0,
      longestStreak: u.stats?.longestStreak ?? 0,
      badgeCount: u.badgeAwards.length,
    }))
  }
}
