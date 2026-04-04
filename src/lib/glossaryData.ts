import { Domain } from './types'

export interface GlossaryEntry {
  domain: Domain
  slug: string
  title: string
  shortDescription: string
  whatItMeasures: string
  whyItMatters: string
  dataSources: string[]
  methodology: string
  correlations: string[]
  faq: { question: string; answer: string }[]
  actionableInsights: {
    individual: string[]
    policymaker: string[]
    business: string[]
  }
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    domain: 'work_risk',
    slug: 'ai-work-displacement',
    title: 'AI Work Displacement',
    shortDescription: 'Measures the pressure AI and automation place on the labor market, tracking job displacement risk across industries.',
    whatItMeasures: 'This domain quantifies how rapidly AI adoption and automation are displacing human labor. It combines unemployment claims data, enterprise AI investment trends, and occupational exposure assessments to produce a 0-100 stress score. A higher score indicates greater displacement pressure on workers.',
    whyItMatters: 'AI-driven automation is reshaping the global economy at an unprecedented pace. Understanding displacement pressure helps workers, businesses, and governments anticipate and prepare for structural changes in employment. When this score rises sharply, it signals that the rate of job transformation is outpacing the workforce\'s ability to adapt.',
    dataSources: [
      'U.S. Bureau of Labor Statistics — Initial Jobless Claims (FRED: ICSA)',
      'O*NET — Occupational task-level AI exposure scores',
      'Enterprise AI adoption surveys and investment data',
    ],
    methodology: 'Raw indicators are normalized to a 0-100 scale using defined floor and ceiling values based on historical ranges. For example, initial jobless claims below 180K/week score 0 (healthy), while 800K+/week scores 100 (deep recession). The domain score is the weighted average of all contributing indicators.',
    correlations: [
      'When AI Work Displacement rises, Income Inequality tends to widen as displaced workers face downward wage pressure.',
      'High displacement often precedes drops in Public Sentiment as economic anxiety spreads.',
      'Elevated work risk scores correlate with increased demand for Policy Response through retraining programs.',
    ],
    faq: [
      { question: 'What does a high AI Work Displacement score mean?', answer: 'A score above 60 indicates significant labor market stress from AI and automation. This means job displacement is occurring faster than new opportunities are being created, and many workers face retraining needs.' },
      { question: 'How is AI job displacement different from normal unemployment?', answer: 'Traditional unemployment is cyclical and recovers with economic growth. AI displacement is structural — it permanently transforms or eliminates entire job categories, requiring workers to develop entirely new skill sets rather than wait for recovery.' },
      { question: 'Which jobs are most at risk from AI?', answer: 'Roles involving routine data processing, pattern recognition, content generation, and rules-based decision making face the highest exposure. This includes many white-collar roles in finance, law, healthcare administration, and customer service.' },
    ],
    actionableInsights: {
      individual: [
        'Assess your role\'s AI exposure using the AI Exposure Quiz to understand your personal risk level.',
        'Invest in skills that complement AI rather than compete with it: complex problem-solving, creative thinking, emotional intelligence, and cross-disciplinary expertise.',
        'Build financial resilience with 6-12 months of emergency savings to weather potential career transitions.',
        'Stay current with AI tools in your field — proficiency with AI augments your value rather than making you replaceable.',
      ],
      policymaker: [
        'Fund workforce retraining programs focused on AI-adjacent skills rather than traditional vocational training.',
        'Develop portable benefits systems that support workers through career transitions between industries.',
        'Create incentives for companies that invest in internal reskilling rather than mass layoffs.',
      ],
      business: [
        'Implement responsible AI adoption plans that include workforce transition support.',
        'Invest in employee upskilling programs to redeploy rather than replace affected workers.',
        'Monitor AI Work Displacement trends to anticipate talent market shifts in your industry.',
      ],
    },
  },
  {
    domain: 'inequality',
    slug: 'income-inequality',
    title: 'Income Inequality',
    shortDescription: 'Tracks wealth concentration, income distribution gaps, and economic opportunity access across populations.',
    whatItMeasures: 'This domain measures how unevenly income and wealth are distributed in society. It uses the Gini coefficient, income share held by the top 10%, and related economic indicators to produce a stress score. A higher score indicates greater concentration of wealth and wider gaps between economic classes.',
    whyItMatters: 'Extreme inequality destabilizes societies. When wealth concentrates at the top, social mobility declines, political polarization increases, and public trust in institutions erodes. Historically, sustained high inequality has preceded periods of social upheaval and institutional breakdown.',
    dataSources: [
      'U.S. Census Bureau — Gini Index (FRED: SIPOVGINIUSA)',
      'World Bank — Gini Index (SI.POV.GINI)',
      'World Bank — Income Share Held by Top 10% (SI.DST.10TH.10)',
      'U.S. Census Bureau — Median Household Income (FRED: MEHOINUSA672N)',
      'U.S. Census Bureau — Poverty Rate (FRED: PPAAUS00000A156NCEN)',
    ],
    methodology: 'The Gini coefficient (0 = perfect equality, 100 = perfect inequality) is normalized against a range of 35-55. Values below 35 score 0 (egalitarian), values above 55 score 100 (extreme inequality). Multiple data sources are averaged to reduce single-source bias.',
    correlations: [
      'Rising Income Inequality strongly correlates with increased Social Unrest as economic frustration translates to civic disengagement and protest.',
      'High inequality tends to degrade Social Wellbeing through reduced access to healthcare, education, and financial security.',
      'When Income Inequality rises, demand for Policy Response increases, but the policy response itself often lags by years.',
    ],
    faq: [
      { question: 'What is the Gini coefficient?', answer: 'The Gini coefficient is the most widely used measure of income inequality. It ranges from 0 (everyone earns exactly the same) to 100 (one person earns everything). The United States typically scores between 39-49, which is high among developed nations.' },
      { question: 'Why does AI increase income inequality?', answer: 'AI tends to benefit capital owners and highly-skilled workers disproportionately. It automates middle-skill jobs while creating demand for high-skill roles, hollowing out the middle class. The productivity gains from AI often flow to shareholders rather than workers.' },
      { question: 'Is some inequality normal?', answer: 'Yes. A moderate level of inequality reflects natural differences in skills, effort, and risk-taking. The concern arises when inequality becomes extreme — when it limits social mobility, concentrates political power, and prevents large portions of the population from accessing basic opportunities.' },
    ],
    actionableInsights: {
      individual: [
        'Diversify income sources. Side projects, investments, and skill-based freelancing reduce dependency on a single employer.',
        'Invest in financial literacy — understanding compound interest, tax optimization, and asset allocation helps bridge wealth gaps over time.',
        'Support and engage with community economic development programs and cooperatives.',
      ],
      policymaker: [
        'Implement progressive tax policies that address wealth concentration without stifling economic growth.',
        'Invest in public education and vocational training to maintain social mobility.',
        'Strengthen social safety nets to prevent inequality from cascading into health and wellbeing crises.',
      ],
      business: [
        'Adopt transparent pay structures and invest in workforce development across all levels.',
        'Share AI-driven productivity gains with employees through profit-sharing or equity programs.',
        'Support local economic ecosystems through procurement policies that benefit smaller suppliers.',
      ],
    },
  },
  {
    domain: 'unrest',
    slug: 'social-unrest',
    title: 'Social Unrest',
    shortDescription: 'Monitors political instability, civic disengagement, protest activity, and social tension across populations.',
    whatItMeasures: 'This domain tracks the level of social friction in society — from political polarization and civic disengagement to organized protests and political violence. It uses political stability indices and conflict event data to gauge how close a society is to destabilizing unrest.',
    whyItMatters: 'Social unrest is both a symptom and a cause of civilizational stress. It signals that existing institutions and policies are failing to address population needs. When unrest scores rise, it indicates growing risk of disruption to economic activity, governance, and daily life.',
    dataSources: [
      'World Bank — Political Stability & Absence of Violence Index (PV.EST)',
      'OECD — Voter Turnout (BLI/CG_VOTO)',
      'FBI — Violent Crime Rate per 100K (UCR)',
      'FBI NICS — Firearm Background Checks (annual)',
      'ACLED — Armed Conflict Location & Event Data (protests & riots)',
    ],
    methodology: 'Political stability scores from the World Governance Indicators are inverted and normalized: a score of 2.0 (very stable) maps to 0, while -2.0 (severe unrest) maps to 100. Additional conflict event data will be incorporated as data sources are integrated.',
    correlations: [
      'Social Unrest typically intensifies when Income Inequality and Institutional Decay are both elevated simultaneously.',
      'Rising unrest often triggers sharp drops in Public Sentiment as people lose confidence in the future.',
      'Prolonged unrest degrades Social Wellbeing through disruption to services, economic activity, and mental health.',
    ],
    faq: [
      { question: 'What counts as social unrest?', answer: 'Social unrest encompasses a spectrum from peaceful protests and labor strikes to political violence and civil conflict. The Human Index tracks all forms, weighted by severity and scale, to provide an overall tension reading.' },
      { question: 'Can social unrest be positive?', answer: 'Yes. Peaceful protest and civic engagement are healthy mechanisms for social change. The concern is when unrest escalates to violence, or when civic disengagement (low voter turnout, institutional distrust) signals that people have given up on peaceful channels for change.' },
      { question: 'How does AI contribute to social unrest?', answer: 'AI amplifies existing social tensions through job displacement, algorithmic polarization on social media, misinformation generation, and concentration of economic power. These effects compound existing grievances rather than creating entirely new ones.' },
    ],
    actionableInsights: {
      individual: [
        'Stay engaged with local governance — attend community meetings and participate in constructive civic processes.',
        'Be critical of algorithmically amplified content that aims to provoke outrage rather than inform.',
        'Build and maintain diverse social connections across political, economic, and cultural lines.',
      ],
      policymaker: [
        'Address root causes of discontent rather than focusing solely on protest suppression.',
        'Create accessible channels for citizen feedback and participatory governance.',
        'Invest in community-level conflict resolution programs and social cohesion initiatives.',
      ],
      business: [
        'Monitor unrest indicators in regions where you operate to anticipate supply chain and operational disruptions.',
        'Ensure your workforce policies don\'t contribute to community tensions — fair wages and benefits reduce local friction.',
        'Support civic engagement programs for employees as part of corporate social responsibility.',
      ],
    },
  },
  {
    domain: 'decay',
    slug: 'institutional-decay',
    title: 'Institutional Decay',
    shortDescription: 'Tracks the erosion of governance effectiveness, rule of law, corruption control, and public trust in institutions.',
    whatItMeasures: 'This domain measures the health and effectiveness of governing institutions. It combines indicators for government effectiveness, voice and accountability, rule of law, and corruption control to assess whether institutions are strong enough to manage civilizational challenges.',
    whyItMatters: 'Institutions are the immune system of civilization. When they decay — through corruption, incompetence, or loss of legitimacy — societies lose their ability to respond to crises, enforce rules fairly, and maintain public trust. Institutional decay often precedes and amplifies other forms of stress.',
    dataSources: [
      'World Bank — Government Effectiveness (GE.EST)',
      'World Bank — Voice & Accountability (VA.EST)',
      'World Bank — Rule of Law (RL.EST)',
      'World Bank — Control of Corruption (CC.EST)',
      'OECD/Pew — Trust in Government (%)',
      'FRED — 10Y-2Y Treasury Spread (T10Y2Y)',
      'FBI — Property Crime Rate per 100K (UCR)',
    ],
    methodology: 'World Governance Indicators are measured on a scale from -2.5 to +2.5. These are inverted and normalized: scores of 2.0-2.5 (excellent governance) map to 0, while -1.0 to -1.5 (failed state) map to 100. The four indicators are averaged for the domain score.',
    correlations: [
      'Institutional Decay amplifies all other stress domains — weak institutions cannot effectively respond to inequality, unrest, or displacement.',
      'Corruption (a component of decay) directly feeds Income Inequality by allowing regulatory capture and rent-seeking.',
      'Eroding Voice & Accountability reduces the population\'s ability to effect change peacefully, increasing Social Unrest risk.',
    ],
    faq: [
      { question: 'What does institutional decay look like in practice?', answer: 'It manifests as declining government effectiveness, politicized courts, regulatory capture by special interests, declining public trust in elections, growing corruption, and reduced government capacity to deliver services.' },
      { question: 'Is institutional decay reversible?', answer: 'Yes, but it requires sustained effort. Transparency initiatives, independent judiciaries, anti-corruption enforcement, and civic engagement can rebuild institutional health. However, recovery typically takes longer than the decay process.' },
      { question: 'How does AI affect institutional decay?', answer: 'AI creates new governance challenges (regulating algorithms, addressing AI bias, managing autonomous systems) that many institutions are ill-equipped to handle. Simultaneously, AI tools could strengthen institutions through better data analysis, fraud detection, and service delivery — if adopted responsibly.' },
    ],
    actionableInsights: {
      individual: [
        'Stay informed about governance quality in your jurisdiction — attend public meetings and read audit reports.',
        'Support independent journalism and transparency organizations that hold institutions accountable.',
        'Participate in elections and civic processes — low participation accelerates institutional decay.',
      ],
      policymaker: [
        'Invest in institutional capacity building, particularly in areas of AI governance and digital regulation.',
        'Strengthen anti-corruption mechanisms with modern auditing tools and whistleblower protections.',
        'Build public trust through transparency — publish data, explain decisions, and accept accountability.',
      ],
      business: [
        'Advocate for clear and consistent regulatory frameworks rather than regulatory vacuums that benefit incumbents.',
        'Implement strong corporate governance and compliance programs that exceed minimum requirements.',
        'Support industry self-regulation initiatives to demonstrate responsibility and reduce the need for reactive policy.',
      ],
    },
  },
  {
    domain: 'wellbeing',
    slug: 'social-wellbeing',
    title: 'Social Wellbeing',
    shortDescription: 'Measures population health, life satisfaction, financial security, and mental health across society.',
    whatItMeasures: 'This domain captures the overall quality of life for the population. It combines life expectancy, mental health indicators (suicide rates), personal savings rates, and financial fragility data to assess whether people are thriving or merely surviving.',
    whyItMatters: 'A society\'s true health isn\'t measured by GDP alone. When wellbeing deteriorates — through declining life expectancy, rising mental health crises, or evaporating savings — it signals that economic growth is not translating into human prosperity. Declining wellbeing is often a leading indicator of social and political instability.',
    dataSources: [
      'FRED — Personal Saving Rate (PSAVERT)',
      'World Bank — Life Expectancy at Birth (SP.DYN.LE00.IN)',
      'World Bank — Suicide Rate per 100K (SH.STA.SUIC.P5)',
      'OECD — Life Satisfaction (BLI/SW_LIFS)',
      'CDC — Drug Overdose Deaths per 100K',
      'U.S. Census — Uninsured Rate (ACS)',
      'HUD — Homeless Population (Point-in-Time Count)',
      'CDC/NCFMR — Divorce Rate per 1,000',
    ],
    methodology: 'Each indicator is normalized to 0-100 with inverted scales where appropriate. For example, a 10%+ personal savings rate scores 0 (healthy), while 1% scores 100 (extreme fragility). Life expectancy of 82+ scores 0, while 65 years scores 100 (severe health crisis).',
    correlations: [
      'Social Wellbeing tends to decline when Income Inequality is high, as economic stress directly impacts health and life satisfaction.',
      'Declining wellbeing feeds back into Public Sentiment — people who are struggling financially and mentally report lower confidence.',
      'AI Work Displacement can rapidly degrade wellbeing by eliminating stable employment that provides identity, purpose, and financial security.',
    ],
    faq: [
      { question: 'Why is personal savings rate included in wellbeing?', answer: 'Savings rate is a proxy for financial fragility. When people cannot save, they are one unexpected expense away from crisis. Low savings rates indicate that the population lacks the financial buffer needed for stability and wellbeing.' },
      { question: 'How does AI affect social wellbeing?', answer: 'AI impacts wellbeing through multiple channels: job displacement threatens financial security, algorithmic social media exacerbates mental health issues, and the pace of technological change creates anxiety. However, AI also enables better healthcare, education, and productivity when deployed thoughtfully.' },
      { question: 'What is a good wellbeing score?', answer: 'A score below 25 indicates healthy population wellbeing — strong life expectancy, adequate savings, and manageable mental health burden. Scores above 60 signal serious wellbeing concerns that typically require policy intervention.' },
    ],
    actionableInsights: {
      individual: [
        'Prioritize an emergency fund of 3-6 months expenses — financial security is the foundation of wellbeing.',
        'Invest in preventive health: regular exercise, sleep hygiene, and social connection have outsized impact on long-term wellbeing.',
        'Set boundaries with technology — screen time management and digital detoxes improve mental health.',
        'Build strong social ties — community connection is the strongest predictor of life satisfaction.',
      ],
      policymaker: [
        'Invest in mental health infrastructure — the return on investment for accessible mental healthcare is enormous.',
        'Strengthen the social safety net to prevent financial shocks from cascading into health crises.',
        'Address housing affordability and healthcare access as foundational wellbeing priorities.',
      ],
      business: [
        'Offer comprehensive employee wellness programs that address financial, mental, and physical health.',
        'Provide adequate paid leave, flexible work arrangements, and livable wages.',
        'Monitor employee burnout and adjust workload expectations accordingly.',
      ],
    },
  },
  {
    domain: 'policy',
    slug: 'policy-response',
    title: 'Policy Response',
    shortDescription: 'Evaluates government fiscal capacity, debt sustainability, and the adequacy of policy responses to emerging challenges.',
    whatItMeasures: 'This domain assesses whether government policy is keeping pace with civilizational challenges. It tracks fiscal capacity (debt-to-GDP ratio), social spending levels, and the overall responsiveness of policy infrastructure to emerging threats like AI displacement and inequality.',
    whyItMatters: 'Policy response is the feedback mechanism of civilization. When governments have fiscal room to act and spend effectively on social needs, they can mitigate rising stress in other domains. When policy capacity is constrained by debt or political gridlock, problems compound unchecked.',
    dataSources: [
      'FRED — Federal Debt as % of GDP (FYONGDA188S)',
      'FRED — Government Social Benefits Spending (G160291A027NBEA)',
    ],
    methodology: 'Debt-to-GDP is normalized with 60% scoring 0 (sustainable) and 150%+ scoring 100 (fiscal crisis). Social spending is evaluated against historical ranges. Both indicators aim to capture whether governments have the capacity and willingness to respond to civilizational stress.',
    correlations: [
      'Weak Policy Response allows other stress domains to compound — without intervention, inequality, displacement, and unrest reinforce each other.',
      'High government debt constrains future policy options, creating a dangerous feedback loop during crises.',
      'Effective policy response can reduce AI Work Displacement impact through retraining programs and transition support.',
    ],
    faq: [
      { question: 'Why does high government debt indicate stress?', answer: 'High debt-to-GDP ratios reduce a government\'s ability to respond to new crises. When debt is already elevated, there is less fiscal room for stimulus spending, social programs, or emergency response — precisely when they may be needed most.' },
      { question: 'Is government spending always good?', answer: 'Not necessarily. The quality and targeting of spending matters as much as the quantity. Well-targeted investments in education, infrastructure, and retraining have high returns. Poorly allocated spending can increase debt without addressing root problems.' },
      { question: 'How should governments respond to AI displacement?', answer: 'Effective responses include funding workforce retraining programs, strengthening social safety nets, investing in education reform, and developing regulatory frameworks for AI. The key is proactive investment before displacement peaks, not reactive measures after mass job loss.' },
    ],
    actionableInsights: {
      individual: [
        'Stay informed about fiscal policy in your jurisdiction — understand how government spending priorities affect your economic environment.',
        'Advocate for evidence-based policy by engaging with elected officials and supporting nonpartisan policy research.',
        'Don\'t rely solely on government policy for personal resilience — build individual and community-level safety nets.',
      ],
      policymaker: [
        'Prioritize AI-era workforce development investment now, while fiscal capacity exists.',
        'Design flexible policy frameworks that can adapt to rapidly changing technological conditions.',
        'Balance fiscal responsibility with adequate social investment — austerity during technological disruption amplifies human cost.',
      ],
      business: [
        'Engage constructively in policy discussions about AI regulation and workforce transition.',
        'Support public-private partnerships for worker retraining and community economic development.',
        'Prepare for potential regulatory changes by building compliance capacity early.',
      ],
    },
  },
  {
    domain: 'sentiment',
    slug: 'public-sentiment',
    title: 'Public Sentiment',
    shortDescription: 'Tracks consumer confidence, economic optimism, and the overall public mood through survey data.',
    whatItMeasures: 'This domain captures how the public feels about the economy and their future. It combines consumer sentiment surveys (University of Michigan), consumer confidence indices (OECD), and related mood indicators to measure whether people are optimistic or pessimistic about economic conditions.',
    whyItMatters: 'Public sentiment is both a measure and a driver of economic health. When confidence drops, consumers spend less, businesses invest less, and recessions become self-fulfilling. Sentiment also reflects how well institutions and policies are addressing population concerns — it\'s a real-time "approval rating" for the entire system.',
    dataSources: [
      'FRED — University of Michigan Consumer Sentiment Index (UMCSENT)',
      'FRED — OECD Consumer Confidence Index (CSCICP03USM665S)',
      'CBOE — VIX Volatility / Fear Index (FRED: VIXCLS)',
    ],
    methodology: 'Consumer sentiment indices are inverted and normalized: a reading of 100+ (optimistic) scores 0, while 45 (crisis-level pessimism) scores 100. Two independent survey sources are averaged to provide a robust sentiment reading.',
    correlations: [
      'Public Sentiment typically falls when AI Work Displacement and Income Inequality are rising — economic anxiety directly impacts mood.',
      'Sentiment declines can become self-fulfilling as reduced consumer spending triggers the economic slowdowns people fear.',
      'Sudden sentiment drops often precede Social Unrest as economic pessimism translates into political action.',
    ],
    faq: [
      { question: 'Why does consumer sentiment matter?', answer: 'Consumer sentiment drives roughly 70% of economic activity in developed economies. When people feel pessimistic, they reduce spending, delay major purchases, and hoard savings — behaviors that can trigger or deepen economic downturns regardless of underlying fundamentals.' },
      { question: 'How accurate are sentiment surveys?', answer: 'No single survey is perfectly predictive, which is why The Human Index combines multiple independent sources. The University of Michigan survey has been conducted since 1952 and has a strong track record of anticipating economic turning points.' },
      { question: 'Can AI improve public sentiment?', answer: 'AI could improve sentiment indirectly by increasing productivity and creating new opportunities. However, if AI benefits are concentrated among the wealthy while displacing workers, it will likely deepen pessimism. The key is whether AI\'s gains are broadly shared.' },
    ],
    actionableInsights: {
      individual: [
        'Be aware that media and social media algorithms amplify negative sentiment — seek balanced information sources.',
        'Base financial decisions on fundamentals, not mood — sentiment is volatile and often overshoots reality in both directions.',
        'Focus on what you can control: skills, savings, health, and relationships are more resilient than market sentiment.',
      ],
      policymaker: [
        'Take sentiment data seriously as an early warning system — declining confidence often predicts economic trouble 3-6 months ahead.',
        'Communicate economic policy clearly and transparently — uncertainty is the biggest driver of negative sentiment.',
        'Address visible sources of economic anxiety (job insecurity, housing costs) to rebuild foundational confidence.',
      ],
      business: [
        'Monitor sentiment trends for demand forecasting — consumer confidence shifts directly impact purchasing behavior.',
        'During low-sentiment periods, focus on value proposition and customer loyalty rather than aggressive expansion.',
        'Employee sentiment mirrors public sentiment — invest in internal communication and morale during pessimistic periods.',
      ],
    },
  },
]

export function getGlossaryBySlug(slug: string): GlossaryEntry | undefined {
  return GLOSSARY.find((g) => g.slug === slug)
}

export function getGlossaryByDomain(domain: Domain): GlossaryEntry | undefined {
  return GLOSSARY.find((g) => g.domain === domain)
}
