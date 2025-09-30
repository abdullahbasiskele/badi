"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/hooks/use-auth";

export function HomePage() {
  const { isAuthenticated, roles } = useAuth();

  const isParticipant = roles.includes("participant");
  const isTeacher = roles.includes("teacher");
  const isAdmin = roles.some(role => ["system-admin", "organization-admin"].includes(role));

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Badi Platformu</h1>
        <p className="text-lg text-muted-foreground">
          Yerel yönetimlerin düzenlediği eğitimleri tek noktadan yönetmek ve toplulukla paylaşmak için tasarlanmış dijital
          platform. Rolünüze göre farklı çalışma alanlarına otomatik yönlendirme uygulanır.
        </p>
      </div>

      <div className="space-y-4 text-muted-foreground">
        {!isAuthenticated && (
          <p>
            Sisteme giriş yaparak kayıt olduğunuz eğitimleri görüntüleyebilir ya da yeni kurslara başvurabilirsiniz.
          </p>
        )}
        {isParticipant && (
          <p>
            Katılımcı rolündesiniz. Buradan yeni kursları keşfedebilir, kayıt durumunuzu takip edebilir ve yaklaşan
            etkinlikler için bildirim alabilirsiniz.
          </p>
        )}
        {isTeacher && (
          <p>
            Öğretmen rolündesiniz. Üst menüden "Öğretmen Paneli" bağlantısını kullanarak ders planlarınızı yönetebilirsiniz.
          </p>
        )}
        {isAdmin && (
          <p>
            Yönetici rolündesiniz. "Yönetim Paneli" üzerinden organizasyon yapılandırmasını sürdürebilirsiniz.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {!isAuthenticated && (
          <Button asChild>
            <Link href="/login">Giriş Yap</Link>
          </Button>
        )}
        {isAuthenticated && (
          <Button asChild variant="outline">
            <Link href="/dashboard">Genel Panele Git</Link>
          </Button>
        )}
      </div>
    </main>
  );
}