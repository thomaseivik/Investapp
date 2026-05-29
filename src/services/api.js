// ─── Base URLs ────────────────────────────────────────────────────────────────
const FMP_KEY = import.meta.env.VITE_FMP_API_KEY
const AV_KEY  = import.meta.env.VITE_ALPHA_VANTAGE_KEY

const FMP_BASE = 'https://financialmodelingprep.com/stable'
const AV_BASE  = 'https://www.alphavantage.co/query'
const PROXY    = 'https://corsproxy.io/?'
// CORS proxy wraps Yahoo Finance and Norges Bank
const YF_BASE  = `${PROXY}https://query1.finance.yahoo.com/v8/finance/chart`
const NB_URL   = `${PROXY}https://data.norges-bank.no/api/data/EXR/B.USD+EUR+GBP.NOK.SP?format=sdmx-json`

// Non-US exchange tickers (any suffix like .OL .DE .L .PA etc.) → Yahoo Finance
const isNonUS = ticker => /\.(OL|DE|L|PA|AS|MI|ST|HE|CO)$/.test(ticker)

// ─── Yahoo Finance ─────────────────────────────────────────────────────────────
async function yfGet(symbol, params = {}) {
  const url = new URL(`${YF_BASE}/${encodeURIComponent(symbol)}`)
  Object.entries({ interval: '1d', includePrePost: false, ...params })
    .forEach(([k, v]) => url.searchParams.set(k, v))
  console.log(`[YF] ${symbol} →`, url.toString())

  let res
  try {
    res = await fetch(url.toString())
  } catch (err) {
    console.error(`[YF] ${symbol} network error:`, err.message)
    return null
  }

  if (!res.ok) {
    console.error(`[YF] ${symbol} HTTP ${res.status}`)
    return null
  }

  const data = await res.json()
  const result = data.chart?.result?.[0]
  if (!result) {
    console.error(`[YF] ${symbol} — no result:`, data.chart?.error)
    return null
  }
  return result
}

async function fetchYahooQuote(symbol) {
  // range=2d gives us today + yesterday so we can calculate change
  const r = await yfGet(symbol, { range: '2d' })
  if (!r) return null

  const meta = r.meta
  const price = meta.regularMarketPrice ?? meta.previousClose
  // regularMarketChangePercent is sometimes absent — calculate from timestamps if needed
  let pct = meta.regularMarketChangePercent
  if (pct == null || pct === 0) {
    const closes = r.indicators?.quote?.[0]?.close?.filter(v => v != null) ?? []
    if (closes.length >= 2) {
      const last = closes[closes.length - 1]
      const prev = closes[closes.length - 2]
      pct = prev ? ((last - prev) / prev) * 100 : 0
    }
  }

  console.log(`[YF] ${symbol} ✓ — ${meta.currency} ${price} (${pct?.toFixed(2)}%)`)
  return {
    symbol,
    _requested: symbol,
    _source: 'yahoo',
    price,
    changesPercentage: pct ?? 0,
    change: meta.regularMarketChange ?? 0,
    previousClose: meta.previousClose,
    marketCap: meta.marketCap,
    currency: meta.currency,
  }
}

