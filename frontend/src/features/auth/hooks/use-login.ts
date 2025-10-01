import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/hooks/use-auth";
import { extractNormalizedRoles, normalizeRoles, resolveRedirectPath } from "@/shared/utils/auth";
import type { LoginPayload } from "../services/auth-service";

export function useLoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [pending, setPending] = useState(false);

  const handleSubmit = async (values: LoginPayload) => {
    try {
      setPending(true);
      const tokens = await login(values);
      const roles = tokens.roles?.length
        ? normalizeRoles(tokens.roles)
        : extractNormalizedRoles(tokens.accessToken);
      const redirectPath = resolveRedirectPath(roles);
      toast.success("Giriş başarılı");
      router.push(redirectPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Giriş sırasında hata oluştu";
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return { handleSubmit, pending };
}
