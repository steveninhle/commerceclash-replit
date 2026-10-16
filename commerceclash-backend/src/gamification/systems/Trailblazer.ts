import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { ClassGateway } from 'src/class/class.gateway';

/**
 * Scenario Card interface
 */
export interface ScenarioCard {
  id: string;
  title: string;
  description: string;
  category: 'market' | 'crisis' | 'opportunity' | 'challenge';
}

/**
 * Predefined scenario cards pool
 * These can be moved to database in the future
 */
const SCENARIO_CARDS: ScenarioCard[] = [
  {
    id: 'scenario_market_takeover',
    title: 'Market Takeover',
    description:
      'Compete to capture the largest market share. The player with the highest market share at the end gains +3 XP.',
    category: 'market',
  },
  {
    id: 'scenario_brand_crisis',
    title: 'Brand Crisis',
    description:
      'A PR disaster strikes! All players must defend their brand. Lowest skill total in Marketing loses 1 Market Share.',
    category: 'crisis',
  },
  {
    id: 'scenario_innovation_race',
    title: 'Innovation Race',
    description:
      'First to demonstrate innovation wins! Highest Innovation skill gains +2 XP and +1 Market Share.',
    category: 'opportunity',
  },
  {
    id: 'scenario_supply_chain_disruption',
    title: 'Supply Chain Disruption',
    description:
      'Global logistics crisis! Player with highest Logistics skill helps others - gains +2 XP. Lowest loses 1 Market Share.',
    category: 'crisis',
  },
  {
    id: 'scenario_talent_war',
    title: 'Talent War',
    description:
      'Compete for top talent! Player with highest Team skill can steal 1 skill point from any opponent.',
    category: 'challenge',
  },
  {
    id: 'scenario_quality_audit',
    title: 'Quality Audit',
    description:
      'Regulators are checking quality! Player with highest Quality skill gains +2 XP. Lowest faces -1 Market Share.',
    category: 'challenge',
  },
  {
    id: 'scenario_viral_campaign',
    title: 'Viral Campaign',
    description:
      'Social media opportunity! Player with best Marketing pitch (teacher judged) gains +3 XP.',
    category: 'opportunity',
  },
  {
    id: 'scenario_hostile_acquisition',
    title: 'Hostile Acquisition',
    description:
      'Corporate raiders are circling! Players must defend or attack. Winner gains +2 Market Share.',
    category: 'market',
  },
  {
    id: 'scenario_sustainability_challenge',
    title: 'Sustainability Challenge',
    description:
      'Go green or go home! Best sustainability pitch gains +2 XP and public favor (+1 Market Share).',
    category: 'opportunity',
  },
  {
    id: 'scenario_economic_downturn',
    title: 'Economic Downturn',
    description:
      'Recession hits! All players lose 1 Market Share except the one with highest combined skills.',
    category: 'crisis',
  },
];

/**
 * Trailblazer Perk (Explorer - Ultra)
 *
 * Effect: Every class, you get 2 challenge cards and YOU choose which one the class plays.
 *
 * Implementation:
 * - System auto-draws 2 random scenario cards
 * - Student sees both options and must pick exactly 1
 * - The chosen scenario becomes the official class scenario
 * - NO teacher approval is needed
 */
export class Trailblazer extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(Trailblazer.name);

  constructor(
    _classGateway: ClassGateway, // Kept for interface compatibility with PerkEngine
    prisma: PrismaService,
  ) {
    super(prisma);
  }

  /**
   * Draw 2 random scenario cards from the pool
   */
  private drawScenarioCards(): ScenarioCard[] {
    const shuffled = [...SCENARIO_CARDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      // Draw 2 random scenario cards
      const drawnCards = this.drawScenarioCards();

      this.logger.log(
        `Trailblazer: Drew 2 scenario cards for student ${ctx.student.name}: ${drawnCards.map((c) => c.title).join(', ')}`,
      );

      // Don't mark as used yet - wait until student selects a scenario
      // The perk will be marked as used when the scenario is selected

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        action: 'Scenario cards drawn',
        drawnCards: drawnCards.map((c) => c.title),
      });

      // Return the scenario cards to the student for selection
      // The frontend will show a modal for the student to choose
      return {
        success: true,
        message: 'Trailblazer activated! Choose one scenario card for the class to play.',
        data: {
          requiresSelection: true,
          pendingCompletion: true,
          scenarioCards: drawnCards,
          studentId: ctx.student.id,
          studentName: ctx.student.name,
          classId: ctx.classId,
          perkId: ctx.perk.id,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Trailblazer perk',
        error: message,
      });
    }
  }
}
