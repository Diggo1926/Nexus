export function StatusPill({ online, hostname }) {
  if (online === null) {
    // Estado de carregamento
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full font-grotesk text-xs font-medium text-nx-muted"
        style={{ background: '#1e1e3a' }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-nx-muted animate-dot-pulse" />
        Conectando...
      </div>
    )
  }

  if (!online) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full font-grotesk text-xs font-medium text-nx-muted"
        style={{ background: '#1e1e3a', border: '1px solid #2a1a1a' }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-nx-danger" />
        Offline
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full font-grotesk text-xs font-semibold text-white"
      style={{
        background: 'linear-gradient(90deg, rgba(124,58,237,0.25), rgba(6,182,212,0.25))',
        border: '1px solid rgba(124,58,237,0.35)',
      }}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-dot-pulse" />
      {hostname || 'Online'}
    </div>
  )
}
