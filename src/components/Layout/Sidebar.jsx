import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Newspaper,
  TrendingUp,
  Bot,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/stocks', icon: TrendingUp, label: 'Aksjeanalyse' },
  { to: '/news', icon: Newspaper, label: 'Nyhetsanalyse' },
]

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Innstillinger' },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: 36,
          height: 36,
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Zap size={18} color="white" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            InvestAI
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            ANALYSEPLATTFORM
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div style={{
        margin: '12px',
        padding: '10px 12px',
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'var(--gain)',
          boxShadow: '0 0 6px var(--gain)',
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gain)' }}>AI Aktiv</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sanntidsanalyse</div>
        </div>
        <Bot size={14} color="var(--gain)" style={{ marginLeft: 'auto' }} />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', color: 'var(--text-muted)', padding: '8px 8px 4px', textTransform: 'uppercase' }}>
          Moduler
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              margin: '2px 0',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              transition: 'all 0.15s ease',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.background = ''
              }
            }}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', color: 'var(--text-muted)', padding: '16px 8px 4px', textTransform: 'uppercase' }}>
          Marked
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)', margin: '2px 0' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>OBX Index</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>1 234.50</span>
            <span style={{ fontSize: 11, color: 'var(--gain)' }}>+1.24%</span>
          </div>
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)', margin: '4px 0 2px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>S&P 500</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>5 821.33</span>
            <span style={{ fontSize: 11, color: 'var(--loss)' }}>-0.38%</span>
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white'
          }}>T</div>
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
