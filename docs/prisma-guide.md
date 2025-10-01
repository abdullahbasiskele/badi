# Prisma ve Veritabanı Rehberi

Bu doküman, Badi backend monoreposu içinde Prisma ORM ve PostgreSQL şemasının nasıl yapılandırıldığını anlatır.

## Dosya Yapısı
- `backend/prisma/schema.base.prisma`: Sadece Prisma `generator` ve `datasource` tanımlarını içerir. Provider (`postgresql`) ve bağlantı env değişkenleri burada ayarlanır.
- `backend/prisma/enums/*.prisma`: Enum tanımlarını barındıran dosyalar. Örnek: `enums.prisma` içinde `EnrollmentStatus`, `LessonDeliveryMode`, `RoleKey`.
- `backend/prisma/tables/<Model>.prisma`: Her tablo için tek dosya. Örneğin `user.prisma`, `course.prisma`, `refresh-token.prisma`.
- `backend/scripts/prisma/build-schema.mjs`: Üstteki dosyaları birleştirip otomatik olarak `backend/prisma/schema.prisma` dosyasını üretir.
- `backend/prisma/schema.prisma`: **Otomatik üretilen** birleşik dosya. Prisma CLI komutları bu dosyayı kullanır. Doğrudan düzenlenmez.
- `backend/prisma/migrations/`: Migration geçmişi. `npm run prisma:migrate -- --name <isim>` komutları burada yeni klasör oluşturur.
- `backend/prisma/seed.ts`: Prisma Client ile örnek veri (organization, roller, kullanıcılar, kurs/lesson) oluşturan seed betiği.

## Çalışma Akışı
1. **Şema Düzenleme**
   - İlgili tablo dosyasını (`tables/<Model>.prisma`) veya enum dosyasını güncelle.
   - `schema.base.prisma` yalnızca generator/datasource içindir; model tanımı ekleme.

2. **Birleştirme ve Doğrulama**
   - `npm run prisma:generate`
     - `scripts/prisma/build-schema.mjs` tetiklenir, `schema.prisma` yeniden oluşturulur.
     - Prisma Client (`@prisma/client`) yeniden üretilir.
   - `npx prisma validate` ile şemanın sintaksını doğrulayabilirsin.

3. **Migration Üretme**
   - İlk migration: `npm run prisma:migrate -- --name init`
   - Yeni değişiklikler için benzer isimle yeni migration komutu.
   - Komut çalışmazsa log mesajlarında shadow DB uyarılarını incele. Gerekirse `.env`de `DATABASE_URL` ve `DATABASE_DIRECT_URL` doğru tanımlı mı kontrol et.

4. **Seed (Örnek Veri)**
   - `npm run prisma:seed`
     - Şemayı yeniden birleştirir.
     - `prisma db seed` ile `prisma/seed.ts` betiğini çalıştırır.
     - Betik önce veritabanını boşaltır, ardından organizasyon, roller, izinler, kullanıcı, kurs, lesson ve enrollment kayıtları ekler.

## .env Değişkenleri
```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/badi_db?schema=public"
DATABASE_DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/badi_db?schema=public"
```
- Migration veya Prisma CLI komutları bu bağlantıları kullanır.
- Shadow DB kullanılmıyor; bu nedenle PostgreSQL düşeyinde `badi_db` veritabanı önceden var olmalı.

## Komut Özeti
- `npm run prisma:generate`: Şemayı birleştirir, Prisma Client üretir.
- `npm run prisma:migrate -- --name <ad>`: Yeni migration oluşturur ve uygular.
- `npm run prisma:deploy`: Production ortamda migration’ları uygular (önce script birleşimi yapılır).
- `npm run prisma:seed`: Veritabanını örnek verilerle doldurur.
- `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`: El ile SQL diff elde etmek için yardımcı komut.

## Notlar
- `schema.prisma` dosyasını git takibine almıyoruz; script her komut öncesi üretir.
- `prisma` alanı `package.json` içinde deklare edildi ancak Prisma 7 ile `prisma.config.ts` kullanımı öneriliyor; ileride geçiş planlanmalı.
- Seed betiginde parolalar Argon2 ile hashlenir ve refresh token sirri hashli saklanir; yer tutucu `demo-hash` artik kullanilmiyor.
- Migration isimleri zaman damgasıyla oluştu (`20250930073220_init` vb.); ortak çalışmalarda merge sırasında dikkat edilmeli.
