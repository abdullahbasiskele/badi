import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';
import { CQRS_MODULE_OPTIONS } from '@nestjs/cqrs/dist/constants';
import type { CqrsModuleOptions } from '@nestjs/cqrs';
import { validate } from 'class-validator';

@Injectable()
export class AppQueryBus extends QueryBus {
  private readonly appLogger = new Logger(AppQueryBus.name);

  constructor(
    moduleRef: ModuleRef,
    @Optional()
    @Inject(CQRS_MODULE_OPTIONS)
    options: CqrsModuleOptions | undefined,
  ) {
    super(moduleRef, options);
  }

  override async execute<T, R = any>(query: T): Promise<R> {
    await this.validateQuery(query);
    const queryName = this.resolveQueryName(query);
    this.appLogger.debug(`Executing query ${queryName}`);
    try {
      const result = await super.execute(query as any);
      this.appLogger.debug(`Query ${queryName} completed`);
      return result;
    } catch (error) {
      this.appLogger.error(`Query ${queryName} failed`, error as Error);
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
