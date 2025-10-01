import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;
  private readonly transactionStack: Prisma.TransactionClient[] = [];

  constructor(private readonly configService: ConfigService) {
    this.client = new PrismaClient({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    });
  }

  private get delegate(): Prisma.TransactionClient | PrismaClient {
    const current = this.transactionStack[this.transactionStack.length - 1];
    return current ?? this.client;
  }

  get course() {
    return this.delegate.course;
  }

  get enrollment() {
    return this.delegate.enrollment;
  }

  get lesson() {
    return this.delegate.lesson;
  }

  get organization() {
    return this.delegate.organization;
  }

  get permission() {
    return this.delegate.permission;
  }

  get refreshToken() {
    return this.delegate.refreshToken;
  }

  get role() {
    return this.delegate.role;
  }

  get rolePermission() {
    return this.delegate.rolePermission;
  }

  get subjectScope() {
    return this.delegate.subjectScope;
  }

  get user() {
    return this.delegate.user;
  }

  get userRole() {
    return this.delegate.userRole;
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.client.$transaction(async (tx) => {
      this.transactionStack.push(tx);
      try {
        return await fn();
      } finally {
        this.transactionStack.pop();
      }
    });
  }

  $transaction(...args: Parameters<PrismaClient['$transaction']>) {
    return (this.client.$transaction as any)(...args);
  }

  $executeRaw(...args: Parameters<PrismaClient['$executeRaw']>) {
    return this.delegate.$executeRaw(...args);
  }

  $queryRaw(...args: Parameters<PrismaClient['$queryRaw']>) {
    return this.delegate.$queryRaw(...args);
  }

  get $extends() {
    return this.client.$extends.bind(this.client);
  }
}
