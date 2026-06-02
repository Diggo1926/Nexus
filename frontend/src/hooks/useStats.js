import { useState, useEffect, useRef, useCallback } from 'react'

const LS_URL = 'nexus_api_url'
const LS_KEY = 'nexus_api_key'

function getConfig() {
  return {
    baseUrl: (localStorage.getItem(LS_URL) || import.meta.env.VITE_API_URL || '').replace(/\/$/, ''),
    apiKey:  localStorage.getItem(LS_KEY)  || import.meta.env.VITE_API_KEY  || '',
  }
}

const toGb = (bytes) =>
  bytes != null && bytes > 0 ? +(bytes / 1073741824).toFixed(1) : 0

function normalizar(raw) {
  if (!raw || typeof raw !== 'object') return null

  const c = raw.cpu    || {}
  const r = raw.ram    || {}
  const g = raw.gpu    || null
  const d = raw.disco  || raw.disk    || []
  const n = raw.rede   || raw.network || {}
  const u = raw.uptime

  const cpu = {
    percentual:     c.percentual    ?? c.percent    ?? 0,
    frequencia_mhz: c.frequencia_mhz ?? c.frequency  ?? c.freq ?? null,
    nucleos:        c.nucleos        ?? c.cores      ?? c.count ?? null,
    threads:        c.threads        ?? null,
    temperatura:    c.temperatura    ?? c.temperature ?? null,
  }

  const ram = {
    percentual: r.percentual ?? r.percent ?? 0,
    total_gb:   r.total_gb   ?? toGb(r.total) ?? 0,
    usado_gb:   r.usado_gb   ?? toGb(r.used)  ?? 0,
    livre_gb:   r.livre_gb   ?? toGb(r.free)  ?? r.livre_gb ?? 0,
  }

  const gpu = g ? {
    nome:          g.nome          ?? g.name         ?? 'GPU',
    carga:         g.carga         ?? g.percent       ?? g.load ?? 0,
    vram_usada_mb: g.vram_usada_mb ?? g.vram_used     ?? 0,
    vram_total_mb: g.vram_total_mb ?? g.vram_total    ?? 0,
    temperatura:   g.temperatura   ?? g.temperature   ?? null,
  } : null

  const disco = Array.isArray(d) ? d.map((dk) => ({
    dispositivo: dk.dispositivo ?? dk.device      ?? dk.name ?? '',
    ponto:       dk.ponto       ?? dk.mountpoint   ?? dk.path ?? '',
    percentual:  dk.percentual  ?? dk.percent      ?? 0,
    total_gb:    dk.total_gb    ?? toGb(dk.total)  ?? 0,
    usado_gb:    dk.usado_gb    ?? toGb(dk.used)   ?? 0,
    livre_gb:    dk.livre_gb    ?? toGb(dk.free)   ?? 0,
  })) : []

  const rede = {
    upload_bps:      n.upload_bps       ?? n.upload   ?? 0,
    download_bps:    n.download_bps     ?? n.download  ?? 0,
    bytes_enviados:  n.bytes_enviados   ?? n.bytes_sent  ?? 0,
    bytes_recebidos: n.bytes_recebidos  ?? n.bytes_recv  ?? 0,
  }

  let uptime
  if (typeof u === 'number') {
    uptime = { total_segundos: u, horas: Math.floor(u / 3600), minutos: Math.floor((u % 3600) / 60) }
  } else if (u && typeof u === 'object') {
    const s = u.total_segundos ?? u.seconds ?? u.uptime ?? 0
    uptime = { total_segundos: s, horas: u.horas ?? Math.floor(s / 3600), minutos: u.minutos ?? Math.floor((s % 3600) / 60) }
  } else {
    uptime = { total_segundos: 0, horas: 0, minutos: 0 }
  }

  return { cpu, ram, gpu, disco, rede, uptime }
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts)
  try { return await res.json() } catch { return null }
}

// Quantas falhas consecutivas para declarar offline
const FALHAS_LIMITE = 3

export function useStats(intervalo = 3000) {
  const [stats,    setStats]    = useState(null)
  const [online,   setOnline]   = useState(null)
  const [hostname, setHostname] = useState('')
  const timerRef   = useRef(null)
  const falhasRef  = useRef(0)  // contador de falhas consecutivas

  const poll = useCallback(async () => {
    const { apiKey } = getConfig()

    const [health, statsRes] = await Promise.allSettled([
      fetchJson('/api/health', { signal: AbortSignal.timeout(3500) }),
      fetchJson('/api/stats', {
        headers: { 'X-API-Key': apiKey },
        signal: AbortSignal.timeout(3500),
      }),
    ])

    // ─── Conexao ─────────────────────────────────────────────────────────────
    const healthOk = health.status === 'fulfilled' && health.value?.status === 'online'
    // Em modo proxy (Railway), pc_local indica se o PC fisico esta online
    // Qualquer status que nao seja 'online' (inclusive 'desconhecido') conta como offline
    const pcLocal    = health.value?.pc_local
    const pcLocalOff = pcLocal !== undefined && pcLocal.status !== 'online'

    if (!healthOk || pcLocalOff) {
      // Considera falha: incrementa contador
      falhasRef.current += 1
      if (falhasRef.current >= FALHAS_LIMITE) {
        setOnline(false)
      }
    } else {
      // Sucesso: reseta contador e marca online
      falhasRef.current = 0
      setOnline(true)
      setHostname(health.value.hostname || '')
    }

    // ─── Stats ────────────────────────────────────────────────────────────────
    if (statsRes.status === 'fulfilled' && statsRes.value && !statsRes.value?.erro) {
      const normalizado = normalizar(statsRes.value)
      if (normalizado) setStats(normalizado)
    } else if (statsRes.status === 'rejected') {
      console.warn('[NEXUS] Falha ao buscar /stats:', statsRes.reason)
    } else if (statsRes.value?.erro) {
      console.warn('[NEXUS] Servidor retornou erro:', statsRes.value.erro)
    }
  }, [])

  useEffect(() => {
    poll()
    timerRef.current = setInterval(poll, intervalo)
    return () => clearInterval(timerRef.current)
  }, [poll, intervalo])

  return { stats, online, hostname, refresh: poll }
}
