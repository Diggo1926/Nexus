import { useState, useEffect } from 'react'
import { PowerButton } from '../components/PowerButton'
import { ActionButton } from '../components/ActionButton'
import { Modal } from '../components/Modal'
import { toast } from '../components/Toast'

function PowerBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 375 600" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="pg" cx="50%" cy="35%" r="55%">
          <stop offset="0%"   stopColor="#7C3AED" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0D0D1A" stopOpacity="0"    />
        </radialGradient>
      </defs>
      <rect width="375" height="600" fill="url(#pg)" />
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 42} y1="0" x2={i * 42} y2="600"
          stroke="#7C3AED" strokeOpacity="0.06" strokeWidth="1" />
      ))}
      {Array.from({ length: 15 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 42} x2="375" y2={i * 42}
          stroke="#7C3AED" strokeOpacity="0.06" strokeWidth="1" />
      ))}
    </svg>
  )
}

const ACOES_DESTRUTIVAS = [
  { id: 'shutdown', label: 'Desligar',  rota: '/power/shutdown', variante: 'danger',
    aviso: 'O PC sera desligado imediatamente. Salve todos os arquivos antes de continuar.' },
  { id: 'restart',  label: 'Reiniciar', rota: '/power/restart',  variante: 'danger',
    aviso: 'O PC sera reiniciado agora. Salve todos os arquivos antes de continuar.' },
]

const ACOES_SECUNDARIAS = [
  { id: 'hibernate', label: 'Hibernar',   rota: '/power/hibernate' },
  { id: 'sleep',     label: 'Modo Sleep', rota: '/power/sleep'     },
]

const LABEL_ACAO = { shutdown: 'Desligar', restart: 'Reiniciar', hibernate: 'Hibernar', sleep: 'Sleep' }

function AgendamentoItem({ s, onRemover }) {
  const label = LABEL_ACAO[s.action] || s.action
  const rep   = s.repeat === 'daily' ? 'Diário' : 'Uma vez'
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: '#12122A', border: '1px solid #1e1e3a' }}>
      <div className="flex-1 min-w-0">
        <p className="font-grotesk text-sm font-medium text-white">
          {label} às {s.time}
        </p>
        <p className="font-mono-nx text-xs" style={{ color: '#7C3AED' }}>{rep}</p>
      </div>
      <button
        onClick={() => onRemover(s.id)}
        className="shrink-0 px-3 py-1.5 rounded-xl font-grotesk text-xs font-semibold
          text-nx-danger active:scale-95 transition-transform"
        style={{ border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)' }}
        aria-label="Remover agendamento"
      >
        Remover
      </button>
    </div>
  )
}

