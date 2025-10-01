import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';
import { CQRS_MODULE_OPTIONS } from '@nestjs/cqrs/dist/constants';
import type { CqrsModuleOptions } from '@nestjs/cqrs';
import { validate } from 'class-validator';
import { AppLoggerService, type ContextualLogger } from '@shared/infrastructure/logging/app-logger.service';
import { PrismaUnitOfWork } from '@shared/infrastructure/prisma/prisma-unit-of-work';
import { isTransactionalCommand } from './decorators/transactional-command.decorator';

@Injectable()
export class AppCommandBus extends CommandBus {
  private readonly logger: ContextualLogger;

  constructor(
    moduleRef: ModuleRef,
    @Optional()
    @Inject(CQRS_MODULE_OPTIONS)
    options: CqrsModuleOptions | undefined,
    private readonly unitOfWork: PrismaUnitOfWork,
    appLogger: AppLoggerService,
  ) {
    super(moduleRef, options);
    this.logger = appLogger.forContext(AppCommandBus.name);
  }

  override async execute<T, R = any>(command: T): Promise<R> {
    await this.validateCommand(command);
    const commandName = this.resolveCommandName(command);
    const run = async () => {
      this.logger.debug('Executing command', { commandName });
      try {
        const result = await super.execute(command as any);
        this.logger.debug('Command completed', { commandName });
        return result;
      } catch (error) {
        this.logger.error('Command failed', error as Error, { commandName });
        throw error;
      }
    };

    if (isTransactionalCommand(command as object)) {
      return this.unitOfWork.withTransaction(async (_tx) => run());
    }

    return run();
  }

  private async validateCommand(command: unknown): Promise<void> {
    if (!command || typeof command !== 'object') {
      return;
    }

    const errors = await validate(command as object, {
      whitelist: true,
      forbidUnknownValues: false,
      skipMissingProperties: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
  }

  private resolveCommandName(command: unknown): string {
    if (!command || typeof command !== 'object') {
      return 'UnknownCommand';
    }
    return command.constructor?.name ?? 'AnonymousCommand';
  }
}
