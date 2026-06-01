export function Modal({
  aberto,
  titulo,
  mensagem,
  onConfirmar,
  onCancelar,
  variante = 'danger',
  labelConfirmar = 'Confirmar',
}) {
  if (!aberto) return null

  const btnConfirm =
    variante === 'danger'
      ? { background: '#F43F5E', boxShadow: '0 0 16px rgba(244,63,94,0.35)' }
      : { background: 'linear-gradient(90deg, #7C3AED, #3B82F6, #06B6D4)', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(13,13,26,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 animate-fade-up"
        style={{
          background: '#12122A',
          border: '1px solid #1e1e3a',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-grotesk font-semibold text-base text-white mb-1">{titulo}</h3>
        <p className="font-grotesk text-sm text-nx-muted mb-6 leading-relaxed">{mensagem}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            className="flex-1 py-3 rounded-2xl font-grotesk font-semibold text-sm text-nx-muted
              active:opacity-70 transition-opacity"
            style={{ background: 'transparent', border: '1px solid #1e1e3a' }}
            aria-label="Cancelar"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 py-3 rounded-2xl font-grotesk font-semibold text-sm text-white
              active:scale-95 transition-transform"
            style={btnConfirm}
            aria-label={labelConfirmar}
          >
            {labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
