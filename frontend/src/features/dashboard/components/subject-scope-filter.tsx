"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/shared/hooks/use-auth";

interface SubjectScopeFilterProps {
  className?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
}

export function SubjectScopeFilter({ className, value = null, onChange }: SubjectScopeFilterProps) {
  const { subjectScopes } = useAuth();
  const [active, setActive] = useState<string | null>(value);

  useEffect(() => {
    setActive(value ?? null);
  }, [value]);

  const options = useMemo(() => {
    if (!subjectScopes) {
      return [] as string[];
    }
    return Array.from(new Set(subjectScopes)).sort();
  }, [subjectScopes]);

  if (!options.length) {
    return null;
  }

  const handleSelect = (next: string | null) => {
    setActive(next);
    onChange?.(next);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Filtrele
      </span>
      <button
        type="button"
        onClick={() => handleSelect(null)}
        className={cn(
          "rounded-full border px-3 py-1 text-xs",
          active === null
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary",
        )}
      >
        Tüm kurslar
      </button>
      {options.map((scope) => (
        <button
          key={scope}
          type="button"
          onClick={() => handleSelect(scope)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs capitalize",
            active === scope
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary",
          )}
        >
          {scope}
        </button>
      ))}
    </div>
  );
}
