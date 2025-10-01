# Kurs Platformu - Mimari Dokuman (2025 Revizyonu)

Bu dokuman Badi kurs platformu icin secilen monolit + Vertical Slice Architecture yaklasimini, teknolojik tercihlerimizi ve guncel gelistirme durumunu ozetler. Tanimlanan kararlara gore sistem Node.js 22 uzerinde NestJS 11 ile calisir, Prisma 6 ve PostgreSQL 18 kullanir. Audit, observability, cache ve queue gibi capraz kesitler infrastructure katmaninda merkezilesmistir.

## 1. Proje Ozeti
- Amac: Vatandasa yonelik kurs alma/verme platformu (ogretmen, katilimci, kurum yoneticisi, sistem yoneticisi rollerini kapsar).
- Yetki modeli: Ogretmenler yalnizca subject scope lari ile eslesen kurs ve kayitlari gorur; organization admin ler yalnizca kendi kurumunu yonetir.
- Kimlik: Passkey (WebAuthn) birincil, e posta/parola ikincil; e Devlet ve diger IdP ler Keycloak broker ile baglanir.
- Yetkilendirme: CASL v6 + @casl/prisma ile ABAC kurallari, PostgreSQL Row Level Security ikinci savunma hattini olusturur.

## 2. Mimari Model
- Vertical Slice Architecture: Her feature `features/<slice>` dizininde domain, application, infrastructure, presentation, tests alt dizinleri ile paketlenir.
- CQRS + Mediator: Komut ve sorgular ayridir; AppCommandBus ve AppQueryBus validation, authorization, transaction pipeline larini uygular.
- Unit of Work: PrismaUnitOfWork transactional komutlari @TransactionalCommand dekoratoru ile yurutur; sorgular yalnizca okuma yapar.

## 3. Teknoloji Yigini
- Runtime: Node.js 22 LTS
- Framework: NestJS 11 (Express 5 tabanli)
- Veritabani: PostgreSQL 18, Prisma 6.x
- Cache / Queue: Valkey veya Redis, BullMQ (opsiyonel fallback komut modu)
- Kimlik: Keycloak, Passkey, OAuth2/OIDC broker
- Observability: OpenTelemetry (OTLP), AppLoggerService, AuditTrailService
- API Sozlesmesi: OpenAPI 3.2, Spectral lint

## 4. Kimlik ve Yetki Akisi
1. JWT iletilerinde roles, subjectScopes, organizationId claim leri tasinir.
2. JwtAccessGuard token i dogrular ve `request.authUser` objesini olusturur.
3. PoliciesGuard route metadata sindaki @CheckAbility bilgisiyle AbilityFactory yi kullanarak CASL yetenekleri uretilir.
4. Repository katmani accessibleBy veya ability tabanli where filtreleri ile veri erisimini sinirlar.
5. AuditTrailService login, refresh ve logout olaylarini RecordAuthActivityCommand araciligi ile loglar.

## 5. Audit ve Observability
- Interceptor: HttpRequestLoggingInterceptor tum HTTP isteklerini once loglar, sonra response durumuna gore AuditTrailService e payload gonderir.
- Audit slice: `features/audit-log` domain factory si PII veriyi maskeleyip digest (sha256) uretir, repository RLS baglamini set_config cagrilariyla ayarlar.
- Kuyruk: AuditTrailService, AUDIT_LOG_TRANSPORT degiskenine gore BullMQ (audit-log kuyruu) veya dogrudan AppCommandBus kullanir.
- Retention: AuditLogRetentionService bakim surecini AUDIT_LOG_PRUNE_INTERVAL_MINUTES ve AUDIT_LOG_RETENTION_DAYS degerlerine gore calistirir.

## 6. Veri Modeli
- User, Role, Permission, SubjectScope, Course, Enrollment, Lesson, Organization, RefreshToken ve HttpRequestLog tablolarindan olusur.
- HttpRequestLog icin indeksler: occurred_at, user_id, status_code, path, organization_id.
- RLS politikasi admin olmayan kullanicilarin yalnizca organization alanlari ile eslesen kayitlari gorebilmesini saglar.

