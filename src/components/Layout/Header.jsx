import { useLocation } from 'react-router-dom'
import { Bell, Search, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '../../context/LanguageContext'

const PAGE_TITLES = {
  NO: {
    '/dashboard': { title: 'Dashboard',       sub: 'Porteføljeoversikt og markedssammendrag' },
    '/stocks':    { title: 'Aksjeanalyse',     sub: 'AI-drevet teknisk og fundamental analyse' },
    '/news':      { title: 'Nyhetsanalyse',    sub: 'Sanntids sentimentanalyse av finansnyheter' },
    '/portfolio': { title: 'Min Portefølje',   sub: 'Beholdning og avkastning i sanntid' },
    '/calendar':  { title: 'Kalender & IPO',   sub: 'FOMC, Norges Bank, CPI og kvartalsrapporter' },
  },
  EN: {
    '/dashboard': { title: 'Dashboard',       sub: 'Portfolio overview and market summary' },
    '/stocks':    { title: 'Stock Analysis',  sub: 'AI-powered technical and fundamental analysis' },
    '/news':      { title: 'News Analysis',   sub: 'Real-time sentiment analysis of financial news' },
    '/portfolio': { title: 'My Portfolio',    sub: 'Holdings and real-time performance' },
    '/calendar':  { title: 'Calendar & IPO',  sub: 'FOMC, Norges Bank, CPI and earnings dates' },
  },
}

export default function Header() {
  const location = useLocation()
  const { lang, toggleLang } = useLang()
  const info = PAGE_TITLES[lang][location.pathname] || { title: 'InvestAI', sub: '' }
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => { window.location.reload() }, 200)
  }

  const now = new Date()
  const isMarketOpen = (() => {
    const h = now.getUTCHours(); const m = now.getUTCMinutes()
    const mins = h * 60 + m
    const day = now.getUTCDay()
    if (day === 0 || day === 6) return false
    return mins >= 14 * 60 + 30 && mins < 21 * 60  // NYSE 09:30–16:00 ET = 14:30–21:00 UTC
  })()

  return (
    <header style={{
      height: 60, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0,
    }}>
      {/* Page title */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {info.title}
          </h1>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{info.sub}</span>
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '6px 12px', width: 200,
      }}>
        <Search size={14} color="var(--text-muted)" />
        <input
          placeholder={lang === 'NO' ? 'Søk aksje, nyhet...' : 'Search stocks, news...'}
          style={{ background: 'transparent', border: 'none', fontSize: 12, color: 'var(--text-primary)', width: '100%' }}
        />
      </div>

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        title={lang === 'NO' ? 'Switch to English' : 'Bytt til norsk'}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 8,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {lang === 'NO' ? '🇬🇧 EN' : '🇳🇴 NO'}
      </button>

      {/* Refresh */}
      <button
        onClick={handleRefresh}
        style={{
          width: 32, height: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', cursor: 'pointer',
        }}
      >
        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear' : 'none' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </button>

      {/* Notifications */}
      <button style={{
        width: 32, height: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', position: 'relative', cursor: 'pointer',
      }}>
        <Bell size={14} />
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--gain)', boxShadow: '0 0 4px var(--gain)',
        }} />
      </button>

      {/* Market status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 6,
        background: isMarketOpen ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
        border: `1px solid ${isMarketOpen ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isMarketOpen ? 'var(--gain)' : 'var(--loss)',
          boxShadow: `0 0 4px ${isMarketOpen ? 'var(--gain)' : 'var(--loss)'}`,
        }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: isMarketOpen ? 'var(--gain)' : 'var(--loss)' }}>
          {isMarketOpen ? (lang === 'NO' ? 'ÅPENT' : 'OPEN') : (lang === 'NO' ? 'STENGT' : 'CLOSED')}
        </span>
      </div>
    </header>
  )
}
