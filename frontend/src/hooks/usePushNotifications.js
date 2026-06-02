import { useState, useEffect } from 'react'

export function usePushNotifications() {
  const [suportado,  setSuportado]  = useState(false)
  const [permissao,  setPermissao]  = useState('default')
  const [inscrito,   setInscrito]   = useState(false)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    const ok = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    setSuportado(ok)
    if (ok) setPermissao(Notification.permission)
  }, [])

  async function solicitar() {
    if (!suportado) return { ok: false, msg: 'Navegador nao suporta push' }
    setCarregando(true)
    try {
      const perm = await Notification.requestPermission()
      setPermissao(perm)
      if (perm !== 'granted') return { ok: false, msg: 'Permissao negada' }

      // Busca chave VAPID publica do backend
      const vapidRes = await fetch('/api/notifications/vapid-public')
      const { publicKey } = await vapidRes.json()
      if (!publicKey) return { ok: false, msg: 'VAPID nao configurado no servidor' }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: _urlBase64ToUint8Array(publicKey),
      })

      const apiKey = localStorage.getItem('nexus_api_key') || import.meta.env.VITE_API_KEY || ''
      await fetch('/api/notifications/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body:    JSON.stringify(sub.toJSON()),
      })

      setInscrito(true)
      return { ok: true, msg: 'Notificacoes ativadas!' }
    } catch (e) {
      return { ok: false, msg: e.message || 'Falha ao ativar notificacoes' }
    } finally {
      setCarregando(false)
    }
  }

  async function testar() {
    const apiKey = localStorage.getItem('nexus_api_key') || import.meta.env.VITE_API_KEY || ''
    const res    = await fetch('/api/notifications/test', {
      method:  'POST',
      headers: { 'X-API-Key': apiKey },
    })
    return res.ok
  }

  return { suportado, permissao, inscrito, carregando, solicitar, testar }
}

function _urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}
