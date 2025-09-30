"use client";

import { MainLayout } from "@/components/templates/MainLayout";
import { RoleGuard } from "@/features/auth/components/role-guard";

export function AdminPanelPage() {
  return (
    <RoleGuard allowedRoles={["system-admin", "organization-admin"]} fallbackPath="/dashboard">
      <MainLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Yönetim Paneli</h1>
          <p className="text-muted-foreground">
            Sistem ve kurum yöneticileri için hazırlanan bu sayfa, kullanıcı ve kurs yapılandırmalarını yönetmek üzere
            referans bileşenler içerir. Test senaryolarında, rol tabanlı yönlendirmelerin doğru çalıştığını gözlemlemek için
            bu sayfayı hedef olarak kullanabilirsiniz.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Yeni organizasyonlar veya eğitmen atamalarını denemek için placeholder kartları ekleyin.</li>
            <li>CASL yetki kontrollerini doğrulamak adına ileride bu sayfaya korumalı bileşenler eklenebilir.</li>
            <li>UI açıklamalarını güncel tutarak test yapan ekiplerin neyi doğruladığını bilmesini sağlayın.</li>
          </ul>
        </div>
      </MainLayout>
    </RoleGuard>
  );
}