# badi Platformu

Bu depo, kurs platformu için backend ve frontend projelerini aynı monorepo içinde barındırır.

## Dizim (Monorepo)
- `backend/`: Feature-Paketli Clean mimarisini izleyen NestJS tabanlı monolit API.
- `frontend/`: Modern web arayüzü (örn. Next.js) için kaynak kodu.
- `ops/`: Dağıtım, izleme ve altyapı ile ilgili betikler.
- `tools/`: Geliştirici araçları ve yardımcı scriptler.
- `config/`: Ortam konfigürasyon şablonları.
- `docs/`: Mimari ve süreç dokümantasyonu.

## Başlangıç Adımları
1. `backend/` ve `frontend/` dizinlerinde bağımlılıkları yükleyin.
2. Ortak konfigürasyon dosyalarını `config/` altından ilgili ortamlara kopyalayın.
3. Ops ve tools klasörlerindeki betikleri kendi süreçlerinize göre güncelleyin.

