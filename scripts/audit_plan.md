# Comprehensive Quality Audit Plan
**The Human Index — user-facing output truth & consistency review**
*Date: 2026-06-05 — Author: Bugra + Claude*

## Bakış Açısı (Revised)

Bu denetimin amacı kullanıcının web sitesinde gördüğü her sayının, her cümlenin, her grafiğin **defensible** olup olmadığını sertifikalandırmak. Engineering iç tutarlılığı önemli ama nihai test: bir okuyucu "ZA composite 60.5 elevated, environmental meta 73" görür ve bunu sorgular — bu sayının izini sürebiliyor muyuz, kanıtla destekleyebiliyor muyuz?

## Kullanıcının Gerçekten Gördüğü 7 Çıktı Türü

| Surface | Içerdiği claim örnekleri | Audit önceliği |
|---|---|---|
| **Composite ranking** | "TR: 51.9 elevated; Top 5: ZA, TR, AR, US, BR" | KRİTİK |
| **Meta-index bars** | "US Technological 80.1, Economic 32.5" | KRİTİK |
| **Indicator card** | "US unemployment 4.2%, source: World Bank 2024-12-31" | KRİTİK |
| **Pulse article** | "AI Job Anxiety 99.7, Daily Screen Time 7h/day" — full paragraph claims | KRİTİK (en görünür hata yüzeyi) |
| **Glossary article** | "Structural unemployment... US rate stands at 4.198% per WB 2025" | YÜKSEK |
| **Research article** | 2,000 kelimelik makale, 8-12 numeric claim | YÜKSEK |
| **Trend sparkline** | "+2.3 since last month" | ORTA (henüz yeterli historic data yok) |

Audit, **bu yedi yüzeyin her birinin ürettiği sayıyı kaynağına kadar takip edebilmek** üzerinden yapılır. Backend internal correctness (örn. divergence detection algoritması) önemli ama kullanıcı bunu görmez — audit'in birinci sırasında değil.

## Sıralama: User-Facing Truth Ekseninde Yeniden

Aşağıdaki sıralama "what user sees first" mantığıyla:

1. **Composite Score Truth** (Phase 3) — Ekranda en büyük yazılan sayı bu. ZA 60.5 doğru mu?
2. **Indicator Value Truth** (Phase 1) — Composite'in girdileri. "US unemployment 4.2%" gerçek mi?
3. **Normalization Defensibility** (Phase 2) — "Unemployment 4.2% → 25 stress" — bu eşleme bir okuyucuya nasıl açıklanır?
4. **Pulse + Glossary + Research Factuality** (Phase 5) — Her sayfada cümle cümle kontrol.
5. **API ↔ Dashboard Consistency** (Phase 6) — User /transparency'e baktığında home'daki ile aynı sayı mı çıkıyor?
6. **Seed Defensibility** (Phase 7) — "Berkeley Earth 2024" diyoruz, gerçekten 2024 mü, gerçekten Berkeley Earth mü?
7. **Cross-Source Disagreement Communication** (Phase 4) — Eğer iki kaynak farklı diyorsa, kullanıcı ne görüyor?
8. Phase 8/9/10 = operational, kullanıcı görmez — secondary.

## "Defensible" sertifikası: her çıktı için ne lazım

Bir sayının "defensible" sayılması için 3 koşul:

1. **Traceable**: Sayı `transparency` API'da bir source + reference_date ile gözükmeli
2. **Reproducible**: O source'un publicly accessible URL'ine gidilince benzer değer çıkmalı (max %2 drift)
3. **Explainable**: Normalize edilmiş stress score'un user'a "5.8% unemployment why is that 25 stress?" sorusuna cevabı olmalı (low/high bound + invert mantığı)

Hangi sayı bu 3'ünden birini geçemiyorsa: audit verdict = NOT DEFENSIBLE → düzeltilmeden UI sprint'e geçilemez.

## Why this audit, why now

Sistem 6 ay önce tek dosyadan 7 domain hesaplıyordu. Şu an 27 indicator × 25 ülke × 6 adapter × per-country content factory × cross-source validation × historical snapshot + 7 public read API koşuyor. Her katmanın kendi başına doğruluğu var, ama uçtan uca bütünlük denetimi yapılmadı. Bir indicator'ın yanlış normalize edilmesi, bir adapter'ın eski/yanlış değer dönmesi, bir composite weighting hatası — bunların hiçbiri TypeScript type check'inde yakalanmaz. Sadece "elle traceback" + "kaynakla karşılaştırma" yöntemiyle ortaya çıkar.