## 7. Repository ve UoW
- Her slice kendi repository sinifina sahiptir (ornek TeacherRepository, CourseRepository, HttpRequestLogRepository).
- Komutlar Unit of Work icinde calisiyorsa TransactionalCommand ile isaretlenmelidir.
- PrismaService transaction stack tutar ve transaction baglaminda Prisma client delegesini expose eder.

## 8. Kuyruk ve Arka Plan Isleri
- BullMQ icin optional baglanti AUDIT_LOG_QUEUE_URL, VALKEY_URL veya REDIS_URL uzerinden saglanir.
- Kuyruk devre disi ise AuditTrailService degrade olarak komut moduna gecer.
- Queue scheduler ve worker AuditLogWorkerService icinde devreye alinmistir; production icin baglanti bilgisi gereklidir.

## 9. Frontend Notlari
- Next.js 15 app router uzerinde atomic + VSA yaklasimi kullanilir (`docs/vsa_atomic_frontend_structure.md`).
- apiFetch otomatik refresh token yenilemesi yapar, guard bileþenleri subject scope ile calisir.
- Auth store Zustand uzerinde tutulur; login/register akislari backend komutlari ile uyumludur.

## 10. Test Stratejisi
- Unit test: Domain kurallari (ornek HttpRequestLogFactory PII maskesi).
- Integration test: Repository + CASL/RLS filtreleri.
- Contract test: OpenAPI ve audit listeleme endpointleri icin backlog da.
- CI pipeline: Jest unit testleri, lint ve Prisma komutlari (workflow dosyasi `ci.yml`).

## 11. Ortam Degiskenleri
- `DATABASE_URL`, `DATABASE_DIRECT_URL`: Prisma migration ve client icin zorunlu.
- `AUDIT_LOG_TRANSPORT` (`command` veya `queue`).
- `AUDIT_LOG_QUEUE_URL` (opsiyonel; yoksa VALKEY_URL/REDIS_URL aranir).
- `AUDIT_LOG_RETENTION_DAYS`, `AUDIT_LOG_PRUNE_INTERVAL_MINUTES`, `AUDIT_LOG_PRUNE_ENABLED`.

## 12. Yol Haritasi (6-8 Hafta)
1. Cekirdek altyapi: Kimlik, CASL, audit, OpenTelemetry ve queue baglantisi.
2. Etki alani: Kurs, enrollment ve ogrenci katmanlari; scope bazli raporlama.
3. Observability ve operasyon: Dashboard, alert, retry politikasi.
4. KVKK ve sertlestirme: Veri saklama matrisi, gizli yonetimi, penetration testleri.

## 13. Riskler ve Azaltim Planlari
- Kimlik akislari: Passkey + Keycloak + e Devlet bilek akisi dokumante edilecek.
- CASL/RLS performansi: Indeksleme tamamlaniyor; EXPLAIN ANALYZE PoC si backlog da.
- Queue bagimliligi: Kuyruk baglantisi saglanmazsa komut modu devreye giriyor ancak alert yok; operasyon planlanacak.
- Observability: Trace ve metric pipeline cizildi, collector kurulumu bekliyor.
- KVKK: Audit retention implementasyonu mevcut; diger domainler icin otomatik silme sirada.

## 14. Basari Metrikleri
- Performans: p95 < 400 ms, hata orani < %1, queue isleme gecikmesi < 5 sn.
- Guvenlik: Sifir kritik acik, token ihlali yok, audit log kayip yok.
- Kalite: Test kapsam hedefi %75+, acik regresyon yok.

Bu dokuman sprint bazinda guncellenmelidir. Yeni feature veya altyapi degisiklikleri (ornek enrollment slice, telemetry) eklendiginde ilgili bolumlerde guncel detaylar yazilmalidir.