async function fetchYahooHistorical(symbol) {
  const r = await yfGet(symbol, { range: '1mo' })
  if (!r) return []

  const timestamps = r.timestamp ?? []
  const q = r.indicators?.quote?.[0] ?? {}
  const adjCloses = r.indicators?.adjclose?.[0]?.adjclose ?? []

  const rows = timestamps
    .map((ts, i) => ({
      date:   new Date(ts * 1000).toISOString().slice(0, 10),
      open:   q.open?.[i]   ?? null,
      high:   q.high?.[i]   ?? null,
      low:    q.low?.[i]    ?? null,
      close:  q.close?.[i]  ?? adjCloses[i] ?? null,
      volume: q.volume?.[i] ?? 0,
    }))
    .filter(d => d.close != null && d.close > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  if (rows.length) {
    console.log(`[YF] historical ${symbol}: ${rows.length} rows, fields:`,
      Object.keys(rows[0]), '— sample:', rows[0])
  } else {
    console.warn(`[YF] historical ${symbol}: 0 valid rows`)
  }
  return rows
}

// ─── Internal FMP fetch helper ────────────────────────────────────────────────
async function fmpGet(path, params = {}, label = path) {
  const url = new URL(`${FMP_BASE}${path}`)
  url.searchParams.set('apikey', FMP_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))

  const displayUrl = url.toString().replace(FMP_KEY, '***KEY***')
  console.log(`[FMP] ${label} →`, displayUrl)

  let res
  try {
    res = await fetch(url.toString())
  } catch (err) {
    console.error(`[FMP] ${label} — network error:`, err.message)
    return null
  }

  const text = await res.text()

  if (!res.ok) {
    console.error(`[FMP] ${label} — HTTP ${res.status}:`, text.slice(0, 400))
    return null
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    console.error(`[FMP] ${label} — JSON parse failed:`, text.slice(0, 200))
    return null
  }

  // FMP sometimes returns an error object with HTTP 200
  if (data && (data['Error Message'] || data.error || data.message?.includes('limit'))) {
    console.error(`[FMP] ${label} — API error:`, data['Error Message'] || data.error || data.message)
    return null
  }

  if (Array.isArray(data)) {
    console.log(`[FMP] ${label} ✓ — ${data.length} rows`, data.length ? data[0] : '(empty)')
  } else {
    console.log(`[FMP] ${label} ✓`, data)
  }

  return data
}

// ─── Connection test — call this first to validate the key ───────────────────
export async function testFMPConnection() {
  console.group('[FMP] ══ API Connection Test ══')
  const data = await fmpGet('/quote', { symbol: 'AAPL' }, 'TEST /quote?symbol=AAPL')
  console.groupEnd()

  if (!data) {
    return { ok: false, error: 'Ingen respons fra FMP API. Ugyldig nøkkel eller nettverksfeil.' }
  }

  const quote = Array.isArray(data) ? data[0] : data
  if (!quote?.price) {
    return { ok: false, error: `FMP svarte men mangler kursdata. Fikk: ${JSON.stringify(data).slice(0, 120)}` }
  }

  console.log(`[FMP] ✓ OK — AAPL: $${quote.price} (${quote.changesPercentage?.toFixed(2)}%)`)
  return { ok: true, sample: quote }
}

// ─── Single quote fetch with .OL fallback ────────────────────────────────────
async function fetchSingleQuote(apiTicker) {
  let data = await fmpGet('/quote', { symbol: apiTicker }, `quote:${apiTicker}`)
  let arr = Array.isArray(data) ? data : data ? [data] : []

  // If .OL returned nothing, try plain symbol (NYSE/ADR listing)
  if (arr.length === 0 && apiTicker.endsWith('.OL')) {
    const plain = apiTicker.replace('.OL', '')
    console.log(`[FMP] ${apiTicker} — empty, trying fallback: ${plain}`)
    const fb = await fmpGet('/quote', { symbol: plain }, `quote:${plain} (fallback)`)
    arr = Array.isArray(fb) ? fb : fb ? [fb] : []
    if (arr.length > 0) {
      console.log(`[FMP] ✓ Fallback ${plain} worked → $${arr[0]?.price}`)
    } else {
      console.warn(`[FMP] ✗ No data for ${apiTicker} or ${plain}`)
    }
  }

  // Tag with requested symbol so callers can match back to their ticker list
  return arr.map(q => ({ ...q, _requested: apiTicker }))
}

// ─── Quote — routes .OL → Yahoo Finance, rest → FMP ─────────────────────────
export async function fetchQuotes(tickers) {
  const results = await Promise.all(tickers.map(async t => {
    try {
      if (isNonUS(t)) {
        const q = await fetchYahooQuote(t)
        return q ? [q] : []
      }
      return await fetchSingleQuote(t)
    } catch (e) {
      console.error(`[fetchQuotes] ${t}:`, e.message)
      return []
    }
  }))
  const all = results.flat()
  console.log(`[fetchQuotes] ${all.length}/${tickers.length} tickers:`,
    all.map(q => `${q._requested || q.symbol}=$${q.price?.toFixed(2)}`))
  return all
}

