import { useState } from 'react'
import { PowerButton } from '../components/PowerButton'
import { ActionButton } from '../components/ActionButton'
import { Modal } from '../components/Modal'
import { toast } from '../components/Toast'

// Background SVG geometrico para a pagina Power
function PowerBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 375 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="pg" cx="50%" cy="35%" r="55%">
          <stop offset="0%"   stopColor="#7C3AED" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0D0D1A" stopOpacity="0"    />
        </radialGradient>
      </defs>
      <rect width="375" height="600" fill="url(#pg)" />
      {/* Grade de linhas sutis */}
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

export function Power({ online, request }) {
  const [carregando, setCarregando] = useState(null)
  const [modal,      setModal]      = useState(null)

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
      toast.sucesso(res.mensagem)
    } catch (e) {
      toast.erro(e.message)
    } finally {
      setCarregando(null)
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
          <p
            className="font-grotesk font-semibold tracking-widest text-sm"
            style={{
              color: online ? '#06B6D4' : '#94A3B8',
              letterSpacing: '0.15em',
            }}
          >
            {online ? 'PC ONLINE' : 'LIGAR PC'}
          </p>
          {!online && (
            <p className="font-grotesk text-xs text-nx-border mt-1">
              Toque para enviar Wake-on-LAN
            </p>
          )}
        </div>
      </div>

      {/* Botoes destrutivos — grid 2x1 */}
      <div className="relative w-full grid grid-cols-2 gap-3">
        {ACOES_DESTRUTIVAS.map((a) => (
          <ActionButton
            key={a.id}
            variant="danger"
            onClick={() => setModal(a)}
            loading={carregando === a.rota}
            aria-label={a.label}
          >
            {a.label}
          </ActionButton>
        ))}
      </div>

      {/* Hibernar e Modo Sleep */}
      <div className="relative w-full grid grid-cols-2 gap-3">
        {ACOES_SECUNDARIAS.map((a) => (
          <ActionButton
            key={a.id}
            variant="ghost"
            onClick={() => executar(a.rota, a.label)}
            loading={carregando === a.rota}
            aria-label={a.label}
          >
            {a.label}
          </ActionButton>
        ))}
      </div>

      {/* Cancelar Desligamento — largura total */}
      <div className="relative w-full">
        <ActionButton
          variant="ghost"
          fullWidth
          onClick={() => executar('/power/cancel', 'Cancelar Desligamento')}
          loading={carregando === '/power/cancel'}
          aria-label="Cancelar Desligamento agendado"
        >
          Cancelar Desligamento
        </ActionButton>
      </div>

      {/* Modal de confirmacao */}
      <Modal
        aberto={!!modal}
        titulo={modal?.label}
        mensagem={modal?.aviso || ''}
        variante="danger"
        labelConfirmar="Confirmar"
        onCancelar={() => setModal(null)}
        onConfirmar={() => {
          executar(modal.rota, modal.label)
          setModal(null)
        }}
      />
    </div>
  )
}
