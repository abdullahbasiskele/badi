import React, { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoleGuard } from "../role-guard";
import { useAuthStore } from "@/shared/store/auth-store";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

function RenderGuard({ children, allowedRoles, fallbackPath }: {
  children: ReactNode;
  allowedRoles?: string[];
  fallbackPath?: string;
}) {
  return (
    <RoleGuard allowedRoles={allowedRoles} fallbackPath={fallbackPath}>
      {children}
    </RoleGuard>
  );
}

describe("RoleGuard", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    const { clear } = useAuthStore.getState();
    clear();
  });

  afterEach(() => {
    const { clear } = useAuthStore.getState();
    clear();
  });

  it("redirects anonymous users to /login", async () => {
    render(
      <RenderGuard>
        <div>Hidden</div>
      </RenderGuard>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Hidden")).toBeNull();
  });

  it("redirects to fallback when role is not allowed", async () => {
    useAuthStore.setState((state) => ({
      ...state,
      accessToken: "token",
      roles: ["participant"],
    }));

    render(
      <RenderGuard allowedRoles={["teacher"]} fallbackPath="/teacher">
        <div>Panel</div>
      </RenderGuard>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/teacher"));
    expect(screen.queryByText("Panel")).toBeNull();
  });

  it("renders children when role is allowed", () => {
    useAuthStore.setState((state) => ({
      ...state,
      accessToken: "token",
      roles: ["teacher"],
    }));

    render(
      <RenderGuard allowedRoles={["teacher"]}>
        <div>Dashboard</div>
      </RenderGuard>,
    );

    expect(replaceMock).not.toHaveBeenCalled();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
