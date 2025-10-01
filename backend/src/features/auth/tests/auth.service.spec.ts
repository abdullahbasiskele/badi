import type { ConfigService } from "@nestjs/config";
import type { JwtService } from "@nestjs/jwt";
import { AuthService } from "../auth.service";
import type { AuthUserWithRelations } from "../application/models/auth-user.model";
import type { RefreshTokenService } from "../application/services/refresh-token.service";
import type { TokenResponseDto } from "../application/dto/token-response.dto";

const signAsyncMock = jest.fn();
const configGetOrThrowMock = jest.fn();
const configGetMock = jest.fn();
const issueTokenMock = jest.fn();

function createService() {
  const jwtService = { signAsync: signAsyncMock } as unknown as JwtService;
  const configService = {
    getOrThrow: configGetOrThrowMock,
    get: configGetMock,
  } as unknown as ConfigService;
  const refreshTokens = {
    issueToken: issueTokenMock,
  } as unknown as RefreshTokenService;

  return new AuthService(jwtService, configService, refreshTokens);
}

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configGetOrThrowMock.mockImplementation((key: string) => {
      switch (key) {
        case "JWT_ACCESS_SECRET":
          return "access-secret";
        case "JWT_ACCESS_TTL":
          return "900s";
        case "JWT_REFRESH_TTL":
          return "7d";
        case "JWT_ISSUER":
          return "badi";
        default:
          throw new Error(`Unexpected config key ${key}`);
      }
    });
    configGetMock.mockImplementation((key: string) =>
      key === "JWT_ACCESS_AUDIENCE" ? "badi-clients" : undefined,
    );
    signAsyncMock.mockResolvedValue("access-token-value");
    issueTokenMock.mockResolvedValue({ token: "refresh.token", id: "rt-1" });
  });

  it("generates token response with normalized role and scopes", async () => {
    const service = createService();
    const now = new Date();
    const user = {
      id: "user-1",
      email: "user@example.com",
      passwordHash: "hash",
      displayName: "Test User",
      organizationId: "org-1",
      organization: {
        id: "org-1",
        name: "Test Org",
        description: null,
        createdAt: now,
        updatedAt: now,
      },
      roles: [
        {
          id: "user-role-1",
          userId: "user-1",
          roleId: "role-1",
          role: {
            id: "role-1",
            name: "Teacher",
            key: "TEACHER",
            createdAt: now,
            updatedAt: now,
            permissions: [],
          },
        },
      ],
      subjectScopes: [
        {
          id: "scope-1",
          subject: "music",
          userId: "user-1",
        },
      ],
    } as unknown as AuthUserWithRelations;

    const response = (await service.generateTokenResponse(user)) as TokenResponseDto;

    expect(signAsyncMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: "user-1",
        roles: ["teacher"],
        subjectScopes: ["music"],
      }),
      expect.any(Object),
    );
    expect(issueTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
    );
    expect(response.roles).toEqual(["teacher"]);
    expect(response.subjectScopes).toEqual(["music"]);
    expect(response.organizationName).toBe("Test Org");
    expect(response.email).toBe("user@example.com");
    expect(response.refreshToken).toBe("refresh.token");
  });

  it("rejects malformed refresh tokens", () => {
    const service = createService();
    expect(() => service.parseRefreshToken("invalid"))
        .toThrow(/yenileme jetonu/);
  });

  it("parses refresh tokens when format is correct", () => {
    const service = createService();
    const parsed = service.parseRefreshToken("abc.def");
    expect(parsed).toEqual({ tokenId: "abc", secret: "def" });
  });
});
