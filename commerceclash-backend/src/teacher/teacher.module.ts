import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { PrismaModule } from '@utils/prisma/prisma.module';
import { SkillsModule } from 'src/skills/skills.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, SkillsModule, AuthModule],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
