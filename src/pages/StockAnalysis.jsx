import { useState } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'
import { Search, TrendingUp, TrendingDown, BarChart2, Target, Shield, Zap } from 'lucide-react'

const generateCandles = () => {
  const data = []
  let price = 870
  const labels = ['28 Apr', '29 Apr', '30 Apr', '2 Mai', '5 Mai', '6 Mai', '7 Mai', '8 Mai', '9 Mai', '12 Mai', '13 Mai', '14 Mai', '15 Mai', '16 Mai', '19 Mai', '20 Mai', '21 Mai', '22 Mai', '23 Mai', '26 Mai', '27 Mai', '28 Mai', '29 Mai']
  labels.forEach(d => {
    const change = (Math.random() - 0.45) * 30
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * 10
    const low = Math.min(open, close) - Math.random() * 10
    const volume = Math.floor(5 + Math.random() * 25)
    data.push({ date: d, open: +open.toFixed(2), close: +close.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), volume })
    price = close
  })
  return data
}

const candleData = generateCandles()

const stockList = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', price: 874.20, change: 4.12, mktCap: '2.15T', sector: 'Teknologi' },
  { ticker: 'AAPL', name: 'Apple Inc.', price: 189.30, change: -1.24, mktCap: '2.91T', sector: 'Teknologi' },
  { ticker: 'EQNR', name: 'Equinor ASA', price: 287.50, change: 2.34, mktCap: '890B', sector: 'Energi' },
  { ticker: 'MOWI', name: 'Mowi ASA', price: 198.40, change: 1.56, mktCap: '107B', sector: 'Sjømat' },
  { ticker: 'DNB', name: 'DNB Bank ASA', price: 221.80, change: -0.87, mktCap: '328B', sector: 'Finans' },
]

const aiAnalysis = {
  NVDA: {
    recommendation: 'KJØp',
    targetPrice: 950,
    stopLoss: 820,
    confidence: 82,
    summary: 'NVIDIA holder seg over alle viktige glidende gjennomsnitt med sterk volumbekreftelse. AI-chipetterspørselen fortsetter å overgå tilbudet. Teknisk oppsett er bullish med en trendlinje-støtte på $850.',
    risks: ['Konsentrasjonsrisiko i datasentersegmentet', 'Regulatorisk press i Kina-markedet', 'Produksjonsflaskehalser hos TSMC'],
    catalysts: ['Blackwell GPU-lansering', 'Sterk datasesonger Q2', 'AI-infrastruktur supercyclus'],
    rsi: 67,
    macd: 'Bullish',
    bollinger: 'Øvre band',
    pe: 68.4,
    pb: 31.2,
    roe: 91.2,
  }
}

function GaugeBar({ label, value, max = 100, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{value}{max === 100 ? '' : ''}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  )
}

function MetricBox({ label, value, color = 'var(--text-primary)' }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--bg-secondary)',
      borderRadius: 8,
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

const CustomCandleTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload
    if (!d) return null
    const isUp = d.close >= d.open
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
        minWidth: 140,
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
        {[['Åpning', d.open], ['Slutt', d.close], ['Høy', d.high], ['Lav', d.low]].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
            <span style={{ color: isUp ? 'var(--gain)' : 'var(--loss)', fontWeight: 600 }}>${v}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Volum</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.volume}M</span>
        </div>
      </div>
    )
  }
  return null
}

export default function StockAnalysis() {
  const [selected, setSelected] = useState(stockList[0])
  const analysis = aiAnalysis[selected.ticker] || aiAnalysis['NVDA']
  const isUp = selected.change >= 0

  const currentPrice = candleData[candleData.length - 1].close

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

        {/* Stock list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 12px',
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Søk ticker..." style={{
              background: 'transparent', border: 'none',
              fontSize: 13, color: 'var(--text-primary)', width: '100%',
            }} />
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card-title" style={{ padding: '14px 16px 0' }}>Aksjer</div>
            {stockList.map(s => (
              <div
                key={s.ticker}
                onClick={() => setSelected(s)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: selected.ticker === s.ticker ? 'rgba(59,130,246,0.08)' : 'transparent',
                  borderLeft: selected.ticker === s.ticker ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  transition: 'all 0.15s',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.ticker}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.sector}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.price.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: s.change >= 0 ? 'var(--gain)' : 'var(--loss)', fontWeight: 600 }}>
                      {s.change >= 0 ? '+' : ''}{s.change}%
                    </div>
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
                      ${currentPrice.toFixed(2)}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 600, alignSelf: 'center',
                      color: isUp ? 'var(--gain)' : 'var(--loss)',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {isUp ? '+' : ''}{selected.change}%
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Rec badge */}
              <div style={{
                padding: '16px 20px',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 12,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>AI Anbefaling</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gain)', letterSpacing: '-0.5px' }}>{analysis.recommendation}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Mål: ${analysis.targetPrice}</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card">
            <div className="card-title">Kursutvikling — 1 Måned</div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={candleData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis
                  yAxisId="price"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`}
                  width={55}
                />
                <YAxis
                  yAxisId="vol"
                  orientation="right"
                  tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                  axisLine={false} tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomCandleTooltip />} />
                <ReferenceLine yAxisId="price" y={analysis.targetPrice} stroke="var(--gain)" strokeDasharray="4 4" label={{ value: 'Mål', fill: 'var(--gain)', fontSize: 10 }} />
                <ReferenceLine yAxisId="price" y={analysis.stopLoss} stroke="var(--loss)" strokeDasharray="4 4" label={{ value: 'Stop', fill: 'var(--loss)', fontSize: 10 }} />
                <Bar yAxisId="vol" dataKey="volume" fill="rgba(59,130,246,0.15)" radius={[2, 2, 0, 0]} />
                <Line yAxisId="price" type="monotone" dataKey="close" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* AI Analysis */}
            <div className="card">
              <div className="card-title">AI Analyse</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                {analysis.summary}
              </p>

              {/* Confidence */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI Konfidens</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)' }}>{analysis.confidence}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${analysis.confidence}%`,
                    background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
                    borderRadius: 4,
                  }} />
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
                  <GaugeBar label={`RSI (14) — ${analysis.rsi > 70 ? 'Overkjøpt' : analysis.rsi < 30 ? 'Oversolgt' : 'Normal'}`} value={analysis.rsi} color={analysis.rsi > 70 ? 'var(--loss)' : analysis.rsi < 30 ? 'var(--gain)' : 'var(--accent-blue)'} />
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
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gain)' }}>${analysis.targetPrice}</div>
                  <div style={{ fontSize: 10, color: 'var(--gain)' }}>+{(((analysis.targetPrice - currentPrice) / currentPrice) * 100).toFixed(1)}% oppside</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Stop Loss</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--loss)' }}>${analysis.stopLoss}</div>
                  <div style={{ fontSize: 10, color: 'var(--loss)' }}>{(((analysis.stopLoss - currentPrice) / currentPrice) * 100).toFixed(1)}% nedsiderisiko</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
