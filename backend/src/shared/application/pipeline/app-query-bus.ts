import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';
import { CQRS_MODULE_OPTIONS } from '@nestjs/cqrs/dist/constants';
import type { CqrsModuleOptions } from '@nestjs/cqrs';
import { validate } from 'class-validator';
import { AppLoggerService, type ContextualLogger } from '@shared/infrastructure/logging/app-logger.service';

@Injectable()
export class AppQueryBus extends QueryBus {
  private readonly logger: ContextualLogger;

  constructor(
    moduleRef: ModuleRef,
    @Optional()
    @Inject(CQRS_MODULE_OPTIONS)
    options: CqrsModuleOptions | undefined,
    appLogger: AppLoggerService,
  ) {
    super(moduleRef, options);
    this.logger = appLogger.forContext(AppQueryBus.name);
  }

  override async execute<T, R = any>(query: T): Promise<R> {
    await this.validateQuery(query);
    const queryName = this.resolveQueryName(query);
    this.logger.debug('Executing query', { queryName });
    try {
      const result = await super.execute(query as any);
      this.logger.debug('Query completed', { queryName });
      return result;
    } catch (error) {
      this.logger.error('Query failed', error as Error, { queryName });
      throw error;
    }
  }

  private async validateQuery(query: unknown): Promise<void> {
    if (!query || typeof query !== 'object') {
      return;
    }

    const errors = await validate(query as object, {
      whitelist: true,
      forbidUnknownValues: false,
      skipMissingProperties: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
  }

  private resolveQueryName(query: unknown): string {
    if (!query || typeof query !== 'object') {
      return 'UnknownQuery';
    }
    return query.constructor?.name ?? 'AnonymousQuery';
  }
}
