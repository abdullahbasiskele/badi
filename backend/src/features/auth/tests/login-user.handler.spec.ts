import { UnauthorizedException } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import * as argon2 from "argon2";
import { AuthService } from "../auth.service";
import { LoginUserHandler } from "../application/commands/login-user/login-user.handler";
import { LoginUserCommand } from "../application/commands/login-user/login-user.command";
import type { AuthUserWithRelations } from "../application/models/auth-user.model";

const queryBusExecuteMock = jest.fn();
const generateTokenResponseMock = jest.fn();

function createHandler() {
  const queryBus = { execute: queryBusExecuteMock } as unknown as QueryBus;
  const authService = {
    generateTokenResponse: generateTokenResponseMock,
  } as unknown as AuthService;
  return new LoginUserHandler(queryBus, authService);
}

describe("LoginUserHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when user is missing", async () => {
    queryBusExecuteMock.mockResolvedValue(null);
    const handler = createHandler();

    await expect(
      handler.execute(new LoginUserCommand("user@example.com", "secret")),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("throws when password does not match", async () => {
    const hash = await argon2.hash("correct", { type: argon2.argon2id });
    const user = { passwordHash: hash } as AuthUserWithRelations;
    queryBusExecuteMock.mockResolvedValue(user);
    const handler = createHandler();

    await expect(
      handler.execute(new LoginUserCommand("user@example.com", "wrong")),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns token response when credentials are valid", async () => {
    const hash = await argon2.hash("correct", { type: argon2.argon2id });
    const user = {
      passwordHash: hash,
    } as AuthUserWithRelations;
    queryBusExecuteMock.mockResolvedValue(user);
    const handler = createHandler();
    const tokenResponse = {
      accessToken: "token",
      refreshToken: "refresh",
      expiresIn: 900,
      refreshExpiresIn: 604800,
      tokenType: "Bearer",
      userId: "user-1",
      email: "user@example.com",
      displayName: null,
      roles: ["teacher"],
      subjectScopes: [],
      organizationId: null,
      organizationName: null,
      permissions: [],
    };
    generateTokenResponseMock.mockResolvedValue(tokenResponse);

    const result = await handler.execute(
      new LoginUserCommand("user@example.com", "correct"),
    );

    expect(generateTokenResponseMock).toHaveBeenCalledWith(user);
    expect(result).toBe(tokenResponse);
  });
});
