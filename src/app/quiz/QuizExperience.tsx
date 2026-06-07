'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/ui/cn';
import { trackQuizCompleted } from '@/lib/analytics';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { StressBand } from '@/components/ui/StressBand';
import {
  bandFor,
  META_INDEXES,
  META_LABELS,
  type MetaIndex,
} from '@/lib/ui/tokens';
import type { QuizCountry } from './page';

// ── Catalog ─────────────────────────────────────────────────────────

type Sector =
  | 'tech' | 'finance' | 'healthcare' | 'education'
  | 'manufacturing' | 'public' | 'retail' | 'other';

type AgeBand = '18-24' | '25-34' | '35-49' | '50-64' | '65+';

type Concern =
  | 'economic'
  | 'mental'
  | 'climate'
  | 'ai'
  | 'social'
  | 'health';

const SECTORS: { id: Sector; label: string; emoji: string }[] = [
  { id: 'tech',          label: 'Tech / Software', emoji: '💻' },
  { id: 'finance',       label: 'Finance / Banking', emoji: '🏦' },
  { id: 'healthcare',    label: 'Healthcare', emoji: '🩺' },
  { id: 'education',     label: 'Education / Research', emoji: '📚' },
  { id: 'manufacturing', label: 'Manufacturing / Energy', emoji: '🏭' },
  { id: 'public',        label: 'Public sector / NGO', emoji: '🏛️' },
  { id: 'retail',        label: 'Retail / Services', emoji: '🛍️' },
  { id: 'other',         label: 'Other / N/A', emoji: '✳️' },
];

const AGE_BANDS: AgeBand[] = ['18-24', '25-34', '35-49', '50-64', '65+'];

const CONCERNS: { id: Concern; label: string; sub: string }[] = [
  { id: 'economic', label: 'Economic security',     sub: 'income, debt, housing, job stability' },
  { id: 'mental',   label: 'Mental health & loneliness', sub: 'anxiety, isolation, work-life balance' },
  { id: 'climate',  label: 'Climate & environment',  sub: 'heat, drought, air quality, disaster' },
  { id: 'ai',       label: 'AI & automation',        sub: 'displacement, surveillance, skill gap' },
  { id: 'social',   label: 'Social trust & cohesion', sub: 'institutional trust, polarization, crime' },
  { id: 'health',   label: 'Physical health',        sub: 'healthcare access, disease burden, longevity' },
];

// ── Weight model ────────────────────────────────────────────────────
//
// Each input contributes a multiplier to one or more meta-indexes.
// Final personal weight for a meta = product of contributions, normalized.

const CONCERN_WEIGHTS: Record<Concern, Partial<Record<MetaIndex, number>>> = {
  economic: { economic:      2.0 },
  mental:   { mental:        2.0 },
  climate:  { environmental: 2.0 },
  ai:       { technological: 2.0 },
  social:   { social:        2.0 },
  health:   { mental:        1.0, economic: 1.0 },
};

const SECTOR_WEIGHTS: Record<Sector, Partial<Record<MetaIndex, number>>> = {
  tech:          { technological: 1.5 },
  finance:       { economic:      1.5 },
  healthcare:    { mental:        1.5 },
  education:     { social:        1.5 },
  manufacturing: { economic:      1.0, technological: 1.0 },
  public:        { social:        1.0, environmental: 0.5 },
  retail:        { economic:      1.5 },
  other:         {},
};

const AGE_WEIGHTS: Record<AgeBand, Partial<Record<MetaIndex, number>>> = {
  '18-24': { mental: 0.5 },
  '25-34': { economic: 0.7, mental: 0.5 },
  '35-49': { economic: 0.7 },
  '50-64': { economic: 0.5, mental: 0.5 },
  '65+':   { environmental: 0.5, mental: 0.7 },
};

