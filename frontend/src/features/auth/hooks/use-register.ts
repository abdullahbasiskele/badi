import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/hooks/use-auth";
import { extractNormalizedRoles, resolveRedirectPath } from "@/shared/utils/auth";
import type { RegisterPayload } from "../services/auth-service";

export function useRegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [pending, setPending] = useState(false);

  const handleSubmit = async (values: RegisterPayload) => {
    try {
      setPending(true);
      const tokens = await register(values);
      const roles = extractNormalizedRoles(tokens.accessToken);
      const redirectPath = resolveRedirectPath(roles);
      toast.success("Kayıt başarılı");
      router.push(redirectPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kayıt sırasında hata oluştu";
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return { handleSubmit, pending };
}