"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/use-auth";

interface RoleGuardProps {
  allowedRoles?: string[];
  fallbackPath?: string;
  children: ReactNode;
}

export function RoleGuard({
  allowedRoles = [],
  fallbackPath = "/",
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const { isAuthenticated, roles } = useAuth();

  const isRoleAllowed =
    allowedRoles.length === 0 || allowedRoles.some(role => roles.includes(role));

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!isRoleAllowed) {
      router.replace(fallbackPath);
    }
  }, [fallbackPath, isAuthenticated, isRoleAllowed, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isRoleAllowed) {
    return null;
  }

  return <>{children}</>;
}