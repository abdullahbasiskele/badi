"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SubjectScopeBadgeList } from "@/features/auth/components/subject-scope-badge-list";
import { useAuth } from "@/shared/hooks/use-auth";

interface MainLayoutProps {
  children: ReactNode;
}

interface NavLink {
  href: string;
  label: string;
  roles?: string[];
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/dashboard", label: "Genel Panel" },
  { href: "/admin", label: "Yönetim Paneli", roles: ["system-admin", "organization-admin"] },
  { href: "/teacher", label: "Öğretmen Paneli", roles: ["teacher"] },
];

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const {
    roles,
    logout,
    displayName,
    organizationName,
    subjectScopes,
    isAuthenticated,
    fetchProfile,
  } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (subjectScopes.length === 0 || !displayName) {
      fetchProfile().catch((error) => {
        console.error("Profile sync failed", error);
      });
    }
  }, [displayName, fetchProfile, isAuthenticated, subjectScopes.length]);

  const filteredLinks = useMemo(() => {
    return NAV_LINKS.filter((link) => {
      if (!link.roles || link.roles.length === 0) {
        return true;
      }
      return link.roles.some((role) => roles.includes(role));
    });
  }, [roles]);

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await logout();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            Badi Portal
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            {filteredLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end leading-tight">
              {displayName ? (
                <span className="text-sm font-medium text-foreground">{displayName}</span>
              ) : null}
              {organizationName ? (
                <span className="text-xs text-muted-foreground">{organizationName}</span>
              ) : null}
            </div>
            <Button variant="ghost" onClick={handleLogout} disabled={isSigningOut}>
              {isSigningOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </Button>
          </div>
        </div>
      </header>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2">
          <SubjectScopeBadgeList withTitle className="text-xs" />
        </div>
      </div>
      <main className="container mx-auto px-4 py-10">{children}</main>
    </div>
  );
}
