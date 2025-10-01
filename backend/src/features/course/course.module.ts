import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@features/auth/auth.module';
import { courseQueryHandlers } from './application/queries';
import { CourseRepository } from './infrastructure/repositories/course.repository';
import { CourseController } from './presentation/http/course.controller';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { PoliciesGuard } from '@shared/application/policies/guards/policies.guard';

@Module({
  imports: [CqrsModule, AuthModule, PrismaModule],
  controllers: [CourseController],
  providers: [...courseQueryHandlers, CourseRepository, PoliciesGuard],
})
export class CourseModule {}