**Hedef:** Kullanıcının ekranında gördüğü her sayının izini kanıtla sürebileceğimiz bir kayıt. Sapma varsa sınıflandırmak (bug / methodology / acceptable drift / stale seed), düzeltme listesi çıkarmak.

**Çıktı:** Düzeltme task'ları + her phase için "passed" işareti. Audit bittiğinde sistem hakkında "bu sayı şuradan geliyor, doğruluğu şu kanıtla teyit edildi" diyebileceğimiz bir kayıt.

## 10 Faz Genel Çerçeve

| Faz | Katman | Test ettiği soru | Çıktı |
|---|---|---|---|
| 1 | Adapter Truth | Her adapter, upstream'in resmi sitesindeki değerle eşleşiyor mu? | Drift report per adapter |
| 2 | Normalization | normalize_low/high bounds her indicator için makul mü? Invert flag'ler doğru yönde mi? | Bounds review table |
| 3 | Composition | Composite, meta-index scores'ın ağırlıklı toplamı mı? Aritmetik doğru mu? | Per-country recompute audit |
| 4 | Divergence triage | Şu an açık warning'ler gerçek methodology farkı mı, yoksa bug mı? | Triage decisions table |
| 5 | Content factuality | Pulse/Glossary/Research içindeki her veri-referansı gerçek snapshot ile eşleşiyor mu? | Spot-check report on 10 content rows |
| 6 | API consistency | Public API'ler, doğrudan tablo okumalarıyla aynı sonucu mu döndürüyor? | API↔DB cross-check |
| 7 | Seed defensibility | Reference seed değerleri (13 indicator) cited kaynaktaki en güncel publication ile eşleşiyor mu? | Seed provenance document |
| 8 | Edge cases | Eksik veri, başarısız adapter, düşük confidence için sistem ne yapıyor? | Failure mode catalog |
| 9 | SEO sanity | sitemap.xml'deki tüm URL'ler 200 mu? hreflang tutarlı mı? canonical doğru mu? | Crawl report |
| 10 | Performance & cost | Cron süre, row count büyümesi, Vercel/Supabase/Claude maliyet trajectory | Cost projection sheet |

---

## Faz 1 — Adapter Truth Test
**Risk:** Adapter doğru endpoint'i çağırıyor olabilir ama upstream şemada değişiklik olmuş, eski field'ı parse ediyor, "succeeded" ama yanlış değer dönüyor.

### Test edilecek
6 production adapter:
- `eurostat` (4 indicator × 11 ülke)
- `worldBank` (14 indicator × 25 ülke)
- `imf` (currently failed, route check)
- `socialFeedComputed` (ai_job_anxiety derivation)
- `oecdHousing` (1 seed indicator)
- `referenceSeed` (13 seed indicator)

### Yöntem
Her adapter için 3 (country, indicator) örneği seç. Resmi upstream'in public viewer'ında değerine bak. Bizim `indicator_values` tablomuzdaki en güncel satır ile karşılaştır.

