import { useState } from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, DollarSign, PieChart, Target } from 'lucide-react'

const portfolioHistory = [
  { day: '1 Mai', value: 412000 }, { day: '5 Mai', value: 425000 },
  { day: '8 Mai', value: 418000 }, { day: '12 Mai', value: 441000 },
  { day: '15 Mai', value: 437000 }, { day: '19 Mai', value: 458000 },
  { day: '22 Mai', value: 452000 }, { day: '26 Mai', value: 471000 },
  { day: '29 Mai', value: 483200 },
]

const holdings = [
  { ticker: 'EQNR', name: 'Equinor', shares: 120, price: 287.50, change: 2.34, value: 34500, weight: 7.1 },
  { ticker: 'DNB', name: 'DNB Bank', shares: 200, price: 221.80, change: -0.87, value: 44360, weight: 9.2 },
  { ticker: 'MOWI', name: 'Mowi ASA', shares: 350, price: 198.40, change: 1.56, value: 69440, weight: 14.4 },
  { ticker: 'AAPL', name: 'Apple Inc.', shares: 50, price: 189.30, change: -1.24, value: 94650, weight: 19.6 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', shares: 30, price: 874.20, change: 4.12, value: 262260, weight: 54.3 },
]

const recentSignals = [
  { ticker: 'NVDA', type: 'BUY', reason: 'Momentum + volum over 200-dagers MA', strength: 'Sterk', time: '14:32' },
  { ticker: 'EQNR', type: 'HOLD', reason: 'Konsolidering nær støttenivå', strength: 'Nøytral', time: '13:15' },
  { ticker: 'DNB', type: 'SELL', reason: 'RSI overkjøpt, bearish divergens', strength: 'Moderat', time: '11:48' },
]

const sectorData = [
  { sector: 'Teknologi', pct: 73.9, color: '#3b82f6' },
  { sector: 'Energi', pct: 7.1, color: '#f59e0b' },
  { sector: 'Finans', pct: 9.2, color: '#8b5cf6' },
  { sector: 'Sjømat', pct: 9.8, color: '#10b981' },
]

function StatCard({ icon: Icon, label, value, sub, trend, trendVal, color = 'var(--accent-blue)' }) {
  const isUp = trend === 'up'
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        background: color,
        opacity: 0.05,
        borderRadius: '0 12px 0 80px',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ padding: 8, borderRadius: 8, background: `${color}15` }}>
          <Icon size={16} color={color} />
        </div>
        <span className={`badge ${isUp ? 'badge-gain' : 'badge-loss'}`}>
          {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trendVal}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function SparkBar({ value, max }) {
  const pct = Math.abs(value / max) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 60, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: value >= 0 ? 'var(--gain)' : 'var(--loss)',
          borderRadius: 2,
        }} />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          kr {payload[0].value.toLocaleString('nb-NO')}
        </div>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [period, setPeriod] = useState('1M')
  const periods = ['1U', '1M', '3M', 'YTD', '1Å']

  const totalValue = holdings.reduce((s, h) => s + h.value, 0)
  const totalGain = 71200
  const gainPct = 17.3

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>

      {/* AI Insight banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.06))',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: 12,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          padding: '6px 8px',
          background: 'rgba(59,130,246,0.15)',
          borderRadius: 8,
          fontSize: 16,
        }}>🤖</div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)' }}>AI Innsikt — </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Porteføljen din har slått OBX med 12.4% siste kvartal. NVDA utgjør over halvparten av eksponeringen — vurder rebalansering for å redusere konsentrasjonsrisiko.
          </span>
        </div>
        <span className="badge badge-blue">Live</span>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard
          icon={DollarSign}
          label="Porteføljeverdi"
          value={`kr ${totalValue.toLocaleString('nb-NO')}`}
          trend="up"
          trendVal="+17.3%"
          color="var(--accent-blue)"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Gevinst"
          value={`kr ${totalGain.toLocaleString('nb-NO')}`}
          sub="Siden oppstart"
          trend="up"
          trendVal="+kr 8 240 i dag"
          color="var(--gain)"
        />
        <StatCard
          icon={Activity}
          label="Daglig Avkastning"
          value="+1.74%"
          sub="kr 8 240 i dag"
          trend="up"
          trendVal="vs OBX +0.5%"
          color="var(--accent-cyan)"
        />
        <StatCard
          icon={Target}
          label="Sharpe Ratio"
          value="1.84"
          sub="12 mnd rullerende"
          trend="up"
          trendVal="Over benchmark"
          color="var(--gold)"
        />
      </div>

      {/* Main chart + sector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

        {/* Portfolio chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div className="card-title">Porteföljeutvikling</div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
                kr 483 200
                <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--gain)', marginLeft: 10 }}>+17.3%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {periods.map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: period === p ? 'var(--accent-blue)' : 'transparent',
                  color: period === p ? 'white' : 'var(--text-muted)',
                  border: period === p ? 'none' : '1px solid var(--border)',
                  transition: 'all 0.15s',
                }}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={portfolioHistory} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#portfolioGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sector breakdown */}
        <div className="card">
          <div className="card-title">Sektorfordeling</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sectorData.map(s => (
              <div key={s.sector}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.sector}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.pct}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Concentration warning */}
          <div style={{
            marginTop: 20,
            padding: '10px 12px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)', marginBottom: 2 }}>
              ⚠ Konsentrasjonsrisiko
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              NVDA utgjør 54% av porteføljen
            </div>
          </div>
        </div>
      </div>

      {/* Holdings + AI Signals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

        {/* Holdings table */}
        <div className="card">
          <div className="card-title">Beholdning</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Aksje', 'Kurs', 'Endring', 'Verdi', 'Vekt', ''].map(h => (
                  <th key={h} style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
                    color: 'var(--text-muted)', textAlign: 'left',
                    padding: '0 12px 10px',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr key={h.ticker} style={{ borderBottom: i < holdings.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: 'var(--accent-blue)',
                      }}>{h.ticker.slice(0, 2)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{h.ticker}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>
                    kr {h.price.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={h.change >= 0 ? 'positive' : 'negative'} style={{ fontSize: 13, fontWeight: 600 }}>
                        {h.change >= 0 ? '+' : ''}{h.change}%
                      </span>
                      <SparkBar value={h.change} max={5} />
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: 13, fontWeight: 600 }}>
                    kr {h.value.toLocaleString('nb-NO')}
                  </td>
                  <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)' }}>
                    {h.weight}%
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button style={{
                      fontSize: 11, padding: '4px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text-secondary)',
                    }}>Analyser</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Signals */}
        <div className="card">
          <div className="card-title">AI Handelssignaler</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentSignals.map(s => {
              const signalColors = { BUY: 'var(--gain)', SELL: 'var(--loss)', HOLD: 'var(--gold)' }
              const signalBg = { BUY: 'var(--gain-dim)', SELL: 'var(--loss-dim)', HOLD: 'rgba(245,158,11,0.15)' }
              return (
                <div key={s.ticker + s.time} style={{
                  padding: 14,
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                  border: `1px solid var(--border)`,
                  borderLeft: `3px solid ${signalColors[s.type]}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{s.ticker}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px',
                        borderRadius: 4, letterSpacing: '0.5px',
                        background: signalBg[s.type], color: signalColors[s.type],
                      }}>{s.type}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.time}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{s.reason}</p>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Signalstyrke: <span style={{ color: signalColors[s.type], fontWeight: 600 }}>{s.strength}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Accuracy */}
          <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>AI Signal Nøyaktighet (30d)</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {[['BUY', '78%', 'var(--gain)'], ['HOLD', '82%', 'var(--gold)'], ['SELL', '71%', 'var(--loss)']].map(([t, v, c]) => (
                <div key={t} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
