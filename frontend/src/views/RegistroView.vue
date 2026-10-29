
<template>
  <main class="pagina-registro">
    <section class="ventana-registro">
      <RouterLink to="/" class="volver-inicio">
        ← Volver al inicio
      </RouterLink>

      <h1>Crear cuenta</h1>
      <p class="descripcion">
        Registrate en PET para acceder a la plataforma.
      </p>

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
          />
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
          />
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
          />
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
          />
        </div>

        <p
          v-if="mensaje"
          class="mensaje"
          :class="{ exito: registroExitoso }"
          role="status"
        >
          {{ mensaje }}
        </p>

        <button type="submit" :disabled="cargando">
          {{ cargando ? "Creando cuenta..." : "Crear cuenta" }}
        </button>
      </form>

      <p class="enlace-login">
        ¿Ya tenés una cuenta?
        <RouterLink to="/login">Iniciar sesión</RouterLink>
      </p>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const usuario = ref("")
const cedula = ref("")
const password = ref("")
const confirmarPassword = ref("")
const mensaje = ref("")
const cargando = ref(false)
const registroExitoso = ref(false)

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
    const respuesta = await fetch(
      "http://localhost:2323/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: usuario.value,
          password: password.value,
          confirmarPassword: confirmarPassword.value,
          rol: "alumno",
          cedula: cedula.value
        })
      }
    )

    const datos = await respuesta.json()

    if (!respuesta.ok) {
      mensaje.value = datos.mensaje || "No se pudo crear la cuenta."
      return
    }

    registroExitoso.value = true
    mensaje.value = datos.mensaje || "Cuenta creada correctamente."

    usuario.value = ""
    cedula.value = ""
    password.value = ""
    confirmarPassword.value = ""

    // Después de registrarse, podrá iniciar sesión.
    setTimeout(() => {
      router.push("/login")
    }, 1500)
  } catch (error) {
    console.error("Error al registrar usuario:", error)
    mensaje.value = "No se pudo conectar con el servidor."
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.pagina-registro {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.ventana-registro {
  width: 100%;
  max-width: 460px;
  padding: 36px;
  box-sizing: border-box;
  background: white;
  color: #171321;
  border-radius: 20px;
  box-shadow: 0 12px 35px rgba(25, 15, 45, 0.16);
}

.volver-inicio {
  display: inline-block;
  margin-bottom: 24px;
  color: #6236a0;
  text-decoration: none;
}

h1 {
  margin: 0 0 10px;
  font-size: 28px;
}

.descripcion {
  margin: 0 0 26px;
  color: #686273;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.campo label {
  font-weight: 600;
}

.campo input {
  width: 100%;
  padding: 13px 14px;
  box-sizing: border-box;
  border: 1px solid #d8d2e2;
  border-radius: 10px;
  font: inherit;
}

.campo input:focus {
  outline: 2px solid #9c79d1;
  outline-offset: 2px;
}

button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: #6236a0;
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.mensaje {
  color: #b42318;
  font-size: 14px;
}

.mensaje.exito {
  color: #187443;
}

.enlace-login {
  margin: 24px 0 0;
  text-align: center;
  color: #686273;
}

.enlace-login a {
  color: #6236a0;
  font-weight: 700;
}
</style>

