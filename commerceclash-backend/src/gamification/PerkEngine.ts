import { BadRequestException } from '@nestjs/common';
import { isNewPerkKey, requiredPerkLevel } from './utils/reactivePerkKeys';
import { PrismaService } from '@utils/prisma/prisma.service';
import { CorporateEspionage } from './systems/CorporateEspionage';
import { Sabotage } from './systems/Sabotage';
import { Wipeout } from './systems/Wipeout';
import { IPerkEffect, IPerkEffectContext } from './core/interfaces/IPerkEffect';
import { MomentOfGlory } from './systems/MomentOfGlory';
import { ClassGateway } from 'src/class/class.gateway';
import { CorporateEmpire } from './systems/CorporateEmpire';
import { Trendsetter } from './systems/Trensetter';
import { ReveredIcon } from './systems/ReveredIcon';
import { CompoundingGains } from './systems/CompoundingGains';
import { StrategicRebith } from './systems/StrategicRebirth';
import { RallyingCry } from './systems/RallyingCry';
import { GenericPerk } from './systems/GenericPerk';
import { DoubleDown } from './systems/DoubleDown';
import { Trailblazer } from './systems/Trailblazer';
import { DangerZone } from './systems/DangerZone';
import { Spotlight } from './systems/Spotlight';
import { StarPower } from './systems/StarPower';
import { Prophecy } from './systems/Prophecy';
import { CrystalBall } from './systems/CrystalBall';
import { Blueprint } from './systems/Blueprint';
import { Masterpiece } from './systems/Masterpiece';
import { Rebirth } from './systems/Rebirth';
import { FanTheFlames } from './systems/FanTheFlames';
import { Afterburner } from './systems/Afterburner';
import { InsiderTrading } from './systems/InsiderTrading';
import { Extortion } from './systems/Extortion';
import { Logger } from '@nestjs/common';

type PerkFactory = (
  deps: { prisma: PrismaService; classGateway?: ClassGateway },
  key?: string,
) => IPerkEffect;

export class PerkEngine {
  private static logger = new Logger(PerkEngine.name);

  private static registry: Record<string, PerkFactory> = {
    // Corporate/Business perks
    corporate_empire: ({ prisma }) => new CorporateEmpire(prisma),
    corporate_espionage: ({ prisma }) => new CorporateEspionage(prisma),

    // Sabotage perk - multiple key variations for database compatibility
    sabotage: ({ prisma }) => new Sabotage(prisma),
    diplomat_sabotage: ({ prisma }) => new Sabotage(prisma),
    core_sabotage: ({ prisma }) => new Sabotage(prisma),

    // Combat/Attack perks
    wipeout: ({ prisma }) => new Wipeout(prisma),
    double_down: ({ classGateway, prisma }) => {
      if (!classGateway) throw new Error('DoubleDown requires ClassGateway');
      return new DoubleDown(classGateway, prisma);
    },
    revered_icon: ({ classGateway, prisma }) => {
      if (!classGateway) throw new Error('ReveredIcon requires ClassGateway');
      return new ReveredIcon(classGateway, prisma);
    },
    fan_the_flames: ({ classGateway, prisma }) => {
      if (!classGateway) throw new Error('FanTheFlames requires ClassGateway');
      return new FanTheFlames(classGateway, prisma);
    },
    compounding_gains: ({ prisma }) => new CompoundingGains(prisma),
    strategic_rebirth: ({ prisma }) => new StrategicRebith(prisma),
    rallying_cry: ({ prisma }) => new RallyingCry(prisma),
    moment_of_glory: ({ classGateway, prisma }) => {
      if (!classGateway) throw new Error('MomentOfGlory requires ClassGateway');
      return new MomentOfGlory(classGateway, prisma);
    },
    trendsetter: ({ classGateway, prisma }) => {
      if (!classGateway) throw new Error('Trendsetter requires ClassGateway');
      return new Trendsetter(classGateway, prisma);
    },
    trailblazer: ({ classGateway, prisma }) => {
      if (!classGateway) throw new Error('Trailblazer requires ClassGateway');
      return new Trailblazer(classGateway, prisma);
    },
    danger_zone: ({ classGateway, prisma }) => {
      if (!classGateway) throw new Error('DangerZone requires ClassGateway');
      return new DangerZone(classGateway, prisma);
    },
    spotlight: ({ prisma }) => new Spotlight(prisma),
    star_power: ({ classGateway, prisma }) => {
      if (!classGateway) throw new Error('StarPower requires ClassGateway');
      return new StarPower(classGateway, prisma);
    },
    prophecy: ({ prisma }) => new Prophecy(prisma),
    crystal_ball: ({ prisma }) => new CrystalBall(prisma),
    blueprint: ({ prisma }) => new Blueprint(prisma),
    masterpiece: ({ prisma }) => new Masterpiece(prisma),
    rebirth: ({ prisma }) => new Rebirth(prisma),
    afterburner: ({ prisma }) => new Afterburner(prisma),
    insider_trading: ({ prisma }) => new InsiderTrading(prisma),
    extortion: ({ prisma }) => new Extortion(prisma),
  };

