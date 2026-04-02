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

Next week's BLS employment situation report (Friday) will be closely watched for further signs of white-collar contraction. Researchers have been mapping existing SOC codes to AI-exposure levels, and we expect these frameworks to sharpen our displacement signal. Tech earnings calls (MSFT, GOOG, META) will also reveal enterprise AI adoption velocity.`,
    composite_score_id: 'mock-score-1',
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'ai-acceleration-threshold',
  },
  {
    id: 'pulse-2',
    type: 'weekly_pulse',
    title: 'The White-Collar Reckoning: March Jobs Data Decoded',
    body_markdown: `# The White-Collar Reckoning: March Jobs Data Decoded

March employment data reveals a structural shift that headline unemployment numbers are hiding. While the topline rate holds near 4.4%, the composition of employment has changed dramatically.

## The Numbers Behind the Numbers

Total nonfarm payrolls continue to grow, but the composition tells a different story:

- **Healthcare and social assistance**: Strong gains (human-touch sectors still growing)
- **Government**: Steady additions (fiscal stimulus lagging indicator)
- **Professional and business services**: Declining (consecutive monthly contractions)
- **Information sector**: Contracting (accelerating losses)
- **Financial activities**: Declining (AI-driven consolidation)

The economy is adding jobs at the bottom and losing them in the middle. This is exactly the "hollowing out" pattern labor economists warned about.

## The Freelance Collapse

Less visible but more alarming: surveys of freelance platforms show self-employed workers in knowledge sectors facing accelerating demand declines. Freelance translators, copywriters, graphic designers, and data analysts are being quietly displaced by AI tools their former clients now use directly.

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

Institutional trust metrics continue their multi-decade decline. Pew Research's tracking data shows trust in the federal government hovering near historic lows — and when the question turns specifically to the government's ability to manage AI-driven economic transformation, the numbers drop even further.

## The Policy Paralysis

Congress has introduced dozens of AI-related bills — including the AI PLAN Act, CREATE AI Act, and GAIN AI Act — yet meaningful legislation remains stalled in committee. The legislative process is fundamentally outpaced by the technology it's trying to regulate. By the time a bill is drafted, the capabilities it addresses have already been superseded.

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

McKinsey's analysis estimates AI-driven productivity gains of $2.6 to $4.4 trillion annually as adoption matures. Our analysis of compensation data shows:

- **Top earners**: Capturing a disproportionate share of AI-related compensation gains, with AI skills commanding 23-25% salary premiums
- **Middle-income workers**: Flat to slightly declining in real terms
- **Lower-income workers**: Experiencing wage pressure from AI-displaced workers competing for remaining roles

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

The American Psychological Association's Stress in America surveys have tracked a steady rise in AI-related workplace anxiety — from roughly 36% in 2023 to 57% in 2025. Early 2026 indicators suggest the trend is accelerating, particularly among workers aged 35-54.

This isn't abstract worry. It's manifesting in concrete health outcomes: rising prescriptions for anxiety medication in working-age demographics, elevated rates of insomnia-related complaints, and increased stress-related healthcare utilization in industries undergoing rapid AI adoption.

## The Paradox of Knowledge Workers

Perhaps the most counterintuitive finding: highly educated workers report higher AI-related anxiety than less educated workers. A software engineer with a Stanford degree feels more threatened than a plumber — because the plumber's work is physically embodied and harder to automate, while the engineer watches AI write increasingly competent code.

## Organizational Impact

Companies are beginning to see the wellbeing cost of AI transformation. Engagement surveys show notable declines at firms that announced AI-driven restructuring, compared to modest industry-wide declines. Presenteeism — showing up but not fully functioning — is a growing concern at firms undergoing rapid AI transitions.

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

Major European cities have seen growing protests against unregulated AI deployment. The protests are notable for their cross-demographic composition — not just displaced workers, but students, retirees, and small business owners who perceive AI-driven consolidation as a threat to economic diversity.

## Online Sentiment

Social media analysis shows a marked increase in protest-related online discourse over the past several weeks. The language is shifting from "concern" to "demand" — indicating a transition from passive anxiety to active mobilization.

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

AI-related bills routinely take over a year to move from introduction to committee consideration. Meanwhile, major AI capability releases happen every few months. By the time legislation is drafted, debated, and amended, the technology it addresses has evolved multiple generations.

## What's Actually Moving

Despite the gridlock at the federal level, some policy action is happening:

- **EEOC**: Previous AI hiring guidance was withdrawn in early 2025, but Title VII enforcement still applies to algorithmic discrimination
- **FTC**: Investigating companies for AI-driven pricing practices and deceptive AI claims
- **SEC**: Examining disclosure requirements for AI's role in material business decisions
- **State level**: A growing number of states now have some form of AI-related legislation, with Colorado's AI Act (SB24-205) taking effect in 2026

The pattern: executive agencies and state governments are moving, while Congress remains stalled. This creates a fragmented regulatory landscape that's better than nothing but far from optimal.

## International Comparison

The EU AI Act, despite implementation challenges, has created a baseline that US policy lacks. With penalties reaching up to 7% of global turnover and the high-risk system deadline approaching in August 2026, EU-based firms are investing significantly more in AI governance infrastructure than US counterparts — not because they want to, but because they have to.

## The Workforce Transition Gap

Perhaps the most damaging policy failure isn't in AI regulation but in workforce transition. Federal spending on worker retraining programs has barely kept pace with inflation. Compare this to South Korea's multi-billion-dollar AI transformation plan or Germany's Qualifizierungschancengesetz, which funds up to 100% of AI and digital skills retraining costs.

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

Three months ago, most public polling showed a roughly even split between AI optimists and pessimists. Today, a clear majority of Americans expect AI to reduce total jobs over the next decade — a significant hardening of public opinion in a short period.

What changed? Not any single event, but a critical mass of personal experience. As AI tools went from demos to deployments, people moved from imagining AI's impact to experiencing it. An increasing share of knowledge workers report personally witnessing a colleague's role being eliminated or significantly reduced due to AI integration.

## The Narrative Fracture

What's particularly interesting is the divergence between elite and public sentiment. In tech industry circles and executive surveys, optimism about AI remains high. Among the general public, it's collapsing. This gap suggests a fundamental disconnect between those building AI and those being affected by it.

## Social Media as Amplifier

Reddit, X, and TikTok have become primary venues for sharing displacement stories. Hashtags around AI layoffs have surged across platforms, and our sentiment analysis of these posts shows a shift from individual complaint to collective identity — people are beginning to see themselves as part of a shared experience rather than isolated cases.

## Why Sentiment Matters

Public Sentiment is our lowest-weighted domain at 8%, and that's deliberate — feelings are not facts. But sentiment drives behavior: voting patterns, consumption choices, career decisions, social cohesion. When a majority of the population feels pessimistic about a technology that's being deployed regardless, the political and social consequences are significant.

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

Healthcare's AI story is different from most sectors. Rather than displacement, we're seeing augmentation: radiologists using AI to improve diagnostic accuracy, nurses using predictive models to prioritize patient care, and administrators using AI to reduce paperwork burden.

Why? Healthcare has a fundamental constraint other sectors don't: you can't outsource human touch. The jobs that are growing (home health aides, nurse practitioners, physical therapists) require physical presence and emotional intelligence. AI handles the data; humans handle the care.

## Skilled Trades: The Immunity Effect

Electricians, plumbers, HVAC technicians, and construction workers have seen AI exposure scores below 15 in our model. Their work is physically embodied, spatially complex, and highly variable — exactly the combination AI struggles with. Demand for skilled trades is growing at roughly 3x the rate of professional roles, and wages are rising well above the national average.

## Education: The Uncomfortable Middle

Education sits in an interesting position. AI tutoring tools are demonstrably effective for content delivery — multiple studies show significant improvement in learning outcomes. But the profession's value extends beyond content delivery into mentorship, socialization, and developmental guidance. Schools that are adapting well are redefining the teacher's role from "content deliverer" to "learning facilitator" — and seeing improved outcomes.

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

Each domain is tracked daily using live data from the Bureau of Labor Statistics, Federal Reserve (FRED), World Bank, OECD, and Reddit/RSS sentiment analysis. Every score is weighted according to a documented methodology that we publish in full.

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
