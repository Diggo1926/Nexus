// Icone de power inline — sem dependencias externas
function PowerIcon({ size = 44 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="22" y1="8" x2="22" y2="22" />
      <path d="M14 13.5A14 14 0 1 0 30 13.5" fill="none" />
    </svg>
  )
}

export function PowerButton({ active = false, loading = false, onClick }) {
  const SIZE = 140 // diametro em px

  const wrapperStyle = active
    ? {
        background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
        padding: '3px',
        borderRadius: '50%',
        animation: 'pulse-glow 2s ease-in-out infinite',
      }
    : {
        background: '#2a2a3a',
        padding: '2px',
        borderRadius: '50%',
      }

  const innerStyle = {
    background: active
      ? 'radial-gradient(circle at 35% 35%, #1a1040, #0D0D1A)'
      : '#1a1a2e',
    borderRadius: '50%',
    width:  SIZE,
    height: SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'transform 0.15s ease',
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-label={active ? 'PC online' : 'Ligar PC via Wake-on-LAN'}
      className="disabled:opacity-70 active:scale-95 transition-transform"
      style={{ border: 'none', background: 'none', padding: 0 }}
    >
      <div style={wrapperStyle}>
        <div style={innerStyle}>
          {loading ? (
            // Spinner no centro quando carregando
            <svg
              className="animate-spin-nx"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <circle cx="20" cy="20" r="16" strokeOpacity="0.2" />
              <path d="M20 4a16 16 0 0 1 16 16" strokeLinecap="round" />
            </svg>
          ) : (
            <PowerIcon size={44} />
          )}
        </div>
      </div>
    </button>
  )
}
