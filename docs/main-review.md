# Kurs Platformu Mimari Değerlendirme (2025 Revizyonu)

> Kaynak: docs/main.md. Bu değerlendirme Codex tarafından hazırlanmıştır.

## 1. Mimari Genel Bakış
- Monolitik yapı, Vertical Slice Architecture (VSA) ve CQRS/Mediator desenleriyle organize edilmiş.
- Teknoloji yığını: Node.js 22, NestJS 11, PostgreSQL 18, Prisma 6; önbellek olarak Valkey/Redis; arka plan işler için BullMQ veya PostgreSQL tabanlı çözümler.
- Kimlik yönetimi: Keycloak üzerinden OIDC/SAML broker, Passkey öncelikli oturum açma, e-Devlet entegrasyonu seçeneği.
- Yetkilendirme: CASL tabanlı ABAC kuralları + PostgreSQL Row Level Security (RLS); audit ve OpenTelemetry ile desteklenen gözlemlenebilirlik.
- Yol haritası: Çekirdek altyapı, etki alanı (kurs/kayıt) özellikleri, raporlama ve uyum sertleştirmesi gibi aşamalara bölünmüş.

## 2. Güçlü Yönler
- **Net hedef mimari:** VSA + CQRS, Repository/UoW gibi desenler ve kullanılan sürümler açıkça belirtilmiş.
- **Çok katmanlı güvenlik:** Passkey, CASL, RLS, audit loglama ve token yönetimiyle savunma hattı güçlendirilmiş.
- **Operasyonel farkındalık:** OpenTelemetry, yapılandırılmış loglama, önbellek ısındırma ve yedekleme/DR planları dokümante edilmiş.
- **Sözleşme odaklı geliştirme:** OpenAPI 3.2, Spectral lint, test piramidi ve CI/CD adımları netleştirilmiş.
- **Gerçekçi yol haritası:** 6-8 haftalık sprint yapısı altyapı › domain özellikleri › sertleştirme sırasını mantıklı kılıyor.

## 3. Riskler ve Eksik Bölgeler
- **Kimlik/Yetki karmaşıklığı:** Passkey + Keycloak + e-Devlet akışı kullanıcı deneyimi ve kurtarma senaryoları için detaylandırılmalı.
- **CASL + RLS performansı:** İnce taneli politikalar sorguları ağırlaştırabilir; indeksleme notu mevcut ancak ölçüm planı yok.
- **CQRS uygulama boşluğu:** AppModule düzeyinde mediator boru hattı henüz devreye alınmadı; komut/sorgu handler'ları ortak pipeline davranışlarını (validation, logging, transaction) paylaşmıyor.
- **Önbellek ve kuyruk seçimi:** Valkey/Redis ile PostgreSQL tabanlı alternatif arasında karar kriterleri belirtilmemiş.
- **Gözlemlenebilirlik kapsamı:** İzleme (tracing) tanımlanmış olsa da metrik, uyarı, SLO ve incident süreçleri eksik.
- **KVKK uygulaması:** PII ayrıştırma vurgulanmış; ancak veri sınıflandırması, DSR otomasyonu ve anahtar yenileme politikaları net değil.
- **Test kapsaması:** Yüzdelik hedefler var fakat CASL kuralları, RLS politikaları, asenkron işler için somut test senaryoları tanımlanmamış.

## 4. Geliştirme Önerileri
### Kısa Vadede (uygulama öncesi)
- Passkey, cihaz kurtarma ve yetkilendirilmiş yönetici akışları için sıralı diyagramlar üret; Keycloak konfigürasyonunu doğrula.
- CASL politikaları ile eşleşen örnek RLS kurallarını yaz ve kritik sorgular için `EXPLAIN ANALYZE` çalıştır.
- Valkey/Redis ile PostgreSQL tabanlı kuyruk arasında seçim matrisi oluştur; DevOps sorumlulukları ve işletim maliyetlerini netleştir.
- OpenAPI sözleşmesine hata gövdeleri (`problem+json`), sayfalama/süzme parametre şablonları ekle.

### Orta Vadede (geliştirme sırasında)
- CASL + Prisma için otomatik politika testleri ve paylaşılabilir fixture setleri hazırla; kapsam genişledikçe regresyonu önle.
- Önbellek/kuyruk ve Keycloak kesintileri için dayanıklılık senaryoları (chaos testleri, gecikme simülasyonları) uygula.
- Ürün metriklerini (başvuru › onay dönüşü, eğitmen onboarding) teknik metriklerle birlikte izlemeye başla.
- KVKK uyumu için veri saklama matrisi ve otomatik silme/bulanıklaştırma iş akışları tasarla.

### Uzun Vadede (canlı sonrası)
- Monolitin sınırlarını düzenli gözden geçir; olası servis ayrıştırmaları için kriterler belirle.
- Feature flag/toggle altyapısı kurarak yüksek riskli değişiklikleri kontrollü yayımla.
- Performans, güvenlik ve bağımlılık güncellemeleri için üç aylık mimari sağlık kontrolleri planla.

## 5. Açık Sorular ve Yanıtlar
1. **SLA/SLO beklentileri:** Şimdilik standart uygulama hedefleri (ör. %99 uptime, p95 < 500 ms) referans alınabilir; özel bir seviye belirlenmedi.
2. **Kapsam ve büyüme:** İlk aşamada tek kurum; yaklaşık 100 kurum personeli ve 40.000-50.000 vatandaşa hizmet verilmesi öngörülüyor.
3. **Entegrasyon kapsamı:** e-Devlet girişinin dışında ödeme ya da diğer dış sistem entegrasyonu planlanmıyor.
4. **Operasyon modeli:** Operasyon ekibi mesai saatleri içinde destek verecek; 7/24 nöbet planı şimdilik yok.
5. **Keycloak yönetimi:** Tema/SPI dahil tüm özelleştirmeler kurum içindeki müdür ve iki yazılımcı tarafından yürütülecek.

## 6. Önerilen İleri Adımlar
- Bu değerlendirmeyi paydaşlarla gözden geçirip kabul edilen aksiyonları backlog kalemlerine dönüştür.
- Kimlik akışları ve CASL + RLS performansı için PoC çalışmalarını önceliklendir; resmi geliştirme öncesi risk azalt.
- Güvenlik ve KVKK ekipleriyle erken eşleşerek denetim, saklama ve audit gereksinimlerini sprint planına yerleştir.
- Teknik (p95, hata oranı) ve iş metriklerini (kurs tamamlama, eğitmen memnuniyeti) aynı tabloda takip eden dashboard hazırla.



