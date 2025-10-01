import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { UnitOfWork } from '@shared/application/uow/unit-of-work.interface';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  withTransaction<T>(work: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction((transaction) => work(transaction));
  }
}
