import { Injectable } from '@nestjs/common'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'
import { ScoringRepository } from '../scoring/ScoringRepository'
import { UsersService } from '../users/UsersService'

@Injectable()
export class ManagerService {
  constructor(
    private readonly scoringRepo: ScoringRepository,
    private readonly usersService: UsersService,
  ) {}

  async getRules() {
    const [scoringRules, levelConfigs, capConfigs] = await Promise.all([
      this.scoringRepo.findAllScoringRules(),
      this.scoringRepo.findAllLevelConfigs(),
      this.scoringRepo.findAllDailyCapConfigs(),
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

  getReps() {
    return this.usersService.listSalesRepSummaries()
  }
}
