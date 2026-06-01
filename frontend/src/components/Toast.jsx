import { useEffect, useState } from 'react'

// Sistema de toast global sem dependencias externas
let _listeners = []

function emit(tipo, mensagem) {
  const id = Date.now() + Math.random()
  _listeners.forEach((fn) => fn((prev) => [...prev, { id, tipo, mensagem }]))
  setTimeout(() => {
    _listeners.forEach((fn) => fn((prev) => prev.filter((t) => t.id !== id)))
  }, 3500)
}

export const toast = {
  sucesso: (msg) => emit('sucesso', msg),
  erro:    (msg) => emit('erro', msg),
  info:    (msg) => emit('info', msg),
}

const BORDA = {
  sucesso: '#06B6D4',
  erro:    '#F43F5E',
  info:    '#7C3AED',
}

const ICONE = {
  sucesso: (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="2.5,8 6,11.5 13.5,4.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  erro: (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="3" y1="3" x2="13" y2="13" strokeLinecap="round"/>
      <line x1="13" y1="3" x2="3" y2="13" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="7.25" y="7" width="1.5" height="5" rx="0.75"/>
      <circle cx="8" cy="4.5" r="0.9"/>
    </svg>
  ),
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _listeners.push(setToasts)
    return () => { _listeners = _listeners.filter((l) => l !== setToasts) }
  }, [])

  return (
    <div className="fixed top-4 inset-x-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-slide-down pointer-events-auto flex items-center gap-3
            rounded-2xl px-4 py-3 text-sm font-grotesk font-medium"
          style={{
            background: '#12122A',
            borderLeft: `4px solid ${BORDA[t.tipo]}`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 0 0 1px #1e1e3a`,
          }}
        >
          <span style={{ color: BORDA[t.tipo] }}>{ICONE[t.tipo]}</span>
          <span className="flex-1 text-white">{t.mensagem}</span>
        </div>
      ))}
    </div>
  )
}
