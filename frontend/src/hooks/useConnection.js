// Hook central de conexao com a API NEXUS
// A API Key e lida do localStorage — nunca exposta no console

// Chaves do localStorage — devem coincidir com Settings.jsx e useStats.js
const LS_URL = 'nexus_api_url'
const LS_KEY = 'nexus_api_key'

function getConfig() {
  return {
    baseUrl: (localStorage.getItem(LS_URL) || import.meta.env.VITE_API_URL || '').replace(/\/$/, ''),
    apiKey:  localStorage.getItem(LS_KEY)  || import.meta.env.VITE_API_KEY  || '',
  }
}

export function useConnection() {
  async function request(method, path, body = null) {
    const { baseUrl, apiKey } = getConfig()

    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      signal: AbortSignal.timeout(8000),
    }

    if (body !== null) opts.body = JSON.stringify(body)

    let res
    try {
      res = await fetch(`/api${path}`, opts)
    } catch {
      throw new Error('Sem conexao com o NEXUS')
    }

    let data
    try {
      data = await res.json()
    } catch {
      throw new Error('Resposta invalida do servidor')
    }

    if (!res.ok) throw new Error(data?.erro || `Erro ${res.status}`)
    return data
  }

  return { request, getConfig }
}
