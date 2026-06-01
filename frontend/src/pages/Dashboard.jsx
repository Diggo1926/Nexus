import { useEffect, useRef, useState } from 'react'
import { StatCard } from '../components/StatCard'

// Formata bytes/s em B/s, KB/s ou MB/s
function fmt(bps) {
  const n = Number(bps) || 0
  if (n < 1024)    return `${Math.round(n)} B/s`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB/s`
  return `${(n / 1048576).toFixed(1)} MB/s`
}

// Formata numero com fallback seguro
function num(v, fallback = '—') {
  return v != null && !isNaN(v) ? v : fallback
}

// Contador de uptime que sincroniza com o servidor e incrementa localmente
function useUptimeCounter(totalSegundos) {
  const [display, setDisplay] = useState(0)
  const baseRef = useRef(null)
  const tsRef   = useRef(null)

  useEffect(() => {
    if (totalSegundos == null || totalSegundos === 0) return
    baseRef.current = Number(totalSegundos)
    tsRef.current   = Date.now()
    setDisplay(Number(totalSegundos))
  }, [totalSegundos])

  useEffect(() => {
    const t = setInterval(() => {
      if (baseRef.current != null && tsRef.current != null) {
        setDisplay(baseRef.current + Math.floor((Date.now() - tsRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const h = Math.floor(display / 3600)
  const m = Math.floor((display % 3600) / 60)
  const s = display % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Empty state quando offline
function EmptyOffline() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 animate-fade-up">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <defs>
          <linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#7C3AED" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect x="8"  y="12" width="56" height="36" rx="4" stroke="url(#eg)" strokeWidth="2" />
        <line x1="22" y1="56" x2="50" y2="56" stroke="url(#eg)" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="48" x2="36" y2="56" stroke="url(#eg)" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="24" x2="48" y2="42" stroke="url(#eg)" strokeWidth="2" strokeLinecap="round" />
        <line x1="48" y1="24" x2="24" y2="42" stroke="url(#eg)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="font-grotesk font-medium text-nx-muted text-sm">Servidor NEXUS indisponivel</p>
      <p className="font-grotesk text-xs text-nx-border">Verifique a conexao nas configuracoes</p>
    </div>
  )
}

// Skeleton enquanto carrega
function Skeleton() {
  return (
    <div className="p-4 grid grid-cols-2 gap-3 animate-fade-up">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl h-28 animate-pulse"
          style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
        />
      ))}
    </div>
  )
}

export function Dashboard({ stats, online }) {
  const uptime = useUptimeCounter(stats?.uptime?.total_segundos)

  if (online === false) return <EmptyOffline />
  if (!stats)           return <Skeleton />

  // Desestrutura com fallback para objeto vazio (null-safety total)
  const cpu   = stats.cpu   || {}
  const ram   = stats.ram   || {}
  const gpu   = stats.gpu   || null
  const disco = stats.disco || []
  const rede  = stats.rede  || {}

  // Sub-texto do CPU
  const cpuSub = [
    cpu.frequencia_mhz != null && `${cpu.frequencia_mhz} MHz`,
    cpu.nucleos        != null && `${cpu.nucleos}C`,
    cpu.temperatura    != null && `${cpu.temperatura}°C`,
  ].filter(Boolean).join(' · ') || null

  // Sub-texto da GPU
  const gpuSub = gpu ? [
    (gpu.vram_usada_mb != null && gpu.vram_total_mb != null) &&
      `VRAM ${gpu.vram_usada_mb}/${gpu.vram_total_mb} MB`,
    gpu.temperatura != null && `${gpu.temperatura}°C`,
  ].filter(Boolean).join(' · ') : null

  // Label do disco principal
  const discoLabel = disco[0]
    ? `DISCO ${(disco[0].dispositivo || disco[0].ponto || 'C').replace(/\\\\.\\|:/g, '').toUpperCase()}`
    : 'DISCO'

  return (
    <div className="p-4 space-y-3 animate-fade-up">
      {/* Grid 2 colunas */}
      <div className="grid grid-cols-2 gap-3">

        {/* CPU */}
        <StatCard
          label="CPU"
          value={num(cpu.percentual, '0')}
          unit="%"
          percentual={Number(cpu.percentual) || 0}
          sub={cpuSub}
        />

        {/* RAM */}
        <StatCard
          label="RAM"
          value={num(ram.percentual, '0')}
          unit="%"
          percentual={Number(ram.percentual) || 0}
          sub={
            (ram.usado_gb != null && ram.total_gb != null)
              ? `${ram.usado_gb} / ${ram.total_gb} GB`
              : null
          }
        />

        {/* GPU */}
        {gpu ? (
          <StatCard
            label={`GPU · ${(gpu.nome || 'GPU').split(' ').slice(0, 3).join(' ')}`}
            value={num(gpu.carga, '0')}
            unit="%"
            percentual={Number(gpu.carga) || 0}
            sub={gpuSub}
          />
        ) : (
          <div
            className="rounded-2xl p-4 flex items-center justify-center"
            style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
          >
            <p className="label-micro text-center">GPU N/A</p>
          </div>
        )}

        {/* Disco principal */}
        {disco[0] ? (
          <StatCard
            label={discoLabel}
            value={num(disco[0].percentual, '0')}
            unit="%"
            percentual={Number(disco[0].percentual) || 0}
            sub={disco[0].livre_gb != null ? `${disco[0].livre_gb} GB livres` : null}
          />
        ) : (
          <div
            className="rounded-2xl p-4 flex items-center justify-center"
            style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
          >
            <p className="label-micro text-center">DISCO N/A</p>
          </div>
        )}

        {/* Rede */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3 col-span-2"
          style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
        >
          <span className="label-micro">REDE</span>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="label-micro mb-1">↓ DOWNLOAD</p>
              <p className="font-mono-nx font-medium text-base" style={{ color: '#06B6D4' }}>
                {fmt(rede.download_bps)}
              </p>
            </div>
            <div>
              <p className="label-micro mb-1">↑ UPLOAD</p>
              <p className="font-mono-nx font-medium text-base text-white">
                {fmt(rede.upload_bps)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Uptime — largura total */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
      >
        <span className="label-micro">UPTIME</span>
        <span
          className="font-mono-nx font-medium"
          style={{ fontSize: 22, color: '#fff', letterSpacing: '0.05em' }}
        >
          {uptime}
        </span>
      </div>
    </div>
  )
}
