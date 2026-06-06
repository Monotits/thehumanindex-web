import { createClient } from '@supabase/supabase-js';
import { QuizExperience } from './QuizExperience';
import type { MetaIndex } from '@/lib/ui/tokens';

export const dynamic = 'force-dynamic';

export interface QuizCountry {
  code: string;
  name: string;
  flag_emoji: string | null;
  composite: number | null;
  meta: Partial<Record<MetaIndex, number>>;
}

async function loadCountries(): Promise<QuizCountry[]> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return [];
  const sb = createClient(sbUrl, sbKey);

  const [countriesRes, compositesRes, metaRes] = await Promise.all([
    sb.from('countries').select('code, name, flag_emoji').eq('active', true).order('name'),
    sb.from('v_country_latest_composite').select('country_code, score_value'),
    sb.from('v_country_latest_meta_indexes').select('country_code, meta_index, value'),
  ]);

  const compositeByCC = new Map<string, number>();
  for (const r of (compositesRes.data ?? []) as Array<{ country_code: string; score_value: number }>) {
    compositeByCC.set(r.country_code, r.score_value);
  }

  const metaByCC = new Map<string, Partial<Record<MetaIndex, number>>>();
  for (const r of (metaRes.data ?? []) as Array<{
    country_code: string;
    meta_index: MetaIndex;
    value: number | null;
  }>) {
    if (r.value === null) continue;
    if (!metaByCC.has(r.country_code)) metaByCC.set(r.country_code, {});
    metaByCC.get(r.country_code)![r.meta_index] = r.value;
  }

  return ((countriesRes.data ?? []) as Array<{
    code: string;
    name: string;
    flag_emoji: string | null;
  }>).map((c) => ({
    code: c.code,
    name: c.name,
    flag_emoji: c.flag_emoji,
    composite: compositeByCC.get(c.code) ?? null,
    meta: metaByCC.get(c.code) ?? {},
  }));
}

export default async function QuizPage() {
  const countries = await loadCountries();
  return (
    <div className="min-h-screen">
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
            Self-assessment · 60 seconds
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
            How exposed are you to civilizational stress?
          </h1>
          <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
            Five quick questions about where you live, what you do, and what
            keeps you up at night. We map your answers to the live indicators
            we track and tell you which stresses matter most for someone in your
            situation — with the actual numbers.
          </p>
          <p className="mt-3 text-xs text-foreground-subtle">
            Nothing is sent to a server. The assessment runs entirely in your browser.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <QuizExperience countries={countries} />
      </section>
    </div>
  );
}
