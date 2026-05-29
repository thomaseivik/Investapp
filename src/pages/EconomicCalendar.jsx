import { useState, useEffect } from 'react'
import { RefreshCw, Calendar, DollarSign, Globe, TrendingUp, AlertCircle } from 'lucide-react'
import { fetchIPOCalendar, fetchNOKRates } from '../services/api'
import { useLang } from '../context/LanguageContext'

// ─── Hard-coded 2026 economic events ─────────────────────────────────────────
const EVENTS_2026 = [
  // FOMC
  ...[['2026-01-29','2026-03-19','2026-05-07','2026-06-18','2026-07-30','2026-09-17','2026-10-29','2026-12-10']
    .map(d => ({ date: d, type: 'fomc', country: 'US', impact: 'Høy' }))],
  // Norges Bank
  ...[['2026-02-05','2026-03-26','2026-05-07','2026-06-18','2026-08-20','2026-09-24','2026-11-05','2026-12-17']
    .map(d => ({ date: d, type: 'norgesbank', country: 'NO', impact: 'Høy' }))],
  // US CPI (BLS)
  ...[['2026-01-14','2026-02-11','2026-03-11','2026-04-10','2026-05-13','2026-06-10',
       '2026-07-15','2026-08-12','2026-09-09','2026-10-14','2026-11-12','2026-12-09']
    .map(d => ({ date: d, type: 'cpiUS', country: 'US', impact: 'Høy' }))],
  // Norway KPI (SSB)
  ...[['2026-01-10','2026-02-10','2026-03-10','2026-04-10','2026-05-12','2026-06-10',
       '2026-07-10','2026-08-10','2026-09-10','2026-10-12','2026-11-10','2026-12-10']
    .map(d => ({ date: d, type: 'cpiNO', country: 'NO', impact: 'Middels' }))],
  // Earnings — NVDA
  { date: '2026-02-26', type: 'earnings', tickers: ['NVDA'], desc: 'NVIDIA Q4 FY2026',         country: 'US', impact: 'Høy' },
  { date: '2026-05-28', type: 'earnings', tickers: ['NVDA'], desc: 'NVIDIA Q1 FY2027',         country: 'US', impact: 'Høy' },
  { date: '2026-08-27', type: 'earnings', tickers: ['NVDA'], desc: 'NVIDIA Q2 FY2027',         country: 'US', impact: 'Høy' },
  { date: '2026-11-19', type: 'earnings', tickers: ['NVDA'], desc: 'NVIDIA Q3 FY2027',         country: 'US', impact: 'Høy' },
  // Earnings — AAPL
  { date: '2026-05-01', type: 'earnings', tickers: ['AAPL'], desc: 'Apple Q2 FY2026',          country: 'US', impact: 'Høy' },
  { date: '2026-07-30', type: 'earnings', tickers: ['AAPL'], desc: 'Apple Q3 FY2026',          country: 'US', impact: 'Høy' },
  { date: '2026-10-29', type: 'earnings', tickers: ['AAPL'], desc: 'Apple Q4 FY2026',          country: 'US', impact: 'Høy' },
  // Earnings — EQNR
  { date: '2026-04-30', type: 'earnings', tickers: ['EQNR'], desc: 'Equinor Q1 2026',          country: 'NO', impact: 'Høy' },
  { date: '2026-07-16', type: 'earnings', tickers: ['EQNR'], desc: 'Equinor Q2 2026',          country: 'NO', impact: 'Høy' },
  { date: '2026-10-22', type: 'earnings', tickers: ['EQNR'], desc: 'Equinor Q3 2026',          country: 'NO', impact: 'Høy' },
  // Earnings — DNB
  { date: '2026-04-24', type: 'earnings', tickers: ['DNB'],  desc: 'DNB Bank Q1 2026',         country: 'NO', impact: 'Høy' },
  { date: '2026-07-10', type: 'earnings', tickers: ['DNB'],  desc: 'DNB Bank Q2 2026',         country: 'NO', impact: 'Høy' },
  { date: '2026-10-23', type: 'earnings', tickers: ['DNB'],  desc: 'DNB Bank Q3 2026',         country: 'NO', impact: 'Høy' },
  // Earnings — MOWI
  { date: '2026-04-29', type: 'earnings', tickers: ['MOWI'], desc: 'Mowi Q1 2026',             country: 'NO', impact: 'Middels' },
  { date: '2026-07-14', type: 'earnings', tickers: ['MOWI'], desc: 'Mowi Q2 2026',             country: 'NO', impact: 'Middels' },
  { date: '2026-10-21', type: 'earnings', tickers: ['MOWI'], desc: 'Mowi Q3 2026',             country: 'NO', impact: 'Middels' },
].sort((a, b) => a.date.localeCompare(b.date))

