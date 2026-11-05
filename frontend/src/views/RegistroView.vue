
<template>
  <main class="pagina-registro">
    <RouterLink to="/" class="volver-inicio">
      ← Volver al inicio
    </RouterLink>

    <section class="contenedor-registro">
      <div class="registro-personaje">
        <h2>¡Sumate a Capi!</h2>
        <p>Tu próximo paso en el aprendizaje comienza acá.</p>
        <span class="personaje-etiqueta">
          ¡VAMOS A CONOCERNOS!
        </span>

        <img
          src="/registro-capi.png"
          alt="Carpincho de Capi"
        >

      </div>

      <div class="ventana-registro">
        <div class="registro-encabezado">
          <span class="registro-etiqueta">CAPI / REGISTRO</span>

          <h1>Crear cuenta</h1>

          <p class="descripcion">
            Registrate para acceder a la plataforma.
          </p>
        </div>

        <form @submit.prevent="registrarUsuario">
          <div class="campo">
            <label for="usuario">Usuario</label>

            <input
              id="usuario"
              v-model.trim="usuario"
              type="text"
              placeholder="Elegí un nombre de usuario"
              autocomplete="username"
              required
            >
          </div>

          <div class="campo">
            <label for="cedula">Cédula</label>

            <input
              id="cedula"
              v-model.trim="cedula"
              type="text"
              inputmode="numeric"
              placeholder="Ingresá tu cédula"
              required
            >
          </div>

          <div class="campo">
            <label for="password">Contraseña</label>

            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
              minlength="8"
              required
            >
          </div>

          <div class="campo">
            <label for="confirmarPassword">Confirmar contraseña</label>

            <input
              id="confirmarPassword"
              v-model="confirmarPassword"
              type="password"
              placeholder="Repetí tu contraseña"
              autocomplete="new-password"
              minlength="8"
              required
            >
          </div>

          <p
            v-if="mensaje"
            class="mensaje"
            :class="{ exito: registroExitoso }"
            role="status"
          >
            {{ mensaje }}
          </p>

          <div v-if="solicitud" class="solicitud-seguimiento">
            <p>Solicitud #{{ solicitud.id }} · Estado: {{ estadoSolicitud || solicitud.estado }}</p>
            <span>Guardá este código para consultar la aprobación</span>
            <code>{{ solicitud.token_consulta }}</code>
            <button type="button" :disabled="consultandoEstado" @click="consultarEstado">
              {{ consultandoEstado ? 'Consultando...' : 'Consultar estado' }}
            </button>
            <p v-if="errorEstado" role="alert">{{ errorEstado }}</p>
            <p v-if="motivoRechazo">Motivo: {{ motivoRechazo }}</p>
          </div>

          <button type="submit" :disabled="cargando">
            {{ cargando ? "Creando cuenta..." : "Crear cuenta" }}
          </button>
        </form>

        <p class="enlace-login">
          ¿Ya tenés una cuenta?
          <RouterLink to="/login">
            Iniciar sesión
          </RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue"
import "../assets/registro.css"
import { apiFetch } from "../lib/api"

const usuario = ref("")
const cedula = ref("")
const password = ref("")
const confirmarPassword = ref("")
const mensaje = ref("")
const cargando = ref(false)
const registroExitoso = ref(false)
const solicitud = ref(null)
const estadoSolicitud = ref('')
const errorEstado = ref('')
const motivoRechazo = ref('')
const consultandoEstado = ref(false)

async function consultarEstado() {
  if (!solicitud.value) return
  consultandoEstado.value = true
  errorEstado.value = ''
  try {
    const datos = await apiFetch('/auth/register/estado', {
      method: 'POST',
      body: JSON.stringify({ id: solicitud.value.id, token: solicitud.value.token_consulta })
    })
    estadoSolicitud.value = datos.solicitud.estado
    motivoRechazo.value = datos.solicitud.motivo_rechazo || ''
  } catch (error) {
    errorEstado.value = error.message
  } finally {
    consultandoEstado.value = false
  }
}

async function registrarUsuario() {
  mensaje.value = ""
  registroExitoso.value = false

  if (password.value !== confirmarPassword.value) {
    mensaje.value = "Las contraseñas no coinciden."
    return
  }

  if (password.value.length < 8) {
    mensaje.value = "La contraseña debe tener al menos 8 caracteres."
    return
  }

  cargando.value = true

  try {
    const datos = await apiFetch('/auth/register', {
        method: "POST",
        body: JSON.stringify({
          usuario: usuario.value,
          password: password.value,
          confirmarPassword: confirmarPassword.value,
          rol: "alumno",
          cedula: cedula.value
        })
      })

    registroExitoso.value = true
    mensaje.value = datos.mensaje || "Cuenta creada correctamente."
    solicitud.value = datos.solicitud || null

    usuario.value = ""
    cedula.value = ""
    password.value = ""
    confirmarPassword.value = ""

  } catch (error) {
    console.error("Error al registrar usuario:", error)
    mensaje.value = error.message || "No se pudo conectar con el servidor."
  } finally {
    cargando.value = false
  }
}
</script>
