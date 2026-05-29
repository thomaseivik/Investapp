import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ThumbsUp, ThumbsDown, Minus, Clock, ExternalLink, RefreshCw, Search, X } from 'lucide-react'
import {
  fetchAVNews, fetchFMPNews,
  mapAVNews, mapFMPNews,
  deduplicateNews, matchesSearch,
} from '../services/api'

const sentimentIcon = { bullish: ThumbsUp, bearish: ThumbsDown, neutral: Minus }
const sentimentColor = { bullish: 'var(--gain)', bearish: 'var(--loss)', neutral: 'var(--gold)' }

const categoryColors = {
  Marked: '#3b82f6', Resultat: '#3b82f6', Makro: '#8b5cf6',
  Teknologi: '#06b6d4', Energi: '#f59e0b', Finans: '#10b981',
  Eiendom: '#ec4899', Industri: '#f97316', Helse: '#14b8a6', Handel: '#a78bfa',
}

function SentimentMeter({ score }) {
  const pct = ((score + 1) / 2) * 100
  const color = score > 0.15 ? 'var(--gain)' : score < -0.15 ? 'var(--loss)' : 'var(--gold)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 80, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{score > 0 ? '+' : ''}{score.toFixed(2)}</span>
    </div>
  )
}

function buildSentimentHistory(news) {
  const hours = {}
  news.forEach(n => {
    const h = (n.time || '00:00').split(':')[0].padStart(2, '0')
    if (!hours[h]) hours[h] = { bullish: 0, bearish: 0, neutral: 0 }
    hours[h][n.sentiment]++
  })
  return Object.entries(hours)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([h, v]) => ({ time: `${h}:00`, ...v }))
}

function buildTrending(news) {
  const counts = {}
  const sentiments = {}
  news.forEach(n => {
    n.tickers.forEach(t => {
      counts[t] = (counts[t] || 0) + 1
      if (!sentiments[t]) sentiments[t] = { bull: 0, bear: 0 }
      if (n.sentiment === 'bullish') sentiments[t].bull++
      if (n.sentiment === 'bearish') sentiments[t].bear++
    })
  })
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic, mentions]) => ({
      topic, mentions,
      sentiment: (sentiments[topic]?.bull ?? 0) >= (sentiments[topic]?.bear ?? 0) ? 'bullish' : 'bearish',
    }))
}

function Spinner({ size = 16 }) {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <RefreshCw size={size} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
    </>
  )
}