const TYPE_META = {
  fomc:       { label: 'FOMC',         color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    icon: '🏦', flag: '🇺🇸' },
  norgesbank: { label: 'Norges Bank',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   icon: '🏦', flag: '🇳🇴' },
  cpiUS:      { label: 'CPI USA',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   icon: '📊', flag: '🇺🇸' },
  cpiNO:      { label: 'KPI Norge',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   icon: '📊', flag: '🇳🇴' },
  earnings:   { label: 'Q-Rapport',   color: '#10b981', bg: 'rgba(16,185,129,0.1)',   icon: '📈', flag: '' },
  ipo:        { label: 'IPO',          color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',    icon: '🚀', flag: '' },
}

function todayStr() { return new Date().toISOString().slice(0, 10) }
function futureStr(d) { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString().slice(0, 10) }

function formatNODate(s) {
  if (!s) return '–'
  const [y, m, d] = s.split('-')
  const mo = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des']
  return `${parseInt(d)}. ${mo[parseInt(m)-1]} ${y}`
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr)
  return Math.round((target - today) / 86400000)
}

function RateCard({ currency, data, flag }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: 'rgba(59,130,246,0.1)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>{flag}</div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{currency}/NOK</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>
          {data ? data.rate.toFixed(4) : '–'}
        </div>
        {data && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Norges Bank · {data.date}</div>}
      </div>
    </div>
  )
}