  static async execute(
    key: string,
    context: IPerkEffectContext,
    deps: { prisma: PrismaService; classGateway?: ClassGateway },
  ) {
    // Normalize the key: lowercase and replace spaces/hyphens with underscores
    const normalizedKey = key.toLowerCase().replace(/[\s-]/g, '_');

    this.logger.log(`[PerkEngine.execute] Received key: "${key}"`);
    this.logger.log(`[PerkEngine.execute] Normalized key: "${normalizedKey}"`);
    this.logger.log(
      `[PerkEngine.execute] Registry keys: [${Object.keys(this.registry).join(', ')}]`,
    );

    // Try to find the factory with the normalized key
    let matchedKey = normalizedKey;
    let factory = this.registry[normalizedKey];

    // If not found, try the original key as-is
    if (!factory) {
      this.logger.log(`[PerkEngine.execute] Normalized key not found, trying original key`);
      factory = this.registry[key];
      matchedKey = key;
    }

    // If still not found, try to find a partial match (e.g., "diplomat_sabotage" should match "sabotage")
    if (!factory) {
      this.logger.log(`[PerkEngine.execute] Trying partial match...`);
      const registryKeys = Object.keys(this.registry);
      for (const registryKey of registryKeys) {
        if (normalizedKey.includes(registryKey) || registryKey.includes(normalizedKey)) {
          this.logger.log(
            `[PerkEngine.execute] Found partial match: "${registryKey}" for "${normalizedKey}"`,
          );
          matchedKey = registryKey;
          factory = this.registry[registryKey];
          break;
        }
      }
    }

    if (!factory) {
      // Use GenericPerk as fallback for unregistered perk keys
      this.logger.error(
        `[PerkEngine.execute] FALLBACK TO GENERIC PERK! ` +
          `Key "${key}" (normalized: "${normalizedKey}") not found in registry. ` +
          `Registered keys: [${Object.keys(this.registry).join(', ')}]`,
      );
      const genericPerk = new GenericPerk(deps.prisma, key);
      return genericPerk.apply(context);
    }

    if (isNewPerkKey(matchedKey)) {
      const sp = await deps.prisma.student_perks.findUnique({
        where: { id: context.perk.id },
        include: { perks: { include: { perk_types: true } }, enrolled_students: true },
      });
      if (
        !sp ||
        sp.perks.key !== matchedKey ||
        !sp.is_unlocked ||
        !sp.is_approved ||
        sp.enrollment_id !== context.student.enrollmentId ||
        sp.enrolled_students.student_id !== context.student.id ||
        sp.enrolled_students.class_id !== context.classId ||
        sp.enrolled_students.is_cancelled ||
        sp.enrolled_students.archtype_id !== sp.perks.archtype_id ||
        (sp.enrolled_students.level ?? 1) < requiredPerkLevel(sp.perks.perk_types.type) ||
        (sp.is_used &&
          (!sp.perks.is_repeatable || !sp.next_available_at || sp.next_available_at > new Date()))
      ) {
        throw new BadRequestException('An unlocked, teacher-approved perk is required.');
      }
    }

    this.logger.log(`[PerkEngine.execute] Found matching perk, executing`);
    const perk = factory(deps, key);
    return perk.apply(context);
  }
}
