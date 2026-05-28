import { Injectable } from '@nestjs/common'
import { EventType } from '@db'
import { getEventTypeDisplayName, listEventTypeOptions } from '../../common/labels/eventTypeLabels'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'
import { ScoringConfigService } from '../scoring/ScoringConfigService'
import { EventTypeOptionDto } from './dto/EventTypeOptionDto'
import { LevelConfigDto } from './dto/LevelConfigDto'
import type { AdminRulesResponseDto } from '../admin/dto/AdminRulesResponseDto'

@Injectable()
export class ConfigService {
  constructor(private readonly scoringConfigService: ScoringConfigService) {}

  async getLevelConfigs(): Promise<LevelConfigDto[]> {
    const { levels } = await this.scoringConfigService.getConfig()
    return levels.map((c) => ({
      level: c.level,
      minXP: c.minXP,
      label: c.label,
    }))
  }

  getEventTypeOptions(): EventTypeOptionDto[] {
    return listEventTypeOptions().map((o) => ({
      value: o.value,
      displayName: o.displayName,
      shortName: o.shortName,
    }))
  }

  async getGamificationRules(): Promise<AdminRulesResponseDto> {
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
}
