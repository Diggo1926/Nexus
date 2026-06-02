import { useState, useEffect } from 'react'
import { ActionButton } from '../components/ActionButton'
import { toast } from '../components/Toast'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { usePcContext } from '../context/PcContext'

function Toggle({ ativo, onChange, disabled }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      disabled={disabled}
      aria-checked={ativo}
      role="switch"
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: ativo ? '#7C3AED' : '#1e1e3a' }}
    >
      <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
        style={{ transform: ativo ? 'translateX(24px)' : 'translateX(4px)' }} />
    </button>
  )
}

function ModalAdicionarPc({ onSalvar, onFechar }) {
  const [form, setForm] = useState({ nome: '', url: '', apiKey: '', mac: '', broadcast: '255.255.255.255' })
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const campos = [
    { k: 'nome',      l: 'NOME DO PC',    p: 'PC Casa',              t: 'text' },
    { k: 'url',       l: 'URL DA API',    p: 'http://...',           t: 'url'  },
    { k: 'apiKey',    l: 'API KEY',       p: '••••••••',             t: 'password' },
    { k: 'mac',       l: 'MAC ADDRESS',   p: 'AA:BB:CC:DD:EE:FF',    t: 'text' },
    { k: 'broadcast', l: 'BROADCAST IP',  p: '255.255.255.255',      t: 'text' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(13,13,26,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onFechar}>
      <div className="w-full max-w-sm rounded-3xl p-6 space-y-4 animate-fade-up"
        style={{ background: '#12122A', border: '1px solid #1e1e3a', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="font-grotesk font-semibold text-base text-white">Adicionar PC</h3>
        {campos.map(({ k, l, p, t }) => (
          <div key={k} className="space-y-1">
            <label className="label-micro">{l}</label>
            <input type={t} value={form[k]} onChange={set(k)} placeholder={p}
              autoComplete="off"
              className="w-full rounded-xl px-4 py-3 font-grotesk text-sm text-white outline-none"
              style={{ background: '#0D0D1A', border: '1px solid #1e1e3a' }} />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button onClick={onFechar}
            className="flex-1 py-3 rounded-2xl font-grotesk font-semibold text-sm text-nx-muted
              active:opacity-70"
            style={{ background: 'transparent', border: '1px solid #1e1e3a' }}>
            Cancelar
          </button>
          <button onClick={() => { if (form.nome && form.url) onSalvar(form) }}
            className="flex-1 py-3 rounded-2xl font-grotesk font-semibold text-sm text-white
              active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(90deg,#7C3AED,#3B82F6,#06B6D4)' }}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export function Settings({ onSave }) {
  const [url,        setUrl]        = useState('')
  const [key,        setKey]        = useState('')
  const [mostrarKey, setMostrarKey] = useState(false)
  const [testando,   setTestando]   = useState(false)
  const [ping,       setPing]       = useState(null)
  const [addPcModal, setAddPcModal] = useState(false)

  const push   = usePushNotifications()
  const pcCtx  = usePcContext()

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
    try {
      const t0 = Date.now()
      const r  = await fetch('/api/health', { signal: AbortSignal.timeout(5000) })
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

  const ativarNotif = async () => {
    const { ok, msg } = await push.solicitar()
    if (ok) toast.sucesso(msg)
    else    toast.erro(msg)
  }

  const testarNotif = async () => {
    const ok = await push.testar()
    if (ok) toast.sucesso('Notificacao de teste enviada!')
    else    toast.erro('Falha ao enviar notificacao de teste')
  }

  const adicionarPc = (form) => {
    pcCtx.addPc(form)
    setAddPcModal(false)
    toast.sucesso(`PC "${form.nome}" adicionado!`)
  }

  const inputStyle = { background: '#0D0D1A', border: '1px solid #1e1e3a' }
  const cardStyle  = { background: '#12122A', border: '1px solid #1e1e3a' }

  return (
    <div className="p-5 space-y-4 animate-fade-up">

      {/* Conexao */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <h2 className="font-grotesk font-semibold text-sm text-white">Conexao com o Servidor</h2>

        <div className="space-y-1.5">
          <label className="label-micro">URL DA API (informativo)</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="http://192.168.1.100:5000" autoComplete="off" autoCapitalize="none"
            className="w-full rounded-xl px-4 py-3 font-grotesk text-sm text-white
              placeholder-nx-border outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
            onBlur={(e)  => (e.target.style.borderColor = '#1e1e3a')}
            aria-label="URL da API" />
          <p className="font-grotesk text-xs text-nx-border">
            Apenas informativo — o proxy Vercel gerencia a conexao automaticamente
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="label-micro">CHAVE DE API</label>
          <div className="relative">
            <input type={mostrarKey ? 'text' : 'password'} value={key}
              onChange={(e) => setKey(e.target.value)} placeholder="••••••••••••••••"
              autoComplete="new-password"
              className="w-full rounded-xl px-4 py-3 pr-12 font-grotesk text-sm text-white
                placeholder-nx-border outline-none transition-all"
              style={{ ...inputStyle, fontFamily: mostrarKey ? undefined : 'monospace' }}
              onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
              onBlur={(e)  => (e.target.style.borderColor = '#1e1e3a')}
              aria-label="API Key" />
            <button type="button" onClick={() => setMostrarKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-nx-muted
                active:scale-90 transition-transform"
              aria-label={mostrarKey ? 'Ocultar API Key' : 'Mostrar API Key'}>
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

      {ping && (
        <div className="rounded-2xl px-4 py-3 font-grotesk text-sm font-medium text-center"
          style={{
            background: ping.ok ? 'rgba(6,182,212,0.1)' : 'rgba(244,63,94,0.1)',
            border: `1px solid ${ping.ok ? 'rgba(6,182,212,0.3)' : 'rgba(244,63,94,0.3)'}`,
            color: ping.ok ? '#06B6D4' : '#F43F5E',
          }}>
          {ping.ok ? '✓' : '✕'} {ping.msg}
        </div>
      )}

      <ActionButton variant="ghost" fullWidth loading={testando} onClick={testar} aria-label="Testar conexao">
        Testar Conexao
      </ActionButton>

      <ActionButton variant="primary" fullWidth onClick={salvar} aria-label="Salvar configuracoes">
        Salvar Configuracoes
      </ActionButton>

      <button onClick={resetar}
        className="w-full py-3 rounded-2xl font-grotesk text-xs text-nx-border active:opacity-60 transition-opacity"
        style={{ background: 'transparent' }}>
        Resetar para padrao
      </button>

      {/* Notificacoes */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <h2 className="font-grotesk font-semibold text-sm text-white">Notificacoes</h2>

        {!push.suportado ? (
          <p className="font-grotesk text-xs text-nx-border">
            Notificacoes push nao sao suportadas neste navegador.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-grotesk text-sm text-white">Ativar notificacoes</p>
                <p className="font-grotesk text-xs text-nx-border">
                  {push.permissao === 'granted' ? 'Permissao concedida' :
                   push.permissao === 'denied'  ? 'Permissao negada no navegador' :
                   'Clique para solicitar permissao'}
                </p>
              </div>
              <Toggle ativo={push.inscrito || push.permissao === 'granted'}
                onChange={ativarNotif} disabled={push.carregando || push.permissao === 'denied'} />
            </div>

            {(push.inscrito || push.permissao === 'granted') && (
              <button onClick={testarNotif}
                className="w-full py-2.5 rounded-xl font-grotesk text-xs font-semibold text-nx-muted
                  active:opacity-70 transition-opacity"
                style={{ background: 'transparent', border: '1px solid #1e1e3a' }}>
                Testar notificacao
              </button>
            )}
          </>
        )}
      </div>

      {/* Meus PCs */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <div className="flex items-center justify-between">
          <h2 className="font-grotesk font-semibold text-sm text-white">Meus PCs</h2>
          <button onClick={() => setAddPcModal(true)}
            className="font-grotesk text-xs font-semibold px-3 py-1.5 rounded-xl
              active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(90deg,#7C3AED,#06B6D4)', color: '#fff' }}
            aria-label="Adicionar PC">
            + Adicionar
          </button>
        </div>

        {pcCtx?.pcs.length === 0 ? (
          <p className="font-grotesk text-xs text-nx-border">Nenhum PC configurado</p>
        ) : (
          <div className="space-y-2">
            {pcCtx.pcs.map((pc) => (
              <div key={pc.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: pcCtx.activeId === pc.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${pcCtx.activeId === pc.id ? 'rgba(124,58,237,0.4)' : '#1e1e3a'}`,
                }}>
                <div className="flex-1 min-w-0">
                  <p className="font-grotesk text-sm font-medium text-white">{pc.nome}</p>
                  <p className="font-mono-nx text-xs text-nx-border truncate">{pc.url}</p>
                </div>
                <div className="flex gap-2">
                  {pcCtx.activeId !== pc.id && (
                    <button onClick={() => pcCtx.selectPc(pc.id)}
                      className="px-2.5 py-1 rounded-lg font-grotesk text-xs font-semibold
                        text-white active:scale-95 transition-transform"
                      style={{ background: 'linear-gradient(90deg,#7C3AED,#06B6D4)' }}>
                      Usar
                    </button>
                  )}
                  <button onClick={() => pcCtx.removePc(pc.id)}
                    className="px-2.5 py-1 rounded-lg font-grotesk text-xs text-nx-danger
                      active:scale-95 transition-transform"
                    style={{ border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)' }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acesso externo */}
      <div className="rounded-2xl p-4 space-y-2" style={cardStyle}>
        <h3 className="font-grotesk font-semibold text-xs text-nx-muted flex items-center gap-2">
          ☁️ Acesso Externo via Cloudflare
        </h3>
        <p className="font-grotesk text-xs text-nx-border leading-relaxed">
          Configure o Cloudflare Tunnel e cole o dominio publico no campo URL acima.
          Consulte o README para instrucoes completas.
        </p>
      </div>

      <div className="text-center space-y-1 pt-2 pb-4">
        <p className="font-grotesk font-bold tracking-widest nexus-text text-sm">NEXUS</p>
        <p className="font-grotesk text-xs text-nx-border">
          por Rodrigo Carvalho Mamede · v1.0.0
        </p>
      </div>

      {addPcModal && (
        <ModalAdicionarPc onSalvar={adicionarPc} onFechar={() => setAddPcModal(false)} />
      )}
    </div>
  )
}
