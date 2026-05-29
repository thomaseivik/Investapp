import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext({ lang: 'NO', toggleLang: () => {}, t: k => k })
export const useLang = () => useContext(LanguageContext)

const STRINGS = {
  NO: {
    // Navigation
    dashboard: 'Dashboard', stocks: 'Aksjeanalyse', news: 'Nyhetsanalyse',
    portfolio: 'Min Portefølje', calendar: 'Kalender & IPO',
    // Sidebar
    aiActive: 'AI Aktiv', realtime: 'Sanntidsanalyse',
    modules: 'Moduler', market: 'Marked', nokRates: 'NOK Valutakurser',
    // Header
    open: 'ÅPENT', closed: 'STENGT', searchPlaceholder: 'Søk aksje, nyhet...',
    // Portfolio
    myPortfolio: 'Min Portefølje', holdings: 'Beholdning',
    name: 'Navn', ticker: 'Ticker', units: 'Andeler', buyPrice: 'Kjøpskurs',
    currentPrice: 'Nåkurs', valueNOK: 'Verdi (NOK)', gainLoss: 'Avkastning',
    totalValue: 'Total Porteføljeverdi', totalGain: 'Total Gevinst',
    bestStock: 'Beste i dag', worstStock: 'Svakeste i dag',
    addHolding: 'Legg til beholdning', deleteHolding: 'Slett',
    save: 'Lagre', cancel: 'Avbryt', currency: 'Valuta',
    loading: 'Laster…', noData: 'Ingen data',
    // Calendar
    upcomingEvents: 'Kommende Hendelser', allEvents: 'Alle 2026',
    fomc: 'FOMC Rentebeslutning', norgesBank: 'Norges Bank Rentemøte',
    cpiUS: 'CPI USA', cpiNO: 'KPI Norge',
    earnings: 'Kvartalsrapport', ipo: 'Børsnotering',
    today: 'I dag', daysAway: 'd unna',
    // General
    source: 'Kilde', high: 'Høy', medium: 'Middels', low: 'Lav',
  },
  EN: {
    dashboard: 'Dashboard', stocks: 'Stock Analysis', news: 'News Analysis',
    portfolio: 'My Portfolio', calendar: 'Calendar & IPO',
    aiActive: 'AI Active', realtime: 'Real-time Analysis',
    modules: 'Modules', market: 'Markets', nokRates: 'NOK Exchange Rates',
    open: 'OPEN', closed: 'CLOSED', searchPlaceholder: 'Search stocks, news...',
    myPortfolio: 'My Portfolio', holdings: 'Holdings',
    name: 'Name', ticker: 'Ticker', units: 'Units', buyPrice: 'Buy Price',
    currentPrice: 'Current Price', valueNOK: 'Value (NOK)', gainLoss: 'Return',
    totalValue: 'Total Portfolio Value', totalGain: 'Total Gain',
    bestStock: 'Best today', worstStock: 'Worst today',
    addHolding: 'Add holding', deleteHolding: 'Delete',
    save: 'Save', cancel: 'Cancel', currency: 'Currency',
    loading: 'Loading…', noData: 'No data',
    upcomingEvents: 'Upcoming Events', allEvents: 'All 2026',
    fomc: 'FOMC Rate Decision', norgesBank: 'Norges Bank Meeting',
    cpiUS: 'US CPI', cpiNO: 'Norway CPI',
    earnings: 'Earnings Report', ipo: 'IPO',
    today: 'Today', daysAway: 'd away',
    source: 'Source', high: 'High', medium: 'Medium', low: 'Low',
  },
}

export function t(key, lang = 'NO') {
  return STRINGS[lang]?.[key] ?? STRINGS.NO[key] ?? key
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('investai-lang') || 'NO')

  const toggleLang = () => {
    const next = lang === 'NO' ? 'EN' : 'NO'
    setLang(next)
    localStorage.setItem('investai-lang', next)
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t: key => t(key, lang) }}>
      {children}
    </LanguageContext.Provider>
  )
}
