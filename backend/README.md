# Backend (Feature-Paketli Clean)

Bu klasör, kurs platformu API''sini barındırır. NestJS + Node.js 22 hedeflenmiştir.

## Yapı
- `src/features/<feature>/`: Her dilim için domain, application, infrastructure, presentation ve test alt klasörleri.
- `src/shared/`: Ortak altyapı, mediator ve pipeline davranışları.
- `src/config/`: Ortam dosyaları ve migration betikleri.
- `prisma/`: Veri modeli ve migration dosyaları.
  - `schema.base.prisma`: yalnızca generator/datasource tanımları.
  - `enums/*.prisma`: enum tanımları.
  - `tables/<Model>.prisma`: her tablo için ayrı şema dosyası.
  - `scripts/prisma/build-schema.mjs`: Prisma çalıştırmadan önce şemayı birleştirir.
- `scripts/`: CLI ve bakım scriptleri.
- `tests/e2e/`: Uçtan uca testler (şimdilik boş).

## Komutlar
- `npm run start:dev`: Lokal geliştirme sunucusu.
- `npm run prisma:generate`: Parçalı şemadan birleşik dosya üretir ve Prisma Client oluşturur.
- `npm run prisma:migrate`: Şema birleşimini çalıştırıp migration oluşturur.
- `npm run prisma:deploy`: Migration''ları production ortamına uygular.
- `npm run prisma:studio`: Prisma Studio''yu açar (önce şema birleştirilir).

