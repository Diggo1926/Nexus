import { useState } from 'react'
import { toast } from '../components/Toast'

function SlideBtn({ children, onClick, loading, variant = 'default', fullWidth, 'aria-label': al }) {
  const styles = {
    default: { background: '#12122A', border: '1px solid #1e1e3a', color: '#fff' },
    primary: { background: 'linear-gradient(90deg,#7C3AED,#06B6D4)', color: '#fff', boxShadow: '0 0 20px rgba(124,58,237,0.3)' },
    danger:  { background: '#F43F5E', color: '#fff', boxShadow: '0 0 16px rgba(244,63,94,0.3)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-label={al}
      className={`flex items-center justify-center gap-3 rounded-3xl font-grotesk font-semibold
        text-lg active:scale-95 disabled:opacity-50 transition-all
        ${fullWidth ? 'w-full' : ''}`}
      style={{ ...styles[variant], minHeight: 72, padding: '0 24px' }}
    >
      {loading
        ? <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin-nx" />
        : children}
    </button>
  )
}

export function Presentation({ request }) {
  const [carregando, setCarregando] = useState(null)
  const [feedback,   setFeedback]   = useState(null)

  const pressionar = async (rota, label) => {
    setCarregando(rota)
    setFeedback(null)
    try {
      await request('POST', rota)
      setFeedback(label)
      setTimeout(() => setFeedback(null), 1000)
    } catch (e) {
      toast.erro(e.message)
    } finally {
      setCarregando(null)
    }
  }

  return (
    <div className="p-5 flex flex-col gap-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="font-grotesk font-semibold text-sm text-white">Modo Apresentacao</h2>
        {feedback && (
          <span className="font-grotesk text-xs font-medium animate-fade-in"
            style={{ color: '#06B6D4' }}>
            ✓ {feedback}
          </span>
        )}
      </div>

      {/* Navegacao de slides — botoes grandes */}
      <div className="grid grid-cols-2 gap-4">
        <SlideBtn onClick={() => pressionar('/presentation/prev', 'Slide anterior')}
          loading={carregando === '/presentation/prev'} aria-label="Slide anterior">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Anterior
        </SlideBtn>
        <SlideBtn onClick={() => pressionar('/presentation/next', 'Proximo slide')}
          loading={carregando === '/presentation/next'} aria-label="Proximo slide">
          Proximo
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </SlideBtn>
      </div>

      {/* Iniciar — botao grande destaque */}
      <SlideBtn variant="primary" fullWidth
        onClick={() => pressionar('/presentation/start', 'Apresentacao iniciada')}
        loading={carregando === '/presentation/start'}
        aria-label="Iniciar apresentacao (F5)">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
        </svg>
        Iniciar Slideshow (F5)
      </SlideBtn>

      {/* Controles secundarios */}
      <div className="grid grid-cols-2 gap-4">
        <SlideBtn onClick={() => pressionar('/presentation/black', 'Tela preta')}
          loading={carregando === '/presentation/black'} aria-label="Tela preta (B)">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" />
          </svg>
          Tela Preta
        </SlideBtn>
        <SlideBtn variant="danger"
          onClick={() => pressionar('/presentation/stop', 'Apresentacao encerrada')}
          loading={carregando === '/presentation/stop'}
          aria-label="Encerrar apresentacao (Escape)">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6"  y1="6" x2="18" y2="18" />
          </svg>
          Encerrar
        </SlideBtn>
      </div>

      <div className="rounded-2xl p-4 text-center"
        style={{ background: '#12122A', border: '1px solid #1e1e3a' }}>
        <p className="font-grotesk text-xs text-nx-border leading-relaxed">
          Os botoes simulam teclas no PC.<br />
          Certifique-se de que o PowerPoint ou outro app esta em foco.
        </p>
      </div>
    </div>
  )
}
