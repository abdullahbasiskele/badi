# Kurs Platformu Mimari Degerlendirme (2025 Revizyonu)

> Kaynak: docs/main.md. Bu rapor guncel kod durumuna gore guncellendi.

## 1. Mimari Genel Bakis
- Monolitik yapi Vertical Slice Architecture ve CQRS/Mediator kaliplari ile calisiyor.
- AppModule seviyesinde CqrsModule aktif; AppCommandBus ve AppQueryBus pipeline davranislarini sagliyor.
- Audit log slice eklendi: HttpRequestLoggingInterceptor tum istekleri kaydediyor, AuditTrailService komut bus i veya BullMQ uzerinden islemleri dagitabiliyor.
- Teknoloji yigininda Node.js 22, NestJS 11, PostgreSQL 18, Prisma 6, BullMQ ve Valkey destegi yer aliyor.
- Kimlik yonetimi Keycloak broker ve Passkey stratejisi uzerine kurulu; CASL + PostgreSQL RLS ile iki katmanli yetki kontrolu mevcut.

## 2. Guclu Yonler
- Tutarsiz pipeline boslugu kapandi: AppCommandBus validation ve transaction davranislarini garanti altina aliyor.
- Audit altyapisi: HttpRequestLogFactory PII maskeleme yapiyor, retention komutu veri saklama politikasini destekliyor.
- Yetkilendirme uyumu: AbilityFactory audit tablosu dahil tum subject ler icin kural uretiyor; PoliciesGuard yeni subject i destekleyecek sekilde genisletildi.
- Frontend entegrasyonu: apiFetch otomatik refresh akisini destekliyor; RoleGuard sayfa bazli kontroller icin kullanimda.

## 3. Riskler ve Acik Alanlar
- DB baglantisi: Prisma migration calistirilirken DATABASE_DIRECT_URL eksik olabiliyor; dokumantasyonda acikca belirtilmeli.
- BullMQ operasyonu: Queue baglantisi opsiyonel; production icin yeniden baglanma ve alert kurallari tanimlanmadi.
- Observability: OpenTelemetry planlandi fakat collector ve dashboard hazir degil.
- KVKK: Veri saklama matrisi tum domainler icin tamamlanmadi; audit retention 180 gun varsayimiyla sinirli.
- Test kapsam genislemesi: Audit sorgulari ve CASL/RLS regression testleri henuz hazir degil.

## 4. Kisa ve Orta Vadeli Oneriler
- Migration surecini belgelemek icin `DATABASE_URL` ve `DATABASE_DIRECT_URL` orneklerini `.env.example` dosyalarina ekle.
- Audit log listeleme sorgusu icin pagination + filtre contract testleri yaz.
- BullMQ baglantisi icin retry/alert kurallari ve `audit-log` kuyruu worker capacitesi planla.
- OpenTelemetry ve dashboard calismalarina baslamak icin observability ekibiyle sync yap.
- CASL/RLS performans testlerini EXPLAIN ANALYZE ile olc, indeks stratejisini audit tablosu icin belge.

## 5. Acik Sorulara Yanitlar
1. SLA/SLO: Standart web hedefleri (uptime %99, p95 < 500 ms) gecici olarak kullaniliyor.
2. Kapsam: Ilk faz tek kurum; 40k-50k vatandas hedefi korunuyor.
3. Entegrasyon: e Devlet disinda odeme entegrasyonu planlanmiyor.
4. Operasyon modeli: Mesai ici destek; audit log retention job u hatalara karsi izlenmeli.
5. Keycloak sorumlulugu: Tema/SPI gelistirme kurum icindeki ekibe ait.

## 6. Sonraki Adimlar
- Paydaslarla bu raporu paylasip backlog durumlarini guncelle.
- Audit log pipeline ini staging ortaminda test et; BullMQ ve komut modlari arasindaki farklari izole et.
- OpenTelemetry ve dashboard calismalarina baslamak icin observability ekibiyle sync yap.
- KVKK planini guncelleyerek audit retention ve diger veri siniflarini ayni tabloya tasla.

Bu degerlendirme her sprint sonunda tekrar gozden gecirilmeli ve yeni slice lar eklendikce guncellenmelidir.
