"use client";

import { MainLayout } from "@/components/templates/MainLayout";
import { RoleGuard } from "@/features/auth/components/role-guard";

export function DashboardPage() {
  return (
    <RoleGuard>
      <MainLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Genel Bakış</h1>
          <p className="text-muted-foreground">
            Bu panel, giriş yapan kullanıcılara yönelik genel durumu ve yakın zamanda eklediğimiz modülleri
            özetlemek için hazırlandı. Rolünüze göre sol üstteki menüden ilgili çalışma alanına geçebilirsiniz.
          </p>
          <p className="text-muted-foreground">
            Testler sırasında bu sayfayı kullanarak yeni bileşenleri hızlıca doğrulayabilir ve yönlendirmelerin doğru
            çalıştığını kontrol edebilirsiniz.
          </p>
        </div>
      </MainLayout>
    </RoleGuard>
  );
}