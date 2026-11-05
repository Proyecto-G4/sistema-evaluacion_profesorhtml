import { cerrarSesion, leerSesion } from './auth'

// Se puede cambiar el servidor sin editar componentes ni recompilar URLs a mano.
// In dev Vite proxies /api; deployments can point VITE_API_URL at their API host.
const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function apiFetch(path, options = {}) {
  const sesion = leerSesion()
  const headers = new Headers(options.headers || {})
  if (sesion?.token) headers.set('Authorization', `Bearer ${sesion.token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response
  try {
    response = await fetch(`${apiBase}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      headers
    })
  } catch (error) {
    // Fetch oculta el detalle de red; damos pasos concretos para el entorno local.
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con la API. Iniciá el backend con «pnpm dev» dentro de backend/.')
    }
    throw error
  }
  const data = await response.json().catch(() => ({}))
  if (response.status === 401) {
    cerrarSesion()
    window.dispatchEvent(new Event('capi:session-expired'))
  }
  if (!response.ok) throw new Error(data.mensaje || `Error HTTP ${response.status}`)
  return data
}
