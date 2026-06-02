import { useState } from 'react'

// ─── Ícones das tabs principais ───────────────────────────────────────────────
const ICONS = {
  dashboard: ({ grad }) => (
    <svg viewBox="0 0 24 24" width="22" height="22">
      {grad}
      <rect x="3"  y="3"  width="8" height="8" rx="1.5" fill={grad ? 'url(#nav-g)' : '#94A3B8'} />
      <rect x="13" y="3"  width="8" height="8" rx="1.5" fill={grad ? 'url(#nav-g)' : '#94A3B8'} />
      <rect x="3"  y="13" width="8" height="8" rx="1.5" fill={grad ? 'url(#nav-g)' : '#94A3B8'} />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill={grad ? 'url(#nav-g)' : '#94A3B8'} />
    </svg>
  ),
  power: ({ grad }) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
      stroke={grad ? 'url(#nav-g)' : '#94A3B8'} strokeWidth="2" strokeLinecap="round">
      {grad}
      <line x1="12" y1="2" x2="12" y2="12" />
      <path d="M7.5 5.5A9 9 0 1 0 16.5 5.5" />
    </svg>
  ),
  apps: ({ grad }) => (
    <svg viewBox="0 0 24 24" width="22" height="22">
      {grad}
      {[5, 12, 19].flatMap((cx) =>
        [5, 12, 19].map((cy) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2"
            fill={grad ? 'url(#nav-g)' : '#94A3B8'} />
        )),
      )}
    </svg>
  ),
  media: ({ grad }) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
      stroke={grad ? 'url(#nav-g)' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {grad}
      <path d="M9 18V5l12-2v13" />
      <circle cx="6"  cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  mais: ({ grad }) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
      stroke={grad ? 'url(#nav-g)' : '#94A3B8'} strokeWidth="2" strokeLinecap="round">
      {grad}
      <circle cx="12" cy="5"  r="1.5" fill={grad ? 'url(#nav-g)' : '#94A3B8'} />
      <circle cx="12" cy="12" r="1.5" fill={grad ? 'url(#nav-g)' : '#94A3B8'} />
      <circle cx="12" cy="19" r="1.5" fill={grad ? 'url(#nav-g)' : '#94A3B8'} />
    </svg>
  ),
}

// ─── Ícones do drawer "Mais" ──────────────────────────────────────────────────
function IconTela({ color }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}
function IconAuto({ color }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
function IconLogs({ color }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="8"  y1="6"  x2="21" y2="6"  />
      <line x1="8"  y1="12" x2="21" y2="12" />
      <line x1="8"  y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6"  r="1.5" fill={color} stroke="none" />
      <circle cx="3" cy="12" r="1.5" fill={color} stroke="none" />
      <circle cx="3" cy="18" r="1.5" fill={color} stroke="none" />
    </svg>
  )
}
function IconTerminal({ color }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )
}
function IconSlides({ color }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <polygon points="10 8 16 12 10 16 10 8" fill={color} stroke="none" />
    </svg>
  )
}
function IconConfig({ color }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
        a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
        A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
        l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
        A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
        l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
        a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
        l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
        a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const GRADIENT_DEF = (
  <defs>
    <linearGradient id="nav-g" x1="0" y1="0" x2="1" y2="0">
      <stop stopColor="#7C3AED" />
      <stop offset="1" stopColor="#06B6D4" />
    </linearGradient>
  </defs>
)

const ABAS = [
  { id: 'dashboard', label: 'Status'  },
  { id: 'power',     label: 'Energia' },
  { id: 'apps',      label: 'Apps'    },
  { id: 'media',     label: 'Mídia'   },
  { id: 'mais',      label: 'Mais'    },
]

const MAIS_ITENS = [
  { id: 'screenshot',   label: 'Tela',        Icon: IconTela     },
  { id: 'terminal',     label: 'Terminal',    Icon: IconTerminal },
  { id: 'automations',  label: 'Automações',  Icon: IconAuto     },
  { id: 'presentation', label: 'Slides',      Icon: IconSlides   },
  { id: 'logs',         label: 'Logs',        Icon: IconLogs     },
  { id: 'settings',     label: 'Config',      Icon: IconConfig   },
]

// Páginas que pertencem ao drawer "Mais"
const MAIS_PAGES = new Set(['screenshot', 'terminal', 'automations', 'presentation', 'logs', 'settings'])

export function BottomNav({ ativa, onChange }) {
  const [drawer, setDrawer] = useState(false)

  const isMaisAtiva = MAIS_PAGES.has(ativa)

  const handleTab = (id) => {
    if (id === 'mais') {
      setDrawer((v) => !v)
    } else {
      setDrawer(false)
      onChange(id)
    }
  }

  const handleMaisItem = (id) => {
    setDrawer(false)
    onChange(id)
  }

  return (
    <>
      {/* Overlay para fechar o drawer */}
      {drawer && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setDrawer(false)}
        />
      )}

      {/* Drawer "Mais" */}
      {drawer && (
        <div
          className="fixed inset-x-0 z-40 px-4 pb-1 animate-fade-up"
          style={{ bottom: 64 }}
        >
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: '#12122A',
              border: '1px solid #1e1e3a',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
            }}
          >
            {MAIS_ITENS.map((item, i) => {
              const isAtivo = ativa === item.id
              const cor = isAtivo ? '#06B6D4' : '#CBD5E1'
              return (
                <button
                  key={item.id}
                  onClick={() => handleMaisItem(item.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 font-grotesk text-sm
                    font-medium active:opacity-60 transition-opacity text-left"
                  style={{
                    color: cor,
                    background: isAtivo ? 'rgba(6,182,212,0.08)' : 'transparent',
                    borderBottom: i < MAIS_ITENS.length - 1 ? '1px solid #1e1e3a' : 'none',
                  }}
                  aria-label={item.label}
                >
                  <item.Icon color={cor} />
                  {item.label}
                  {isAtivo && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: '#06B6D4' }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Barra de navegação */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 safe-bottom"
        style={{
          background: 'rgba(13,13,26,0.97)',
          borderTop: '1px solid #1e1e3a',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex" role="tablist">
          {ABAS.map((aba) => {
            const isAtiva = aba.id === 'mais'
              ? isMaisAtiva || drawer
              : aba.id === ativa
            const Icon = ICONS[aba.id]
            return (
              <button
                key={aba.id}
                role="tab"
                aria-selected={isAtiva}
                aria-label={aba.label}
                onClick={() => handleTab(aba.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
              >
                <Icon grad={isAtiva ? GRADIENT_DEF : null} />
                <span
                  className="label-micro transition-colors"
                  style={{ color: isAtiva ? '#06B6D4' : '#94A3B8' }}
                >
                  {aba.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
