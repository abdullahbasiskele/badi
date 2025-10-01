import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@features/auth/auth.module';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { PoliciesGuard } from '@shared/application/policies/guards/policies.guard';
import { TeacherController } from './presentation/http/teacher.controller';
import { CreateTeacherHandler } from './application/commands/create-teacher/create-teacher.handler';

@Module({
  imports: [CqrsModule, AuthModule, PrismaModule],
  controllers: [TeacherController],
  providers: [CreateTeacherHandler, PoliciesGuard],
})
export class TeacherModule {}
