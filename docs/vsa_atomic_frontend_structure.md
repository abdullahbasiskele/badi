# VSA + Atomic Design Hybrid - Frontend Yapisi

Bu rehber Next.js 15 tabanli frontend katmaninda Vertical Slice Architecture (VSA) ile Atomic Design ilkelerinin nasil birlikte kullanildigini ozetler. Dizindeki ornekler `frontend/src` agacina gore guncellenmistir.

## 1. Dizin Ozet (Ekim 2025)
```
src/
  app/(auth)/{layout.tsx,login/page.tsx,register/page.tsx}
  app/{admin,page.tsx,dashboard/page.tsx,teacher/page.tsx,layout.tsx}
  components/{atoms,molecules,organisms,templates,ui}
  features/
    auth/{components/hooks/services/store/types}
    dashboard/pages
    site/pages
  shared/{hooks,use-auth.ts,services/http-client.ts,store/auth-store.ts,types,utils}
  lib/utils.ts
```

## 2. Atomic Katmanlari
- Atoms: Temel buton, input, label bilesenleri `components/atoms` ve shadcn uyarlamalari `components/ui` altinda.
- Molecules: Form gibi tekrar eden kombinasyonlar `components/molecules` dizininde.
- Organisms: AuthCard gibi karmasik bloklar `components/organisms` altinda tutulur.
- Templates: `AuthLayout` ve `MainLayout` sayfa duzenini tanimlar; App Router layout dosyalari bu sablonlari kullanir.

## 3. Vertical Slice Dilimleri
- Auth slice: Login/Register formlari, `use-login`, `use-register` hook lari, Zustand tabanli auth store ve API servisini barindirir. `role-guard.tsx` rota seviyesinde yetki kontrolu yapar.
- Dashboard slice: Rol bazli dashboard, admin ve ogretmen sayfalarini hazirlayan presentational bilesenleri saglar.
- Site slice: Landing sayfasini (`home-page.tsx`) tutar.
- Paylasilan tipler ve servisler `shared/` altina konulur; slice lar dogrudan birbirlerinin kodunu import etmez.

## 4. Ortak Servisler
- `shared/services/http-client.ts` apiFetch fonksiyonu ile Authorization header ekler, 401 durumunda otomatik refresh calistirir, iki denemeden sonra store u temizler.
- `shared/store/auth-store.ts` access/refresh token lari saklar ve `setTokens`, `clear` aksiyonlarini saglar.
- `shared/hooks/use-auth.ts` guard bilesenleri icin auth durumunu, rolleri ve subject scope listesini saglar.

## 5. App Router Eslesmeleri
- `(auth)/layout.tsx` auth sayfalarini `AuthLayout` ile sarar.
- `(auth)/login/page.tsx` ve `(auth)/register/page.tsx` slice bilesenlerini kullanarak form render eder.
- `dashboard/page.tsx` kullanicinin rolune gore dogru panel bilesenini secen orchestrator dir.
- `admin/page.tsx` ve `teacher/page.tsx` RoleGuard ile korunur.

## 6. Kod Ornekleri
```tsx
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <header className="border-b bg-white px-8 py-4">
        <h1 className="text-xl font-semibold">Badi Platformu</h1>
      </header>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
```
```tsx
export function LoginForm() {
  const { mutateAsync, isPending } = useLogin();
  return (
    <AuthCard title="Giris Yap">
      <Form {...form}>
        {/* input alanlari */}
      </Form>
      <Button disabled={isPending} type="submit">Devam</Button>
    </AuthCard>
  );
}
```

## 7. Gelistirme Notlari
- Refresh token akisi artik apiFetch icinde otomatik. Yeni servisler `skipAuthRefresh` bayragi ile bu davranisi kapatabilir.
- RoleGuard `useAuth` hook undan gelen roller ve subjectScopes degerlerini kontrol eder; backend CASL kurallari ile uyumludur.
- Atomic katmanda kullanilan Tailwind token lari (globals.css) tum bilesenlerde tutarliligi saglar.
- UTF 8 karakter sorunu halen backlog da; yeni icerikte ASCII kullanimi tercih edilmelidir.

## 8. Tailwind Tema ve Tasarim Tokenleri
- Renkler, tipografi, spacing ve radius degerleri globals.css icindeki CSS degiskenleri ile yonetilir.
- `components/ui` altindaki temel atomlar bu degiskenleri dogrudan kullanir; molecules ve organisms seviye custom hex degerleri kullanmamalidir.
- Dark mode desteklenir; `prefers-color-scheme: dark` blogu token degerlerini degistirir.

Bu dokuman yeni frontend slice leri, guard kararlarini veya tema guncellemelerini ekledikten sonra tekrar guncellenmelidir.
