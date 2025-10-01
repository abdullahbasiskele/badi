import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { UserRepository } from './infrastructure/repositories';

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class UserModule {}
