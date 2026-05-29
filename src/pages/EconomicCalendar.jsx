import { useState, useEffect } from 'react'
import { RefreshCw, Calendar, TrendingUp, DollarSign, Globe } from 'lucide-react'
import { fetchIPOCalendar, fetchNOKRates } from '../services/api'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function futureStr(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatNODate(dateStr) {
  if (!dateStr) return '–'
  const [year, month, day] = dateStr.split('-')
  const NO_MONTHS = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
  return `${parseInt(day)}. ${NO_MONTHS[parseInt(month) - 1]} ${year}`
}

function formatMarketCap(val) {
  if (!val) return '–'
  const n = Number(val)
  if (isNaN(n)) return val
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  return `$${n.toLocaleString()}`
}

function RateCard({ currency, data, flag }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.1))',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>{flag}</div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            {currency}/NOK
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            {data ? data.rate.toFixed(4) : '–'}
          </div>
        </div>
      </div>
      {data && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Norges Bank · {data.date}
        </div>
      )}
    </div>
  )
}

export default function EconomicCalendar() {
  const [rates, setRates] = useState(null)
  const [ipos, setIPOs] = useState([])
  const [loadingRates, setLoadingRates] = useState(true)
  const [loadingIPOs, setLoadingIPOs] = useState(true)
  const [ratesError, setRatesError] = useState(null)
  const [iposError, setIPOsError] = useState(null)

  useEffect(() => {
    fetchNOKRates()
      .then(setRates)
      .catch(() => setRatesError('Kunne ikke hente valutakurser fra Norges Bank.'))
      .finally(() => setLoadingRates(false))
  }, [])

  useEffect(() => {
    const from = todayStr()
    const to = futureStr(90)
    fetchIPOCalendar(from, to)
      .then(data => setIPOs(Array.isArray(data) ? data : []))
      .catch(() => setIPOsError('Kunne ikke hente IPO-kalender fra FMP.'))
      .finally(() => setLoadingIPOs(false))
  }, [])

  const Spinner = () => (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <RefreshCw size={16} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.06))',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: 12, padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ padding: '6px 8px', background: 'rgba(59,130,246,0.15)', borderRadius: 8, fontSize: 16 }}>
          <Globe size={18} color="var(--accent-blue)" />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)' }}>Markedskalender — </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Valutakurser fra Norges Bank (oppdatert daglig) og kommende børsnoteringer fra Financial Modeling Prep.
          </span>
        </div>
        <span className="badge badge-blue">Live</span>
      </div>

      {/* NOK Exchange Rates */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <DollarSign size={16} color="var(--accent-blue)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>NOK Valutakurser</span>
          {loadingRates && <Spinner />}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>Kilde: Norges Bank åpent API</span>
        </div>

        {ratesError ? (
          <div style={{ fontSize: 13, color: 'var(--loss)', padding: '12px 0' }}>{ratesError}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <RateCard currency="USD" data={rates?.USD} flag="🇺🇸" />
            <RateCard currency="EUR" data={rates?.EUR} flag="🇪🇺" />
            <RateCard currency="GBP" data={rates?.GBP} flag="🇬🇧" />
          </div>
        )}
      </div>

      {/* IPO Calendar */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Calendar size={16} color="var(--accent-blue)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Kommende Børsnoteringer (IPO)
          </span>
          {loadingIPOs && <Spinner />}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
            Neste 90 dager · Kilde: Financial Modeling Prep
          </span>
          {!loadingIPOs && (
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
              {ipos.length} noteringer funnet
            </span>
          )}
        </div>

        {iposError && (
          <div style={{ fontSize: 13, color: 'var(--loss)', padding: '12px 0' }}>{iposError}</div>
        )}

        {!loadingIPOs && !iposError && ipos.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
            Ingen planlagte noteringer funnet for de neste 90 dagene.
          </div>
        )}

        {ipos.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Dato', 'Selskap', 'Symbol', 'Børs', 'Prisintervall', 'Mkt Cap', 'Aksjer'].map(h => (
                    <th key={h} style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
                      color: 'var(--text-muted)', textAlign: 'left',
                      padding: '14px 16px 10px',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ipos.map((ipo, i) => (
                  <tr
                    key={`${ipo.symbol}-${i}`}
                    style={{ borderBottom: i < ipos.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 6, padding: '3px 8px',
                        display: 'inline-block', whiteSpace: 'nowrap',
                      }}>
                        {formatNODate(ipo.date)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ipo.company || '–'}
                      </div>
                      {ipo.actions && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {ipo.actions}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: 'var(--accent-cyan)',
                        background: 'rgba(6,182,212,0.08)',
                        borderRadius: 5, padding: '2px 7px',
                        border: '1px solid rgba(6,182,212,0.2)',
                      }}>
                        {ipo.symbol || '–'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {ipo.exchange || '–'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {ipo.priceRange || '–'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatMarketCap(ipo.marketCap)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {ipo.shares ? Number(ipo.shares).toLocaleString('nb-NO') : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
