const TOKEN_KEY = 'token'

// Valida firma solo en el servidor; en cliente decodificamos claims para navegación.
export function leerSesion() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null

  try {
    const segmento = token.split('.')[1]
    if (!segmento) throw new Error('JWT sin payload')
    const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64), caracter => caracter.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(bytes))
    if (!payload.exp || payload.exp * 1000 <= Date.now()) throw new Error('JWT vencido')
    return { token, payload, rol: String(payload.rol || '').trim().toLowerCase() }
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
}

export function guardarToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY)
}
