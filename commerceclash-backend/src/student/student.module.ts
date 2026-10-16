import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { PrismaModule } from '@utils/prisma/prisma.module';
import { SkillsModule } from 'src/skills/skills.module';
import { ClassModule } from 'src/class/class.module';
import { ReusableService } from '@utils/common/classes/reusable';
import { UsersModule } from 'src/user/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { CohortModule } from 'src/cohort/cohort.module';

@Module({
  imports: [PrismaModule, SkillsModule, ClassModule, UsersModule, AuthModule, CohortModule],
  controllers: [StudentController],
  providers: [StudentService, ReusableService],
})
export class StudentModule {}
