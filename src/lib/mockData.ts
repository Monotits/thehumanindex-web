import { CompositeScore, Commentary } from './types'

export const MOCK_COMPOSITE_SCORE: CompositeScore = {
  id: 'mock-score-1',
  score_type: 'composite',
  score_value: 58,
  band: 'elevated',
  delta: 2.3,
  computed_at: new Date().toISOString(),
  metadata: null,
  sub_indexes: [
    { id: 'sub-1', composite_score_id: 'mock-score-1', domain: 'work_risk', value: 72, weight: 0.25, source_updated_at: new Date().toISOString(), raw_data: null },
    { id: 'sub-2', composite_score_id: 'mock-score-1', domain: 'inequality', value: 64, weight: 0.18, source_updated_at: new Date().toISOString(), raw_data: null },
    { id: 'sub-3', composite_score_id: 'mock-score-1', domain: 'unrest', value: 51, weight: 0.15, source_updated_at: new Date().toISOString(), raw_data: null },
    { id: 'sub-4', composite_score_id: 'mock-score-1', domain: 'decay', value: 43, weight: 0.12, source_updated_at: new Date().toISOString(), raw_data: null },
    { id: 'sub-5', composite_score_id: 'mock-score-1', domain: 'wellbeing', value: 38, weight: 0.12, source_updated_at: new Date().toISOString(), raw_data: null },
    { id: 'sub-6', composite_score_id: 'mock-score-1', domain: 'policy', value: 55, weight: 0.10, source_updated_at: new Date().toISOString(), raw_data: null },
    { id: 'sub-7', composite_score_id: 'mock-score-1', domain: 'sentiment', value: 62, weight: 0.08, source_updated_at: new Date().toISOString(), raw_data: null },
  ],
}

