import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ThumbsUp, ThumbsDown, Minus, Clock, ExternalLink, TrendingUp, Zap } from 'lucide-react'

const sentimentHistory = [
  { time: '09:00', bullish: 65, bearish: 20, neutral: 15 },
  { time: '10:00', bullish: 58, bearish: 28, neutral: 14 },
  { time: '11:00', bullish: 72, bearish: 18, neutral: 10 },
  { time: '12:00', bullish: 61, bearish: 25, neutral: 14 },
  { time: '13:00', bullish: 55, bearish: 32, neutral: 13 },
  { time: '14:00', bullish: 69, bearish: 20, neutral: 11 },
  { time: '15:00', bullish: 74, bearish: 16, neutral: 10 },
]

const newsItems = [
  {
    id: 1,
    headline: 'Equinor rapporterer rekordresultater for Q1 2026 — overgår konsensus med 12%',
    source: 'E24',
    time: '14:45',
    sentiment: 'bullish',
    score: 0.84,
    tickers: ['EQNR'],
    summary: 'Equinor leverte kvartalsinntekter på NOK 287 milliarder, drevet av høye olje- og gasspriser kombinert med effektiviseringer på norsk sokkel. Utbytte økes med 15%.',
    impact: 'Høy',
    category: 'Resultat',
  },
  {
    id: 2,
    headline: 'Norges Bank holder renten uendret — signalerer mulig kutt i september',
    source: 'Finansavisen',
    time: '10:00',
    sentiment: 'bullish',
    score: 0.61,
    tickers: ['DNB', 'SRBNK'],
    summary: 'Sentralbanken valgte å holde styringsrenten på 4.5% men åpnet for rentekutt dersom inflasjonen fortsetter nedover. Bankaksjer reagerte positivt.',
    impact: 'Middels',
    category: 'Makro',
  },
  {
    id: 3,
    headline: 'NVIDIA varsler forsinket leveranse av Blackwell-brikker — produksjonsproblemer hos TSMC',
    source: 'Reuters',
    time: '09:15',
    sentiment: 'bearish',
    score: -0.72,
    tickers: ['NVDA', 'TSM'],
    summary: 'Leveringsproblemer i produksjonskjeden kan gi NVIDIA inntektstap på opptil 3 milliarder dollar i Q2. Aksjen falt 4.2% i førhandel.',
    impact: 'Høy',
    category: 'Sektor',
  },
  {
    id: 4,
    headline: 'Mowi øker lakseprismål for 2026 — sterk global etterspørsel',
    source: 'Intrafish',
    time: '08:30',
    sentiment: 'bullish',
    score: 0.78,
    tickers: ['MOWI'],
    summary: 'Analytikere hever kursmålet på Mowi til 240 NOK etter sterk kinesisk etterspørsel og begrenset tilbud fra Chile. Meglerhus oppgraderer til kjøp.',
    impact: 'Middels',
    category: 'Analyse',
  },
  {
    id: 5,
    headline: 'Global resesjonsfrykt øker — PMI-data skuffer i eurosonene',
    source: 'Bloomberg',
    time: '08:00',
    sentiment: 'bearish',
    score: -0.55,
    tickers: [],
    summary: 'Innkjøpssjefindekser for industri falt under 50 for tredje måned på rad i eurosonen. Markedet priser inn økt sannsynlighet for resesjon innen 12 måneder.',
    impact: 'Høy',
    category: 'Makro',
  },
  {
    id: 6,
    headline: 'Apple lanserer AI-drevet finansiell rådgiver i iOS 20 — partnerskap med Goldman Sachs',
    source: 'TechCrunch',
    time: '07:45',
    sentiment: 'bullish',
    score: 0.69,
    tickers: ['AAPL', 'GS'],
    summary: 'Apple bekrefter integrasjon av avansert AI-finansiell analyse direkte i iPhone, potensielt disrupting tradisjonell formuesforvaltning.',
    impact: 'Middels',
    category: 'Teknologi',
  },
]

const trendingTopics = [
  { topic: 'Norges Bank', mentions: 142, delta: +28, sentiment: 'bullish' },
  { topic: 'Kunstig Intelligens', mentions: 98, delta: +15, sentiment: 'bullish' },
  { topic: 'Resesjon', mentions: 87, delta: +31, sentiment: 'bearish' },
  { topic: 'Laksepris', mentions: 64, delta: -8, sentiment: 'bullish' },
  { topic: 'Oljepris', mentions: 59, delta: +4, sentiment: 'neutral' },
]

const sentimentIcon = { bullish: ThumbsUp, bearish: ThumbsDown, neutral: Minus }
const sentimentColor = { bullish: 'var(--gain)', bearish: 'var(--loss)', neutral: 'var(--gold)' }
const sentimentLabel = { bullish: 'Bullish', bearish: 'Bearish', neutral: 'Nøytral' }

