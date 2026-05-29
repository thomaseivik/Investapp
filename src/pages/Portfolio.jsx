import { useState, useEffect } from 'react'
import { PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign, RefreshCw, Edit2, Check, X } from 'lucide-react'
import { fetchQuotes, fetchNOKRates } from '../services/api'
import { useLang } from '../context/LanguageContext'

const DEFAULT_HOLDINGS = [
  { id: 1, name: 'Nordnet Global',          ticker: 'EUNL.DE', units: 351, buyPrice: 209,  buyCurrency: 'NOK' },
  { id: 2, name: 'Nordnet Teknologi',        ticker: 'QQQ',     units: 59,  buyPrice: 180,  buyCurrency: 'NOK' },
  { id: 3, name: 'KLP Small Cap',            ticker: 'IUSN.DE', units: 9,   buyPrice: 1447, buyCurrency: 'NOK' },
  { id: 4, name: 'Nordnet Emerging Markets', ticker: 'EEM',     units: 84,  buyPrice: 149,  buyCurrency: 'NOK' },
  { id: 5, name: 'NVIDIA',                   ticker: 'NVDA',    units: 1,   buyPrice: 131,  buyCurrency: 'USD' },
]

function guessCurrency(ticker) {
  if (/\.(OL)$/.test(ticker)) return 'NOK'
  if (/\.(DE|PA|AS|MI|ST)$/.test(ticker)) return 'EUR'
  if (/\.L$/.test(ticker)) return 'GBP'
  return 'USD'
}

function toNOK(price, fromCurrency, rates) {
  if (!price || !rates) return null
  if (fromCurrency === 'NOK') return price
  const rate = rates[fromCurrency]?.rate
  return rate ? price * rate : null
}

function formatNOK(val) {
  if (val == null || isNaN(val)) return '–'
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(val) + ' kr'
}

function GainBadge({ pct }) {
  if (pct == null) return <span style={{ color: 'var(--text-muted)' }}>–</span>
  const up = pct >= 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 12, fontWeight: 700,
      color: up ? 'var(--gain)' : 'var(--loss)',
    }}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? '+' : ''}{pct.toFixed(2)}%
    </span>
  )
}

const EMPTY_FORM = { name: '', ticker: '', units: '', buyPrice: '', buyCurrency: 'NOK' }

