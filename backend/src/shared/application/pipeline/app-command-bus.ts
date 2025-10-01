import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';
import { CQRS_MODULE_OPTIONS } from '@nestjs/cqrs/dist/constants';
import type { CqrsModuleOptions } from '@nestjs/cqrs';
import { validate } from 'class-validator';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { isTransactionalCommand } from './decorators/transactional-command.decorator';

@Injectable()
export class AppCommandBus extends CommandBus {
  private readonly appLogger = new Logger(AppCommandBus.name);

  constructor(
    moduleRef: ModuleRef,
    @Optional()
    @Inject(CQRS_MODULE_OPTIONS)
    options: CqrsModuleOptions | undefined,
    private readonly prisma: PrismaService,
  ) {
    super(moduleRef, options);
  }

  override async execute<T, R = any>(command: T): Promise<R> {
    await this.validateCommand(command);
    const commandName = this.resolveCommandName(command);
    const run = async () => {
      this.appLogger.debug(`Executing command ${commandName}`);
      try {
        const result = await super.execute(command as any);
        this.appLogger.debug(`Command ${commandName} completed`);
        return result;
      } catch (error) {
        this.appLogger.error(`Command ${commandName} failed`, error as Error);
        throw error;
      }
    };

    if (isTransactionalCommand(command as object)) {
      return this.prisma.runInTransaction(run);
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