export default function NewsAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('ticker') || '')
  const [baseNews, setBaseNews] = useState([])
  const [tickerNews, setTickerNews] = useState([])
  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingTicker, setLoadingTicker] = useState(false)
  const [baseError, setBaseError] = useState(null)
  const [filter, setFilter] = useState('Alle')
  const [selectedNews, setSelectedNews] = useState(null)
  const debounceRef = useRef(null)
  const searchInputRef = useRef(null)

  // Load base news from both FMP + AV on mount
  useEffect(() => {
    Promise.allSettled([fetchFMPNews(null, 50), fetchAVNews(20)])
      .then(([fmpResult, avResult]) => {
        const fmpNews = fmpResult.status === 'fulfilled' && Array.isArray(fmpResult.value)
          ? mapFMPNews(fmpResult.value)
          : []
        const avNews = avResult.status === 'fulfilled' && avResult.value?.feed
          ? mapAVNews(avResult.value.feed)
          : []
        const combined = deduplicateNews([...avNews, ...fmpNews])
        if (combined.length === 0) setBaseError('Ingen nyheter tilgjengelig. Sjekk API-nøkler.')
        setBaseNews(combined)
      })
      .catch(() => setBaseError('Nettverksfeil ved henting av nyheter.'))
      .finally(() => setLoadingBase(false))
  }, [])

  // Ticker-specific fetch with 600ms debounce
  useEffect(() => {
    clearTimeout(debounceRef.current)
    const term = search.trim()

    if (!term) {
      setTickerNews([])
      setSearchParams({}, { replace: true })
      return
    }

    setSearchParams({ ticker: term }, { replace: true })

    debounceRef.current = setTimeout(() => {
      setLoadingTicker(true)
      fetchFMPNews(term, 30)
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setTickerNews(mapFMPNews(data))
          } else {
            setTickerNews([])
          }
        })
        .catch(() => setTickerNews([]))
        .finally(() => setLoadingTicker(false))
    }, 600)

    return () => clearTimeout(debounceRef.current)
  }, [search])

  const filters = ['Alle', 'Bullish', 'Bearish', 'Makro', 'Teknologi', 'Resultat']
  const isSearching = search.trim().length > 0

  const allNews = isSearching
    ? deduplicateNews([...tickerNews, ...baseNews.filter(n => matchesSearch(n, search))])
    : baseNews

  const displayed = allNews.filter(n => {
    if (filter === 'Alle') return true
    if (filter === 'Bullish') return n.sentiment === 'bullish'
    if (filter === 'Bearish') return n.sentiment === 'bearish'
    return n.category === filter
  })

  const bullishCount = displayed.filter(n => n.sentiment === 'bullish').length
  const bearishCount = displayed.filter(n => n.sentiment === 'bearish').length
  const sentimentHistory = buildSentimentHistory(allNews)
  const trendingTopics = buildTrending(allNews)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>

      {/* Search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '10px 16px',
        boxShadow: isSearching ? '0 0 0 2px rgba(59,130,246,0.25)' : 'none',
        transition: 'box-shadow 0.15s',
      }}>
        <Search size={18} color={isSearching ? 'var(--accent-blue)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
        <input
          ref={searchInputRef}
          value={search}
          onChange={e => { setSearch(e.target.value); setSelectedNews(null) }}
          placeholder="Søk på ticker eller selskapsnavn — f.eks. NVDA, Apple, Equinor…"
          style={{
            flex: 1, background: 'transparent', border: 'none',
            fontSize: 14, color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        {loadingTicker && <Spinner size={15} />}
        {isSearching && !loadingTicker && (
          <button
            onClick={() => { setSearch(''); searchInputRef.current?.focus() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
          >
            <X size={16} color="var(--text-muted)" />
          </button>
        )}
      </div>

      {/* Active search banner */}
      {isSearching && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 10, padding: '10px 16px',
        }}>
          <Search size={14} color="var(--accent-blue)" />
          <span style={{ fontSize: 13, color: 'var(--accent-blue)', fontWeight: 600 }}>
            Nyheter for: &quot;{search}&quot;
          </span>
          {loadingTicker && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Spinner size={12} /> Henter ticker-nyheter…
            </span>
          )}
          {!loadingTicker && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
              {allNews.length} treff ({tickerNews.length} ticker-spesifikke)
            </span>
          )}
          <button
            onClick={() => setSearch('')}
            style={{
              marginLeft: 'auto', fontSize: 12, padding: '4px 10px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            Nullstill søk
          </button>
        </div>
      )}

      {/* Stats */}
      {loadingBase ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, gap: 10, color: 'var(--text-muted)' }}>
          <Spinner /> <span style={{ fontSize: 13 }}>Henter nyheter fra FMP + Alpha Vantage…</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Nyheter vist', value: String(displayed.length), sub: `av ${allNews.length} totalt`, icon: '📰', color: 'var(--accent-blue)' },
            { label: 'Sentiment', value: bullishCount > bearishCount ? 'Bullish' : bearishCount > bullishCount ? 'Bearish' : 'Nøytral', sub: `${bullishCount} bull / ${bearishCount} bear`, icon: '🎯', color: bullishCount >= bearishCount ? 'var(--gain)' : 'var(--loss)' },
            { label: 'Høy Påvirkning', value: String(displayed.filter(n => n.impact === 'Høy').length), sub: 'nyheter', icon: '⚡', color: 'var(--gold)' },
            { label: 'Kilder', value: 'FMP + AV', sub: '250 + 25 kall/dag', icon: '🤖', color: 'var(--accent-cyan)' },
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
      )}

      {/* Chart + Trending — skjul under søk for mer plass */}
      {!isSearching && !loadingBase && sentimentHistory.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
          <div className="card">
            <div className="card-title">Sentimentfordeling per time</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sentimentHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="bullish" name="Bullish" stackId="a" fill="var(--gain)" />
                <Bar dataKey="neutral" name="Nøytral" stackId="a" fill="var(--gold)" />
                <Bar dataKey="bearish" name="Bearish" stackId="a" fill="var(--loss)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="card-title">Trendende Tickers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trendingTopics.map((t, i) => (
                <div
                  key={t.topic}
                  onClick={() => setSearch(t.topic)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', background: 'var(--bg-secondary)',
                    borderRadius: 8, border: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  title={`Filtrer på ${t.topic}`}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 16 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{t.topic}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.mentions} omtaler</div>
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: sentimentColor[t.sentiment] }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!loadingBase && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Filter:</span>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12,
              fontWeight: filter === f ? 600 : 400,
              background: filter === f ? 'var(--accent-blue)' : 'var(--bg-card)',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              border: filter === f ? 'none' : '1px solid var(--border)',
              cursor: 'pointer',
            }}>{f}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {displayed.length} nyheter
          </span>
        </div>
      )}

      {/* Error */}
      {baseError && (
        <div style={{ fontSize: 13, color: 'var(--loss)', padding: '12px 0', textAlign: 'center' }}>{baseError}</div>
      )}

      {/* Ticker-specific section label */}
      {isSearching && !loadingTicker && tickerNews.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            TICKER-SPESIFIKKE NYHETER FRA FMP
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      )}

      {/* News list */}
      {!loadingBase && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayed.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
              {isSearching
                ? `Ingen nyheter funnet for "${search}". Prøv et annet søk.`
                : 'Ingen nyheter tilgjengelig med valgte filter.'}
            </div>
          )}
          {displayed.map(news => {
            const SIcon = sentimentIcon[news.sentiment]
            const sColor = sentimentColor[news.sentiment]
            const catColor = categoryColors[news.category] || '#3b82f6'
            const isTickerSpecific = tickerNews.some(tn => tn.id === news.id)
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
                  outline: isTickerSpecific && isSearching ? '1px solid rgba(59,130,246,0.2)' : 'none',
                }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ padding: 10, borderRadius: 10, background: `${sColor}15`, flexShrink: 0 }}>
                    <SIcon size={18} color={sColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 4, letterSpacing: '0.5px',
                        background: `${catColor}20`, color: catColor,
                      }}>{news.category}</span>
                      {isTickerSpecific && isSearching && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)',
                          letterSpacing: '0.5px',
                        }}>TICKER</span>
                      )}
                      {news.tickers.map(t => (
                        <span
                          key={t}
                          className="badge badge-neutral"
                          onClick={e => { e.stopPropagation(); setSearch(t) }}
                          title={`Filtrer på ${t}`}
                          style={{ cursor: 'pointer' }}
                        >{t}</span>
                      ))}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
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

                    {selectedNews?.id === news.id && (
                      <div style={{
                        marginTop: 12, padding: '12px 14px',
                        background: 'var(--bg-secondary)', borderRadius: 8,
                        borderLeft: '2px solid var(--accent-blue)',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 6 }}>
                          Sammendrag
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {news.summary || 'Ingen sammendrag tilgjengelig.'}
                        </p>
                        {news.url && (
                          <a
                            href={news.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{
                              marginTop: 10, fontSize: 11, padding: '5px 12px',
                              background: 'var(--bg-card)', border: '1px solid var(--border)',
                              borderRadius: 6, color: 'var(--text-secondary)',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              textDecoration: 'none',
                            }}
                          >
                            <ExternalLink size={11} /> Les original
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
