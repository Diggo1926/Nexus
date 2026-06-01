// Spinner SVG embutido — nao depende de nenhuma biblioteca
function Spinner() {
  return (
    <svg
      className="animate-spin-nx"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  )
}

const ESTILOS = {
  primary: {
    style: {
      background: 'linear-gradient(90deg, #7C3AED, #3B82F6, #06B6D4)',
      boxShadow: '0 0 20px rgba(124,58,237,0.35)',
    },
    classe: 'text-white active:scale-95',
  },
  danger: {
    style: { background: '#F43F5E', boxShadow: '0 0 16px rgba(244,63,94,0.3)' },
    classe: 'text-white active:scale-95',
  },
  ghost: {
    style: { background: 'transparent', border: '1px solid #1e1e3a' },
    classe: 'text-nx-muted active:bg-white/5',
  },
}

export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  'aria-label': ariaLabel,
  className = '',
}) {
  const { style, classe } = ESTILOS[variant] || ESTILOS.primary

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={`
        flex items-center justify-center gap-2 rounded-2xl py-3.5 px-5
        font-grotesk font-semibold text-sm transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${classe}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={style}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
