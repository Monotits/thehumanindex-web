# Content Batch Fill Runbook (J2)

The Human Index — content factory'i hızlı doldurmak için tek-seferlik adımlar.

## 0. Önce: PD env config

PD'nin `.env` dosyasına ekle veya export et:

```bash
# Per-country Pulse Supabase'e auto-publish etsin
THI_PULSE_AUTO_PUBLISH=true

# Pulse'lar hangi locale'lerde üretilsin (virgülle ayrılmış)
THI_PULSE_LOCALES=en,tr

# Supabase service role key (push için gerekli, varsa atla)
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

Sonra PD'yi yeniden başlat:

```bash
cd ~/Desktop/Umay.dev/PD/PD
# Mevcut process'i durdur (Ctrl+C) ve:
npm run dev:server
# veya prod:
npm start
```

## 1. Status check (her şey çalışıyor mu?)

```bash
curl -s http://localhost:3001/api/thi/status | python3 -m json.tool
curl -s http://localhost:3001/api/glossary/status | python3 -m json.tool
curl -s http://localhost:3001/api/research/status | python3 -m json.tool
```

## 2. Glossary batch fire (5 paralel hedef, ~25 dk total)

Backend'in 22 indicator + 5 meta + 25 ülke matrisi için glossary terimleri kritik —
SEO için ana SERP zenginleştirme katmanı. Aşağıdaki sıra ile fire et:

```bash
# US/en — en yüksek arama hacmi
curl -X POST http://localhost:3001/api/glossary/run \
  -H "Content-Type: application/json" \
  -d '{"locale":"en","countryCode":"US","countryName":"United States","limit":8}'
# (~4 dk, 8 entry)

# GB/en
curl -X POST http://localhost:3001/api/glossary/run \
  -H "Content-Type: application/json" \
  -d '{"locale":"en","countryCode":"GB","countryName":"United Kingdom","limit":8}'

# DE/en (Almanya teknik kitlesi İngilizce de okuyor)
curl -X POST http://localhost:3001/api/glossary/run \
  -H "Content-Type: application/json" \
  -d '{"locale":"en","countryCode":"DE","countryName":"Germany","limit":8}'

# JP/en
curl -X POST http://localhost:3001/api/glossary/run \
  -H "Content-Type: application/json" \
  -d '{"locale":"en","countryCode":"JP","countryName":"Japan","limit":8}'

# global/en — country-neutral baseline (en geniş hedef kitle)
curl -X POST http://localhost:3001/api/glossary/run \
  -H "Content-Type: application/json" \
  -d '{"locale":"en","countryCode":"global","limit":8}'
```

İkinci turun: aynı 5'i `locale=tr` ile, country-name'i Türkçe vererek:

```bash
curl -X POST http://localhost:3001/api/glossary/run \
  -d '{"locale":"tr","countryCode":"US","countryName":"ABD","limit":8}' \
  -H "Content-Type: application/json"

curl -X POST http://localhost:3001/api/glossary/run \
  -d '{"locale":"tr","countryCode":"GB","countryName":"Birleşik Krallık","limit":8}' \
  -H "Content-Type: application/json"

curl -X POST http://localhost:3001/api/glossary/run \
  -d '{"locale":"tr","countryCode":"DE","countryName":"Almanya","limit":8}' \
  -H "Content-Type: application/json"

curl -X POST http://localhost:3001/api/glossary/run \
  -d '{"locale":"tr","countryCode":"JP","countryName":"Japonya","limit":8}' \
  -H "Content-Type: application/json"

curl -X POST http://localhost:3001/api/glossary/run \
  -d '{"locale":"tr","countryCode":"global","limit":8}' \
  -H "Content-Type: application/json"
```

**Beklenen kazanım**: 10 batch × 8 = ~80 yeni glossary entry. Mevcut 5 + 80 = 85 entry.

## 3. Research batch fire (5 makale, ~25 dk total)

Her POST tek bir makale üretir (1500-2500 word). 12 topic rotasyonu var, en
yüksek değerlilerini önden fire edelim:

```bash
# global/en — en geniş kitle
curl -X POST http://localhost:3001/api/research/run \
  -H "Content-Type: application/json" \
  -d '{"locale":"en","countryCode":"global"}'

curl -X POST http://localhost:3001/api/research/run \
  -H "Content-Type: application/json" \
  -d '{"locale":"en","countryCode":"US","countryName":"United States"}'

curl -X POST http://localhost:3001/api/research/run \
  -H "Content-Type: application/json" \
  -d '{"locale":"en","countryCode":"GB","countryName":"United Kingdom"}'

curl -X POST http://localhost:3001/api/research/run \
  -H "Content-Type: application/json" \
  -d '{"locale":"en","countryCode":"DE","countryName":"Germany"}'

curl -X POST http://localhost:3001/api/research/run \
  -H "Content-Type: application/json" \
  -d '{"locale":"en","countryCode":"JP","countryName":"Japan"}'
```

**Beklenen kazanım**: 5 makale (her biri ayrı topic). Mevcut 1 + 5 = 6 makale.

## 4. Per-country Pulse fire (manuel batch)

PD'ye yeni eklenen `POST /api/thi/generate-country-pulse` endpoint'i ile:

```bash
# Tüm pulse_active=true ülkeler × en + tr (5 × 2 = 10 pulse, ~5 dk)
curl -X POST http://localhost:3001/api/thi/generate-country-pulse \
  -H "Content-Type: application/json" \
  -d '{"locales":["en","tr"],"publish":true}'

# Veya tek bir ülke + tek locale (test için):
curl -X POST http://localhost:3001/api/thi/generate-country-pulse \
  -H "Content-Type: application/json" \
  -d '{"countryCode":"US","locale":"en","publish":true}'

# Dry-run (Supabase'e push etmeden sadece üret):
curl -X POST http://localhost:3001/api/thi/generate-country-pulse \
  -H "Content-Type: application/json" \
  -d '{"countryCode":"DE","locale":"en","publish":false}'
```

Endpoint çıktısı: `{ summary: { published, drafted, failed }, results: [...] }`

## 5. Audit query'yi yeniden çalıştır

Batch'ler bittikten sonra `scripts/content_audit.sql`'i Supabase SQL Editor'de tekrar
çalıştır. Şu büyüme beklenir:

- Glossary: 5 → ~85 entry
- Research: 1 → 6 makale
- Pulse: değişmez (Pazartesi'ye kadar)

## 6. Beklenen sorunlar ve çözümleri

**Issue**: PD `claude` CLI bulamıyor → glossary/research generator fail eder.
**Çözüm**: PD env'de `CLAUDE_CLI=/path/to/claude` set et ya da `PATH`'i export et.

**Issue**: Supabase RLS REST insert'ü reddediyor → glossary INSERT failed.
**Çözüm**: PD env'de `SUPABASE_SERVICE_ROLE_KEY` set olmalı (anon key INSERT yapamaz).

**Issue**: Slug conflict — "all 33 terms already present for X/Y".
**Çözüm**: Beklenen davranış. Glossary terimleri (locale, country) bazında unique;
bir batch çalıştırıldıktan sonra aynı (locale, country) tekrar fire edilirse skip eder.
Yeni batch yapmak için yeni bir (locale, country) seç.

**Issue**: Vercel'deki `/api/glossary/...` 404 dönüyor.
**Çözüm**: Glossary endpoint yok (henüz). Frontend Supabase'i doğrudan okuyacak veya
yeni bir public API yazılacak. UI sprint'inde plan.
