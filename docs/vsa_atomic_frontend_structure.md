# VSA + Atomic Design Hybrid - Frontend Yapisal Rehberi

Bu dokuman Next.js tabanli frontend katmaninin guncel klasor yapisini ve Vertical Slice Architecture (VSA) ile Atomic Design ilkelerinin nasil birlikte kullanildigini ozetler. Tum ornekler `frontend/src` agacindan alinmistir.

## Dizim Ozet (Eylul 2025)

```
src/
  app/
    (auth)/
      layout.tsx
      login/page.tsx
      register/page.tsx
    admin/page.tsx
    dashboard/page.tsx
    teacher/page.tsx
    layout.tsx
    page.tsx
  components/
    atoms/
      button.tsx
      input.tsx
      label.tsx
    molecules/
      form.tsx
    organisms/
      auth-card.tsx
    templates/
      AuthLayout.tsx
      MainLayout.tsx
    ui/
      button.tsx
      card.tsx
      form.tsx
      input.tsx
      label.tsx
  features/
    auth/
      components/
        login-form.tsx
        register-form.tsx
        role-guard.tsx
      hooks/
        use-login.ts
        use-register.ts
      services/
        auth-service.ts
      store/
        auth-store.ts
      types/
        auth.types.ts
    dashboard/
      pages/
        admin-panel-page.tsx
        dashboard-page.tsx
        teacher-panel-page.tsx
    site/
      pages/
        home-page.tsx
  shared/
    hooks/use-auth.ts
    services/http-client.ts
    store/auth-store.ts
    types/auth.ts
    utils/{auth.ts,jwt.ts}
  lib/utils.ts
```

## Atomic Katmanlari

- **Atoms:** `components/atoms` klasorundaki `button.tsx`, `input.tsx`, `label.tsx` temel HTML sarmalayan sade parcalardir. Shadcn UI stilleri `components/ui` altinda tutulur.
- **Molecules:** `components/molecules/form.tsx` gibi bilesenler atoms kombinasyonlarindan olusur ve tekrar eden form alt bolumlerini kapsar.
- **Organisms:** `components/organisms/auth-card.tsx` gibi daha zengin bloklar auth sayfalarinda tekrar kullanilir.
- **Templates:** `components/templates/AuthLayout.tsx` ve `MainLayout.tsx` sayfa duzenini belirler ve App Router icinde layout bile komponentleri ile eslesir.

## Vertical Slice Dilimleri

- **Auth slice:** `features/auth` altinda form bilesenleri, React hooks (`use-login`, `use-register`), API katmani (`auth-service.ts`) ve Zustand store (`auth-store.ts`) bir aradadir. `role-guard.tsx` App Router sayfalarinda yetki kontrolu icin kullanilir.
- **Dashboard slice:** `features/dashboard/pages/*` kullanici rolune gore ekrani hazirlayan presentational sayfa parcalari saglar. Bu sayfalar `app/dashboard`, `app/admin` ve `app/teacher` route dizinleri tarafindan kullanilir.
- **Site slice:** `features/site/pages/home-page.tsx` ana landing icin tutulan placeholder bilesendir.

Her slice kendi dizininde calisan kodu saklar; paylasilan servisler veya tipler `shared/` altina alinmistir. Dilimler arasi bagimlilik sadece bu paylasilan katman uzerinden kurulur.

## Ortak Servis ve Store Katmani

- `shared/services/http-client.ts` tum API isteklerini yonetir, JWT header ekler ve hatalari standartlestirir.
- `shared/store/auth-store.ts` global oturum durumunu saklar ve `features/auth` icinde yeniden kullanilir.
- `shared/hooks/use-auth.ts` guard bilesenlerine oturum, roller ve router entegrasyonu saglar.

Bu katmanlarin tamami client-side calisir; Next.js server componentlerinde kullanilacaksa ayri adapterler gerekir.

## App Router Eslesmeleri

- `(auth)/layout.tsx` auth sayfalarini `AuthLayout` sablonu ile sarmalar.
- `(auth)/login/page.tsx` ve `(auth)/register/page.tsx` slice bilesenlerini kullanarak formlari render eder.
- `dashboard/page.tsx` oturum rolu ile uyumlu dashboard sayfasini secmek icin `features/dashboard/pages/dashboard-page.tsx` dosyasini kullanir.
- `admin/page.tsx` ve `teacher/page.tsx` ilgili panel sayfalarini `RoleGuard` ile sarmalar.

## Kod Ornekleri

```tsx
// components/templates/MainLayout.tsx
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
// features/auth/components/login-form.tsx
export function LoginForm() {
  const { mutateAsync, isPending } = useLogin();
  // form state ve submit handler burada toplanir
  return (
    <AuthCard title="Giris Yap">
      <Form {...form}>
        {/* input alanlari */}
      </Form>
    </AuthCard>
  );
}
```

## Gelistirme Notlari

1. UTF-8 karakter sorunlari henuz tamamen giderilmedi; `docs/tasks-todo.md` icerisinde acik gorev olarak takip ediliyor.
2. Refresh token rotasyonu ve 401 yakalama akisi front-end tarafinda eksik, guard bilesenleri prod ortamina alinmadan once tamamlanmali.
3. Role bazli sayfalar su anda placeholder icerik gosteriyor; kurs ve enrollment slice eklendiginde VSA yapisi genisletilecek.

Bu rehber yeni feature eklerken dizin yapisini ve katman sorumluluklarini hizli sekilde hatirlatmak icin guncellenmelidir.
## Tailwind Tema ve Tasarım Tokenleri

- **Renk paleti:** `frontend/src/app/globals.css` içinde `:root` seviyesinde tanımlanan `--foreground`, `--background`, `--primary`, `--muted` gibi tokenlar `components/ui` katmanındaki atomlar tarafından otomatik olarak kullanılır.
- **Typografi:** `globals.css` içindeki `--font-sans` ve `--font-mono` tanımları `body` ve `code` seviyesinde uygulanır; atoms/molecules katmanı ekstra font seçimi yapmaz.
- **Spacing & radius:** `--radius`, `--spacing-base` gibi değerler `button`, `card`, `form` gibi atomlarda `rounded-md`, `px-4` vb. utility sınıflarıyla eşleşir. Tasarım değişiklikleri için token güncellemek yeterlidir.
- **Durum renkleri:** `--destructive`, `--ring`, `--muted-foreground` gibi tonlar toast, uyarı kartı ve tablo satırlarında tekrar kullanılır; molecules/organisms seviyesinde doğrudan hex kodu kullanılmaz.
- **Dark mode:** Token seti `@media (prefers-color-scheme: dark)` bloğu ile yansıtılır; atomic bileşenler ek koşul tanımlamadığından tema geçişi merkezi olarak yönetilir.

Bu rehber ile Atomic katmanlardaki tüm görsel kararlar Tailwind tokenlarına bağlanarak tutarlılık sağlanır.
