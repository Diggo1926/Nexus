import { useState } from 'react'
import { useStats } from './hooks/useStats'
import { useConnection } from './hooks/useConnection'
import { BottomNav } from './components/BottomNav'
import { StatusPill } from './components/StatusPill'
import { ToastContainer } from './components/Toast'
import { PcProvider } from './context/PcContext'
import { Dashboard } from './pages/Dashboard'
import { Power } from './pages/Power'
import { Apps } from './pages/Apps'
import { Media } from './pages/Media'
import { Settings } from './pages/Settings'
import { Screenshot } from './pages/Screenshot'
import { Automations } from './pages/Automations'
import { Logs } from './pages/Logs'

function Inner() {
  const [aba, setAba] = useState('dashboard')
  const { stats, online, hostname, refresh } = useStats(3000)
  const { request } = useConnection()

  return (
    <div className="min-h-dvh bg-nx-bg font-grotesk">
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-4"
        style={{
          background: 'rgba(13,13,26,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1e1e3a',
        }}
      >
        <span
          className="font-grotesk font-bold tracking-widest nexus-text"
          style={{ fontSize: 20, letterSpacing: '0.18em' }}
        >
          NEXUS
        </span>
        <StatusPill online={online} hostname={hostname} />
      </header>

      <main className="pb-safe-nav">
        {aba === 'dashboard'   && <Dashboard stats={stats} online={online} />}
        {aba === 'power'       && <Power online={online} request={request} />}
        {aba === 'apps'        && <Apps request={request} />}
        {aba === 'media'       && <Media request={request} />}
        {aba === 'settings'    && <Settings onSave={refresh} />}
        {aba === 'screenshot'  && <Screenshot request={request} />}
        {aba === 'automations' && <Automations request={request} />}
        {aba === 'logs'        && <Logs request={request} />}
      </main>

      <BottomNav ativa={aba} onChange={setAba} />
      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <PcProvider>
      <Inner />
    </PcProvider>
  )
}
