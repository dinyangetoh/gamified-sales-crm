import { Injectable, Logger } from '@nestjs/common'
import { EventType } from '@db'
import { getEventTypeDisplayName, listEventTypeOptions } from '../../common/labels/eventTypeLabels'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'
import { ScoringConfigService } from '../scoring/ScoringConfigService'
import { EventTypeOptionDto } from './dto/EventTypeOptionDto'
import { LevelConfigDto } from './dto/LevelConfigDto'
import type { AdminRulesResponseDto } from '../admin/dto/AdminRulesResponseDto'
import { handleServiceError } from '../../common/errors/ServiceErrorHandler'

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name)

  constructor(private readonly scoringConfigService: ScoringConfigService) {}

  async getLevelConfigs(): Promise<LevelConfigDto[]> {
    try {
      const { levels } = await this.scoringConfigService.getConfig()
      return levels.map((levelConfig) => ({
        level: levelConfig.level,
        minXP: levelConfig.minXP,
        label: levelConfig.label,
      }))
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: ConfigService.name,
        method: 'getLevelConfigs',
        operation: 'fetchScoringLevels',
        safeMessage: 'Unable to load level configuration right now.',
      })
    }
  }

  getEventTypeOptions(): EventTypeOptionDto[] {
    return listEventTypeOptions().map((eventTypeOption) => ({
      value: eventTypeOption.value,
      displayName: eventTypeOption.displayName,
      shortName: eventTypeOption.shortName,
    }))
  }

  async getGamificationRules(): Promise<AdminRulesResponseDto> {
    try {
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
        levelConfig: config.levels.map((levelConfig) => ({
          level: levelConfig.level,
          minXP: levelConfig.minXP,
          label: levelConfig.label,
        })),
        badges: BADGE_DEFINITIONS.map((badgeDefinition) => ({
          type: badgeDefinition.type,
          displayName: badgeDefinition.displayName,
          description: badgeDefinition.description,
          iconUrl: badgeDefinition.iconUrl,
          targetCount: badgeDefinition.targetCount,
          windowType: badgeDefinition.windowType,
        })),
      }
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: ConfigService.name,
        method: 'getGamificationRules',
        operation: 'buildGamificationRules',
        safeMessage: 'Unable to load gamification rules right now.',
      })
    }
  }
}
