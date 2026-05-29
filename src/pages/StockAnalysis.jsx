import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'
import { Search, TrendingUp, TrendingDown, Shield, Zap, RefreshCw, Newspaper } from 'lucide-react'
import { testFMPConnection, fetchQuotes, fetchHistorical, formatMktCap, formatDateNO } from '../services/api'

const BASE_STOCKS = [
  { ticker: 'NVDA',  apiTicker: 'NVDA',    name: 'NVIDIA Corporation', sector: 'Teknologi' },
  { ticker: 'AAPL',  apiTicker: 'AAPL',    name: 'Apple Inc.',         sector: 'Teknologi' },
  { ticker: 'EQNR',  apiTicker: 'EQNR.OL', name: 'Equinor ASA',       sector: 'Energi'    },
  { ticker: 'MOWI',  apiTicker: 'MOWI.OL', name: 'Mowi ASA',           sector: 'Sjømat'    },
  { ticker: 'DNB',   apiTicker: 'DNB.OL',  name: 'DNB Bank ASA',       sector: 'Finans'    },
]

const aiAnalysis = {
  NVDA: {
    recommendation: 'KJØP', targetPrice: 950, stopLoss: 820, confidence: 82,
    summary: 'NVIDIA holder seg over alle viktige glidende gjennomsnitt med sterk volumbekreftelse. AI-chipetterspørselen fortsetter å overgå tilbudet. Teknisk oppsett er bullish med trendlinje-støtte.',
    risks: ['Konsentrasjonsrisiko i datasentersegmentet', 'Regulatorisk press i Kina-markedet', 'Produksjonsflaskehalser hos TSMC'],
    catalysts: ['Blackwell GPU-lansering', 'Sterk datasesonger Q2', 'AI-infrastruktur supercyclus'],
    rsi: 67, macd: 'Bullish', bollinger: 'Øvre band', pe: 68.4, pb: 31.2, roe: 91.2,
  },
  AAPL: {
    recommendation: 'HOLD', targetPrice: 210, stopLoss: 170, confidence: 65,
    summary: 'Apple konsoliderer etter sterk oppgang. Tjenestesegmentet vokser stabilt, men iPhone-salget er flatt. Markedet venter på AI-funksjoner i iOS.',
    risks: ['Svak iPhone-etterspørsel i Kina', 'Høy verdsettelse', 'Regulatorisk press i EU'],
    catalysts: ['Apple Intelligence-utrulling', 'Tjenestevekst', 'Tilbakekjøp av aksjer'],
    rsi: 52, macd: 'Nøytral', bollinger: 'Midtpunkt', pe: 32.1, pb: 48.5, roe: 147.3,
  },
  EQNR: {
    recommendation: 'KJØP', targetPrice: 320, stopLoss: 255, confidence: 71,
    summary: 'Equinor leverer sterke resultater drevet av høye energipriser. Økt utbytte og tilbakekjøp gir aksjonærverdi. Fornybar energisatsing gir langsiktig oppside.',
    risks: ['Oljeprisfallet', 'Politisk risiko på norsk sokkel', 'Energiomstilling'],
    catalysts: ['Høye gass- og oljepriser', 'Ny feltutbygging', 'Vindkraftprosjekter'],
    rsi: 58, macd: 'Bullish', bollinger: 'Øvre halvdel', pe: 8.2, pb: 2.1, roe: 28.4,
  },
  MOWI: {
    recommendation: 'KJØP', targetPrice: 240, stopLoss: 175, confidence: 68,
    summary: 'Mowi er verdens største lakseoppdrettsselskap. Sterk global etterspørsel og begrenset tilbudsside støtter prisene. Kinesisk marked åpner seg igjen.',
    risks: ['Lakselus og sykdom', 'Regulatoriske endringer', 'Valutarisiko'],
    catalysts: ['Sterk laksepris', 'Kinesisk markedsåpning', 'Effektiviseringsgevinster'],
    rsi: 61, macd: 'Bullish', bollinger: 'Øvre halvdel', pe: 14.3, pb: 2.8, roe: 19.7,
  },
  DNB: {
    recommendation: 'HOLD', targetPrice: 245, stopLoss: 200, confidence: 59,
    summary: 'DNB er Norges største bank med stabil inntjening. Rentemarginen er høy, men kredittkvaliteten kan svekkes ved rentefall. Solid utbytte.',
    risks: ['Norsk boligmarked', 'Rentefallet', 'Økt konkurranse fra fintechs'],
    catalysts: ['Høy rentenetto', 'Kostnadskutt', 'Sterk norsk økonomi'],
    rsi: 48, macd: 'Nøytral', bollinger: 'Midtpunkt', pe: 11.8, pb: 1.4, roe: 13.2,
  },
}