export default function Portfolio() {
  const { t } = useLang()

  const [holdings, setHoldings] = useState(() => {
    try {
      const stored = localStorage.getItem('investai-portfolio')
      return stored ? JSON.parse(stored) : DEFAULT_HOLDINGS
    } catch { return DEFAULT_HOLDINGS }
  })

  const [prices, setPrices]     = useState({})   // ticker → { price, currency }
  const [rates, setRates]       = useState(null)  // USD/EUR/GBP to NOK
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [nextId, setNextId]     = useState(() => Math.max(...DEFAULT_HOLDINGS.map(h => h.id)) + 1)

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem('investai-portfolio', JSON.stringify(holdings))
  }, [holdings])

  // Fetch prices + NOK rates on mount and when holdings change
  useEffect(() => {
    const tickers = [...new Set(holdings.map(h => h.ticker))]
    setLoading(true)
    Promise.allSettled([fetchQuotes(tickers), fetchNOKRates()])
      .then(([qRes, rRes]) => {
        if (qRes.status === 'fulfilled') {
          const map = {}
          qRes.value.forEach(q => {
            const key = q._requested || q.symbol
            map[key] = { price: q.price, currency: q.currency || guessCurrency(key) }
          })
          setPrices(map)
        }
        if (rRes.status === 'fulfilled') setRates(rRes.value)
      })
      .finally(() => setLoading(false))
  }, [holdings.map(h => h.ticker).join(',')])

  // Per-holding calculations
  const enriched = holdings.map(h => {
    const priceData  = prices[h.ticker]
    const priceCur   = priceData?.currency || guessCurrency(h.ticker)
    const priceNOK   = toNOK(priceData?.price, priceCur, rates)
    const buyNOK     = toNOK(h.buyPrice, h.buyCurrency, rates) ?? h.buyPrice
    const currValNOK = priceNOK ? h.units * priceNOK : null
    const buyValNOK  = h.units * (h.buyCurrency === 'NOK' ? h.buyPrice : (toNOK(h.buyPrice, h.buyCurrency, rates) ?? h.buyPrice))
    const gainNOK    = currValNOK != null ? currValNOK - buyValNOK : null
    const gainPct    = gainNOK != null && buyValNOK ? (gainNOK / buyValNOK) * 100 : null
    return { ...h, priceNOK, currValNOK, buyValNOK, gainNOK, gainPct, priceCur, rawPrice: priceData?.price }
  })

  const totalValue = enriched.reduce((s, h) => s + (h.currValNOK ?? 0), 0)
  const totalCost  = enriched.reduce((s, h) => s + h.buyValNOK, 0)
  const totalGain  = totalValue - totalCost
  const totalPct   = totalCost ? (totalGain / totalCost) * 100 : 0

  const best  = [...enriched].filter(h => h.gainPct != null).sort((a, b) => b.gainPct - a.gainPct)[0]
  const worst = [...enriched].filter(h => h.gainPct != null).sort((a, b) => a.gainPct - b.gainPct)[0]

  // Form handlers
  function startAdd() { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  function startEdit(h) {
    setForm({ name: h.name, ticker: h.ticker, units: String(h.units), buyPrice: String(h.buyPrice), buyCurrency: h.buyCurrency })
    setEditId(h.id)
    setShowForm(true)
  }
  function cancelForm() { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }

  function saveForm() {
    const units = parseFloat(form.units)
    const buyPrice = parseFloat(form.buyPrice)
    if (!form.name || !form.ticker || !units || !buyPrice) return
    if (editId != null) {
      setHoldings(h => h.map(x => x.id === editId
        ? { ...x, name: form.name, ticker: form.ticker, units, buyPrice, buyCurrency: form.buyCurrency }
        : x))
    } else {
      setHoldings(h => [...h, { id: nextId, name: form.name, ticker: form.ticker, units, buyPrice, buyCurrency: form.buyCurrency }])
      setNextId(n => n + 1)
    }
    cancelForm()
  }

  function deleteHolding(id) {
    setHoldings(h => h.filter(x => x.id !== id))
  }

  const Spinner = () => (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <RefreshCw size={14} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          {
            label: t('totalValue'), icon: DollarSign,
            value: loading ? t('loading') : formatNOK(totalValue),
            sub: `Investert: ${formatNOK(totalCost)}`,
            color: 'var(--accent-blue)',
          },
          {
            label: t('totalGain'), icon: totalGain >= 0 ? TrendingUp : TrendingDown,
            value: loading ? t('loading') : formatNOK(totalGain),
            sub: `${totalGain >= 0 ? '+' : ''}${totalPct.toFixed(2)}% totalt`,
            color: totalGain >= 0 ? 'var(--gain)' : 'var(--loss)',
          },
          {
            label: t('bestStock'), icon: TrendingUp,
            value: best ? best.name : '–',
            sub: best ? `+${best.gainPct?.toFixed(2)}%` : '–',
            color: 'var(--gain)',
          },
          {
            label: t('worstStock'), icon: TrendingDown,
            value: worst ? worst.name : '–',
            sub: worst ? `${worst.gainPct?.toFixed(2)}%` : '–',
            color: 'var(--loss)',
          },
        ].map(card => (
          <div key={card.label} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ padding: 10, borderRadius: 10, background: `${card.color}15`, flexShrink: 0 }}>
              <card.icon size={18} color={card.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: card.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {card.value}
              </div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                {card.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Holdings table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{t('holdings')}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {loading && <Spinner />}
            <button
              onClick={startAdd}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: 'var(--accent-blue)', color: 'white', border: 'none', cursor: 'pointer',
              }}
            >
              <PlusCircle size={13} /> {t('addHolding')}
            </button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[t('name'), t('ticker'), t('units'), t('buyPrice'), t('currentPrice'), t('valueNOK'), t('gainLoss'), ''].map(h => (
                <th key={h} style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-muted)',
                  textAlign: 'left', padding: '10px 16px 10px', textTransform: 'uppercase',
                  borderBottom: '1px solid var(--border)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enriched.map((h, i) => (
              <tr key={h.id} style={{ borderBottom: i < enriched.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h.name}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                    background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)',
                  }}>{h.ticker}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {h.units.toLocaleString('nb-NO')}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {h.buyPrice.toLocaleString('nb-NO')} {h.buyCurrency}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>
                  {h.rawPrice != null
                    ? `${h.rawPrice.toFixed(2)} ${h.priceCur}`
                    : <span style={{ color: 'var(--text-muted)' }}>–</span>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
                  {formatNOK(h.currValNOK)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <GainBadge pct={h.gainPct} />
                    {h.gainNOK != null && (
                      <span style={{ fontSize: 10, color: h.gainNOK >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                        {h.gainNOK >= 0 ? '+' : ''}{formatNOK(h.gainNOK)}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => startEdit(h)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex' }}
                    >
                      <Edit2 size={12} color="var(--text-muted)" />
                    </button>
                    <button
                      onClick={() => deleteHolding(h.id)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex' }}
                    >
                      <Trash2 size={12} color="var(--loss)" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add / Edit form */}
        {showForm && (
          <div style={{
            padding: '16px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end',
          }}>
            {[
              { label: t('name'), key: 'name', type: 'text', placeholder: 'Nordnet Global' },
              { label: t('ticker'), key: 'ticker', type: 'text', placeholder: 'EUNL.DE' },
              { label: t('units'), key: 'units', type: 'number', placeholder: '100' },
              { label: t('buyPrice'), key: 'buyPrice', type: 'number', placeholder: '209' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: 7,
                    border: '1px solid var(--border)', background: 'var(--bg-card)',
                    fontSize: 13, color: 'var(--text-primary)',
                  }}
                />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('currency')}</div>
              <select
                value={form.buyCurrency}
                onChange={e => setForm(p => ({ ...p, buyCurrency: e.target.value }))}
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 7,
                  border: '1px solid var(--border)', background: 'var(--bg-card)',
                  fontSize: 13, color: 'var(--text-primary)',
                }}
              >
                {['NOK', 'USD', 'EUR', 'GBP'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={saveForm}
                style={{
                  padding: '7px 14px', borderRadius: 7, border: 'none',
                  background: 'var(--accent-blue)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <Check size={12} /> {t('save')}
              </button>
              <button
                onClick={cancelForm}
                style={{
                  padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)',
                  background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rate info footer */}
      {rates && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          Kurser (Norges Bank): 1 USD = {rates.USD?.rate?.toFixed(2)} NOK ·
          1 EUR = {rates.EUR?.rate?.toFixed(2)} NOK ·
          1 GBP = {rates.GBP?.rate?.toFixed(2)} NOK
        </div>
      )}
    </div>
  )
}
