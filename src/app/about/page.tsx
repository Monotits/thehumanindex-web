'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/theme'
import { Domain } from '@/lib/types'
import { DomainIcon } from '@/components/DomainIcon'

export default function AboutPage() {
  const { theme, themeId } = useTheme()

  const accent = theme.accent
  const isBriefing = themeId === 'briefing'

  const section: React.CSSProperties = {
    maxWidth: 720,
    margin: '0 auto',
    padding: '0 24px',
  }

  const h2Style: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: theme.text,
    fontFamily: theme.fontHeading,
    margin: '56px 0 20px',
    lineHeight: 1.3,
  }

  const pStyle: React.CSSProperties = {
    fontSize: 15,
    lineHeight: 1.75,
    color: theme.textSecondary,
    fontFamily: theme.fontBody,
    margin: '0 0 16px',
  }

  return (
    <div style={{ background: isBriefing ? '#f8f5f0' : theme.bg, minHeight: '100vh', color: theme.text }}>
      {/* Hero */}
      <div style={{ borderBottom: `1px solid ${theme.surfaceBorder}`, padding: '64px 24px 56px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, fontFamily: theme.fontMono }}>
            About the Project
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: theme.text, fontFamily: theme.fontHeading, lineHeight: 1.2, margin: '0 0 20px' }}>
            We built the dashboard<br />we wished existed.
          </h1>
          <p style={{ fontSize: 17, color: theme.textSecondary, lineHeight: 1.7, fontFamily: theme.fontBody, maxWidth: 520, margin: '0 auto' }}>
            AI is transforming the economy at a pace institutions can&apos;t match.
            The Human Index tracks what that means for real people — in real time.
          </p>
        </div>
      </div>

      <div style={section}>
        {/* WHY */}
        <h2 style={h2Style}>Why this exists</h2>
        <p style={pStyle}>
          Every week, another headline declares that AI will create more jobs than it destroys.
          And every week, another company quietly replaces entire teams. The truth is somewhere
          in between — but nobody is tracking the full picture.
        </p>
        <p style={pStyle}>
          GDP goes up. Productivity goes up. But what about the 55-year-old accountant whose
          firm just automated tax prep? Or the freelance translator who lost 80% of their
          clients in six months? Aggregate numbers hide individual devastation.
        </p>
        <p style={pStyle}>
          The Human Index was built to make the invisible visible. We aggregate data from public
          sources — labor statistics, economic indicators, social surveys, policy trackers — and
          synthesize them into a single, interpretable signal: how much stress is AI-driven
          transformation placing on human systems right now?
        </p>

        {/* WHAT */}
        <h2 style={h2Style}>What we measure</h2>
        <p style={pStyle}>
          The index tracks seven interconnected domains of civilizational stress. Not just job
          displacement — but the cascading effects: rising inequality, institutional paralysis,
          social unrest, declining wellbeing, policy failure, and public sentiment collapse.
        </p>
        <p style={pStyle}>
          Each domain draws from authoritative public data sources — BLS, FRED, World Bank,
          OECD, WHO, V-Dem governance indicators, Stanford AI Index, and Reddit/RSS
          sentiment analysis. Every score is weighted,
          documented, and open to scrutiny. We publish our full methodology because
          transparency isn&apos;t optional when the stakes are this high.
        </p>

        {/* Domains grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, margin: '24px 0 16px' }}>
          {([
            { domain: 'work_risk' as Domain, name: 'AI Work Displacement', weight: '25%' },
            { domain: 'inequality' as Domain, name: 'Income Inequality', weight: '18%' },
            { domain: 'unrest' as Domain, name: 'Social Unrest', weight: '15%' },
            { domain: 'decay' as Domain, name: 'Institutional Decay', weight: '12%' },
            { domain: 'wellbeing' as Domain, name: 'Social Wellbeing', weight: '12%' },
            { domain: 'policy' as Domain, name: 'Policy Response', weight: '10%' },
            { domain: 'sentiment' as Domain, name: 'Public Sentiment', weight: '8%' },
          ]).map(d => (
            <div key={d.name} style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <DomainIcon domain={d.domain} size={20} color={theme.textSecondary} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, fontFamily: theme.fontBody }}>{d.name}</div>
                <div style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.fontMono }}>{d.weight}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FOR WHOM */}
        <h2 style={h2Style}>Who this is for</h2>
        <p style={pStyle}>
          We built The Human Index for anyone who cares about what&apos;s actually
          happening — not what the press release says is happening. That includes workers
          wondering if their skills are still relevant, policymakers tracking transformation
          speed against legislative pace, researchers studying labor market dynamics,
          journalists seeking a single source of truth, and citizens who want more than vibes.
        </p>

        {/* HOW */}
        <h2 style={h2Style}>How it works</h2>
        <p style={pStyle}>
          Every week, automated pipelines pull fresh data from public sources. Each domain&apos;s
          raw indicators are normalized, weighted, and aggregated into sub-index scores. Those
          seven sub-indexes combine into a single composite score on a 0–100 scale. The weekly
          Pulse analysis explains what moved, why, and what to watch next.
        </p>
        <p style={pStyle}>
          The personal quiz uses your job title, tasks, experience, and region to estimate
          your individual exposure to AI displacement. It&apos;s not a prediction — it&apos;s a
          probability-weighted assessment based on current automation trajectories
          in your field and geography.
        </p>

        {/* PRINCIPLES */}
        <h2 style={h2Style}>Our principles</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, margin: '8px 0 16px' }}>
          {[
            { title: 'Data over narrative', body: 'Every claim we make is backed by a specific public data source. We cite our work. Always.' },
            { title: 'Transparency over authority', body: 'Our methodology is public. Our weights are documented. If you disagree, you can see exactly where and why.' },
            { title: 'Nuance over alarm', body: 'We don\'t exist to scare people. We exist to inform them. The composite score is descriptive, not prescriptive.' },
            { title: 'Individual over aggregate', body: 'A rising GDP doesn\'t help if your job disappeared. We track what matters at the human scale.' },
          ].map(p => (
            <div key={p.title} style={{ paddingLeft: 16, borderLeft: `3px solid ${accent}30` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 4, fontFamily: theme.fontBody }}>{p.title}</div>
              <div style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6, fontFamily: theme.fontBody }}>{p.body}</div>
            </div>
          ))}
        </div>

        {/* TEAM */}
        <h2 style={h2Style}>Behind the index</h2>
        <p style={pStyle}>
          The Human Index is an independent research project. We are not affiliated with
          any AI company, government body, or lobbying organization. The project was started
          by a small team of developers, economists, and data scientists who believe the
          public deserves better tools for understanding the transformation happening around them.
        </p>
        <p style={pStyle}>
          We don&apos;t accept advertising. We don&apos;t sell user data. The quiz results belong
          to you — we collect email addresses only if you opt in, and only to send the
          weekly Pulse newsletter.
        </p>

        {/* CTA */}
        <div style={{ margin: '48px 0 64px', padding: 32, background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 10, textAlign: 'center' }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 10px', fontFamily: theme.fontHeading }}>
            See where you stand
          </h3>
          <p style={{ fontSize: 14, color: theme.textSecondary, margin: '0 0 20px', fontFamily: theme.fontBody }}>
            Take the free AI exposure quiz — it takes 2 minutes and shows your personal risk profile.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/quiz" style={{ padding: '10px 28px', background: accent, color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600, fontFamily: theme.fontBody }}>
              Take the Quiz
            </Link>
            <Link href="/methodology" style={{ padding: '10px 28px', background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, color: theme.text, borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600, fontFamily: theme.fontBody }}>
              Read Our Methodology
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
