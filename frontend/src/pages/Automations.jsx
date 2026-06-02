import { useState, useEffect } from 'react'
import { toast } from '../components/Toast'

const METRICAS  = [{ v: 'cpu', l: 'CPU' }, { v: 'ram', l: 'RAM' }, { v: 'temp', l: 'Temperatura' }]
const OPERADORES = [{ v: '>', l: 'maior que' }, { v: '<', l: 'menor que' }]
const ACOES_TIPO = [
  { v: 'notify',      l: 'Notificar'         },
  { v: 'kill_process',l: 'Encerrar processo' },
  { v: 'shutdown',    l: 'Desligar PC'       },
]

function DescricaoLegivel({ auto }) {
  const trig   = auto.trigger  || {}
  const action = auto.action   || {}
  const mLabel = METRICAS.find((m) => m.v === trig.metric)?.l || trig.metric || '?'
  const opLabel = trig.operator === '>' ? '>' : '<'
  const acLabel = ACOES_TIPO.find((a) => a.v === action.type)?.l || action.type || '?'
  const alvo    = action.target ? ` ${action.target}` : ''
  return (
    <p className="font-grotesk text-sm font-medium text-white">
      Se {mLabel} {opLabel} {trig.value}% → {acLabel}{alvo}
    </p>
  )
}

export function Automations({ request }) {
  const [autos,    setAutos]    = useState([])
  const [modal,    setModal]    = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [form, setForm] = useState({
    metric: 'cpu', operator: '>', value: '90',
    actionType: 'notify', target: '', cooldown: '5',
  })

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const carregar = () => {
    request('GET', '/automations/list')
      .then(setAutos)
      .catch(() => {})
  }

  useEffect(() => { carregar() }, [])

  const criar = async () => {
    setLoading(true)
    try {
      await request('POST', '/automations/create', {
        trigger:          { metric: form.metric, operator: form.operator, value: Number(form.value) },
        action:           { type: form.actionType, target: form.target },
        cooldown_minutes: Number(form.cooldown),
      })
      toast.sucesso('Automacao criada!')
      setModal(false)
      carregar()
    } catch (e) {
      toast.erro(e.message)
    } finally {
      setLoading(false)
    }
  }

  const remover = async (id) => {
    try {
      await request('DELETE', `/automations/${id}`)
      toast.info('Automacao removida')
      carregar()
    } catch (e) {
      toast.erro(e.message)
    }
  }

  const cardStyle = { background: '#12122A', border: '1px solid #1e1e3a' }
  const inputStyle = { background: '#0D0D1A', border: '1px solid #1e1e3a' }
  const selectCls  = 'w-full rounded-xl px-4 py-3 font-grotesk text-sm text-white outline-none'

  return (
    <div className="p-5 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="font-grotesk font-semibold text-sm text-white">Automacoes</h2>
        <button onClick={() => setModal(true)}
          className="font-grotesk text-xs font-semibold px-3 py-1.5 rounded-xl
            active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(90deg,#7C3AED,#06B6D4)', color: '#fff' }}>
          + Nova
        </button>
      </div>

      {autos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 rounded-2xl" style={cardStyle}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
            <defs>
              <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="url(#ag)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="font-grotesk text-sm text-nx-muted">Nenhuma automacao configurada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {autos.map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3 rounded-2xl" style={cardStyle}>
              <div className="flex-1 min-w-0">
                <DescricaoLegivel auto={a} />
                <p className="font-mono-nx text-xs" style={{ color: '#7C3AED' }}>
                  Cooldown: {a.cooldown_minutes} min
                </p>
              </div>
              <button onClick={() => remover(a.id)}
                className="shrink-0 px-3 py-1.5 rounded-xl font-grotesk text-xs text-nx-danger
                  active:scale-95 transition-transform"
                style={{ border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(13,13,26,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setModal(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4 animate-fade-up"
            style={{ background: '#12122A', border: '1px solid #1e1e3a', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-grotesk font-semibold text-base text-white">Nova Automacao</h3>

            <p className="label-micro">GATILHO</p>
            <div className="grid grid-cols-3 gap-2">
              <select value={form.metric} onChange={set('metric')} className={selectCls} style={inputStyle}>
                {METRICAS.map((m)  => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
              <select value={form.operator} onChange={set('operator')} className={selectCls} style={inputStyle}>
                {OPERADORES.map((o) => <option key={o.v} value={o.v}>{o.v}</option>)}
              </select>
              <input type="number" value={form.value} onChange={set('value')}
                min="0" max="100" placeholder="90"
                className={selectCls} style={inputStyle} />
            </div>

            <p className="label-micro">ACAO</p>
            <select value={form.actionType} onChange={set('actionType')} className={selectCls} style={inputStyle}>
              {ACOES_TIPO.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
            </select>

            {form.actionType === 'kill_process' && (
              <input type="text" value={form.target} onChange={set('target')}
                placeholder="chrome.exe" className={selectCls} style={inputStyle} />
            )}

            <div className="space-y-1">
              <label className="label-micro">COOLDOWN (minutos)</label>
              <input type="number" value={form.cooldown} onChange={set('cooldown')}
                min="1" className={selectCls} style={inputStyle} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(false)}
                className="flex-1 py-3 rounded-2xl font-grotesk font-semibold text-sm text-nx-muted
                  active:opacity-70"
                style={{ background: 'transparent', border: '1px solid #1e1e3a' }}>
                Cancelar
              </button>
              <button onClick={criar} disabled={loading}
                className="flex-1 py-3 rounded-2xl font-grotesk font-semibold text-sm text-white
                  active:scale-95 transition-transform disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg,#7C3AED,#3B82F6,#06B6D4)' }}>
                {loading ? '...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