function computeProfile(opts: {
  countryCode: string;
  sector: Sector;
  age: AgeBand;
  concerns: Concern[];
  countries: QuizCountry[];
}) {
  const { countryCode, sector, age, concerns, countries } = opts;
  const country = countries.find((c) => c.code === countryCode);
  if (!country) return null;

  // Personal weight per meta
  const personalWeight: Record<MetaIndex, number> = {
    economic: 1, social: 1, mental: 1, technological: 1, environmental: 1,
  };
  for (const c of concerns) {
    for (const [k, v] of Object.entries(CONCERN_WEIGHTS[c] ?? {})) {
      personalWeight[k as MetaIndex] += v;
    }
  }
  for (const [k, v] of Object.entries(SECTOR_WEIGHTS[sector] ?? {})) {
    personalWeight[k as MetaIndex] += v;
  }
  for (const [k, v] of Object.entries(AGE_WEIGHTS[age] ?? {})) {
    personalWeight[k as MetaIndex] += v;
  }

  // Rank meta-indexes by combined relevance × actual country score
  const ranking = META_INDEXES.map((m) => {
    const personal = personalWeight[m];
    const score = country.meta[m] ?? null;
    const exposure = score !== null ? (personal * score) / 100 : null;
    return { meta: m, personalWeight: personal, score, exposure };
  })
    .sort((a, b) => (b.exposure ?? -1) - (a.exposure ?? -1));

  // Personal exposure index = weighted average of meta scores
  let weightedSum = 0;
  let totalWeight = 0;
  for (const r of ranking) {
    if (r.score === null) continue;
    weightedSum += r.score * r.personalWeight;
    totalWeight += r.personalWeight;
  }
  const personalExposure = totalWeight > 0 ? weightedSum / totalWeight : null;

  return {
    country,
    ranking,
    personalExposure,
  };
}

// ── Main component ─────────────────────────────────────────────────

type Step = 'country' | 'sector' | 'age' | 'concerns' | 'result';

export function QuizExperience({ countries }: { countries: QuizCountry[] }) {
  const [step, setStep] = useState<Step>('country');
  const [countryCode, setCountryCode] = useState<string>('');
  const [sector, setSector] = useState<Sector | ''>('');
  const [age, setAge] = useState<AgeBand | ''>('');
  const [concerns, setConcerns] = useState<Concern[]>([]);

  const stepIndex = (['country', 'sector', 'age', 'concerns', 'result'] as Step[]).indexOf(step);

  const result = useMemo(() => {
    if (step !== 'result' || !countryCode || !sector || !age) return null;
    return computeProfile({ countryCode, sector, age, concerns, countries });
  }, [step, countryCode, sector, age, concerns, countries]);

  // Fire analytics once when reaching the result step
  useEffect(() => {
    if (step === 'result' && result) {
      trackQuizCompleted({
        country: result.country.code,
        sector: String(sector),
        age: String(age),
        concerns: concerns.map(String),
        personalExposure: result.personalExposure,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, result?.country.code]);

  function reset() {
    setCountryCode('');
    setSector('');
    setAge('');
    setConcerns([]);
    setStep('country');
  }

  return (
    <div>
      {/* Progress bar */}
      {step !== 'result' && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-foreground-subtle mb-2 font-medium">
            <span>Step {stepIndex + 1} of 4</span>
            <button
              type="button"
              onClick={reset}
              className="hover:text-foreground transition-colors"
            >
              Start over
            </button>
          </div>
          <div className="h-1 bg-background-alt rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 'country' && (
        <StepCountry
          countries={countries}
          value={countryCode}
          onSelect={(c) => {
            setCountryCode(c);
            setStep('sector');
          }}
        />
      )}

      {step === 'sector' && (
        <StepSector
          value={sector}
          onSelect={(s) => {
            setSector(s);
            setStep('age');
          }}
          onBack={() => setStep('country')}
        />
      )}

      {step === 'age' && (
        <StepAge
          value={age}
          onSelect={(a) => {
            setAge(a);
            setStep('concerns');
          }}
          onBack={() => setStep('sector')}
        />
      )}

      {step === 'concerns' && (
        <StepConcerns
          value={concerns}
          onToggle={(c) =>
            setConcerns((prev) =>
              prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
            )
          }
          onSubmit={() => setStep('result')}
          onBack={() => setStep('age')}
        />
      )}

      {step === 'result' && result && (
        <Result result={result} onRestart={reset} />
      )}
    </div>
  );
}

// ── Step views ──────────────────────────────────────────────────────

function StepCountry({
  countries,
  value,
  onSelect,
}: {
  countries: QuizCountry[];
  value: string;
  onSelect: (cc: string) => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold mb-2">
        Where do you live?
      </h2>
      <p className="text-sm text-foreground-muted mb-6">
        Pick one of the 25 countries we currently track.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {countries.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => onSelect(c.code)}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
              value === c.code
                ? 'border-foreground bg-background-alt'
                : 'border-border hover:border-border-strong hover:bg-background-alt/60',
            )}
          >
            <span className="text-xl shrink-0" aria-hidden="true">
              {c.flag_emoji ?? '🏳️'}
            </span>
            <span className="text-sm font-medium truncate">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSector({
  value,
  onSelect,
  onBack,
}: {
  value: Sector | '';
  onSelect: (s: Sector) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold mb-2">
        What field are you in?
      </h2>
      <p className="text-sm text-foreground-muted mb-6">
        Sector context helps us weight which stresses hit you the hardest.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SECTORS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
              value === s.id
                ? 'border-foreground bg-background-alt'
                : 'border-border hover:border-border-strong hover:bg-background-alt/60',
            )}
          >
            <span className="text-xl" aria-hidden="true">{s.emoji}</span>
            <span className="text-sm font-medium">{s.label}</span>
          </button>
        ))}
      </div>
      <BackButton onClick={onBack} />
    </div>
  );
}

