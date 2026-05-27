import { Injectable } from '@nestjs/common'
import { EventType } from '@db'
import { getEventTypeDisplayName } from '../../common/labels/eventTypeLabels'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'
import { ScoringConfigService } from '../scoring/ScoringConfigService'
import { UsersService } from '../users/UsersService'

@Injectable()
export class ManagerService {
  constructor(
    private readonly scoringConfigService: ScoringConfigService,
    private readonly usersService: UsersService,
  ) {}

  async getRules() {
    const config = await this.scoringConfigService.getConfig()
    const updatedAt = new Date()

    return {
      scoringRules: (Object.keys(config.pointRules) as EventType[]).map((eventType) => ({
        eventType,
        eventTypeDisplayName: getEventTypeDisplayName(eventType),
        points: config.pointRules[eventType],
        isActive: true,
        updatedAt,
      })),
      dailyCapRules: (Object.keys(config.dailyCaps) as EventType[]).map((eventType) => ({
        eventType,
        eventTypeDisplayName: getEventTypeDisplayName(eventType),
        maxCount: config.dailyCaps[eventType].maxCount,
        isActive: config.dailyCaps[eventType].isActive,
        updatedAt,
      })),
      levelConfig: config.levels.map((l) => ({
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