export function Power({ online, request }) {
  const [carregando,    setCarregando]    = useState(null)
  const [modal,         setModal]         = useState(null)
  const [agendamentos,  setAgendamentos]  = useState([])
  const [modalAgendar,  setModalAgendar]  = useState(false)
  const [formAcao,      setFormAcao]      = useState('shutdown')
  const [formHorario,   setFormHorario]   = useState('22:00')
  const [formRepeat,    setFormRepeat]    = useState('once')

  const carregarAgendamentos = () => {
    request('GET', '/scheduler/list')
      .then(setAgendamentos)
      .catch(() => {})
  }

  useEffect(() => {
    carregarAgendamentos()
  }, [])

  const executar = async (rota, label) => {
    setCarregando(rota)
    try {
      const res = await request('POST', rota)
      toast.sucesso(res.mensagem || label)
    } catch (e) {
      toast.erro(e.message)
    } finally {
      setCarregando(null)
    }
  }

  const wol = async () => {
    setCarregando('wol')
    try {
      const res = await request('POST', '/wol/wake')
      toast.sucesso(res.mensagem || 'Magic packet enviado!')
    } catch (e) {
      toast.erro(e.message)
    } finally {
      setCarregando(null)
    }
  }

  const criarAgendamento = async () => {
    try {
      await request('POST', '/scheduler/create', {
        action: formAcao,
        time:   formHorario,
        repeat: formRepeat,
      })
      toast.sucesso('Agendamento criado!')
      setModalAgendar(false)
      carregarAgendamentos()
    } catch (e) {
      toast.erro(e.message)
    }
  }

  const removerAgendamento = async (id) => {
    try {
      await request('DELETE', `/scheduler/${id}`)
      toast.info('Agendamento removido')
      carregarAgendamentos()
    } catch (e) {
      toast.erro(e.message)
    }
  }

  return (
    <div className="relative min-h-[calc(100dvh-140px)] flex flex-col items-center px-5 pt-8 gap-8 overflow-hidden">
      <PowerBg />

      {/* Botao power central */}
      <div className="relative flex flex-col items-center gap-4">
        <PowerButton
          active={!!online}
          loading={carregando === 'wol'}
          onClick={online ? undefined : wol}
        />
        <div className="text-center">
          <p className="font-grotesk font-semibold tracking-widest text-sm"
            style={{ color: online ? '#06B6D4' : '#94A3B8', letterSpacing: '0.15em' }}>
            {online ? 'PC ONLINE' : 'LIGAR PC'}
          </p>
          {!online && (
            <p className="font-grotesk text-xs text-nx-border mt-1">
              Toque para enviar Wake-on-LAN
            </p>
          )}
        </div>
      </div>

      {/* Controles — so aparecem quando online */}
      {online && (
        <>
          <div className="relative w-full grid grid-cols-2 gap-3">
            {ACOES_DESTRUTIVAS.map((a) => (
              <ActionButton key={a.id} variant="danger"
                onClick={() => setModal(a)} loading={carregando === a.rota}
                aria-label={a.label}>
                {a.label}
              </ActionButton>
            ))}
          </div>

          <div className="relative w-full grid grid-cols-2 gap-3">
            {ACOES_SECUNDARIAS.map((a) => (
              <ActionButton key={a.id} variant="ghost"
                onClick={() => executar(a.rota, a.label)} loading={carregando === a.rota}
                aria-label={a.label}>
                {a.label}
              </ActionButton>
            ))}
          </div>

          <div className="relative w-full">
            <ActionButton variant="ghost" fullWidth
              onClick={() => executar('/power/cancel', 'Cancelar Desligamento')}
              loading={carregando === '/power/cancel'}
              aria-label="Cancelar Desligamento agendado">
              Cancelar Desligamento
            </ActionButton>
          </div>
        </>
      )}

      {/* Agendamentos */}
      <div className="relative w-full space-y-3">
        <div className="flex items-center justify-between">
          <span className="label-micro">AGENDAMENTOS</span>
          <button
            onClick={() => setModalAgendar(true)}
            className="font-grotesk text-xs font-semibold px-3 py-1.5 rounded-xl
              active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(90deg,#7C3AED,#06B6D4)', color: '#fff' }}
            aria-label="Novo agendamento"
          >
            + Novo
          </button>
        </div>

        {agendamentos.length === 0 ? (
          <p className="font-grotesk text-xs text-nx-border text-center py-4">
            Nenhum agendamento ativo
          </p>
        ) : (
          agendamentos.map((s) => (
            <AgendamentoItem key={s.id} s={s} onRemover={removerAgendamento} />
          ))
        )}
      </div>

      {/* Modal confirmacao de acao destrutiva */}
      <Modal
        aberto={!!modal}
        titulo={modal?.label}
        mensagem={modal?.aviso || ''}
        variante="danger"
        labelConfirmar="Confirmar"
        onCancelar={() => setModal(null)}
        onConfirmar={() => { executar(modal.rota, modal.label); setModal(null) }}
      />

      {/* Modal de novo agendamento */}
      {modalAgendar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(13,13,26,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setModalAgendar(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6 animate-fade-up space-y-4"
            style={{ background: '#12122A', border: '1px solid #1e1e3a', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-grotesk font-semibold text-base text-white">Novo Agendamento</h3>

            <div className="space-y-1.5">
              <label className="label-micro">ACAO</label>
              <select value={formAcao} onChange={(e) => setFormAcao(e.target.value)}
                className="w-full rounded-xl px-4 py-3 font-grotesk text-sm text-white outline-none"
                style={{ background: '#0D0D1A', border: '1px solid #1e1e3a' }}>
                <option value="shutdown">Desligar</option>
                <option value="restart">Reiniciar</option>
                <option value="hibernate">Hibernar</option>
                <option value="sleep">Sleep</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="label-micro">HORARIO</label>
              <input type="time" value={formHorario} onChange={(e) => setFormHorario(e.target.value)}
                className="w-full rounded-xl px-4 py-3 font-grotesk text-sm text-white outline-none"
                style={{ background: '#0D0D1A', border: '1px solid #1e1e3a' }} />
            </div>

            <div className="space-y-1.5">
              <label className="label-micro">REPETICAO</label>
              <div className="flex gap-2">
                {[{ v: 'once', l: 'Uma vez' }, { v: 'daily', l: 'Diariamente' }].map((o) => (
                  <button key={o.v} onClick={() => setFormRepeat(o.v)}
                    className="flex-1 py-2.5 rounded-xl font-grotesk text-sm transition-all"
                    style={formRepeat === o.v
                      ? { background: 'linear-gradient(90deg,#7C3AED,#06B6D4)', color: '#fff' }
                      : { background: 'transparent', color: '#94A3B8', border: '1px solid #1e1e3a' }}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalAgendar(false)}
                className="flex-1 py-3 rounded-2xl font-grotesk font-semibold text-sm text-nx-muted
                  active:opacity-70 transition-opacity"
                style={{ background: 'transparent', border: '1px solid #1e1e3a' }}>
                Cancelar
              </button>
              <button onClick={criarAgendamento}
                className="flex-1 py-3 rounded-2xl font-grotesk font-semibold text-sm text-white
                  active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(90deg,#7C3AED,#3B82F6,#06B6D4)' }}>
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