function StepAge({
  value,
  onSelect,
  onBack,
}: {
  value: AgeBand | '';
  onSelect: (a: AgeBand) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold mb-2">
        Which age range?
      </h2>
      <p className="text-sm text-foreground-muted mb-6">
        Different life stages experience civilizational stress differently.
      </p>
      <div className="flex flex-wrap gap-2">
        {AGE_BANDS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onSelect(a)}
            className={cn(
              'inline-flex items-center rounded-full border px-5 py-2 text-sm font-medium transition-colors',
              value === a
                ? 'border-foreground bg-background-alt'
                : 'border-border hover:border-border-strong hover:bg-background-alt/60',
            )}
          >
            {a}
          </button>
        ))}
      </div>
      <BackButton onClick={onBack} />
    </div>
  );
}

function StepConcerns({
  value,
  onToggle,
  onSubmit,
  onBack,
}: {
  value: Concern[];
  onToggle: (c: Concern) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold mb-2">
        What weighs on your mind?
      </h2>
      <p className="text-sm text-foreground-muted mb-6">
        Pick anything that resonates — multiple are fine.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CONCERNS.map((c) => {
          const active = value.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              aria-pressed={active}
              className={cn(
                'rounded-lg border px-4 py-3 text-left transition-colors',
                active
                  ? 'border-foreground bg-background-alt'
                  : 'border-border hover:border-border-strong hover:bg-background-alt/60',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1 inline-flex w-4 h-4 rounded-sm border items-center justify-center text-[10px]',
                    active
                      ? 'bg-foreground border-foreground text-background'
                      : 'border-border-strong',
                  )}
                >
                  {active ? '✓' : ''}
                </span>
                <div>
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
                    {c.sub}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={value.length === 0}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors',
            value.length === 0
              ? 'bg-background-alt text-foreground-subtle cursor-not-allowed'
              : 'bg-accent text-accent-fg hover:bg-accent-hover',
          )}
        >
          See your profile →
        </button>
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={onClick}
        className="text-sm text-foreground-muted hover:text-foreground"
      >
        ← Back
      </button>
    </div>
  );
}

