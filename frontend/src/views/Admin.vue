<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch } from '../lib/api'
import { cerrarSesion } from '../lib/auth'

const router = useRouter()
const cuentas = ref([])
const altas = ref([])
const gestiones = ref([])
const mensaje = ref('')
const error = ref('')
const cargando = ref(false)
const docente = ref({ cedula_profesor: '', usuario: '', password: '', confirmarPassword: '' })

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [cuentasData, altasData, gestionesData] = await Promise.all([
      apiFetch('/cuentas'),
      apiFetch('/cuentas/solicitudes/alumnos'),
      apiFetch('/cuentas/solicitudes/gestion')
    ])
    cuentas.value = cuentasData.cuentas || []
    altas.value = altasData.solicitudes || []
    gestiones.value = gestionesData.solicitudes || []
  } catch (err) { error.value = err.message }
  finally { cargando.value = false }
}

async function decidirAlta(id, decision) {
  const motivo = decision === 'rechazar' ? window.prompt('Motivo del rechazo (mínimo 5 caracteres):') : undefined
  if (decision === 'rechazar' && (!motivo || motivo.trim().length < 5)) return
  await ejecutar(() => apiFetch(`/cuentas/solicitudes/alumnos/${id}`, {
    method: 'PATCH', body: JSON.stringify({ decision, motivo })
  }), 'Solicitud de alumno resuelta.')
}

async function decidirGestion(id, decision) {
  const motivo = decision === 'rechazar' ? window.prompt('Motivo del rechazo (mínimo 5 caracteres):') : undefined
  if (decision === 'rechazar' && (!motivo || motivo.trim().length < 5)) return
  await ejecutar(() => apiFetch(`/cuentas/solicitudes/gestion/${id}`, {
    method: 'PATCH', body: JSON.stringify({ decision, motivo })
  }), 'Solicitud de gestión resuelta.')
}

async function cambiarEstado(cuenta) {
  const estado = cuenta.estado === 'activo' ? 'suspendido' : 'activo'
  await ejecutar(() => apiFetch(`/cuentas/${cuenta.id_login}/estado`, {
    method: 'PATCH', body: JSON.stringify({ estado })
  }), 'Estado de cuenta actualizado.')
}

async function crearDocente() {
  await ejecutar(async () => {
    await apiFetch('/auth/profesores', { method: 'POST', body: JSON.stringify(docente.value) })
    docente.value = { cedula_profesor: '', usuario: '', password: '', confirmarPassword: '' }
  }, 'Cuenta de profesor creada.')
}

async function ejecutar(accion, exito) {
  error.value = ''
  mensaje.value = ''
  try { await accion(); mensaje.value = exito; await cargar() }
  catch (err) { error.value = err.message }
}

function salir() { cerrarSesion(); router.replace('/login') }
onMounted(cargar)
</script>

<template>
  <main class="admin-panel">
    <header><div><span>CAPI / ADMINISTRACIÓN</span><h1>Gestión de cuentas</h1></div><button @click="salir">Cerrar sesión</button></header>
    <p v-if="mensaje" role="status" class="admin-ok">{{ mensaje }}</p>
    <p v-if="error" role="alert" class="admin-error">{{ error }}</p>
    <p v-if="cargando">Cargando información…</p>

    <section class="admin-bloque">
      <h2>Solicitudes de alta de alumnos</h2>
      <p v-if="!altas.length">No hay solicitudes pendientes.</p>
      <article v-for="solicitud in altas" :key="solicitud.id_solicitud">
        <div><strong>{{ solicitud.nombre }} {{ solicitud.apellido }}</strong><span>{{ solicitud.usuario }} · Cédula {{ solicitud.alumno_cedula_alumno }}</span></div>
        <div class="admin-acciones"><button @click="decidirAlta(solicitud.id_solicitud, 'aprobar')">Aprobar</button><button class="secundario" @click="decidirAlta(solicitud.id_solicitud, 'rechazar')">Rechazar</button></div>
      </article>
    </section>

    <section class="admin-bloque">
      <h2>Solicitudes de gestión de cuentas</h2>
      <p v-if="!gestiones.length">No hay solicitudes pendientes.</p>
      <article v-for="solicitud in gestiones" :key="solicitud.id_solicitud">
        <div><strong>{{ solicitud.cuenta_objetivo }} · {{ solicitud.accion }}</strong><span>{{ solicitud.solicitante_usuario }}: {{ solicitud.motivo }}</span></div>
        <div class="admin-acciones"><button @click="decidirGestion(solicitud.id_solicitud, 'aprobar')">Aprobar</button><button class="secundario" @click="decidirGestion(solicitud.id_solicitud, 'rechazar')">Rechazar</button></div>
      </article>
    </section>

    <section class="admin-bloque">
      <h2>Crear cuenta de profesor</h2>
      <form @submit.prevent="crearDocente">
        <label>Cédula<input v-model="docente.cedula_profesor" inputmode="numeric" required></label>
        <label>Usuario<input v-model.trim="docente.usuario" required maxlength="50"></label>
        <label>Contraseña<input v-model="docente.password" type="password" minlength="8" required></label>
        <label>Confirmar contraseña<input v-model="docente.confirmarPassword" type="password" minlength="8" required></label>
        <button type="submit">Crear cuenta</button>
      </form>
    </section>

    <section class="admin-bloque">
      <h2>Cuentas</h2>
      <article v-for="cuenta in cuentas" :key="cuenta.id_login">
        <div><strong>{{ cuenta.usuario }} · {{ cuenta.rol }}</strong><span>{{ cuenta.nombre }} {{ cuenta.apellido }} · {{ cuenta.estado }}</span></div>
        <button v-if="cuenta.estado !== 'eliminado'" @click="cambiarEstado(cuenta)">{{ cuenta.estado === 'activo' ? 'Suspender' : 'Reactivar' }}</button>
      </article>
    </section>
  </main>
</template>

<style scoped>
.admin-panel { min-height:100vh; padding:clamp(20px,5vw,60px); background:#f4f2e9; color:#263c35; font-family:Inter,system-ui,sans-serif }
header { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:24px }
header span { color:#718373; font-size:11px; font-weight:800; letter-spacing:1.4px }
h1 { margin:5px 0 0; font-size:clamp(28px,4vw,42px) }
.admin-bloque { display:grid; gap:12px; margin:18px 0; padding:20px; border:1px solid #d5d4c8; border-radius:15px; background:#fff }
.admin-bloque h2 { margin:0 }
.admin-bloque article { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:12px 0; border-top:1px solid #e4e3da }
.admin-bloque article div:first-child { display:grid; gap:4px }
.admin-bloque article span { color:#59685b; font-size:13px }
.admin-bloque form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px }
label { display:grid; gap:5px; font-size:13px }
input { box-sizing:border-box; width:100%; padding:10px; border:1px solid #c9cec4; border-radius:8px; font:inherit }
button { padding:9px 13px; border:0; border-radius:8px; background:#456c52; color:white; font:inherit; font-weight:700; cursor:pointer }
.admin-acciones { display:flex; gap:8px }
button.secundario { background:#80574d }
.admin-ok,.admin-error { padding:12px; border-radius:9px; background:#dcebdd }
.admin-error { background:#f4d9d5 }
@media(max-width:600px) { header,.admin-bloque article { align-items:flex-start; flex-direction:column } .admin-bloque form { grid-template-columns:1fr } }
</style>
