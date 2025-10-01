import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule, CommandBus, QueryBus } from '@nestjs/cqrs';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogModule } from './features/audit-log/audit-log.module';
import { AuthModule } from './features/auth/auth.module';
import { CourseModule } from './features/course/course.module';
import { TeacherModule } from './features/teacher/teacher.module';
import { UserModule } from './features/user/user.module';
import { AppCommandBus } from './shared/application/pipeline/app-command-bus';
import { AppQueryBus } from './shared/application/pipeline/app-query-bus';
import { LoggingModule } from './shared/infrastructure/logging/logging.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { HttpRequestLoggingInterceptor } from './shared/presentation/interceptors/http-request-logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../.env.local', '../.env'],
    }),
    CqrsModule.forRoot(),
    LoggingModule,
    PrismaModule,
    AuditLogModule,
    AuthModule,
    CourseModule,
    TeacherModule,
    UserModule,
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
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpRequestLoggingInterceptor,
    },
  ],
})
export class AppModule {}
