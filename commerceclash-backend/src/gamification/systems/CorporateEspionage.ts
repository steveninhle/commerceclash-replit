import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { Rival } from '../utils/types/types';

export class CorporateEspionage extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(CorporateEspionage.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      // Fetch all rivals (other players in the class)
      const rivals: Rival[] = await this.prisma.enrolled_students.findMany({
        where: {
          class_id: ctx.classId,
          NOT: { student_id: ctx.student.id },
          is_cancelled: { not: true },
        },
        select: {
          is_cancelled: true,
          skill_unlocked: true,
          users: { select: { id: true, name: true } },
          archtypes: { select: { title: true, sub_title: true } },
          student_attributes: {
            select: {
              value: true,
              attributes: { select: { name: true } },
            },
          },
        },
      });

      // Check if all rivals have locked their skill trees (skill_unlocked = false)
      const rivalsWithUnlockedSkills = rivals.filter((rival) => rival.skill_unlocked === true);

      if (rivalsWithUnlockedSkills.length > 0) {
        const unlockedNames = rivalsWithUnlockedSkills
          .map((r) => r.users?.name || 'Unknown')
          .join(', ');
        throw new BadRequestException({
          success: false,
          message: `Corporate Espionage can only be activated after all other players have locked their skill trees. Players still unlocked: ${unlockedNames}`,
        });
      }

      // Build skill trees for each rival, including their CEO archetype
      const skillTrees = rivals.map((rival) => ({
        studentId: rival.users.id,
        name: rival.users?.name || 'Unknown',
        ceo: rival.archtypes
          ? { title: rival.archtypes.title, sub_title: rival.archtypes.sub_title }
          : null,
        skills: rival.student_attributes.map((attr) => ({
          attributeName: attr.attributes.name,
          value: attr.value,
        })),
      }));

      // Mark perk as used (one-time use - permanently expires)
      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        viewedRivalsSkillTree: skillTrees.length,
        skillTrees,
      });

      return {
        success: true,
        message:
          'Corporate Espionage activated — all player skill trees revealed. This access expires permanently after this viewing session.',
        data: { skillTrees },
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Corporate Espionage perk',
        error: message,
      });
    }
  }
}
