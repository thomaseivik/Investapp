import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Newspaper, TrendingUp, BarChart3, Zap, Calendar, Briefcase, Bot, RefreshCw } from 'lucide-react'
import { fetchNOKRates } from '../../services/api'
import { useLang } from '../../context/LanguageContext'

export default function Sidebar() {
  const { lang, t } = useLang()
  const [nokRates, setNokRates] = useState(null)

  useEffect(() => {
    fetchNOKRates().then(setNokRates).catch(() => null)
  }, [])

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
    { to: '/stocks',    icon: TrendingUp,       labelKey: 'stocks'    },
    { to: '/news',      icon: Newspaper,        labelKey: 'news'      },
    { to: '/portfolio', icon: Briefcase,        labelKey: 'portfolio' },
    { to: '/calendar',  icon: Calendar,         labelKey: 'calendar'  },
  ]

  return (
    <aside style={{
      width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)',
      background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={18} color="white" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>InvestAI</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ANALYSEPLATTFORM</div>
        </div>
      </div>

      {/* AI Status */}
      <div style={{ margin: '12px', padding: '10px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gain)', boxShadow: '0 0 6px var(--gain)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gain)' }}>{t('aiActive')}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('realtime')}</div>
        </div>
        <Bot size={14} color="var(--gain)" style={{ marginLeft: 'auto' }} />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', color: 'var(--text-muted)', padding: '8px 8px 4px', textTransform: 'uppercase' }}>
          {t('modules')}
        </div>
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, margin: '2px 0',
              textDecoration: 'none', fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            <Icon size={16} />
            {t(labelKey)}
          </NavLink>
        ))}

        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', color: 'var(--text-muted)', padding: '16px 8px 4px', textTransform: 'uppercase' }}>
          {t('market')}
        </div>

        {/* NOK Rates */}
        <div style={{ margin: '2px 0', padding: '10px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            {t('nokRates')}
            {!nokRates && (
              <>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <RefreshCw size={9} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
              </>
            )}
          </div>
          {nokRates ? (
            [['🇺🇸 USD', nokRates.USD?.rate], ['🇪🇺 EUR', nokRates.EUR?.rate], ['🇬🇧 GBP', nokRates.GBP?.rate]].map(([label, rate]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {rate ? `${rate.toFixed(2)} kr` : '–'}
                </span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Laster…</div>
          )}
        </div>

        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', margin: '4px 0 2px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>OBX Index</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>1 234.50</span>
            <span style={{ fontSize: 11, color: 'var(--gain)' }}>+1.24%</span>
          </div>
        </div>
      </nav>

      {/* Bottom user */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>T</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Thomas</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pro Plan</div>
          </div>
          <BarChart3 size={14} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
        </div>
      </div>
    </aside>
  )
}
