import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import request from 'supertest';
import { RefreshAccessTokenCommand } from '../../application/commands/refresh-access-token/refresh-access-token.command';
import { RevokeRefreshTokenCommand } from '../../application/commands/revoke-refresh-token/revoke-refresh-token.command';
import { AuthController } from '../../presentation/http/auth.controller';

describe('Auth routes (integration)', () => {
  let app: INestApplication;
  const commandBusMock = { execute: jest.fn() } as unknown as CommandBus;
  const queryBusMock = { execute: jest.fn() } as unknown as QueryBus;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: CommandBus, useValue: commandBusMock },
        { provide: QueryBus, useValue: queryBusMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /auth/refresh returns refreshed tokens', async () => {
    const tokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
      refreshExpiresIn: 7200,
      tokenType: 'Bearer',
    };
    (commandBusMock.execute as jest.Mock).mockResolvedValue(tokens);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'valid-refresh' })
      .expect(201)
      .expect(tokens);

    expect(commandBusMock.execute).toHaveBeenCalledWith(
      expect.any(RefreshAccessTokenCommand),
    );
  });

  it('POST /auth/refresh propagates command errors (401/500)', async () => {
    (commandBusMock.execute as jest.Mock).mockRejectedValue(
      new Error('invalid token'),
    );

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'broken' })
      .expect(500);
  });

  it('POST /auth/refresh validates payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({})
      .expect(400);

    expect(commandBusMock.execute).not.toHaveBeenCalled();
  });

  it('POST /auth/logout revokes refresh token', async () => {
    (commandBusMock.execute as jest.Mock).mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: 'rotate-me' })
      .expect(204);

    expect(commandBusMock.execute).toHaveBeenCalledWith(
      expect.any(RevokeRefreshTokenCommand),
    );
  });

  it('POST /auth/logout validates payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({})
      .expect(400);

    expect(commandBusMock.execute).not.toHaveBeenCalled();
  });
});
