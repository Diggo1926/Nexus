import { useState } from 'react'
import { toast } from '../components/Toast'

export function Screenshot({ request }) {
  const [img,       setImg]       = useState(null)
  const [timestamp, setTimestamp] = useState(null)
  const [loading,   setLoading]   = useState(false)

  const capturar = async () => {
    setLoading(true)
    try {
      const res = await request('GET', '/screenshot')
      setImg(res.screenshot)
      setTimestamp(res.timestamp)
    } catch (e) {
      toast.erro(e.message)
    } finally {
      setLoading(false)
    }
  }

  const formatarTs = (ts) => {
    if (!ts) return ''
    try {
      return new Date(ts).toLocaleTimeString('pt-BR')
    } catch {
      return ts
    }
  }

  return (
    <div className="p-5 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="font-grotesk font-semibold text-sm text-white">Captura de Tela</h2>
        {timestamp && (
          <span className="font-mono-nx text-xs text-nx-muted">
            {formatarTs(timestamp)}
          </span>
        )}
      </div>

      <button
        onClick={capturar}
        disabled={loading}
        className="w-full py-4 rounded-2xl font-grotesk font-semibold text-sm text-white
          active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(90deg,#7C3AED,#3B82F6,#06B6D4)',
                 boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}
        aria-label="Capturar tela"
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent
            rounded-full animate-spin-nx" />
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        )}
        {loading ? 'Capturando...' : 'Capturar Tela'}
      </button>

      {img ? (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#12122A', border: '1px solid #1e1e3a' }}>
          <img
            src={`data:image/png;base64,${img}`}
            alt="Screenshot do PC"
            className="w-full h-auto"
            style={{ display: 'block', maxHeight: '60vh', objectFit: 'contain' }}
          />
        </div>
      ) : !loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl"
          style={{ background: '#12122A', border: '1px solid #1e1e3a' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
            <defs>
              <linearGradient id="scg" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <rect x="2" y="3" width="20" height="14" rx="2" stroke="url(#scg)" strokeWidth="2" />
            <line x1="8" y1="21" x2="16" y2="21" stroke="url(#scg)" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="21" stroke="url(#scg)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="font-grotesk text-sm text-nx-muted">
            Clique em "Capturar Tela" para ver a tela do PC
          </p>
        </div>
      )}
    </div>
  )
}
