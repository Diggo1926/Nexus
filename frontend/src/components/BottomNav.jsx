// Icones SVG inline para cada aba
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
  settings: ({ grad }) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
      stroke={grad ? 'url(#nav-g)' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {grad}
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
  ),
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
  { id: 'dashboard', label: 'Status'   },
  { id: 'power',     label: 'Energia'  },
  { id: 'apps',      label: 'Apps'     },
  { id: 'media',     label: 'Mídia'    },
  { id: 'settings',  label: 'Config'   },
]

export function BottomNav({ ativa, onChange }) {
  return (
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
          const isAtiva = aba.id === ativa
          const Icon = ICONS[aba.id]
          return (
            <button
              key={aba.id}
              role="tab"
              aria-selected={isAtiva}
              aria-label={aba.label}
              onClick={() => onChange(aba.id)}
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
  )
}