// ─── Historical — routes .OL → Yahoo Finance, rest → FMP ────────────────────
async function fetchHistoricalFMP(symbol, limit) {
  const data = await fmpGet('/historical-price-eod/light', { symbol, limit }, `historical:${symbol}`)
  if (!data) return []

  // Unwrap various response shapes
  const raw = Array.isArray(data)
    ? data
    : (data.historical || data.results || Object.values(data).find(v => Array.isArray(v)) || [])

  if (!Array.isArray(raw) || raw.length === 0) {
    console.warn(`[FMP] historical:${symbol} — empty response:`, data)
    return []
  }

  // Log the RAW first item so we can see the actual field names from FMP
  console.log(`[FMP] historical:${symbol} — ${raw.length} rows — first item:`, raw[0])

  // Return raw rows sorted oldest→newest; let the component normalise field names
  return raw.slice().sort((a, b) => (a.date < b.date ? -1 : 1))
}

export async function fetchHistorical(ticker, limit = 30) {
  // .OL stocks → Yahoo Finance directly (FMP gives 402)
  if (isNonUS(ticker)) return fetchYahooHistorical(ticker)

  // US stocks → try FMP first; fall back to Yahoo if FMP historical needs paid plan
  const fmpRows = await fetchHistoricalFMP(ticker, limit)
  if (fmpRows.length > 0) return fmpRows

  console.log(`[historical] FMP empty for ${ticker} — falling back to Yahoo Finance`)
  return fetchYahooHistorical(ticker)
}

// ─── FMP Stock News — /stable/news/stock?tickers=TICKER&limit=N ───────────────
export async function fetchFMPNews(ticker = null, limit = 50) {
  const params = { limit }
  if (ticker) params.tickers = ticker.toUpperCase()
  const data = await fmpGet('/news/stock', params, `news:${ticker || 'general'}`)
  if (!data) return []
  return Array.isArray(data) ? data : []
}

// ─── Alpha Vantage News ───────────────────────────────────────────────────────
export async function fetchAVNews(limit = 20) {
  const url = `${AV_BASE}?function=NEWS_SENTIMENT&limit=${limit}&apikey=${AV_KEY}`
  console.log('[AV] Fetching news →', url.replace(AV_KEY, '***KEY***'))
  const res = await fetch(url)
  if (!res.ok) {
    console.error('[AV] HTTP', res.status)
    return {}
  }
  const data = await res.json()
  if (data.Information) {
    console.warn('[AV] Rate limit hit:', data.Information)
  } else {
    console.log('[AV] News ✓ —', data.feed?.length ?? 0, 'articles')
  }
  return data
}

// ─── IPO Calendar — /stable/ipo-calendar?from=DATE&to=DATE ───────────────────
export async function fetchIPOCalendar(from, to) {
  const data = await fmpGet('/ipo-calendar', { from, to }, 'ipo-calendar')
  if (!data) return []
  return Array.isArray(data) ? data : []
}

