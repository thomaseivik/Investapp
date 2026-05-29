import { useLocation } from 'react-router-dom'
import { Bell, Search, RefreshCw } from 'lucide-react'
import { useState } from 'react'

const pageTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'Porteføljeoversikt og markedssammendrag' },
  '/stocks': { title: 'Aksjeanalyse', sub: 'AI-drevet teknisk og fundamental analyse' },
  '/news': { title: 'Nyhetsanalyse', sub: 'Sanntids sentimentanalyse av finansnyheter' },
}

export default function Header() {
  const location = useLocation()
  const info = pageTitles[location.pathname] || { title: 'InvestAI', sub: '' }
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <header style={{
      height: 60,
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      flexShrink: 0,
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

      {/* Time */}
      <div style={{ textAlign: 'right', display: 'none' }} className="desktop-only">
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{timeStr}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{dateStr}</div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '6px 12px',
        width: 200,
      }}>
        <Search size={14} color="var(--text-muted)" />
        <input
          placeholder="Søk aksje, nyhet..."
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 12,
            color: 'var(--text-primary)',
            width: '100%',
          }}
        />
      </div>

      {/* Refresh */}
      <button
        onClick={handleRefresh}
        style={{
          width: 32, height: 32,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
          transition: 'all 0.15s',
        }}
      >
        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear' : 'none' }} />
      </button>

      {/* Notifications */}
      <button style={{
        width: 32, height: 32,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)',
        position: 'relative',
      }}>
        <Bell size={14} />
        <div style={{
          position: 'absolute',
          top: 6, right: 6,
          width: 6, height: 6,
          borderRadius: '50%',
          background: 'var(--gain)',
          boxShadow: '0 0 4px var(--gain)',
        }} />
      </button>

      {/* Market status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gain)', boxShadow: '0 0 4px var(--gain)' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gain)' }}>ÅPENT</span>
      </div>
    </header>
  )
}