export default function EconomicCalendar() {
  const { t } = useLang()
  const [rates,    setRates]    = useState(null)
  const [ipos,     setIPOs]     = useState([])
  const [loadingR, setLoadingR] = useState(true)
  const [loadingI, setLoadingI] = useState(true)
  const [filter,   setFilter]   = useState('alle')   // alle | fomc | norgesbank | cpi | earnings | ipo
  const today = todayStr()

  useEffect(() => {
    fetchNOKRates().then(setRates).catch(() => null).finally(() => setLoadingR(false))
  }, [])

  useEffect(() => {
    fetchIPOCalendar(todayStr(), futureStr(90))
      .then(data => setIPOs(Array.isArray(data) ? data : []))
      .catch(() => null)
      .finally(() => setLoadingI(false))
  }, [])

  // Merge hard-coded events with live IPO data
  const ipoEvents = ipos.map((ipo, i) => ({
    date: ipo.date, type: 'ipo', country: '',
    desc: `${ipo.company || '?'} (${ipo.symbol || '?'}) · ${ipo.exchange || ''} · ${ipo.priceRange || '?'}`,
    impact: 'Middels', id: `ipo-${i}`,
  }))

  const allEvents = [...EVENTS_2026, ...ipoEvents]
    .sort((a, b) => a.date.localeCompare(b.date))

  const upcoming = allEvents.filter(e => e.date >= today)
  const filterBtns = [
    { key: 'alle',       label: 'Alle' },
    { key: 'fomc',       label: 'FOMC' },
    { key: 'norgesbank', label: 'Norges Bank' },
    { key: 'cpiUS',      label: 'CPI USA' },
    { key: 'cpiNO',      label: 'KPI Norge' },
    { key: 'earnings',   label: 'Q-Rapporter' },
    { key: 'ipo',        label: 'IPO' },
  ]
  const filtered = filter === 'alle' ? upcoming : upcoming.filter(e => e.type === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>

      {/* NOK Rates */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <DollarSign size={16} color="var(--accent-blue)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>NOK Valutakurser</span>
          {loadingR && (
            <>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <RefreshCw size={13} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
            </>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>Norges Bank åpent API</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <RateCard currency="USD" data={rates?.USD} flag="🇺🇸" />
          <RateCard currency="EUR" data={rates?.EUR} flag="🇪🇺" />
          <RateCard currency="GBP" data={rates?.GBP} flag="🇬🇧" />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Calendar size={15} color="var(--accent-blue)" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Vis:</span>
        {filterBtns.map(b => (
          <button key={b.key} onClick={() => setFilter(b.key)} style={{
            padding: '5px 13px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            fontWeight: filter === b.key ? 600 : 400,
            background: filter === b.key ? 'var(--accent-blue)' : 'var(--bg-card)',
            color: filter === b.key ? 'white' : 'var(--text-secondary)',
            border: filter === b.key ? 'none' : '1px solid var(--border)',
          }}>{b.label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} hendelser</span>
      </div>

      {/* Events */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((ev, i) => {
          const meta    = TYPE_META[ev.type] || TYPE_META.ipo
          const days    = daysUntil(ev.date)
          const isToday = days === 0
          const isPast  = days < 0
          const label   = ev.desc || ev.type

          return (
            <div key={ev.id || `${ev.date}-${ev.type}-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 16px',
              background: isToday ? 'rgba(59,130,246,0.06)' : 'var(--bg-card)',
              border: `1px solid ${isToday ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
              borderLeft: `4px solid ${isPast ? 'var(--border)' : meta.color}`,
              borderRadius: 10,
              opacity: isPast ? 0.5 : 1,
            }}>
              {/* Icon + type */}
              <div style={{ width: 80, flexShrink: 0 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                  background: meta.bg, color: meta.color, letterSpacing: '0.5px',
                }}>
                  {meta.flag} {meta.label}
                </div>
              </div>

              {/* Date */}
              <div style={{ width: 130, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                  {formatNODate(ev.date)}
                </div>
              </div>

              {/* Description */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{label}</div>
                {ev.tickers?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                    {ev.tickers.map(tk => (
                      <span key={tk} className="badge badge-neutral">{tk}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Impact */}
              <div style={{ flexShrink: 0 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: ev.impact === 'Høy' ? 'var(--loss)' : ev.impact === 'Middels' ? 'var(--gold)' : 'var(--text-muted)',
                }}>{ev.impact}</span>
              </div>

              {/* Days until */}
              <div style={{ width: 70, textAlign: 'right', flexShrink: 0 }}>
                {isToday ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)' }}>I dag</span>
                ) : isPast ? (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Passert</span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>om {days}d</span>
                )}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
            Ingen kommende hendelser for valgt filter.
          </div>
        )}
      </div>

      {/* IPO Calendar (live) */}
      {ipos.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={15} color="var(--accent-cyan)" />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Kommende Børsnoteringer (FMP)</span>
            {loadingI && <RefreshCw size={13} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Neste 90 dager</span>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Dato', 'Selskap', 'Symbol', 'Børs', 'Prisintervall', 'Mkt Cap'].map(h => (
                    <th key={h} style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-muted)',
                      textAlign: 'left', padding: '12px 16px 10px', textTransform: 'uppercase',
                      borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ipos.map((ipo, i) => (
                  <tr key={i} style={{ borderBottom: i < ipos.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)',
                        background: 'rgba(59,130,246,0.08)', borderRadius: 5, padding: '2px 7px',
                      }}>{formatNODate(ipo.date)}</span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600 }}>{ipo.company || '–'}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span className="badge badge-neutral">{ipo.symbol || '–'}</span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{ipo.exchange || '–'}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12 }}>{ipo.priceRange || '–'}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {ipo.marketCap ? `$${(Number(ipo.marketCap)/1e6).toFixed(0)}M` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