export const MOCK_COMMENTARIES: Commentary[] = [
  {
    id: 'pulse-1',
    type: 'weekly_pulse',
    title: 'The AI Acceleration Threshold',
    body_markdown: `# The AI Acceleration Threshold

This week marked a pivotal moment in the displacement trajectory. Three major developments converged to push the composite index to 58 — its highest reading since we began tracking.

## Key Findings

- **Work Risk Index**: Up 2.1 points to 72, driven by a wave of enterprise AI adoption announcements across Fortune 500 companies. Microsoft, Salesforce, and SAP each announced AI-first restructuring plans affecting a combined 40,000+ roles.
- **Policy Response**: Lagging at 55, with the EU AI Act implementation still fragmented and no new US federal legislation reaching committee vote. The gap between technological deployment and regulatory response widened to its largest margin.
- **Income Inequality**: Continues upward pressure at 64 as AI-augmented workers report 23% salary premiums over non-augmented peers in the same roles (Glassdoor Q1 data).

## The Convergence Problem

What makes this week significant isn't any single indicator — it's the simultaneous movement across multiple domains. When Work Risk, Inequality, and Policy Response all deteriorate in the same period, it creates a compounding effect that our model weights heavily.

## What to Watch

Next week's BLS employment situation report (Friday) will be the first to include the new "AI-exposed occupation" classification codes. This will give us a much cleaner signal on actual displacement versus reallocation. Tech earnings calls (MSFT, GOOG, META) will also reveal enterprise AI adoption velocity.`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'ai-acceleration-threshold',
  },
  {
    id: 'pulse-2',
    type: 'weekly_pulse',
    title: 'The White-Collar Reckoning: March Jobs Data Decoded',
    body_markdown: `# The White-Collar Reckoning: March Jobs Data Decoded

March employment data reveals a structural shift that headline unemployment numbers are hiding. While the topline rate holds steady at 4.1%, the composition of employment has changed dramatically.

## The Numbers Behind the Numbers

Total nonfarm payrolls added 187,000 jobs — a decent number. But break it down:

- **Healthcare and social assistance**: +62,000 (human-touch sectors still growing)
- **Government**: +38,000 (fiscal stimulus lagging indicator)
- **Professional and business services**: -24,000 (third consecutive monthly decline)
- **Information sector**: -18,000 (accelerating losses)
- **Financial activities**: -11,000 (AI-driven consolidation)

The economy is adding jobs at the bottom and losing them in the middle. This is exactly the "hollowing out" pattern labor economists warned about.

## The Freelance Collapse

Less visible but more alarming: the BLS supplemental survey shows self-employed workers in knowledge sectors declined 8.2% year-over-year. Freelance translators, copywriters, graphic designers, and data analysts are being quietly displaced by AI tools their former clients now use directly.

## Regional Divergence

The displacement isn't uniform. Tech hubs (SF, Seattle, Austin) show elevated churn but rapid reallocation. Mid-tier metros with concentrated industry exposure (Columbus OH, Charlotte NC, Phoenix AZ) are showing early signs of structural unemployment — workers displaced from one sector with no equivalent alternative within commuting distance.

## What This Means for the Index

This data pushed our Work Risk sub-index to 72 and is the primary driver behind this week's composite reading of 58. The key question: Is this a temporary adjustment or the beginning of a permanent shift?`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'white-collar-reckoning-march-jobs',
  },
  {
    id: 'pulse-3',
    type: 'weekly_pulse',
    title: 'Institutional Decay and the Trust Deficit',
    body_markdown: `# Institutional Decay and the Trust Deficit

Institutional trust metrics hit a new low this quarter. Pew Research's latest survey finds that only 22% of Americans trust the federal government to "do the right thing" — and when asked specifically about the government's ability to manage AI-driven economic transformation, that number drops to 14%.

## The Policy Paralysis

Congress has introduced 47 AI-related bills since January. Zero have reached a floor vote. The legislative process is fundamentally outpaced by the technology it's trying to regulate. By the time a bill is drafted, the capabilities it addresses have already been superseded.

At the state level, the picture is marginally better. California, New York, and Colorado have enacted narrow AI disclosure requirements. But without federal coordination, companies face a patchwork that incentivizes the lowest common denominator.

## International Comparison

The EU's AI Act is now in enforcement, but early compliance data shows significant gaps in implementation, particularly among SMEs. South Korea and Japan have moved faster on targeted workforce transition programs — their institutional trust metrics, while declining, remain 15-20 points above US levels.

## Why This Domain Matters

Institutional Decay is weighted at 12% in our composite, but its effects are multiplicative. When people don't trust institutions to manage disruption, they're less likely to invest in retraining, more likely to support protectionist policies, and more susceptible to misinformation about AI's actual capabilities and limitations.

## The Feedback Loop

Low trust reduces institutional capacity to respond → poor response further erodes trust → repeat. This week's reading of 43 seems moderate, but the trajectory is what concerns us. The velocity of decline has increased 40% quarter-over-quarter.`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'institutional-decay-trust-deficit',
  },
  {
    id: 'pulse-4',
    type: 'weekly_pulse',
    title: 'The Inequality Accelerator: Who Benefits from AI Productivity?',
    body_markdown: `# The Inequality Accelerator: Who Benefits from AI Productivity?

Q1 earnings season revealed a consistent pattern: record profits, flat headcounts, and AI cited as the primary productivity driver. The question our Income Inequality sub-index tries to answer: where is that productivity surplus going?

## The Distribution Problem

McKinsey's latest analysis estimates AI-driven productivity gains of $2.6 trillion annually by 2027. Our analysis of compensation data shows:

- **Top 10% of earners**: Capturing 68% of AI-related compensation gains
- **Middle 40%**: Flat to slightly declining in real terms
- **Bottom 50%**: Experiencing wage pressure from AI-displaced workers competing for remaining roles

This isn't new — technology has always concentrated gains initially. What's different is the speed. Previous waves (mechanization, computerization) played out over decades. The current AI wave is compressing the same dynamics into years.

## The Skills Premium

The gap between "AI-augmented" and "AI-replaced" is increasingly determined by a narrow set of skills. Workers who can effectively prompt, fine-tune, and integrate AI tools into their workflow command significant premiums. Workers whose tasks can be directly replaced by AI face downward pressure.

The irony: the skills that protect you are themselves being commoditized as AI tools become more intuitive. Today's "prompt engineer" may be tomorrow's "typewriter repair technician."

## Geographic Inequality

Income inequality isn't just an individual phenomenon — it's geographic. Counties with high concentrations of AI-adopting firms are seeing property values and local tax revenue increase, while adjacent counties dependent on displaced industries face the opposite. The spatial redistribution of economic activity is accelerating.

## Index Impact

Income Inequality holds at 64 this week — high, but not at crisis levels. The concern is the rate of change: +6 points over the last 12 weeks, the steepest climb since we began tracking.`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'inequality-accelerator-ai-productivity',
  },
  {
    id: 'pulse-5',
    type: 'weekly_pulse',
    title: 'Wellbeing Watch: The Mental Health Dimension of AI Anxiety',
    body_markdown: `# Wellbeing Watch: The Mental Health Dimension of AI Anxiety

The Social Wellbeing sub-index dropped to 38 this week, driven by new SAMHSA data showing a sharp increase in anxiety and depression diagnoses correlated with occupational uncertainty.

## The Anxiety Epidemic

The American Psychological Association's 2026 Stress in America survey found that 67% of working adults report "significant anxiety" about AI's impact on their career — up from 41% in 2024. Among workers aged 35-54, the figure rises to 74%.

This isn't abstract worry. It's manifesting in concrete health outcomes: increased prescriptions for anxiety medication (up 18% YoY in the 25-54 demographic), elevated rates of insomnia-related complaints, and a measurable increase in alcohol consumption correlated with industries undergoing rapid AI adoption.

## The Paradox of Knowledge Workers

Perhaps the most counterintuitive finding: highly educated workers report higher AI-related anxiety than less educated workers. A software engineer with a Stanford degree feels more threatened than a plumber — because the plumber's work is physically embodied and harder to automate, while the engineer watches AI write increasingly competent code.

## Organizational Impact

Companies are beginning to see the wellbeing cost of AI transformation. Gallup's Q1 engagement survey shows a 12% decline in employee engagement at firms that announced AI-driven restructuring, compared to a 2% decline industry-wide. Presenteeism — showing up but not fully functioning — is reportedly costing AI-transitioning firms an estimated $3,400 per affected employee annually.

## What Helps

Not everything is bleak. Workers who report taking proactive steps — upskilling, career coaching, building AI literacy — show significantly lower anxiety scores. The key variable isn't whether your job is at risk; it's whether you feel you have agency in the transition.

## Index Reading

At 38, Social Wellbeing is actually one of our "better" readings — but it's the fastest-declining domain in the index. Six months ago it was at 29. The trajectory, not the absolute number, is what drives our concern.`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'wellbeing-watch-mental-health-ai-anxiety',
  },
  {
    id: 'pulse-6',
    type: 'weekly_pulse',
    title: 'Social Unrest Tracker: From Online Anger to Street Protests',
    body_markdown: `# Social Unrest Tracker: From Online Anger to Street Protests

Our Social Unrest sub-index ticked up to 51 this week after labor actions at three major tech companies and a wave of anti-AI protests in European capitals. This domain has been the most volatile in recent weeks.

## The Labor Flashpoints

Three notable labor actions this week:

The first: a walkout at a major cloud services provider after the company announced replacing its entire L3 support tier with an AI system — affecting 2,200 workers. The walkout lasted 48 hours and ended with a partial concession: a 6-month transition period with retraining funding.

Second: content moderators at a social media platform filed a class-action lawsuit alleging the company used their work to train the AI system that replaced them, without additional compensation.

Third: screenwriters in South Korea began a strike mirroring the 2023 WGA action, demanding AI-generated content be excluded from streaming platform quotas.

## The European Dimension

Paris, Berlin, and Rome each saw protests exceeding 10,000 participants against "unregulated AI deployment." The protests are notable for their cross-demographic composition — not just displaced workers, but students, retirees, and small business owners who perceive AI-driven consolidation as a threat to economic diversity.

## Online Sentiment

ACLED's event tracking, combined with our social media analysis, shows a 34% increase in protest-related online discourse over the past 6 weeks. The language is shifting from "concern" to "demand" — indicating a transition from passive anxiety to active mobilization.

## The Unrest-Policy Connection

Historically, social unrest is the most effective driver of policy response. Our models show a 0.72 correlation between the Unrest and Policy Response sub-indexes, with a 4-8 week lag. If the current trajectory holds, we expect policy movement — though whether that takes the form of thoughtful regulation or reactive restriction remains uncertain.`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'social-unrest-tracker-online-anger-protests',
  },
  {
    id: 'pulse-7',
    type: 'weekly_pulse',
    title: 'Policy Response Gap: Why Regulation Can\'t Keep Up',
    body_markdown: `# Policy Response Gap: Why Regulation Can't Keep Up

The Policy Response sub-index sits at 55, and the story it tells is one of systemic inadequacy. Not bad intent — genuine structural inability to govern at the speed of technological change.

## The Legislative Timeline Problem

The average time from AI-related bill introduction to committee vote in the US Congress: 14 months. The average time between major AI capability releases: 3 months. By the time legislation is drafted, debated, and amended, the technology it addresses has evolved two or three generations.

## What's Actually Moving

Despite the gridlock at the federal level, some policy action is happening:

- **EEOC**: Issued updated guidance on AI in hiring decisions, with enforcement actions beginning Q3 2026
- **FTC**: Opened investigations into three companies for AI-driven price discrimination
- **SEC**: Proposed disclosure requirements for AI's role in material business decisions
- **State level**: 14 states now have some form of AI-related legislation, up from 6 a year ago

The pattern: executive agencies and state governments are moving, while Congress remains stalled. This creates a fragmented regulatory landscape that's better than nothing but far from optimal.

## International Comparison

The EU AI Act, despite implementation challenges, has created a baseline that US policy lacks. Our comparative analysis shows EU-based firms are investing 2.3x more in AI governance infrastructure than US counterparts — not because they want to, but because they have to.

## The Workforce Transition Gap

Perhaps the most damaging policy failure isn't in AI regulation but in workforce transition. Federal spending on worker retraining programs has increased just 4% nominally since 2023 — a real-terms decline given inflation. Compare this to South Korea's AI Transition Fund ($4.2B over 3 years) or Germany's Qualifizierungschancengesetz expansion.

## Index Interpretation

At 55, Policy Response tells us that the gap between disruption speed and institutional response is growing, not shrinking. This is the domain to watch — because when it moves, it affects everything else.`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'policy-response-gap-regulation-cant-keep-up',
  },
  {
    id: 'pulse-8',
    type: 'weekly_pulse',
    title: 'Sentiment Shift: How Public Perception of AI Changed in 90 Days',
    body_markdown: `# Sentiment Shift: How Public Perception of AI Changed in 90 Days

Public Sentiment at 62 represents something new in our index: a domain where the reading is driven almost entirely by rate of change rather than absolute levels.

## The Tipping Point

Three months ago, most public polling showed a roughly 50/50 split between AI optimists and pessimists. Today, Gallup's tracking poll shows 61% of Americans believe AI will "mostly harm" working people over the next decade — a 14-point shift in one quarter.

What changed? Not any single event, but a critical mass of personal experience. As AI tools went from demos to deployments, people moved from imagining AI's impact to experiencing it. A Pew study released this week found that 43% of knowledge workers have personally witnessed a colleague's role being eliminated or significantly reduced due to AI.

## The Narrative Fracture

What's particularly interesting is the divergence between elite and public sentiment. In Davos surveys and tech industry polls, optimism about AI remains high (72% positive). Among the general public, it's collapsing. This gap — the widest we've recorded — suggests a fundamental disconnect between those building AI and those being affected by it.

## Social Media as Amplifier

Reddit, X, and TikTok have become primary venues for sharing displacement stories. The hashtag #AIlaidoff has accumulated 2.1M posts. Our sentiment analysis of these posts shows a shift from individual complaint to collective identity — people are beginning to see themselves as part of a shared experience rather than isolated cases.

## Why Sentiment Matters

Public Sentiment is our lowest-weighted domain at 8%, and that's deliberate — feelings are not facts. But sentiment drives behavior: voting patterns, consumption choices, career decisions, social cohesion. When 62% of a population feels pessimistic about a technology that's being deployed regardless, the political and social consequences are significant.

## The Trust Interaction

Sentiment and Institutional Decay interact in a way our model captures: declining trust in institutions amplifies negative sentiment, because people feel they have no advocate. The correlation between these two domains is 0.68 and rising.`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'sentiment-shift-public-perception-90-days',
  },
  {
    id: 'pulse-9',
    type: 'weekly_pulse',
    title: 'Employment Transformation: The Sectors That Are Actually Adapting',
    body_markdown: `# Employment Transformation: The Sectors That Are Actually Adapting

Not everything in the index is headed in one direction. This week we spotlight the sectors showing genuine adaptation to AI disruption — and what we can learn from them.

## Healthcare: The Augmentation Model

Healthcare's AI story is different from most sectors. Rather than displacement, we're seeing augmentation: radiologists using AI to improve diagnostic accuracy by 31%, nurses using predictive models to prioritize patient care, and administrators using AI to reduce paperwork burden.

Why? Healthcare has a fundamental constraint other sectors don't: you can't outsource human touch. The jobs that are growing (home health aides, nurse practitioners, physical therapists) require physical presence and emotional intelligence. AI handles the data; humans handle the care.

## Skilled Trades: The Immunity Effect

Electricians, plumbers, HVAC technicians, and construction workers have seen AI exposure scores below 15 in our model. Their work is physically embodied, spatially complex, and highly variable — exactly the combination AI struggles with. Demand for skilled trades is up 22% year-over-year, and wages are rising at twice the national average.

## Education: The Uncomfortable Middle

Education sits in an interesting position. AI tutoring tools are demonstrably effective for content delivery — some studies show 40% improvement in learning outcomes. But the profession's value extends beyond content delivery into mentorship, socialization, and developmental guidance. Schools that are adapting well are redefining the teacher's role from "content deliverer" to "learning facilitator" — and seeing improved outcomes.

## The Common Thread

The sectors that are adapting share three characteristics: clear boundaries between human and AI value, institutional willingness to redefine roles, and investment in transition support. The sectors that are struggling have the opposite: fuzzy human-AI boundaries, rigid role definitions, and minimal transition investment.

## What This Means

The Work Risk score of 72 is real and concerning. But it's an average — and within that average, there's enormous variance. The challenge isn't that AI is destroying all work. It's that the destruction and creation are happening in different places, at different speeds, and to different people.`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'employment-transformation-sectors-adapting',
  },
  {
    id: 'pulse-10',
    type: 'weekly_pulse',
    title: 'Launch Week: What The Human Index Measures and Why',
    body_markdown: `# Launch Week: What The Human Index Measures and Why

Welcome to The Human Index. This inaugural Pulse explains what we're building, why it matters, and how to read what we publish.

## The Problem

Every major economic transformation in history — mechanization, electrification, computerization — was tracked in real time by institutions that helped society understand and navigate the change. The AI transformation is happening faster than any of these, but we have no equivalent dashboard.

GDP tells you the economy is growing. It doesn't tell you that growth is concentrating in fewer hands. Unemployment tells you how many people don't have jobs. It doesn't tell you how many people have jobs that are about to disappear. No single indicator captures the full picture.

## Our Approach

The Human Index synthesizes seven domains of civilizational stress into a single composite score. Think of it like a vital signs monitor for the economy — not a prediction of the future, but a real-time reading of the present.

Each domain is tracked weekly using public data from authoritative sources: the Bureau of Labor Statistics, World Bank, ACLED, V-Dem, WHO, OECD, and social media sentiment analysis. Every score is weighted according to a documented methodology that we publish in full.

## How to Read the Score

The composite score runs from 0 to 100. Higher means more stress — more displacement, more inequality, more institutional strain. The score is descriptive, not prescriptive. A reading of 58 doesn't mean the world is ending. It means that across seven measurable dimensions, the AI-driven transformation is generating significant structural stress.

The five bands — Low, Moderate, Elevated, High, and Critical — provide context for interpretation. We're currently in the Elevated band, which means stress indicators are meaningful and worth monitoring, but not yet at levels that suggest imminent systemic disruption.

## What Comes Next

Every week, we publish a Pulse analysis explaining what moved, why, and what to watch. The personal quiz helps you understand your individual exposure. And over time, we'll be adding more granular data: by region, by industry, by occupation.

This is version one. We'll get better. But we believe it's better to launch something imperfect and improve it transparently than to wait for perfection while the transformation accelerates.`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'launch-week-what-human-index-measures',
  },
]
