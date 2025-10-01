import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule, CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthModule } from './features/auth/auth.module';
import { CourseModule } from './features/course/course.module';
import { TeacherModule } from './features/teacher/teacher.module';
import { AppCommandBus } from './shared/application/pipeline/app-command-bus';
import { AppQueryBus } from './shared/application/pipeline/app-query-bus';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../.env.local', '../.env'],
    }),
    CqrsModule.forRoot(),
    AuthModule,
    CourseModule,
    TeacherModule,
    PrismaModule,
  ],
  providers: [
    {
      provide: CommandBus,
      useClass: AppCommandBus,
    },
    {
      provide: QueryBus,
      useClass: AppQueryBus,
    },
  ],
})
export class AppModule {}
