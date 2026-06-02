import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LS_PCS       = 'nexus_pcs'
const LS_ACTIVE_ID = 'nexus_active_pc_id'
const LS_URL       = 'nexus_api_url'
const LS_KEY       = 'nexus_api_key'

const PcContext = createContext(null)

export function PcProvider({ children }) {
  const [pcs,      setPcs]      = useState(() => _loadPcs())
  const [activeId, setActiveId] = useState(() => localStorage.getItem(LS_ACTIVE_ID) || null)

  const activePc = pcs.find((p) => p.id === activeId) || pcs[0] || null

  // Sincroniza URL/Key ativas no localStorage quando o PC ativo muda
  useEffect(() => {
    if (activePc) {
      if (activePc.url)    localStorage.setItem(LS_URL, activePc.url)
      if (activePc.apiKey) localStorage.setItem(LS_KEY, activePc.apiKey)
    }
  }, [activeId, activePc])

  const addPc = useCallback((pc) => {
    const novo = { id: crypto.randomUUID(), ...pc }
    setPcs((prev) => {
      const lista = [...prev, novo]
      _savePcs(lista)
      return lista
    })
    return novo
  }, [])

  const removePc = useCallback((id) => {
    setPcs((prev) => {
      const lista = prev.filter((p) => p.id !== id)
      _savePcs(lista)
      return lista
    })
    if (activeId === id) {
      setActiveId(null)
      localStorage.removeItem(LS_ACTIVE_ID)
    }
  }, [activeId])

  const selectPc = useCallback((id) => {
    setActiveId(id)
    localStorage.setItem(LS_ACTIVE_ID, id)
  }, [])

  return (
    <PcContext.Provider value={{ pcs, activePc, activeId, addPc, removePc, selectPc }}>
      {children}
    </PcContext.Provider>
  )
}

export function usePcContext() {
  return useContext(PcContext)
}

function _loadPcs() {
  try {
    return JSON.parse(localStorage.getItem(LS_PCS) || '[]')
  } catch {
    return []
  }
}

function _savePcs(pcs) {
  localStorage.setItem(LS_PCS, JSON.stringify(pcs))
}
