# AGENTS.md — Badi Monolit İçin Kod Asistanı Kuralları

> Bu dosya, VS Code/Codex gibi araçların **projeye özgü** kuralları anlaması için hazırlanmıştır. Yeni bir görevde önce bu dosyayı bağlama ekleyin ve kararlarınızı buradaki ilkelere göre verin. Temel mimari: **Monolith + Vertical Slice Architecture (VSA) + CQRS/Mediator**, yetkilendirme: **CASL ABAC + PostgreSQL RLS** (iki katmanlı).

---

## 0) Hızlı Kullanım (Asistan İçin)
- **Önce oku:** Bu dosyayı ve belirtilen rehber MD’leri (örn. `docs/main.md`, `docs/vsa_atomic_frontend_structure.md`, `docs/prisma-guide.md`) bağlama ekleyin.
- **Değişiklik prensibi:** Her değişiklik ilgili feature slice sınırlarında yapılır; dilimler arası doğrudan repository erişimi yasaktır (mediator/event kullanılır).
- **Kimlik & yetki:** CASL kurallarına ve (varsa) RLS eşleşmesine uymayan kod **önerme**. Veri erişiminde `@casl/prisma` › `accessibleBy` uygulanır.
- **Güvenlik:** Gizli anahtar, PII, token veya gerçek kullanıcı verisi üretmeyin; KVKK/uyum bölümlerini referans alın.
- **Test & sözleşme:** Yeni endpoint için unit + integration + **contract** (OpenAPI) testleri ekleyin.

---

## 1) Proje Özeti ve Kısıtlar
- **Amaç:** Vatandaşa yönelik kurs alma/verme platformu; roller: öğretmen, katılımcı, kurum yöneticisi, sistem yöneticisi. Örn. **müzik öğretmeni sadece Müzik** kurs/kayıtlarını görür ve işlem yapar.
- **Kimlik:** Passkey (WebAuthn) birincil, e-posta/şifre ikincil; e-Devlet ve diğer IdP’ler Keycloak broker üzerinden. Token politikaları: kısa ömürlü access, HTTP-Only cookie ile refresh ve rotasyon.
- **Yetkilendirme:** CASL tabanlı koşullu (ABAC) kurallar; kritik tablolarda **RLS** ikinci savunma hattı.

---

## 2) Mimari İlke ve Dizin Yapısı
- **Seçilen model:** **Feature-Paketli Clean**; her özellik `features/<feature>` altında kendi mini-clean katmanları (domain, application, infrastructure, presentation, tests) ile paketlenir.
- **Diller arası ilişkiler:** Feature’lar doğrudan birbirinin repository’sine erişmez; ortak parçalar `shared/` altındadır; haberleşme **mediator** veya **domain events** ile yapılır.
- **Örnek iskelet (özet):**
  ```txt
  src/features/<feature>/{domain,application,infrastructure,presentation,tests}
  src/shared/{domain,application/pipeline,infrastructure,presentation}
  ```
  - CQRS pipeline davranışları `shared/application/pipeline`: validation › authorization › transaction › (sorguda) cache vb.
- **Güncel durum:** AppModule seviyesinde özel `AppCommandBus`/`AppQueryBus` devrede; transactional komutlar `TransactionalCommand()` dekoratörüyle Unit of Work kullanıyor.

---

## 3) Teknoloji Yığını ve Sürümler
- **Runtime/Framework:** Node.js **22 LTS**, NestJS **11.x**.
- **DB/ORM:** PostgreSQL **18**, Prisma **6.x**; şema parçalı (`prisma/tables/*.prisma`) ve build script ile birleştirilir.
- **Önbellek/Kuyruk:** Valkey/Redis + BullMQ (alternatif: PostgreSQL tabanlı kuyruk).
- **Observability:** OpenTelemetry (OTLP), yapılandırılmış loglar, audit.
- **Sözleşme:** OpenAPI 3.2; CI’da Spectral lint/kalite kapıları.

---

## 4) Kimlik & Yetki — Uygulama Kuralları
- **JWT claim’leri:** `roles`, `subjectScopes`, `organizationId` access token’da taşınır; istek sırasında `AuthUser` modeline maplenir.
- **CASL Ability üretimi:** Kullanıcının rol ve SubjectScope kayıtlarına göre kurallar üretilir; sistem yöneticisi `manage all`, kurum yöneticisi `organizationId` filtresiyle; öğretmenler `subjectScopes` + `instructorId=user.id` ile sınırlandırılır. SubjectScope verisi UI katmanına taşınır (`useAuth`, `subject-scope-badge-list`).
- **Guard/Pipeline:** `JwtAccessGuard` › `PoliciesGuard` route metadata’sındaki `@CheckAbility` dekoratörünü değerlendirir. Veri erişiminde `@casl/prisma` › `accessibleBy` kullanılır.

