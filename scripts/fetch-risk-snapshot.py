#!/usr/bin/env python3
"""
Fetch monthly country risk indices into data/live/risk-indices.json:
  - GPR: Caldara & Iacoviello Geopolitical Risk Index, country-specific
         (GPRC_<ISO3>), https://www.matteoiacoviello.com/gpr.htm
  - EPU: Economic Policy Uncertainty, country indices,
         https://www.policyuncertainty.com/all_country_data.html
Runs in GitHub Actions (.github/workflows/oecd-snapshot.yml). Deterministic
output; refuses to overwrite with a near-empty result.
"""
import io, json, os, sys, time, urllib.request
import pandas as pd

OUT = sys.argv[1] if len(sys.argv) > 1 else 'data/live/risk-indices.json'
ISO3_TO_ISO2 = dict(ARG='AR', AUS='AU', BRA='BR', CAN='CA', FRA='FR', DEU='DE', IND='IN', ISR='IL', ITA='IT',
                    JPN='JP', MEX='MX', NLD='NL', NZL='NZ', NOR='NO', POL='PL', SGP='SG', ZAF='ZA', KOR='KR',
                    ESP='ES', SWE='SE', CHE='CH', TUR='TR', ARE='AE', GBR='GB', USA='US')
EPU_NAMES = {'Australia': 'AU', 'Brazil': 'BR', 'Canada': 'CA', 'France': 'FR', 'Germany': 'DE', 'India': 'IN',
             'Italy': 'IT', 'Japan': 'JP', 'Korea': 'KR', 'South Korea': 'KR', 'Mexico': 'MX', 'Netherlands': 'NL',
             'Singapore': 'SG', 'Spain': 'ES', 'Sweden': 'SE', 'UK': 'GB', 'United Kingdom': 'GB', 'US': 'US',
             'United States': 'US', 'USA': 'US', 'Switzerland': 'CH', 'Turkey': 'TR', 'Poland': 'PL',
             'Israel': 'IL', 'Argentina': 'AR', 'Norway': 'NO', 'New Zealand': 'NZ', 'South Africa': 'ZA'}
FROM = 2000

def get(url):
    last = None
    for i in range(5):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'TheHumanIndex/2.0 (+https://thehumanindex.org/data-sources)'})
            return urllib.request.urlopen(req, timeout=60).read()
        except Exception as e:
            last = e
            time.sleep(3 * 2 ** i)
    raise last

out = {'source': {'gpr': 'Caldara & Iacoviello GPR (country-specific)', 'epu': 'Baker, Bloom & Davis EPU (country indices)'}, 'gpr': {}, 'epu': {}}

# ── GPR ──
try:
    df = pd.read_excel(io.BytesIO(get('https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls')))
    print('GPR columns:', [c for c in df.columns][:12], '... total', len(df.columns))
    mcol = next(c for c in df.columns if str(c).lower() in ('month', 'date'))
    df[mcol] = pd.to_datetime(df[mcol])
    for col in df.columns:
        s = str(col)
        if s.startswith('GPRC_') and s[5:] in ISO3_TO_ISO2:
            ser = df[[mcol, col]].dropna()
            ser = ser[ser[mcol].dt.year >= FROM]
            out['gpr'][ISO3_TO_ISO2[s[5:]]] = [[d.strftime('%Y-%m'), round(float(v), 4)] for d, v in zip(ser[mcol], ser[col])]
    print('GPR countries:', sorted(out['gpr']))
except Exception as e:
    print('GPR failed:', e)

# ── EPU ──
try:
    raw = get('https://www.policyuncertainty.com/media/All_Country_Data.xlsx')
    df = pd.read_excel(io.BytesIO(raw))
    print('EPU columns:', list(df.columns))
    df = df[pd.to_numeric(df['Year'], errors='coerce').notna()]
    df['Year'] = df['Year'].astype(int); df['Month'] = pd.to_numeric(df['Month'], errors='coerce')
    df = df[df['Month'].notna() & (df['Year'] >= FROM)]
    for col in df.columns:
        cc = EPU_NAMES.get(str(col).strip())
        if not cc:
            continue
        ser = df[['Year', 'Month', col]].copy()
        ser[col] = pd.to_numeric(ser[col], errors='coerce')
        ser = ser.dropna()
        out['epu'][cc] = [[f'{int(y):04d}-{int(m):02d}', round(float(v), 4)] for y, m, v in zip(ser['Year'], ser['Month'], ser[col])]
    print('EPU countries:', sorted(out['epu']))
except Exception as e:
    print('EPU failed:', e)

if len(out['gpr']) < 10 and len(out['epu']) < 10:
    sys.exit('risk indices: too few countries — refusing to overwrite')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w') as f:
    json.dump(out, f, separators=(',', ':'))
    f.write('\n')
print('wrote', OUT)
