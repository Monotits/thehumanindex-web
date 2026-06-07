import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { QuizExperience } from './QuizExperience';
import { QUIZ_VARIANTS } from '@/lib/ui/quiz-variants';
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
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
            Self-assessments · 60 seconds each
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
            Pick your question. We&apos;ll answer it with live data.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
            Same engine, three lenses. Each takes about a minute and runs
            entirely in your browser — no email needed.
          </p>
        </div>
      </section>

      {/* ── VARIANT PICKER ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {QUIZ_VARIANTS.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/quiz/${v.slug}`}
                className="group flex flex-col rounded-lg border border-border bg-background hover:bg-background-alt/60 p-6 transition-colors h-full"
              >
                <div className="flex items-center justify-between mb-4 text-[11px] uppercase tracking-wider text-foreground-subtle">
                  <span className="font-medium">{v.badge}</span>
                  <span>{v.duration}</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold leading-tight mb-3 text-balance group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
                  {v.title}
                </h2>
                <p className="text-sm text-foreground-muted leading-relaxed flex-1">
                  {v.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground border-b border-foreground/30 pb-0.5 w-fit group-hover:border-foreground transition-colors">
                  Start →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── DEFAULT QUIZ (in-page) ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-border">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-wider text-foreground-subtle mb-2 font-medium">
            Or take the default
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
            Civilizational stress exposure
          </h2>
        </div>
        <QuizExperience countries={countries} />
      </section>
    </div>
  );
}
