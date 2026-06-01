import { useState, useEffect } from 'react'
import { ActionButton } from '../components/ActionButton'
import { toast } from '../components/Toast'

export function Settings({ onSave }) {
  const [url,        setUrl]        = useState('')
  const [key,        setKey]        = useState('')
  const [mostrarKey, setMostrarKey] = useState(false)
  const [testando,   setTestando]   = useState(false)
  const [ping,       setPing]       = useState(null)

  useEffect(() => {
    setUrl(localStorage.getItem('nexus_api_url') || import.meta.env.VITE_API_URL || '')
    setKey(localStorage.getItem('nexus_api_key') || import.meta.env.VITE_API_KEY || '')
  }, [])

  const salvar = () => {
    localStorage.setItem('nexus_api_url', url.trim())
    localStorage.setItem('nexus_api_key', key.trim())
    toast.sucesso('Configuracoes salvas!')
    onSave?.()
  }

  const testar = async () => {
    setTestando(true)
    setPing(null)
    const baseUrl = (url.trim() || import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
    try {
      const t0 = Date.now()
      const r  = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) })
      const d  = await r.json()
      const ms = Date.now() - t0
      if (d.status === 'online') {
        setPing({ ok: true, msg: `${d.hostname} — ${ms}ms` })
        toast.sucesso(`Online: ${d.hostname}`)
      } else {
        throw new Error('Resposta inesperada')
      }
    } catch {
      setPing({ ok: false, msg: 'Sem conexao' })
      toast.erro('Falha na conexao com o NEXUS')
    } finally {
      setTestando(false)
    }
  }

  const resetar = () => {
    localStorage.removeItem('nexus_api_url')
    localStorage.removeItem('nexus_api_key')
    setUrl(import.meta.env.VITE_API_URL || '')
    setKey(import.meta.env.VITE_API_KEY || '')
    toast.info('Configuracoes redefinidas')
  }

  return (
    <div className="p-5 space-y-4 animate-fade-up">

      {/* Conexao */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
      >
        <h2 className="font-grotesk font-semibold text-sm text-white">Conexao com o Servidor</h2>

        <div className="space-y-1.5">
          <label className="label-micro">URL DA API</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://192.168.1.100:5000"
            autoComplete="off"
            autoCapitalize="none"
            className="w-full rounded-xl px-4 py-3 font-grotesk text-sm text-white
              placeholder-nx-border outline-none transition-all"
            style={{
              background: '#0D0D1A',
              border: '1px solid #1e1e3a',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
            onBlur={(e)  => (e.target.style.borderColor = '#1e1e3a')}
            aria-label="URL da API"
          />
          <p className="font-grotesk text-xs text-nx-border">
            IP local em casa · Cloudflare Tunnel de fora
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="label-micro">CHAVE DE API</label>
          <div className="relative">
            <input
              type={mostrarKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••••••••••"
              autoComplete="new-password"
              className="w-full rounded-xl px-4 py-3 pr-12 font-grotesk text-sm text-white
                placeholder-nx-border outline-none transition-all"
              style={{
                background: '#0D0D1A',
                border: '1px solid #1e1e3a',
                fontFamily: mostrarKey ? undefined : 'monospace',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
              onBlur={(e)  => (e.target.style.borderColor = '#1e1e3a')}
              aria-label="API Key"
            />
            <button
              type="button"
              onClick={() => setMostrarKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-nx-muted
                active:scale-90 transition-transform"
              aria-label={mostrarKey ? 'Ocultar API Key' : 'Mostrar API Key'}
            >
              {mostrarKey ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Feedback do teste */}
      {ping && (
        <div
          className="rounded-2xl px-4 py-3 font-grotesk text-sm font-medium text-center"
          style={{
            background: ping.ok ? 'rgba(6,182,212,0.1)' : 'rgba(244,63,94,0.1)',
            border: `1px solid ${ping.ok ? 'rgba(6,182,212,0.3)' : 'rgba(244,63,94,0.3)'}`,
            color: ping.ok ? '#06B6D4' : '#F43F5E',
          }}
        >
          {ping.ok ? '✓' : '✕'} {ping.msg}
        </div>
      )}

      {/* Acoes */}
      <ActionButton
        variant="ghost"
        fullWidth
        loading={testando}
        onClick={testar}
        aria-label="Testar conexao"
      >
        Testar Conexao
      </ActionButton>

      <ActionButton
        variant="primary"
        fullWidth
        onClick={salvar}
        aria-label="Salvar configuracoes"
      >
        Salvar Configuracoes
      </ActionButton>

      <button
        onClick={resetar}
        className="w-full py-3 rounded-2xl font-grotesk text-xs text-nx-border
          active:opacity-60 transition-opacity"
        style={{ background: 'transparent' }}
        aria-label="Resetar para padrao"
      >
        Resetar para padrao
      </button>

      {/* Acesso externo */}
      <div
        className="rounded-2xl p-4 space-y-2"
        style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
      >
        <h3 className="font-grotesk font-semibold text-xs text-nx-muted flex items-center gap-2">
          ☁️ Acesso Externo via Cloudflare
        </h3>
        <p className="font-grotesk text-xs text-nx-border leading-relaxed">
          Configure o Cloudflare Tunnel e cole o dominio publico no campo URL acima.
          Consulte o README para instrucoes completas.
        </p>
      </div>

      {/* Rodape */}
      <div className="text-center space-y-1 pt-2 pb-4">
        <p className="font-grotesk font-bold tracking-widest nexus-text text-sm">NEXUS</p>
        <p className="font-grotesk text-xs text-nx-border">
          por Rodrigo Carvalho Mamede · v1.0.0
        </p>
      </div>
    </div>
  )
}
