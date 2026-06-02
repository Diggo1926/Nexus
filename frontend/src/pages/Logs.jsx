import { useState, useEffect, useCallback } from 'react'
import { toast } from '../components/Toast'

const LABELS = {
  shutdown:  'Desligar',
  restart:   'Reiniciar',
  hibernate: 'Hibernar',
  sleep:     'Sleep',
  cancel:    'Cancelar desligamento',
  wake:      'Wake-on-LAN',
  play:      'Play/Pause',
  prev:      'Faixa anterior',
  next:      'Proxima faixa',
  stop:      'Parar midia',
  mute:      'Mute',
  volume:    'Volume',
  open:      'Abrir app',
  kill:      'Encerrar processo',
  exec:      'Terminal',
  next_slide:'Proximo slide',
  prev_slide:'Slide anterior',
  start:     'Iniciar apresentacao',
  black:     'Tela preta',
}

function BadgeStatus({ status }) {
  const ok = status >= 200 && status < 300
  return (
    <span className="font-mono-nx text-xs px-2 py-0.5 rounded-lg"
      style={{
        background: ok ? 'rgba(6,182,212,0.12)' : 'rgba(244,63,94,0.12)',
        color:       ok ? '#06B6D4' : '#F43F5E',
        border: `1px solid ${ok ? 'rgba(6,182,212,0.25)' : 'rgba(244,63,94,0.25)'}`,
      }}>
      {status}
    </span>
  )
}

function formatarHora(ts) {
  try {
    const d = new Date(ts)
    const hoje = new Date()
    const mesma = d.toDateString() === hoje.toDateString()
    const hora  = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return mesma ? `hoje ${hora}` : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ` ${hora}`
  } catch {
    return ts || ''
  }
}

export function Logs({ request }) {
  const [logs,     setLogs]     = useState([])
  const [loading,  setLoading]  = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await request('GET', '/logs?limit=50')
      if (Array.isArray(res)) setLogs([...res].reverse())
    } catch (e) {
      toast.erro(e.message)
    } finally {
      setLoading(false)
    }
  }, [request])

  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 30000)
    return () => clearInterval(t)
  }, [])

  const limpar = async () => {
    try {
      await request('POST', '/logs/clear')
      setLogs([])
      toast.info('Logs limpos')
    } catch {
      setLogs([])
      toast.info('Logs limpos localmente')
    }
  }

  return (
    <div className="p-5 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="font-grotesk font-semibold text-sm text-white">Historico de Acoes</h2>
        <div className="flex gap-2">
          <button onClick={carregar} disabled={loading}
            className="px-3 py-1.5 rounded-xl font-grotesk text-xs text-nx-muted
              active:opacity-70 transition-opacity disabled:opacity-50"
            style={{ background: '#12122A', border: '1px solid #1e1e3a' }}>
            {loading ? '...' : '↻'}
          </button>
          <button onClick={limpar}
            className="px-3 py-1.5 rounded-xl font-grotesk text-xs text-nx-danger
              active:opacity-70 transition-opacity"
            style={{ border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)' }}>
            Limpar
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 rounded-2xl"
          style={{ background: '#12122A', border: '1px solid #1e1e3a' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <line x1="8" y1="6"  x2="21" y2="6"  stroke="url(#lg)" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="12" x2="21" y2="12" stroke="url(#lg)" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="18" x2="21" y2="18" stroke="url(#lg)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="3" cy="6"  r="1.5" fill="url(#lg)" />
            <circle cx="3" cy="12" r="1.5" fill="url(#lg)" />
            <circle cx="3" cy="18" r="1.5" fill="url(#lg)" />
          </svg>
          <p className="font-grotesk text-sm text-nx-muted">Nenhuma acao registrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: '#12122A', border: '1px solid #1e1e3a' }}>
              <div className="flex-1 min-w-0">
                <p className="font-grotesk text-sm font-medium text-white">
                  {LABELS[log.action] || log.action}
                </p>
                <p className="font-mono-nx text-xs text-nx-border truncate">{log.route}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <BadgeStatus status={log.status} />
                <span className="font-mono-nx text-xs text-nx-border">{formatarHora(log.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
