import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Dashboard from './pages/Dashboard'
import NewsAnalysis from './pages/NewsAnalysis'
import StockAnalysis from './pages/StockAnalysis'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header />
          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            background: 'var(--bg-primary)'
          }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/news" element={<NewsAnalysis />} />
              <Route path="/stocks" element={<StockAnalysis />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