// ─── Norges Bank exchange rates (via CORS proxy) ─────────────────────────────
export async function fetchNOKRates() {
  const url = NB_URL
  console.log('[NB] Fetching NOK rates →', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Norges Bank HTTP ${res.status}`)
  const data = await res.json()

  const series      = data.dataSets[0].series
  const timePeriods = data.structure.dimensions.observation[0].values
  const currencies  = ['USD', 'EUR', 'GBP']
  const rates       = {}

  currencies.forEach((cur, i) => {
    const obs = series[`0:${i}:0:0`]?.observations
    if (!obs) return
    for (let j = timePeriods.length - 1; j >= 0; j--) {
      const val = obs[String(j)]
      if (val && val[0] != null) {
        rates[cur] = { rate: +val[0].toFixed(4), date: timePeriods[j].id }
        break
      }
    }
  })

  console.log('[NB] NOK rates ✓', rates)
  return rates
}

// ─── Mappers ──────────────────────────────────────────────────────────────────
export function mapFMPNews(items) {
  if (!items.length) return []
  console.log('[FMP] mapFMPNews — first item keys:', Object.keys(items[0]))

  return items.map((item, i) => {
    const title  = item.title  || item.headline  || ''
    const source = item.site   || item.source    || 'FMP'
    const text   = item.text   || item.content   || item.summary || ''
    const url    = item.url    || item.link      || ''
    const symbol = item.symbol || item.ticker    || ''
    const dateRaw = item.publishedDate || item.date || ''

    let time = '–'
    const m = dateRaw.match(/[T ](\d{2}):(\d{2})/)
    if (m) time = `${m[1]}:${m[2]}`

    return {
      id: `fmp-${i}-${dateRaw}`,
      headline: title,
      source,
      time,
      sentiment: 'neutral',
      score: 0,
      tickers: symbol ? [symbol] : [],
      summary: text,
      url,
      impact: 'Middels',
      category: 'Marked',
      publishedDate: dateRaw,
    }
  })
}

function mapAVSentiment(label) {
  if (label === 'Bullish' || label === 'Somewhat-Bullish') return 'bullish'
  if (label === 'Bearish' || label === 'Somewhat-Bearish') return 'bearish'
  return 'neutral'
}

const TOPIC_MAP = {
  'Financial Markets':        'Marked',
  'Earnings':                 'Resultat',
  'Economy - Macro':          'Makro',
  'Economy - Monetary':       'Makro',
  'Economy - Fiscal':         'Makro',
  'Technology':               'Teknologi',
  'Energy & Transportation':  'Energi',
  'Finance':                  'Finans',
  'Real Estate & Construction':'Eiendom',
  'Manufacturing':            'Industri',
  'Life Sciences':            'Helse',
  'Retail & Wholesale':       'Handel',
}

export function mapAVNews(feed) {
  return feed.map((item, i) => {
    const tp    = item.time_published || ''
    const hhmm  = tp.substring(9, 13)
    const time  = hhmm.length === 4 ? `${hhmm.slice(0, 2)}:${hhmm.slice(2)}` : '–'
    const score = item.overall_sentiment_score ?? 0
    return {
      id: `av-${i}`,
      headline: item.title,
      source:   item.source,
      time,
      sentiment: mapAVSentiment(item.overall_sentiment_label),
      score,
      tickers:  (item.ticker_sentiment || []).map(t => t.ticker).slice(0, 3),
      summary:  item.summary,
      url:      item.url,
      impact:   Math.abs(score) > 0.35 ? 'Høy' : Math.abs(score) > 0.15 ? 'Middels' : 'Lav',
      category: TOPIC_MAP[item.topics?.[0]?.topic] || 'Marked',
    }
  })
}

export function deduplicateNews(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = (item.headline || '').toLowerCase().replace(/\s+/g, '').slice(0, 60)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function matchesSearch(news, term) {
  if (!term) return true
  const t = term.toLowerCase()
  return (
    news.tickers.some(tk => tk.toLowerCase().includes(t)) ||
    news.headline.toLowerCase().includes(t) ||
    news.source.toLowerCase().includes(t) ||
    (news.summary || '').toLowerCase().includes(t)
  )
}

// ─── Formatting helpers ───────────────────────────────────────────────────────
export function formatMktCap(cap) {
  if (!cap) return '–'
  if (cap >= 1e12) return `${(cap / 1e12).toFixed(2)}T`
  if (cap >= 1e9)  return `${(cap / 1e9).toFixed(0)}B`
  if (cap >= 1e6)  return `${(cap / 1e6).toFixed(0)}M`
  return String(cap)
}

const NO_MONTHS = ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des']
export function formatDateNO(dateStr) {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  return `${parseInt(day)} ${NO_MONTHS[parseInt(month) - 1]}`
}
