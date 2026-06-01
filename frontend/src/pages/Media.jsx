import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from '../components/Toast'

// SVG inline de nota musical no topo
function MusicIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M18 36V13l24-4v23" stroke="url(#mg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="36" r="6" stroke="url(#mg)" strokeWidth="2.5" />
      <circle cx="36" cy="32" r="6" stroke="url(#mg)" strokeWidth="2.5" />
    </svg>
  )
}

// Botao de controle de midia — estilo Play/Pause maior, outros menores
function MediaBtn({ icon, onClick, disabled, big = false, 'aria-label': al }) {
  const size = big ? 72 : 56
  const style = big
    ? {
        width: size, height: size,
        background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
        boxShadow: '0 0 28px rgba(124,58,237,0.45)',
        borderRadius: '50%',
      }
    : {
        width: size, height: size,
        background: '#12122A',
        border: '1px solid #1e1e3a',
        borderRadius: '50%',
      }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={al}
      className="flex items-center justify-center active:scale-90 disabled:opacity-40 transition-transform"
      style={{ ...style, padding: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {icon}
    </button>
  )
}

// Icones SVG dos controles
const Prev = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
    stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="19 20 9 12 19 4 19 20" fill="#94A3B8" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
)

const PlayPause = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="none"
    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" fill="white" />
  </svg>
)

const Next = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
    stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" fill="#94A3B8" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
)

const Stop = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#94A3B8" />
  </svg>
)

const VolOn = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
    stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#94A3B8" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
)

const VolOff = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
    stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#F43F5E" />
    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
  </svg>
)

export function Media({ request }) {
  const [volume,    setVolume]    = useState(50)
  const [muted,     setMuted]     = useState(false)
  const [carregando, setCarregando] = useState(null)
  const debounce = useRef(null)

  useEffect(() => {
    request('GET', '/media/volume')
      .then((r) => { setVolume(r.volume); setMuted(r.muted) })
      .catch(() => {})
  }, [])

  const enviarVolume = useCallback((nivel) => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      request('POST', '/media/volume', { level: nivel }).catch((e) => toast.erro(e.message))
    }, 220)
  }, [request])

  const handleSlider = (e) => {
    const v = parseInt(e.target.value)
    setVolume(v)
    enviarVolume(v)
  }

  const toggleMute = async () => {
    try {
      const r = await request('POST', '/media/mute')
      setMuted(r.muted)
    } catch (e) {
      toast.erro(e.message)
    }
  }

  const ctrl = async (rota, label) => {
    setCarregando(rota)
    try {
      await request('POST', rota)
      toast.info(label)
    } catch (e) {
      toast.erro(e.message)
    } finally {
      setCarregando(null)
    }
  }

  return (
    <div className="p-5 space-y-8 flex flex-col items-center animate-fade-up">
      {/* Icone de musica */}
      <MusicIcon />

      {/* Controles principais */}
      <div className="flex items-center justify-center gap-5">
        <MediaBtn
          icon={<Prev />}
          onClick={() => ctrl('/media/prev', 'Faixa anterior')}
          disabled={!!carregando}
          aria-label="Faixa anterior"
        />
        <MediaBtn
          icon={<PlayPause />}
          onClick={() => ctrl('/media/play-pause', 'Play/Pause')}
          disabled={!!carregando}
          big
          aria-label="Play/Pause"
        />
        <MediaBtn
          icon={<Next />}
          onClick={() => ctrl('/media/next', 'Proxima faixa')}
          disabled={!!carregando}
          aria-label="Proxima faixa"
        />
      </div>

      {/* Stop */}
      <MediaBtn
        icon={<Stop />}
        onClick={() => ctrl('/media/stop', 'Parado')}
        disabled={!!carregando}
        aria-label="Stop"
      />

      {/* Volume */}
      <div
        className="w-full rounded-2xl p-5 space-y-4"
        style={{ background: '#12122A', border: '1px solid #1e1e3a' }}
      >
        <div className="flex items-center justify-between">
          <span className="label-micro">VOLUME</span>
          <div className="flex items-center gap-3">
            <span className="font-mono-nx font-medium text-white">{volume}%</span>
            <button
              onClick={toggleMute}
              className="active:scale-90 transition-transform"
              aria-label={muted ? 'Desativar mute' : 'Ativar mute'}
            >
              {muted ? <VolOff /> : <VolOn />}
            </button>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleSlider}
          aria-label="Controle de volume"
          className="w-full"
          style={{
            background: `linear-gradient(90deg, #7C3AED ${volume}%, #1e1e3a ${volume}%)`,
          }}
        />

        {/* Atalhos rapidos de volume */}
        <div className="flex gap-2">
          {[0, 25, 50, 75, 100].map((v) => (
            <button
              key={v}
              onClick={() => { setVolume(v); enviarVolume(v) }}
              className="flex-1 py-1.5 rounded-xl font-mono-nx text-xs transition-all"
              style={
                volume === v
                  ? { background: 'linear-gradient(90deg, #7C3AED, #06B6D4)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid #1e1e3a' }
              }
              aria-label={`Volume ${v}%`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
