
<template>
  <main class="pagina-login">
    <RouterLink to="/" class="volver-inicio">
      ← Volver al inicio
    </RouterLink>

    <section class="contenedor-login">
      <div class="login-personaje">
        <span class="personaje-etiqueta">¡QUÉ BUENO VERTE!</span>

        <img
          src="/login-capi.png"
          alt="Carpincho de Capi"
        >
      </div>

      <div class="ventana-login">
        <div class="login-encabezado">
          <span class="login-etiqueta">CAPI / ACCESO</span>

          <h1>Accedé a la plataforma</h1>

          <p class="descripcion">
            Ingresá tus datos para continuar en Capi.
          </p>
        </div>

        <form @submit.prevent="login">
          <div class="campo">
            <label for="usuario">Usuario</label>

            <input
              id="usuario"
              v-model.trim="usuario"
              type="text"
              placeholder="Ingresá tu usuario"
              autocomplete="username"
              required
            >
          </div>

          <div class="campo">
            <label for="password">Contraseña</label>

            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Ingresá tu contraseña"
              autocomplete="current-password"
              required
            >
          </div>

          <p v-if="mensaje" class="mensaje" role="alert">
            {{ mensaje }}
          </p>

          <button type="submit" :disabled="cargando">
            {{ cargando ? "Iniciando sesión..." : "Iniciar sesión" }}
          </button>
        </form>

        <p class="enlace-registro">
          ¿Todavía no tenés cuenta?
          <RouterLink to="/registro">
            Crear cuenta
          </RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import "../assets/login.css"
import { guardarToken, leerSesion } from "../lib/auth"
import { apiFetch } from "../lib/api"

const router = useRouter()

const usuario = ref("")
const password = ref("")
const mensaje = ref("")
const cargando = ref(false)

async function login() {
  mensaje.value = ""
  cargando.value = true

  try {
    const datos = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario: usuario.value, password: password.value })
    })

    if (!datos.token) {
      mensaje.value = "El servidor no devolvió un token de acceso."
      return
    }

    guardarToken(datos.token)
    const sesion = leerSesion()
    if (!sesion) throw new Error('El servidor devolvió un token inválido o vencido.')
    const destino = sesion.rol === 'profesor' ? '/profesor' : sesion.rol === 'alumno' ? '/alumno' : sesion.rol === 'admin' ? '/admin' : '/'
    await router.replace(router.currentRoute.value.query.destino || destino)

  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    mensaje.value = error.message || "No se pudo conectar con el servidor."
  } finally {
    cargando.value = false
  }
}
</script>
