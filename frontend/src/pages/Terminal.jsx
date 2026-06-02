import { useState, useRef, useEffect } from 'react'
import { toast } from '../components/Toast'

const CMDS_RAPIDOS = ['ipconfig', 'tasklist', 'systeminfo', 'dir', 'whoami', 'hostname', 'netstat -n']

export function Terminal({ request }) {
  const [output,    setOutput]    = useState([{ tipo: 'info', texto: 'NEXUS Terminal — comandos permitidos pela whitelist do servidor' }])
  const [cmd,       setCmd]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const [historico, setHistorico] = useState([])
  const [histIdx,   setHistIdx]   = useState(-1)
  const outputRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const executar = async (comando) => {
    const c = (comando || cmd).trim()
    if (!c) return
    setLoading(true)
    setHistorico((h) => [c, ...h.filter((x) => x !== c)].slice(0, 50))
    setHistIdx(-1)
    setOutput((p) => [...p, { tipo: 'cmd', texto: `> ${c}` }])
    setCmd('')
    try {
      const res = await request('POST', '/terminal/exec', { command: c })
      if (res.output) setOutput((p) => [...p, { tipo: 'out', texto: res.output }])
      if (res.error)  setOutput((p) => [...p, { tipo: 'err', texto: res.error  }])
    } catch (e) {
      setOutput((p) => [...p, { tipo: 'err', texto: e.message }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      executar()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(histIdx + 1, historico.length - 1)
      setHistIdx(idx)
      setCmd(historico[idx] || '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(histIdx - 1, -1)
      setHistIdx(idx)
      setCmd(idx === -1 ? '' : historico[idx])
    }
  }

  const limpar = () => setOutput([{ tipo: 'info', texto: 'Terminal limpo.' }])

  return (
    <div className="p-4 space-y-3 animate-fade-up h-[calc(100dvh-140px)] flex flex-col">
      {/* Barra de comandos rapidos */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CMDS_RAPIDOS.map((c) => (
          <button key={c}
            onClick={() => executar(c)}
            disabled={loading}
            className="shrink-0 px-3 py-1.5 rounded-lg font-mono-nx text-xs text-nx-muted
              active:scale-95 transition-transform disabled:opacity-50"
            style={{ background: '#12122A', border: '1px solid #1e1e3a', whiteSpace: 'nowrap' }}
            aria-label={`Executar ${c}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Area de output */}
      <div ref={outputRef}
        className="flex-1 rounded-2xl p-4 overflow-y-auto font-mono-nx text-xs leading-5"
        style={{ background: '#050510', border: '1px solid #1e1e3a', minHeight: 0 }}>
        {output.map((linha, i) => (
          <pre key={i}
            style={{
              color: linha.tipo === 'cmd'  ? '#7C3AED' :
                     linha.tipo === 'err'  ? '#F43F5E' :
                     linha.tipo === 'info' ? '#06B6D4' : '#C4C4E0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}>
            {linha.texto}
          </pre>
        ))}
        {loading && (
          <span className="inline-block w-2 h-4 bg-nx-violet animate-pulse" />
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3"
          style={{ background: '#050510', border: '1px solid #1e1e3a' }}>
          <span className="font-mono-nx text-xs" style={{ color: '#7C3AED' }}>{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
            placeholder="Digite um comando..."
            className="flex-1 bg-transparent font-mono-nx text-xs text-white outline-none
              placeholder-nx-border disabled:opacity-50"
            aria-label="Comando"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <button onClick={() => executar()} disabled={loading || !cmd.trim()}
          className="px-4 rounded-2xl font-grotesk text-sm font-semibold text-white
            active:scale-95 transition-transform disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg,#7C3AED,#06B6D4)' }}
          aria-label="Executar">
          ↵
        </button>
        <button onClick={limpar}
          className="px-4 rounded-2xl font-grotesk text-xs text-nx-muted
            active:opacity-70 transition-opacity"
          style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
          aria-label="Limpar terminal">
          CLR
        </button>
      </div>
    </div>
  )
}