---

## 5) UoW & Repository İlkeleri (Güncel)
- **Unit of Work:** `PrismaUnitOfWork` (`backend/src/shared/infrastructure/prisma/prisma-unit-of-work.ts`) UoW interface’ini uygular ve Prisma servisinin `runInTransaction(tx => …)` imzasını kullanır. Transactional komutlar `TransactionalCommand()` dekoratörü ile işaretlenir; `AppCommandBus` UoW üzerinden yürütür.
- **Repository katmanı:**
  - Tamamlandı: `features/auth`, `features/teacher`, `features/course` slice'ları repository + UoW altyapısıyla çalışıyor (AuthUser/Role/RefreshToken, Teacher, Course repository'leri).
  - Sıradaki: `features/user` için repository hazır ancak komut/sorgular henüz adapte edilmedi; sonraki sprintte enrollment ve diğer slice'lara aynı desen uygulanacak.
  - Ortak repository'ler injection yolu ile modüllere eklenir (`auth.module.ts`, `teacher.module.ts`, `course.module.ts`).
- **Servisler:** Domain/application servisleri repository ve UoW üzerinden ilerler; doğrudan Prisma çağrısı sadece repository / `PrismaService` içinde yapılır.

---

## 6) Vertically Sliced İş Akışları (Örnekler)
- **Auth**
  1. **Register**: `RegisterUserCommand` › `RegisterUserHandler` (repository + AuthService) › `AuthService.generateTokenResponse`.
  2. **Login**: `LoginUserCommand` handler, `AuthUserRepository` ile kullanıcıyı, `RefreshTokenService` ile token rotasyonunu yönetir.
  3. **Refresh**: `RefreshAccessTokenCommand` repository + UoW üzerinden refresh tokenı doğrular, revoke eder, yeni paket döner.
  4. **Profile**: `GET /auth/profile` query bus › repository; SubjectScope, roller, org bilgisi döner.
- **Teacher Yönetimi**
  1. `POST /teachers` CASL guard › `CreateTeacherCommand` handler repository üzerinden öğretmeni ve SubjectScope kaydını oluşturur (rol ataması + opsiyonel geçici şifre).
- **Course Listesi**
  1. `GET /courses` query handler `CourseRepository` ile CASL filtreli kursları getirir, DTO’ya mapler.

---

## 7) Frontend Erişim Notları
- **State kaynakları:** `useAuthStore` access/refresh token, SubjectScope ve profil verisini saklar; `fetchProfile()` backend `/auth/profile` ile senkron.
- **Guard akışı:** `RoleGuard` oturum/rol kontrolü yapar; Admin paneli SubjectScope rozeti + filtre bileşeni ile entegredir.
- **API katmanı:** `apiFetch` 401 aldığında otomatik refresh akışını dener; hata halinde store temizlenir.

---

## 8) Test ve CI
- Backend: Jest; handler/service testleri slice bazlı (`src/features/<feature>/tests`).
- Frontend: Vitest + RTL + MSW (`src/test/setup-tests.ts`). React `act` uyarıları bilinir, uzun vadede giderilmesi planlı.
- CI runbook: lint › unit › integration › contract › policy testleri.

---

## 9) Komutlar / Scriptler
```bash
# Backend
npm run build
npm test -- --runTestsByPath src/features/auth/tests/auth.service.spec.ts src/features/auth/tests/login-user.handler.spec.ts src/features/teacher/tests/create-teacher.handler.spec.ts

# Frontend
npm run dev
npm run build
npm run test

# Prisma
npm run prisma:generate
npm run prisma:migrate -- --name <ad>
npm run prisma:deploy
npm run prisma:seed
```
Prisma komutları, parçalı şemayı birleştirir ve client/migration/seed adımlarını çalıştırır.

---

## 10) Açık Konular (Takip)
- CASL + RLS performans PoC sonuçlarının indeks/plan rehberine dönüştürülmesi.
- Observability SLO ve incident süreçlerinin netleştirilmesi.
- Frontend testlerinde React `act` uyarılarının temizlenmesi.
- BANA HER ZAMAN TÜRKÇE CEVAP VER.
---

**Bu dosya yeni sprintlerle güncellenir; mimari ve rehber MD’lerdeki değişiklikleri buraya yansıtmayı unutmayın.**
