import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { AppConfigModule } from '@utils/config/config.module';
import { PrismaModule } from '@utils/prisma/prisma.module';
import { SkillsModule } from 'src/skills/skills.module';
import { ClassGateway } from './class.gateway';
import { ReusableService } from '@utils/common/classes/reusable';
import { PrototypePerkAccess } from './prototype-perk-access';
import { SupabaseModule } from '@utils/supabase/supabase.module';

@Module({
  imports: [AppConfigModule, PrismaModule, SkillsModule, SupabaseModule],
  controllers: [ClassController],
  providers: [ClassGateway, ClassService, ReusableService, PrototypePerkAccess],
  exports: [ClassGateway],
})
export class ClassModule {}
