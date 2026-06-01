import { useState, useEffect, useCallback } from 'react'
import { ActionButton } from '../components/ActionButton'
import { Modal } from '../components/Modal'
import { toast } from '../components/Toast'

// Mapa de icones por nome de app
const ICONES = {
  chrome: '🌐', spotify: '🎵', notepad: '📝', vscode: '💻',
  explorer: '📁', discord: '💬', steam: '🎮', firefox: '🦊',
  edge: '🌀', calc: '🧮', paint: '🎨', vlc: '📺', obs: '🎬',
  terminal: '⬛',
}

// Empty states
function EmptyApps() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 animate-fade-up">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="ea" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="52" height="52" rx="8" stroke="url(#ea)" strokeWidth="2" />
        <line x1="32" y1="20" x2="32" y2="44" stroke="url(#ea)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="20" y1="32" x2="44" y2="32" stroke="url(#ea)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="font-grotesk text-sm text-nx-muted">Nenhum app configurado ainda</p>
      <p className="font-grotesk text-xs text-nx-border">Edite ALLOWED_APPS no .env do servidor</p>
    </div>
  )
}

function EmptyProcesses() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 animate-fade-up">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="ep" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect x="8" y="10" width="48" height="32" rx="3" stroke="url(#ep)" strokeWidth="2" />
        <line x1="22" y1="50" x2="42" y2="50" stroke="url(#ep)" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="42" x2="32" y2="50" stroke="url(#ep)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="26" r="6" stroke="url(#ep)" strokeWidth="2" />
      </svg>
      <p className="font-grotesk text-sm text-nx-muted">Nenhum processo ativo</p>
    </div>
  )
}

export function Apps({ request }) {
  const [aba,        setAba]        = useState('apps')
  const [apps,       setApps]       = useState([])
  const [processos,  setProcessos]  = useState([])
  const [abrindo,    setAbrindo]    = useState(null)
  const [atualizando, setAtualizando] = useState(false)
  const [alvo,       setAlvo]       = useState(null)

  // Carrega lista de apps na montagem
  useEffect(() => {
    request('GET', '/app/list')
      .then((r) => setApps(r.apps))
      .catch(() => toast.erro('Falha ao carregar apps'))
  }, [])

  const carregarProcessos = useCallback(async () => {
    setAtualizando(true)
    try {
      const r = await request('GET', '/app/running')
      setProcessos(r.processos)
    } catch (e) {
      toast.erro(e.message)
    } finally {
      setAtualizando(false)
    }
  }, [request])

  useEffect(() => {
    if (aba === 'processos') carregarProcessos()
  }, [aba])

  const abrirApp = async (nome) => {
    setAbrindo(nome)
    try {
      const r = await request('POST', '/app/open', { app: nome })
      toast.sucesso(r.mensagem)
    } catch (e) {
      toast.erro(e.message)
    } finally {
      setAbrindo(null)
    }
  }

  const encerrar = async () => {
    if (!alvo) return
    try {
      const r = await request('POST', '/app/kill', { pid: alvo.pid })
      toast.sucesso(r.mensagem)
      setAlvo(null)
      carregarProcessos()
    } catch (e) {
      toast.erro(e.message)
      setAlvo(null)
    }
  }

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      {/* Seletor de secao */}
      <div
        className="flex p-1 gap-1 rounded-2xl"
        style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
      >
        {[
          { id: 'apps',      label: 'Apps'      },
          { id: 'processos', label: 'Processos' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className="flex-1 py-2.5 rounded-xl font-grotesk font-semibold text-sm transition-all"
            style={
              aba === t.id
                ? { background: 'linear-gradient(90deg, #7C3AED, #3B82F6, #06B6D4)', color: '#fff' }
                : { background: 'transparent', color: '#94A3B8' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista de apps */}
      {aba === 'apps' && (
        <div className="space-y-2">
          {apps.length === 0
            ? <EmptyApps />
            : apps.map((nome) => (
                <div
                  key={nome}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
                >
                  <span className="text-2xl w-9 text-center">{ICONES[nome] || '💻'}</span>
                  <span className="flex-1 font-grotesk font-medium capitalize">{nome}</span>
                  <ActionButton
                    variant="primary"
                    loading={abrindo === nome}
                    onClick={() => abrirApp(nome)}
                    aria-label={`Abrir ${nome}`}
                    className="!py-2 !px-4 !text-xs"
                  >
                    Abrir
                  </ActionButton>
                </div>
              ))}
        </div>
      )}

      {/* Lista de processos */}
      {aba === 'processos' && (
        <div className="space-y-2">
          <button
            onClick={carregarProcessos}
            disabled={atualizando}
            className="w-full py-3 rounded-2xl font-grotesk text-sm text-nx-muted
              flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
            aria-label="Atualizar lista de processos"
          >
            {atualizando
              ? <span className="inline-block w-4 h-4 border-2 border-nx-violet border-t-transparent rounded-full animate-spin-nx" />
              : '↻'}
            Atualizar
          </button>

          {processos.length === 0 && !atualizando
            ? <EmptyProcesses />
            : processos.map((p) => (
                <div
                  key={p.pid}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-grotesk text-sm font-medium text-white truncate">{p.nome}</p>
                    <p className="font-mono-nx text-xs" style={{ color: '#06B6D4' }}>
                      PID {p.pid} · {p.cpu}% CPU · {p.ram_mb} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setAlvo(p)}
                    className="shrink-0 px-3 py-1.5 rounded-xl font-grotesk text-xs font-semibold
                      text-nx-danger active:scale-95 transition-transform"
                    style={{ border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)' }}
                    aria-label={`Encerrar ${p.nome}`}
                  >
                    Encerrar
                  </button>
                </div>
              ))}
        </div>
      )}

      <Modal
        aberto={!!alvo}
        titulo="Encerrar Processo"
        mensagem={`Deseja encerrar "${alvo?.nome}" (PID ${alvo?.pid})?`}
        variante="danger"
        labelConfirmar="Encerrar"
        onCancelar={() => setAlvo(null)}
        onConfirmar={encerrar}
      />
    </div>
  )
}
