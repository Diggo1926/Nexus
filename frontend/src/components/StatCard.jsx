// Card de estatistica com barra de progresso gradiente
export function StatCard({ label, value, percentual, sub, unit = '' }) {
  const cor =
    percentual > 85 ? '#F43F5E' :
    percentual > 65 ? '#F59E0B' :
    null // usa gradiente padrao

  const barFill = cor
    ? { background: cor }
    : { background: 'linear-gradient(90deg, #7C3AED, #3B82F6, #06B6D4)' }

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: '#12122A',
        border: '1px solid #1e1e3a',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Label */}
      <span className="label-micro">{label}</span>

      {/* Valor principal */}
      <div className="flex items-end justify-between gap-2">
        <span
          className="font-mono-nx font-medium leading-none"
          style={{ fontSize: 28, color: '#fff' }}
        >
          {value}
          {unit && (
            <span className="text-nx-muted font-mono-nx text-sm ml-1">{unit}</span>
          )}
        </span>
        {percentual !== undefined && (
          <span className="font-mono-nx text-xs text-nx-muted">
            {Math.round(percentual)}%
          </span>
        )}
      </div>

      {/* Barra de progresso */}
      {percentual !== undefined && (
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: '#1e1e3a' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(Math.max(percentual, 0), 100)}%`, ...barFill }}
          />
        </div>
      )}

      {/* Dado secundario */}
      {sub && (
        <span
          className="font-mono-nx text-xs"
          style={{ color: '#06B6D4' }}
        >
          {sub}
        </span>
      )}
    </div>
  )
}
