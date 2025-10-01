# Prisma ve Veritabani Rehberi

Bu rehber Prisma ORM kullanimini, parcalanmis sema yapisini ve audit log tablosu dahil guncel migration surecini aciklar.

## 1. Dosya Yapisi
- `backend/prisma/schema.base.prisma`: Yalnizca generator ve datasource tanimlari.
- `backend/prisma/enums/*.prisma`: Enum tanimlari (EnrollmentStatus, LessonDeliveryMode, RoleKey vb.).
- `backend/prisma/tables/*.prisma`: Her tablo icin ayri dosya. Ornekler: `user.prisma`, `course.prisma`, `http-request-log.prisma`.
- `backend/scripts/prisma/build-schema.mjs`: Tablolari ve enumlari birlestirerek `schema.prisma` dosyasini uretir.
- `backend/prisma/schema.prisma`: Otomatik uretilen dosya; manuel duzenlenmez.
- `backend/prisma/migrations/`: Migration gecmisi (`20250930073220_init`, `20251001132145_add_http_request_logs`, ...).
- `backend/prisma/seed.ts`: Organization, role, permission, user, course, lesson ve enrollment icin ornek veri olusturur.

## 2. Calisma Akisi
1. `tables/<Model>.prisma` veya `enums/*.prisma` dosyasini guncelle.
2. `npm run prisma:generate` calistir; script schema.prisma yi yeniden yazar ve Prisma Client i gunceller.
3. `npm run prisma:migrate -- --name <degisiklik>` ile yeni migration olusturup uygula.
4. Gerekirse `npm run prisma:seed` ile ornek verileri yukle.

## 3. Audit Log Tablosu
- Dosya: `backend/prisma/tables/http-request-log.prisma`.
- Alanlar: uuid id, occurred_at, user_id, organization_id, roles (text[]), subject_scopes (text[]), ip_address, forwarded_for, user_agent, method, path, status_code, duration_ms, query_json, params_json, body_digest, response_digest, correlation_id.
- Indeksler: occurred_at, user_id, status_code, path, organization_id.
- Migration: `20251001132145_add_http_request_logs/migration.sql` ayrica RLS politikalarini (`http_request_logs_select`, `http_request_logs_insert`, `http_request_logs_delete`) aktif eder ve tabloyu RLS moduna alir.

## 4. Ortam Degiskenleri
```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/badi_db?schema=public"
DATABASE_DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/badi_db?schema=public"
```
- Migration calistirmadan once iki degiskenin de tanimli oldugundan emin ol.
- Localde database yoksa olusturman gerekir; shadow db kullanilmiyor.

Ek audit degiskenleri:
```
AUDIT_LOG_TRANSPORT=command|queue
AUDIT_LOG_QUEUE_URL=redis://localhost:6379
AUDIT_LOG_RETENTION_DAYS=180
AUDIT_LOG_PRUNE_INTERVAL_MINUTES=1440
```

## 5. Komut Ozetleri
- `npm run prisma:generate`: Sema birlesir, Prisma Client yeniden derlenir.
- `npm run prisma:migrate -- --name add_http_request_logs`: Audit tablosu iceren ornek migration komutu.
- `npm run prisma:deploy`: Production ortamlarda migration lari uygulamak icin kullanilir.
- `npm run prisma:seed`: Ornek verilerle veritabani doldurur.
- `npx prisma studio`: Hizli veritabani gezgini.

## 6. Notlar
- `schema.prisma` git takibine alinmaz; script her calistiginda yeniden uretilir.
- Prisma CLI loglarinda DATABASE_DIRECT_URL eksik uyarisi alirsan ortam degiskenlerini kontrol et.
- Audit tablosu RLS sebebiyle oturum icinde `set_config('app.organization_id', ...)` cagrilarina ihtiyac duyar; repository bunu otomatik yapar.
- Prisma 7 ile `prisma.config.ts` kullanimi planlanmali; su an package.json icindeki `prisma` alaninin kullanimi uyarili.

Bu rehber yeni tablo veya indice eklendiginde guncellenmeli, ozellikle audit ve RLS davranislarinda yapilan degisiklikler not edilmelidir.