// ── Result view ─────────────────────────────────────────────────────

function Result({
  result,
  onRestart,
}: {
  result: NonNullable<ReturnType<typeof computeProfile>>;
  onRestart: () => void;
}) {
  const { country, ranking, personalExposure } = result;
  const overallBand = bandFor(personalExposure);

  return (
    <div className="space-y-10">
      {/* HEADLINE */}
      <div>
        <p className="text-xs uppercase tracking-wider text-foreground-muted mb-2 font-medium">
          Your civilizational stress profile
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight tracking-tight text-balance mb-6">
          {country.flag_emoji} {country.name}
        </h2>

        {personalExposure !== null && (
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                Your personal exposure
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono tabular-nums text-4xl sm:text-5xl font-semibold">
                  {personalExposure.toFixed(1)}
                </span>
                {overallBand && (
                  <StressBand band={overallBand} score={null} showScore={false} variant="pill" size="lg" />
                )}
              </div>
              <div className="mt-1 text-xs text-foreground-subtle">
                weighted by your concerns × {country.name}&apos;s live scores
              </div>
            </div>
            {country.composite !== null && (
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
                  {country.name} composite
                </div>
                <div className="font-mono tabular-nums text-3xl sm:text-4xl font-semibold">
                  {country.composite.toFixed(1)}
                </div>
                <div className="mt-1 text-xs text-foreground-subtle">
                  the population-level baseline
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RANKING */}
      <div>
        <h3 className="font-serif text-xl font-semibold mb-2">
          The stresses that matter most for you
        </h3>
        <p className="text-sm text-foreground-muted mb-6">
          Ranked by personal relevance × live country score. The number is
          {country.name}&apos;s current value on that meta-index.
        </p>
        <ul className="space-y-3">
          {ranking.map((r, i) => {
            const b = bandFor(r.score);
            return (
              <li
                key={r.meta}
                className="flex items-center gap-4 rounded-lg border border-border bg-background p-4"
              >
                <span className="text-xs text-foreground-subtle tabular-nums w-5">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <MetaCategoryBadge meta={r.meta} variant="dot" size="md" />
                  <div className="mt-1 text-xs text-foreground-muted">
                    Relevance to you: ×{r.personalWeight.toFixed(1)}
                  </div>
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <span
                    className="font-mono tabular-nums text-2xl font-semibold"
                    style={{ color: b ? `var(--band-${b})` : undefined }}
                  >
                    {r.score !== null ? r.score.toFixed(1) : '—'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* CTAs */}
      <div className="rounded-lg border border-border bg-background-alt/40 p-6">
        <h3 className="font-serif text-lg font-semibold mb-2">
          Where to go from here
        </h3>
        <p className="text-sm text-foreground-muted mb-5">
          Dive into the actual numbers and editorial coverage for {country.name}.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/country/${country.code.toLowerCase()}`}
            className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-fg px-5 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            See {country.name} in detail
          </Link>
          <Link
            href="/pulse"
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-alt transition-colors"
          >
            Read Weekly Pulse
          </Link>
          <Link
            href="/glossary"
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-alt transition-colors"
          >
            Browse Glossary
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border text-sm">
        <button
          type="button"
          onClick={onRestart}
          className="text-foreground-muted hover:text-foreground"
        >
          ← Retake the assessment
        </button>
        <span className="text-xs text-foreground-subtle text-right max-w-xs">
          Showcase, not diagnosis. Useful for prioritizing, not for clinical or
          policy decisions.
        </span>
      </div>
    </div>
  );
}

// Show the deprecated names list label
{
  // (eslint-friendly noop usage — kept since we display META_LABELS map inline as needed)
  void META_LABELS;
}