function GaugeBar({ label, value, max = 100, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  )
}

function MetricBox({ label, value, color = 'var(--text-primary)' }) {
  return (
    <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

const CustomCandleTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const isUp = d.close >= d.open
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, minWidth: 140 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {[['Åpning', d.open], ['Slutt', d.close], ['Høy', d.high], ['Lav', d.low]].map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
          <span style={{ color: 'var(--text-muted)' }}>{k}</span>
          <span style={{ color: isUp ? 'var(--gain)' : 'var(--loss)', fontWeight: 600 }}>{v?.toFixed(2)}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text-muted)' }}>Volum</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.volume}M</span>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
      <RefreshCw size={20} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function StockAnalysis() {
  const navigate = useNavigate()
  const [stocks, setStocks] = useState(BASE_STOCKS.map(s => ({ ...s, price: null, change: 0, mktCap: '–' })))
  const [selectedTicker, setSelectedTicker] = useState('NVDA')
  const [candleData, setCandleData] = useState([])
  const [loadingQuotes, setLoadingQuotes] = useState(true)
  const [loadingChart, setLoadingChart] = useState(true)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState(null)

  const selected = stocks.find(s => s.ticker === selectedTicker) || stocks[0]
  const analysis = aiAnalysis[selectedTicker] || aiAnalysis['NVDA']
  const isUp = selected.change >= 0

  // Step 1: test the connection first
  useEffect(() => {
    testFMPConnection().then(result => {
      if (!result.ok) {
        setApiError(result.error)
        setLoadingQuotes(false)
        setLoadingChart(false)
      }
    })
  }, [])

  // Step 2: fetch all quotes
  useEffect(() => {
    if (apiError) return
    const tickers = BASE_STOCKS.map(s => s.apiTicker)
    fetchQuotes(tickers)
      .then(quotes => {
        if (quotes.length === 0) {
          setApiError('FMP returnerte ingen kursdata. Endepunktet /stable/quote virker ikke med denne nøkkelen.')
          return
        }
        setStocks(BASE_STOCKS.map(s => {
          // Match by _requested tag (handles .OL fallback) or symbol directly
          const q = quotes.find(q => q._requested === s.apiTicker || q.symbol === s.apiTicker)
          if (!q) {
            console.warn(`[StockAnalysis] Ingen data for ${s.apiTicker}`)
            return { ...s, price: null, change: 0, mktCap: '–' }
          }
          const pct = parseFloat(q.changesPercentage) || 0
          console.log(`[StockAnalysis] ${s.ticker}: ${q.currency ?? '$'}${q.price} Δ${pct.toFixed(2)}% src=${q._source ?? 'fmp'}`)
          return {
            ...s,
            price:  q.price,
            change: +pct.toFixed(2),   // will be overwritten by loadChart once historical arrives
            mktCap: formatMktCap(q.marketCap),
          }
        }))
      })
      .catch(err => setApiError(`fetchQuotes feilet: ${err.message}`))
      .finally(() => setLoadingQuotes(false))
  }, [apiError])

  const loadChart = useCallback((apiTicker, displayTicker) => {
    setLoadingChart(true)
    setCandleData([])
    fetchHistorical(apiTicker, 30)
      .then(historical => {
        if (historical.length === 0) {
          console.warn(`[StockAnalysis] Ingen historikk for ${apiTicker}`)
          return
        }

        console.log(`[StockAnalysis] Mapping ${historical.length} candles for ${apiTicker}, sample:`, historical[0])

        const mapped = historical
          .map(d => {
            // FMP may use adjClose, adjclose, or close depending on the endpoint
            const rawClose = d.close ?? d.adjClose ?? d.adjclose ?? d.price ?? d.Close
            const c = Number(rawClose)
            if (!c || isNaN(c)) return null             // skip rows with no valid close
            const o = Number(d.open  ?? d.Open)  || c
            const h = Number(d.high  ?? d.High)  || Math.max(o, c)
            const l = Number(d.low   ?? d.Low)   || Math.min(o, c)
            const v = Number(d.volume ?? d.Volume) || 0
            return {
              date:   formatDateNO(d.date),
              open:   +o.toFixed(2),
              close:  +c.toFixed(2),
              high:   +h.toFixed(2),
              low:    +l.toFixed(2),
              volume: +(v / 1e6).toFixed(2),
            }
          })
          .filter(Boolean)

        console.log(`[StockAnalysis] ${displayTicker}: ${mapped.length} valid candles, last close: ${mapped[mapped.length - 1]?.close}`)
        setCandleData(mapped)

        // Calculate daily % change from last two valid candles
        if (mapped.length >= 2) {
          const today = mapped[mapped.length - 1].close
          const prev  = mapped[mapped.length - 2].close
          if (today && prev) {
            const calcChange = +((today - prev) / prev * 100).toFixed(2)
            console.log(`[StockAnalysis] ${displayTicker} Δ: ${calcChange}% (${prev} → ${today})`)
            setStocks(all => all.map(s =>
              s.ticker === displayTicker ? { ...s, change: calcChange } : s
            ))
          }
        }
      })
      .catch(err => console.error('[StockAnalysis] loadChart error:', err))
      .finally(() => setLoadingChart(false))
  }, [])

  useEffect(() => {
    if (apiError) return
    const stock = BASE_STOCKS.find(s => s.ticker === selectedTicker)
    if (stock) loadChart(stock.apiTicker, stock.ticker)
  }, [selectedTicker, loadChart, apiError])

  // Prefer last candle close; fall back to quote price; never show 0.00
  const lastClose = candleData.length ? candleData[candleData.length - 1].close : null
  const currentPrice = (lastClose && lastClose > 0) ? lastClose : selected.price
  const displayPrice = (currentPrice && currentPrice > 0) ? Number(currentPrice).toFixed(2) : '–'

  const filtered = stocks.filter(s =>
    s.ticker.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>

      {/* API Error banner */}
      {apiError && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: 10, padding: '14px 18px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--loss)', marginBottom: 4 }}>
              FMP API-feil
            </div>
            <div style={{ fontSize: 12, color: 'var(--loss)', opacity: 0.85 }}>{apiError}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Åpne nettleser-konsollen (F12) for detaljert feillogg fra API-kallene.
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

        {/* Stock list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px',
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              placeholder="Søk ticker..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontSize: 13, color: 'var(--text-primary)', width: '100%' }}
            />
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card-title" style={{ padding: '14px 16px 0' }}>Aksjer</div>
            {filtered.map(s => (
              <div
                key={s.ticker}
                onClick={() => setSelectedTicker(s.ticker)}
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  background: selectedTicker === s.ticker ? 'rgba(59,130,246,0.08)' : 'transparent',
                  borderLeft: selectedTicker === s.ticker ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  transition: 'all 0.15s', borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.ticker}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.sector}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {loadingQuotes ? (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Laster…</div>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {s.price != null ? s.price.toFixed(2) : '–'}
                        </div>
                        <div style={{ fontSize: 11, color: s.change >= 0 ? 'var(--gain)' : 'var(--loss)', fontWeight: 600 }}>
                          {s.change >= 0 ? '+' : ''}{s.change}%
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main analysis area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg, #1e3a5f, #1a2540)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: 'var(--accent-blue)',
                }}>{selected.ticker.slice(0, 2)}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{selected.ticker}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selected.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
                      {loadingChart ? '–' : displayPrice}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 600, alignSelf: 'center',
                      color: isUp ? 'var(--gain)' : 'var(--loss)',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {isUp ? '+' : ''}{selected.change}%
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                      Mkt Cap: {selected.mktCap}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                <div style={{
                  padding: '16px 20px',
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 12, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>AI Anbefaling</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gain)', letterSpacing: '-0.5px' }}>{analysis.recommendation}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Mål: {analysis.targetPrice}</div>
                </div>
                <button
                  onClick={() => navigate(`/news?ticker=${selected.ticker}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 14px',
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    color: 'var(--accent-blue)',
                    transition: 'background 0.15s',
                    width: '100%', justifyContent: 'center',
                  }}
                >
                  <Newspaper size={13} />
                  Se nyheter om {selected.ticker}
                </button>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="card-title" style={{ margin: 0 }}>Kursutvikling — 30 dager</div>
              {loadingChart && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Henter data…</span>}
            </div>
            {loadingChart ? <Spinner /> : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={candleData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis
                    yAxisId="price" domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => v.toFixed(0)}
                    width={55}
                  />
                  <YAxis
                    yAxisId="vol" orientation="right"
                    tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                    axisLine={false} tickLine={false} width={30}
                  />
                  <Tooltip content={<CustomCandleTooltip />} />
                  {currentPrice && (
                    <>
                      <ReferenceLine yAxisId="price" y={analysis.targetPrice} stroke="var(--gain)" strokeDasharray="4 4" label={{ value: 'Mål', fill: 'var(--gain)', fontSize: 10 }} />
                      <ReferenceLine yAxisId="price" y={analysis.stopLoss} stroke="var(--loss)" strokeDasharray="4 4" label={{ value: 'Stop', fill: 'var(--loss)', fontSize: 10 }} />
                    </>
                  )}
                  <Bar yAxisId="vol" dataKey="volume" fill="rgba(59,130,246,0.15)" radius={[2, 2, 0, 0]} />
                  <Line yAxisId="price" type="monotone" dataKey="close" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bottom grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* AI Analysis */}
            <div className="card">
              <div className="card-title">AI Analyse</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                {analysis.summary}
              </p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI Konfidens</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)' }}>{analysis.confidence}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${analysis.confidence}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <Zap size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Katalysatorer
                  </div>
                  {analysis.catalysts.map(c => (
                    <div key={c} style={{ fontSize: 11, color: 'var(--gain)', marginBottom: 4, display: 'flex', gap: 5 }}>
                      <span>↑</span> {c}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <Shield size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />Risikoer
                  </div>
                  {analysis.risks.map(r => (
                    <div key={r} style={{ fontSize: 11, color: 'var(--loss)', marginBottom: 4, display: 'flex', gap: 5 }}>
                      <span>↓</span> {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="card">
              <div className="card-title">Teknisk & Fundamental</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tekniske Indikatorer</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <GaugeBar
                    label={`RSI (14) — ${analysis.rsi > 70 ? 'Overkjøpt' : analysis.rsi < 30 ? 'Oversolgt' : 'Normal'}`}
                    value={analysis.rsi}
                    color={analysis.rsi > 70 ? 'var(--loss)' : analysis.rsi < 30 ? 'var(--gain)' : 'var(--accent-blue)'}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>MACD</span>
                    <span className="badge badge-gain">{analysis.macd}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bollinger Bands</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)' }}>{analysis.bollinger}</span>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verdivurdering</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <MetricBox label="P/E" value={analysis.pe} />
                  <MetricBox label="P/B" value={analysis.pb} />
                  <MetricBox label="ROE %" value={`${analysis.roe}%`} color="var(--gain)" />
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Kursmål</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gain)' }}>{analysis.targetPrice}</div>
                  {currentPrice && (
                    <div style={{ fontSize: 10, color: 'var(--gain)' }}>
                      +{(((analysis.targetPrice - currentPrice) / currentPrice) * 100).toFixed(1)}% oppside
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Stop Loss</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--loss)' }}>{analysis.stopLoss}</div>
                  {currentPrice && (
                    <div style={{ fontSize: 10, color: 'var(--loss)' }}>
                      {(((analysis.stopLoss - currentPrice) / currentPrice) * 100).toFixed(1)}% nedsiderisiko
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
