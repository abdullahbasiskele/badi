# Kimlik ve Yetki Rehberi

Bu dokuman Badi monolit backend inde kimlik dogrulama, yetkilendirme ve audit islemlerinin nasil calistigini ozetler. Veri modeli Prisma uzerinden yurutulur, CQRS komutlari ve guard katmani CASL ile RLS kurallarini birlikte uygular.

## 1. Veri Modeli ve Iliskiler

### User
- E posta, parola ozeti (argon2), gorunen ad, locale ve opsiyonel organizationId alanlarini tasir.
- UserRole, SubjectScope, Course, Lesson, Enrollment ve RefreshToken iliskileri uzerinden diger aggregate lara baglanir.

### Role ve Permission
- Role tablosu RoleKey enum degerleri ile isaretlenir (SYSTEM_ADMIN, ORGANIZATION_ADMIN, TEACHER, PARTICIPANT).
- Permission kayitlari CASL kararlarinda kullanilacak subject, action ve metadata bilgilerinin kaynagi olarak hizmet eder.
- RolePermission pivotu bir rolde hangi izinlerin aktif oldugunu takip eder.

### SubjectScope
- Kullaniciya belirli konu veya modullerde yetki verir (ornek subject = music).
- AbilityFactory bu listeyi CASL yeteneklerine cevirir; frontend guard lar ayni listeyi UI filtreleri icin kullanir.

### RefreshToken
- Opaque yenileme token larinin hashlenmis degerini, gecerlilik ve revoke bilgisini saklar.
- Token limiti (varsayilan 3) asildiginda en eski kayitlar otomatik olarak revoke edilir.

### HttpRequestLog
- Audit log tablosu (http_request_logs) butun HTTP isteklerini ve auth aktivitelerini kaydeder.
- Alanlar: occurred_at, user_id, organization_id, roles, subject_scopes, ip, forwarded_for, user_agent, method, path, status_code, duration_ms, query_json, params_json, body_digest, response_digest, correlation_id.
- Sistem ve organization admin rolleri CASL uzerinden okuyabilir; RLS politikasi organization baglamina gore filtre uygular.

## 2. Kimlik Komutlari ve Akislar

1. RegisterUserCommand: Parolayi argon2 ile hashler, varsayilan rolu baglar, refresh token paketi dondurur.
2. LoginUserCommand: Kullanici kimligini dogrular, SubjectScope ve rollerini yukler, token uretir.
3. RefreshAccessTokenCommand: Refresh token kaydini dogrular, yeni access + refresh ciftini dondurur, eski kaydi revoke eder.
4. Logout: Refresh token tedarik edilmisse revoke eder ve store u temizler.
5. RecordAuthActivityCommand: Giris, cikis, refresh gibi olaylarda audit log tablosuna kayit olusturur (body digest ve PII maskesi dahil).

Islemler AppCommandBus uzerinden calisir. Validation, transaction ve loglama pipeline lari AppCommandBus ve HttpRequestLoggingInterceptor arasinda paylastirilir.

## 3. CASL ve RLS Uygulamasi

1. JwtAccessGuard access token i dogrular ve request.authUser objesini olusturur.
2. PoliciesGuard route metadata sindaki @CheckAbility dekoratorunu okur ve AbilityFactory ile user yeteneklerini cikarir.
3. accessibleBy(ability) yardimiyla repository katmaninda Prisma filtreleri olusur. Ornek: Course sorgulari organizationId ve subjectScopes kosullarina gore filtrelenir.
4. PostgreSQL tarafinda RLS aktif tablolarda (course, enrollment, http_request_logs vb.) ayni kosullar uygulanir. Audit tablosu icin app.is_system_admin ve app.organization_id session parametreleri kullanilir.

```ts
const ability = this.abilityFactory.createForUser(authUser);
const filter = accessibleBy(ability, AppAction.Read).Course;
return this.prisma.course.findMany({ where: filter });
```

## 4. Audit Izleme

- HttpRequestLoggingInterceptor tum HTTP isteklerini suredir ve sonucuna gore AuditTrailService e icerik gonderir.
- AuditTrailService config e gore dogrudan AppCommandBus u kullanir veya BullMQ kuyruguna (audit-log) is birakir.
- Repository, gelen body ve response verisini maskeleyerek digest (sha256) uretir ve PII bilgisini regex ile temizler.
- DeleteOldHttpLogsCommand veri saklama suresine (varsayilan 180 gun) gore tabloyu budar. Service, periyodik calisan AuditLogRetentionService ile birlikte calisir.

## 5. Frontend Entegrasyonu

- Access token ve refresh token useAuthStore icinde saklanir. apiFetch 401 aldiginda otomatik refresh dener.
- SubjectScope listesi UI guard lari, menu filtreleri ve form gorunumleri icin kullanilir.
- RoleGuard komutu request.authUser bilgisini bekler ve AuthUser.roles degerine gore rota kontrolu yapar.

## 6. Gelistirme Checklist i

- [ ] Yeni endpoint eklerken @CheckAbility dekoratorunu unutma.
- [ ] Repository sorgularina accessibleBy veya ability tabanli where filtreleri ekle.
- [ ] Auth ile ilgili komutlarda RecordAuthActivityCommand tetiklenip tetiklenmedigini kontrol et.
- [ ] Migration eklediginde npm run prisma:generate calistir ve seed scriptini guncelle.
- [ ] Audit log retention ihtiyacina gore AUDIT_LOG_RETENTION_DAYS ortam degiskenini ayarla.

Bu rehber kimlik ve yetki ile ilgili tum feature calismalarinda referans alinan ana kaynaktir. Yeni roller, subject scope senaryolari veya audit politikasi geldiginde dokuman mutlaka guncellenmelidir.
