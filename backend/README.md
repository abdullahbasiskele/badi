# Backend (Feature-Paketli Clean)

Bu klasör, kurs platformu API'sini barındırır. NestJS + Node.js 22 hedeflenmiştir.

## Yapı
- `src/features/<feature>/`: Her dilim için domain, application, infrastructure, presentation ve test alt klasörleri.
- `src/shared/`: Ortak altyapı, mediator ve pipeline davranışları.
- `src/config/`: Ortam dosyaları ve migration betikleri.
- `prisma/`: Veri modeli ve migration dosyaları.
- `scripts/`: CLI ve bakım scriptleri.
- `tests/e2e/`: Uçtan uca testler.