### Örnek protokol — Eurostat
| Country | Indicator | Eurostat browser'da | Bizim DB | Drift | Verdict |
|---|---|---|---|---|---|
| DE | unemployment_rate | (manuel kontrol) | (SQL'le çek) | % | OK / FLAG |
| FR | youth_unemployment_rate | … | … | … | … |
| IT | gini_index | … | … | … | … |

### Geçer şart
3'te 3 ülke için drift < 0.5% (decimal rounding tolerance). Drift varsa: methodology dürüstlüğü mü (e.g., Eurostat seasonally-adjusted vs raw), yoksa bug mı?

### Süre tahmini: ~3 saat (6 adapter × 30 dk)

---

## Faz 2 — Normalization Sanity Sweep
**Risk:** `normalize_low > normalize_high` ama `normalize_invert=false` (yön karışmış). Bounds çok dar / geniş tutulmuş, gerçek dünya max value sıçradığında stress 100'e yapışıp kalıyor. invert flag yanlış set edilmiş.

### Test edilecek
Tüm 27 active indicator için normalize bounds review.

### Yöntem
Aşağıdaki SQL audit table'ı üret:

```sql
WITH ranges AS (
  SELECT i.id, i.name, i.meta_index, i.unit,
         i.normalize_low, i.normalize_high, i.normalize_invert,
         (SELECT MIN(raw_value) FROM indicator_values WHERE indicator_id = i.id) AS observed_min,
         (SELECT MAX(raw_value) FROM indicator_values WHERE indicator_id = i.id) AS observed_max,
         (SELECT MIN(normalized_value) FROM indicator_values WHERE indicator_id = i.id) AS norm_min,
         (SELECT MAX(normalized_value) FROM indicator_values WHERE indicator_id = i.id) AS norm_max
  FROM indicators i WHERE i.active = true
)
SELECT id, name, meta_index, unit,
       normalize_low, normalize_high, normalize_invert,
       ROUND(observed_min::numeric,2) AS obs_min,
       ROUND(observed_max::numeric,2) AS obs_max,
       norm_min, norm_max,
       CASE
         WHEN observed_min < normalize_low AND NOT normalize_invert THEN 'BOUNDS TOO HIGH'
         WHEN observed_max > normalize_high AND NOT normalize_invert THEN 'CLAMPED HIGH'
         WHEN observed_max < normalize_low THEN 'NO COVERAGE'
         WHEN norm_max - norm_min < 10 THEN 'TIGHT RANGE (low signal)'
         ELSE 'OK'
       END AS verdict
FROM ranges
ORDER BY meta_index, id;
```

### Geçer şart
Hiçbir satırda `verdict != 'OK'` olmamalı. Olursa: bounds'ı genişlet / invert flag'i değiştir / indicator'ı disable et.

### Süre tahmini: 1 saat (query + 30 dk eyeball + 30 dk fix decisions)

---

## Faz 3 — Composite Recomputation
**Risk:** `composeMetaIndex.ts` ağırlıkları yanlış uyguluyor olabilir. Meta-index'lerden bir veya birden fazlasında veri eksikse composite hatalı normalize ediliyor olabilir. Round-off birikiyor.

### Test edilecek
25 ülkenin son composite skoru.

### Yöntem
Her ülke için Excel'de tek tek hesapla:
1. Latest `meta_index_scores` çek (5 satır per ülke)
2. DEFAULT_META_WEIGHTS uygula (economic 0.25, social 0.20, mental 0.20, technological 0.20, environmental 0.15)
3. Sadece `value != NULL` olan meta-index'leri kullan; weight'leri renormalize et (total weight = sum of available weights)
4. Sonucu `country_composite_scores.score_value` ile karşılaştır

### Geçer şart
25/25 ülke için diff < 0.1 (rounding noise). Diff > 0.5 olan ülke için investigation.

### Süre tahmini: 1.5 saat (SQL pull + spreadsheet manual + flag list)

---

## Faz 4 — Cross-Source Divergence Triage
**Risk:** Şu an 4 warning per run var. Bunların bir kısmı gerçek methodology (Eurostat seasonally adjusted vs WB raw), bir kısmı bug (yanlış birim, eski reference date).

### Test edilecek
`v_recent_divergence_streaks`'deki tüm warning + critical pairs.

### Yöntem
Her divergent pair için:
1. Hangi adapter'lar var?
2. Her birinin raw_value + reference_date
3. Upstream'in publicly documented methodology'sini incele
4. Sınıflandır: real methodology / stale data / unit mismatch / actual bug
5. Action: warning suppress / fix bug / accept

### Çıktı şablonu
| Country | Indicator | Adapter A | Adapter B | Diff% | Reason | Action |
|---|---|---|---|---|---|---|
| DE | unemployment | eurostat 5.8% (2024-Q4) | WB 5.5% (2023) | 5.5% | Year drift | Accept (WB lags) |
| ... | ... | ... | ... | ... | ... | ... |

### Süre tahmini: 1 saat (4 warning, ~15 dk her biri)

---

## Faz 5 — Content Factuality Spot Check
**Risk:** Claude content factory hallucination yapabilir. Pulse'ta "composite 47.4" yazıyor ama gerçek değer farklı olabilir; Glossary "structural unemployment 5%" diyor ama snapshot'ta başka değer; Research data_snapshot ile body yazısı çelişiyor olabilir.

### Test edilecek
- 5 Pulse (1 her aktif ülke için)
- 5 Glossary entry (rastgele seç)
- 3 Research article

### Yöntem
Her content rowunu yan yana göster:
- `body_markdown`'da geçen her numeric claim'i çıkar
- O claim'in beklendiği indicator + country + reference_date için snapshot'ta gerçek değeri bul
- Karşılaştır

### Otomasyon imkanı
Numeric claim extraction → regex (`\d{2,3}(?:\.\d)?(?: per\s+\w+|%|\$)`). Sonra `indicator_snapshots` join.

### Geçer şart
Her sample'da %90+ claim doğru. Yanlış olan claim'lerin pattern'i: hangi indicator'da en sık hata?

### Süre tahmini: 3 saat (13 sample × ~15 dk)

---

## Faz 6 — API ↔ DB Consistency
**Risk:** `/api/transparency/US` cevabıyla `v_indicator_source_breakdown` tablosundaki US değerleri aynı olmalı. Eğer farklıysa: caching artifact, RLS filtering, parametrization bug.

### Test edilecek
1. `/api/transparency/US` vs direct SQL
2. `/api/trends/US/unemployment_rate` vs `indicator_snapshots` SQL
3. `/api/glossary?country=US&locale=en&limit=5` vs direct query
4. `/api/pulse/US/<slug>` vs `commentary` row
5. `/api/research/<slug>` vs `research_articles` row

### Geçer şart
Tüm 5 endpoint için: API JSON `entries[0]` ↔ SQL `LIMIT 1` matched.

### Süre tahmini: 1 saat

---

## Faz 7 — Seed Defensibility
**Risk:** 13 reference seed indicator var. Bu değerler "2024 Berkeley Earth", "Gallup 2024", "OECD BLI 2024" diye attribuited ama gerçek source dökümanı şu an mevcut mu, biz son rakamı mı aldık?

### Test edilecek
Reference seed adapter'ındaki tüm 13 indicator × 3 ülke örneklem.

### Yöntem
Her seed entry için provenance kartı yaz:
```
indicator: temperature_anomaly
source: Berkeley Earth 2024
url: http://berkeleyearth.org/data/
expected refresh: annually
latest values (USA, DEU, JPN):
  Berkeley Earth published page: 1.6, 1.7, 1.3
  Our seed:                     1.6, 1.7, 1.3 ✓
last refresh: 2026-06-05 (this commit)
```

13 indicator × 3 spot check = 39 lookup. Eğer drift varsa "stale seed" task açılır.

### Süre tahmini: 4 saat (en zor faz — manuel research yoğun)

---

## Faz 8 — Edge Cases
**Risk:** Sistem happy path'te çalışıyor, ama bir adapter timeout'lerse / bir indicator için 0 ülke veri dönerse / confidence çok düşükse ne oluyor? Bilinmeyen ülke kodu? Eksik locale?

### Test edilecek
| Senaryo | Tetik | Beklenen |
|---|---|---|
| Tüm WB fail | Sandbox curl fail manuel simüle | Composite hala diğer adapter ile compose ediyor |
| Confidence < 0.5 | Test ülke seç, indicator coverage 30% | Pulse skipped, dashboard'da "low coverage" badge |
| Eksik (country, indicator) | NL ai_job_anxiety yok | Composite NULL contribute, weight renormalize |
| Bilinmeyen country | /api/transparency/XX | 404 returned, no crash |
| Geçersiz slug | /api/glossary/'; DROP-- | 400 invalid slug |

### Süre tahmini: 2 saat (her senaryo ~25 dk)

---

## Faz 9 — SEO Sanity Crawl
**Risk:** Sitemap'tan rastgele 20 URL'i crawl et, hangileri 200 dönüyor, hangileri 404 / 5xx?

### Test edilecek
Bash script: sitemap.xml indir, 20 rastgele URL çek, HTTP status + content-type + hreflang count'u kaydet.

### Bonus
- `www.thehumanindex.org/` → apex redirect'i var mı? (currently NO — şu an issue)
- Per-page canonical doğru mu?
- Hreflang tag'i her sayfada apex'i referans mı veriyor?

### Süre tahmini: 30 dk

---

## Faz 10 — Performance & Cost Projection
**Risk:** Tablo büyüme hızı vs Supabase tier limiti. Vercel function süresi limit (60s). Claude CLI maliyet trajectory (Max sub, ama PD batch hızla token tüketebilir).

### Test edilecek
| Boyut | Şu an | Yıllık projeksiyon | Limit | Marj |
|---|---|---|---|---|
| indicator_values rows | ~? | … | Free 500MB | … |
| indicator_snapshots rows | ~735/gün | 268k/yıl | … | … |
| cross_source_validations | 40/run × 12/gün = 480/gün | 175k/yıl | … | … |
| commentary | ~17 toplam → 60/hafta target | 3,120/yıl | unlimited | OK |
| Cron süre | (Vercel log) | trend | 60s | … |
| Claude tokens/batch | (PD log) | quota | Max sub | … |

### Süre tahmini: 1 saat (logs read + sheet)

---

## Önerilen Execution Sırası (User-Output Truth Eksenli)

Üç farklı tempo seçeneği — hepsi kullanıcı-görür sayıyı önceleyecek şekilde dizilmiş:

### A) "First Page Truth" — 1 günde (6-8 saat)
**Hedef:** Bir gazeteci/araştırmacı bugün siteye girse ve homepage'i ekran almak için açtığında orada gördüğü 5 sayıyı bana sorsa, "şuradan geldi, doğru" cevabı verebilmek.

Sırayla:
1. **Phase 3** (Composite Recompute) — ZA 60.5, TR 51.9, US 47.4 vb. doğru hesaplanmış mı? *(1.5 saat)*
2. **Phase 2** (Normalization Sanity) — Her indicator için low/high bounds defensible mi? *(1 saat)*
3. **Phase 1** (Adapter Truth — partial, sadece WB + Eurostat) — En çok kullanılan iki adapter için 6 spot check. *(2 saat)*
4. **Phase 6** (API ↔ DB consistency) — Transparency endpoint için 3 ülke. *(1 saat)*

Çıktı: "Today's homepage composite ranking ve top 5 indicator value'su defensible" sertifikası.

### B) "Article Truth" — 2 gün (10-12 saat)
A + aşağıdakiler:
5. **Phase 5** (Content Factuality — Pulse + Glossary spot check) — 10 sample, claim-by-claim. *(3 saat)*
6. **Phase 7** (Seed Defensibility — top 5 most-cited seed) — Berkeley Earth, IHME GBD, McKinsey, Gallup, WRI. *(3 saat)*

Çıktı: "Bir okur ZA pulse'ını okuyup tüm sayıları sorgulayabilir, biz cevap verebiliriz" sertifikası.

### C) "Full Certification" — 4-5 gün (20+ saat)
Sırayla **3 → 2 → 1 → 6 → 5 → 7 → 4 → 8 → 9 → 10**. Her phase için artifact + pass/fail verdict + finding'lerin tek tek action item olarak açılması. UI sprint öncesi sertifika düzeyinde audit.

---

## Çıktılar (artifacts produced by this audit)

1. `scripts/audit_phase1_adapter_truth.md` — table per adapter
2. `scripts/audit_phase2_normalization.sql` — bounds review query
3. `scripts/audit_phase3_composite_recompute.xlsx` — manual recompute
4. `scripts/audit_phase4_divergence_triage.md` — warning decisions
5. `scripts/audit_phase5_content_factuality.md` — claim-by-claim check
6. `scripts/audit_phase6_api_consistency.sh` — auto API↔DB diff
7. `scripts/audit_phase7_seed_provenance.md` — citation card per seed
8. `scripts/audit_phase8_edge_cases.md` — failure mode catalog
9. `scripts/audit_phase9_seo_crawl.sh` — sitemap crawl + status report
10. `scripts/audit_phase10_capacity.md` — cost projection sheet

## Action items oluşturma

Her phase için bulunan issue'lar `audit_findings/<phase>_<short>.md` formatında ayrı dosyaya yazılır:
- Severity (critical / high / medium / low)
- Description + reproduction steps
- Suggested fix
- Owner (Bugra için fix mi, accept ile mi kapanıyor?)

Phase tamamlanınca status: ✓ Passed / ⚠ Issues found / ✗ Blocked.

---

## Bu plan ne diyor

Şu an sistem **deploy edilmiş ama denetimsiz**. Eski v1.0'da tek algoritma + tek source vardı, hata yapılması zordu. Şu an 27 indicator × 6 adapter × 5 meta × 2 composition layer × 1 content factory = ~32 ayrı işlem zinciri var. Tek bir noktada %5 hata olsa, son composite skor %5+ yanılır ve okuyucu "yanlış" bir Türkiye-Almanya karşılaştırması okur.

Audit, "hangi katmanda ne kadar güvenebiliriz" sorusuna kanıtla cevap verecek bir yapılandırma. UI sprint öncesi yapmak, frontend'in inşa edileceği substrate'i sağlam sertifikalı bir hale getirir.

---

## Sıradaki adım

Karar:
- **A (1 gün hızlı):** Hangi phase'lerden başlayacağımızı söyle, ben hemen Faz 9'dan başlayıp ilerleyeyim.
- **B (3 gün tam):** Sırayla 1'den 10'a, her birinin artifact'ını üretip "pass" işareti vermeden bir sonrakine geçmeyelim.
- **C (hibrit):** Önce A'nın 5 fazı, sonra 5+7 derinlik.

Hangisini istiyorsun?
