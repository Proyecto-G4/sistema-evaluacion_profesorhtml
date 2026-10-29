
<template>
  <main class="pagina-login">
    <section class="ventana-login">
      <RouterLink to="/" class="volver-inicio">
        ← Volver al inicio
      </RouterLink>

      <h1>Accedé a la plataforma</h1>
      <p class="descripcion">
        Ingresá tus datos para continuar en PET.
      </p>

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
          />
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
          />
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
        <RouterLink to="/registro">Crear cuenta</RouterLink>
      </p>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const usuario = ref("")
const password = ref("")
const mensaje = ref("")
const cargando = ref(false)

async function login() {
  mensaje.value = ""
  cargando.value = true

  try {
    const respuesta = await fetch(
      "http://localhost:2323/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: usuario.value,
          password: password.value
        })
      }
    )

    const datos = await respuesta.json()

    if (!respuesta.ok) {
      mensaje.value = datos.mensaje || "No se pudo iniciar sesión."
      return
    }

    if (!datos.token) {
      mensaje.value = "El servidor no devolvió un token de acceso."
      return
    }

    localStorage.setItem("token", datos.token)

    // Por ahora volvemos al inicio.
    // Más adelante redirigiremos según el rol.
    await router.push("/")
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    mensaje.value = "No se pudo conectar con el servidor."
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.pagina-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.ventana-login {
  width: 100%;
  max-width: 430px;
  padding: 36px;
  box-sizing: border-box;
  background: white;
  color: #171321;
  border-radius: 20px;
  box-shadow: 0 12px 35px rgba(25, 15, 45, 0.16);
}

.volver-inicio {
  display: inline-block;
  margin-bottom: 28px;
  color: #6236a0;
  text-decoration: none;
}

h1 {
  margin: 0 0 10px;
  font-size: 28px;
}

.descripcion {
  margin: 0 0 28px;
  color: #686273;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
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

.enlace-registro {
  margin: 24px 0 0;
  text-align: center;
  color: #686273;
}

.enlace-registro a {
  color: #6236a0;
  font-weight: 700;
}
</style>

