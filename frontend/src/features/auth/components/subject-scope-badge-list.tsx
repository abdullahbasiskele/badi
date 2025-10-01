"use client";

import { cn } from "@/lib/utils";
import { useAuth } from "@/shared/hooks/use-auth";

interface SubjectScopeBadgeListProps {
  className?: string;
  withTitle?: boolean;
}

export function SubjectScopeBadgeList({
  className,
  withTitle = true,
}: SubjectScopeBadgeListProps) {
  const { subjectScopes } = useAuth();

  if (!subjectScopes || subjectScopes.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-xs text-muted-foreground", className)}>
      {withTitle ? (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Yetkili Alanlar
        </span>
      ) : null}
      {subjectScopes.map((scope) => (
        <span
          key={scope}
          className="rounded-full border border-muted-foreground/40 bg-muted px-2 py-1 text-[11px] font-medium text-foreground"
        >
          {scope}
        </span>
      ))}
    </div>
  );
}