const categoryColors = {
  Resultat: '#3b82f6',
  Makro: '#8b5cf6',
  Sektor: '#f59e0b',
  Analyse: '#10b981',
  Teknologi: '#06b6d4',
}

function SentimentMeter({ score }) {
  const pct = ((score + 1) / 2) * 100
  const color = score > 0.3 ? 'var(--gain)' : score < -0.3 ? 'var(--loss)' : 'var(--gold)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 80, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{score > 0 ? '+' : ''}{score.toFixed(2)}</span>
    </div>
  )
}

export default function NewsAnalysis() {
  const [filter, setFilter] = useState('Alle')
  const [selectedNews, setSelectedNews] = useState(null)
  const filters = ['Alle', 'Bullish', 'Bearish', 'Makro', 'Sektor']

  const filtered = newsItems.filter(n => {
    if (filter === 'Alle') return true
    if (filter === 'Bullish') return n.sentiment === 'bullish'
    if (filter === 'Bearish') return n.sentiment === 'bearish'
    return n.category === filter
  })

  const bullishCount = newsItems.filter(n => n.sentiment === 'bullish').length
  const bearishCount = newsItems.filter(n => n.sentiment === 'bearish').length
  const overallSentiment = bullishCount > bearishCount ? 'Bullish' : 'Bearish'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Nyheter Analysert', value: '247', sub: 'Siste 24 timer', icon: '📰', color: 'var(--accent-blue)' },
          { label: 'Samlet Sentiment', value: overallSentiment, sub: `${bullishCount} bullish / ${bearishCount} bearish`, icon: '🎯', color: 'var(--gain)' },
          { label: 'Høy Påvirkning', value: '3', sub: 'Nyheter i dag', icon: '⚡', color: 'var(--gold)' },
          { label: 'AI Nøyaktighet', value: '89%', sub: 'Sentimentmodell', icon: '🤖', color: 'var(--accent-cyan)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Trending */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

        {/* Sentiment chart */}
        <div className="card">
          <div className="card-title">Sentimentutvikling — I dag</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sentimentHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-muted)' }}
              />
              <Bar dataKey="bullish" name="Bullish" stackId="a" fill="var(--gain)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="neutral" name="Nøytral" stackId="a" fill="var(--gold)" />
              <Bar dataKey="bearish" name="Bearish" stackId="a" fill="var(--loss)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trending topics */}
        <div className="card">
          <div className="card-title">Trendende Temaer</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {trendingTopics.map((t, i) => (
              <div key={t.topic} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 16 }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{t.topic}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.mentions} omtaler</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: t.delta > 0 ? 'var(--gain)' : 'var(--loss)',
                }}>
                  {t.delta > 0 ? '+' : ''}{t.delta}
                </span>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: sentimentColor[t.sentiment],
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Filter:</span>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: filter === f ? 600 : 400,
            background: filter === f ? 'var(--accent-blue)' : 'var(--bg-card)',
            color: filter === f ? 'white' : 'var(--text-secondary)',
            border: filter === f ? 'none' : '1px solid var(--border)',
          }}>{f}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} nyheter</span>
      </div>

      {/* News list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(news => {
          const SIcon = sentimentIcon[news.sentiment]
          const sColor = sentimentColor[news.sentiment]
          return (
            <div
              key={news.id}
              className="card"
              onClick={() => setSelectedNews(selectedNews?.id === news.id ? null : news)}
              style={{
                cursor: 'pointer',
                borderLeft: `3px solid ${sColor}`,
                transition: 'all 0.15s ease',
                background: selectedNews?.id === news.id ? 'var(--bg-card-hover)' : 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

                {/* Sentiment icon */}
                <div style={{
                  padding: 10,
                  borderRadius: 10,
                  background: `${sColor}15`,
                  flexShrink: 0,
                }}>
                  <SIcon size={18} color={sColor} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 4, letterSpacing: '0.5px',
                      background: `${categoryColors[news.category]}20`,
                      color: categoryColors[news.category],
                    }}>{news.category}</span>
                    {news.tickers.map(t => (
                      <span key={t} className="badge badge-neutral">{t}</span>
                    ))}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {news.time} · {news.source}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 8 }}>
                    {news.headline}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>AI Sentiment</div>
                      <SentimentMeter score={news.score} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Påvirkning</div>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: news.impact === 'Høy' ? 'var(--loss)' : news.impact === 'Middels' ? 'var(--gold)' : 'var(--text-muted)',
                      }}>{news.impact}</span>
                    </div>
                  </div>

                  {/* Expanded summary */}
                  {selectedNews?.id === news.id && (
                    <div style={{
                      marginTop: 12,
                      padding: '12px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 8,
                      borderLeft: '2px solid var(--accent-blue)',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 6 }}>
                        🤖 AI-sammendrag
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {news.summary}
                      </p>
                      <button style={{
                        marginTop: 10,
                        fontSize: 11,
                        padding: '5px 12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <ExternalLink size={11} /> Les original
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
