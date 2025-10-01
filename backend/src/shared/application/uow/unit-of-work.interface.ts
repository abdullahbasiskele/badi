import type { Prisma } from '@prisma/client';

export interface UnitOfWork {
  withTransaction<T>(work: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T>;
}
