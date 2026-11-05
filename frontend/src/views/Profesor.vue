<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import ProfesorSidebar from '../components/profesor/ProfesorSidebar.vue'
import { apiFetch } from '../lib/api'
import { leerSesion, cerrarSesion } from '../lib/auth'
import { useRouter } from 'vue-router'
import '../assets/profesor.css'

const router = useRouter()
const seccion = ref('Inicio')
const clases = ref([])
const evaluaciones = ref([])
const consignas = ref([])
const alumnosClase = ref([])
const preguntasEvaluacion = ref([])
const resultadosProfesor = ref(null)
const evaluacionResultados = ref('')
const notasProfesor = ref({})
const cargando = ref(false)
const cargandoAlumnos = ref(false)
const mensaje = ref('')
const error = ref('')
const profesor = computed(() => leerSesion()?.payload?.usuario || 'Profesor')

const preferenciasIniciales = {
  modo: 'claro',
  paleta: 'bosque',
  fuente: 'normal',
  foto: ''
}

function leerPreferencias() {
  try {
    const guardadas = JSON.parse(localStorage.getItem('capi-preferencias-docente') || '{}')
    return { ...preferenciasIniciales, ...guardadas }
  } catch {
    return { ...preferenciasIniciales }
  }
}

const preferencias = reactive(leerPreferencias())
const fotoPerfil = computed(() => preferencias.foto)

const clasesApariencia = computed(() => [
  `tema-${preferencias.modo}`,
  `paleta-${preferencias.paleta}`,
  `fuente-${preferencias.fuente}`
])

watch(
  () => ({ ...preferencias }),
  nuevasPreferencias => {
    try {
      localStorage.setItem('capi-preferencias-docente', JSON.stringify(nuevasPreferencias))
    } catch {
      error.value = 'No se pudieron guardar las preferencias. La imagen podría ser demasiado grande.'
    }
  },
  { deep: true }
)

function seleccionarFoto(evento) {
  const archivo = evento.target.files?.[0]
  if (!archivo) return

  if (!archivo.type.startsWith('image/')) {
    error.value = 'Seleccioná un archivo de imagen válido.'
    evento.target.value = ''
    return
  }

  if (archivo.size > 1500000) {
    error.value = 'La foto no puede superar 1,5 MB.'
    evento.target.value = ''
    return
  }

  const lector = new FileReader()

  lector.onload = () => {
    preferencias.foto = lector.result
    mensaje.value = 'Foto de perfil actualizada en este dispositivo.'
    error.value = ''
  }

  lector.onerror = () => {
    error.value = 'No se pudo cargar la imagen.'
  }

  lector.readAsDataURL(archivo)
  evento.target.value = ''
}

function quitarFoto() {
  preferencias.foto = ''
  mensaje.value = 'Foto de perfil eliminada de este dispositivo.'
}

const formularioClase = reactive({ nombre: '', periodo_lectivo: '' })
const formularioConsigna = reactive({ consigna: '', rubrica: '' })
const formularioEvaluacion = reactive({
  titulo: '', descripcion: '', fecha: '', hora: '', duracion: 60,
  tipo: '', id_clase: '', cantidad_preguntas: 1
})
const asociacion = reactive({ id_evaluacion: '', id_consigna: '' })
const claseSeleccionada = ref('')
const cedulaAlumno = ref('')
const respuestaCorrecta = ref({})

const claseActual = computed(() =>
  clases.value.find(clase => String(clase.id_clase) === String(claseSeleccionada.value))
)

const titulos = {
  Inicio: 'Resumen docente',
  'Mis clases': 'Mis clases',
  Evaluaciones: 'Evaluaciones',
  'Tareas y materiales': 'Tareas y materiales',
  Solicitudes: 'Solicitudes de ingreso',
  Chat: 'Mensajes',
  'Banco de preguntas': 'Banco de preguntas',
  Calificaciones: 'Calificaciones',
  Calendario: 'Calendario',
  Configuración: 'Configuración'
}

async function cargarDatos() {
  cargando.value = true
  error.value = ''

  try {
    const [datosClases, datosEvaluaciones, datosConsignas] = await Promise.all([
      apiFetch('/clases'),
      apiFetch('/evaluaciones'),
      apiFetch('/consignas')
    ])

    clases.value = datosClases.clases || []
    evaluaciones.value = datosEvaluaciones.evaluaciones || []
    consignas.value = datosConsignas.consignas || []

    for (const consigna of consignas.value) {
      respuestaCorrecta.value[consigna.id_consigna] = consigna.respuesta_correcta || ''
    }
  } catch (err) {
    error.value = err.message
  } finally {
    cargando.value = false
  }
}

async function entrarClase(clase) {
  claseSeleccionada.value = clase.id_clase
  alumnosClase.value = []
  mensaje.value = ''
  error.value = ''
  await cargarAlumnosClase()
}

function volverAClases() {
  claseSeleccionada.value = ''
  alumnosClase.value = []
  cedulaAlumno.value = ''
  mensaje.value = ''
  error.value = ''
}

async function cargarAlumnosClase() {
  if (!claseSeleccionada.value) return

  cargandoAlumnos.value = true
  error.value = ''

  try {
    const datos = await apiFetch(`/clases/${claseSeleccionada.value}/alumnos`)
    alumnosClase.value = datos.alumnos || []
  } catch (err) {
    error.value = err.message
  } finally {
    cargandoAlumnos.value = false
  }
}

async function cargarPreguntasEvaluacion() {
  if (!asociacion.id_evaluacion) return

  try {
    const datos = await apiFetch(`/evaluaciones/${asociacion.id_evaluacion}/preguntas`)
    preguntasEvaluacion.value = datos.preguntas || []
  } catch (err) {
    error.value = err.message
  }
}

async function cargarResultadosProfesor() {
  if (!evaluacionResultados.value) return

  error.value = ''

  try {
    resultadosProfesor.value = await apiFetch(`/evaluaciones/${evaluacionResultados.value}/resultados`)

    for (const alumno of resultadosProfesor.value.resultados) {
      for (const pregunta of alumno.preguntas) {
        if (pregunta.id_respuesta) {
          notasProfesor.value[pregunta.id_respuesta] = pregunta.nota ?? ''
        }
      }
    }
  } catch (err) {
    error.value = err.message
  }
}

function guardarNota(idRespuesta) {
  return ejecutar(() => apiFetch(
    `/evaluaciones/${evaluacionResultados.value}/resultados/${idRespuesta}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ nota: Number(notasProfesor.value[idRespuesta]) })
    }
  ), 'Nota guardada.').then(cargarResultadosProfesor)
}

async function ejecutar(accion, exito) {
  mensaje.value = ''
  error.value = ''

  try {
    await accion()
    mensaje.value = exito
    await cargarDatos()
  } catch (err) {
    error.value = err.message
  }
}

function crearClase() {
  return ejecutar(() => apiFetch('/clases', {
    method: 'POST',
    body: JSON.stringify(formularioClase)
  }).then(() => Object.assign(formularioClase, {
    nombre: '',
    periodo_lectivo: ''
  })), 'Clase creada.')
}

function inscribirAlumno() {
  if (!claseSeleccionada.value) {
    error.value = 'Primero tenés que entrar a una clase.'
    return
  }

  return ejecutar(() => apiFetch(`/clases/${claseSeleccionada.value}/alumnos`, {
    method: 'POST',
    body: JSON.stringify({ cedula_alumno: Number(cedulaAlumno.value) })
  }).then(() => {
    cedulaAlumno.value = ''
  }), 'Alumno inscrito.').then(cargarAlumnosClase)
}

function crearConsigna() {
  return ejecutar(() => apiFetch('/consignas', {
    method: 'POST',
    body: JSON.stringify(formularioConsigna)
  }).then(() => Object.assign(formularioConsigna, {
    consigna: '',
    rubrica: ''
  })), 'Consigna creada.')
}

function guardarRespuesta(id) {
  return ejecutar(() => apiFetch(`/consignas/${id}/respuesta`, {
    method: 'PUT',
    body: JSON.stringify({
      respuesta_correcta: respuestaCorrecta.value[id]
    })
  }), 'Respuesta de referencia guardada.')
}

function crearEvaluacion() {
  return ejecutar(() => apiFetch('/evaluaciones', {
    method: 'POST',
    body: JSON.stringify({
      ...formularioEvaluacion,
      id_clase: Number(formularioEvaluacion.id_clase),
      duracion: Number(formularioEvaluacion.duracion),
      cantidad_preguntas: Number(formularioEvaluacion.cantidad_preguntas)
    })
  }), 'Evaluación creada.')
}

function agregarConsigna() {
  return ejecutar(() => apiFetch(
    `/evaluaciones/${asociacion.id_evaluacion}/preguntas/${asociacion.id_consigna}`,
    { method: 'POST' }
  ), 'Pregunta agregada a la evaluación.').then(cargarPreguntasEvaluacion)
}

function eliminarConsignaEvaluacion(idConsigna) {
  return ejecutar(() => apiFetch(
    `/evaluaciones/${asociacion.id_evaluacion}/preguntas/${idConsigna}`,
    { method: 'DELETE' }
  ), 'Pregunta retirada de la evaluación.').then(cargarPreguntasEvaluacion)
}

function salir() {
  cerrarSesion()
  router.replace('/login')
}

onMounted(cargarDatos)
</script>

<template>
  <div class="profesor-layout" :class="clasesApariencia">
    <ProfesorSidebar
      :activa="seccion"
      :foto-perfil="fotoPerfil"
      :nombre-profesor="profesor"
      @seleccionar="seccion = $event"
      @salir="salir"
    />

    <main class="profesor-main">
      <header class="profesor-topbar">
        <div>
          <span class="panel-eyebrow">ESPACIO DOCENTE</span>
          <h1>{{ titulos[seccion] || seccion }}</h1>
        </div>
        <span class="panel-usuario">{{ profesor }}</span>
      </header>

      <section class="profesor-contenido">
        <p v-if="mensaje" class="panel-mensaje exito" role="status">{{ mensaje }}</p>
        <p v-if="error" class="panel-mensaje error" role="alert">{{ error }}</p>
        <p v-if="cargando" class="panel-mensaje">Actualizando datos…</p>

        <template v-if="seccion === 'Inicio'">
          <div class="panel-tarjetas">
            <article>
              <span>CLASES</span>
              <strong>{{ clases.length }}</strong>
            </article>
            <article>
              <span>EVALUACIONES</span>
              <strong>{{ evaluaciones.length }}</strong>
            </article>
            <article>
              <span>PREGUNTAS</span>
              <strong>{{ consignas.length }}</strong>
            </article>
          </div>
          <p class="panel-ayuda">Estos datos se cargan desde las APIs del sistema.</p>
        </template>

        <template v-else-if="seccion === 'Mis clases'">
          <template v-if="!claseSeleccionada">
            <form class="panel-form" @submit.prevent="crearClase">
              <h2>Crear clase</h2>
              <label>
                Nombre
                <input v-model.trim="formularioClase.nombre" required maxlength="100">
              </label>
              <label>
                Período lectivo
                <input v-model.trim="formularioClase.periodo_lectivo" required maxlength="30" placeholder="2026">
              </label>
              <button type="submit">Guardar clase</button>
            </form>

            <div class="panel-lista">
              <h2>Mis clases</h2>
              <p v-if="!clases.length">Todavía no hay clases registradas.</p>

              <article v-for="clase in clases" :key="clase.id_clase">
                <div>
                  <strong>{{ clase.nombre }}</strong>
                  <span>Período lectivo: {{ clase.periodo_lectivo }}</span>
                </div>
                <button type="button" @click="entrarClase(clase)">Entrar a la clase</button>
              </article>
            </div>
          </template>

          <template v-else>
            <div class="panel-lista">
              <button type="button" class="panel-link" @click="volverAClases">
                ← Volver a mis clases
              </button>
              <h2>{{ claseActual?.nombre || 'Clase seleccionada' }}</h2>
              <p>Período lectivo: {{ claseActual?.periodo_lectivo || 'No especificado' }}</p>
            </div>

            <form class="panel-form" @submit.prevent="inscribirAlumno">
              <h2>Agregar alumno a esta clase</h2>
              <p class="panel-ayuda">
                El alumno se inscribirá en: <strong>{{ claseActual?.nombre }}</strong>
              </p>
              <label>
                Cédula de identidad del alumno
                <input
                  v-model.trim="cedulaAlumno"
                  inputmode="numeric"
                  pattern="[0-9]+"
                  required
                  placeholder="Ingresá la CI sin puntos ni guiones"
                >
              </label>
              <button type="submit" :disabled="!cedulaAlumno || cargando">Inscribir alumno</button>
            </form>

            <div class="panel-lista">
              <h2>Alumnos de esta clase</h2>
              <p v-if="cargandoAlumnos">Cargando alumnos…</p>
              <p v-else-if="!alumnosClase.length">Todavía no hay alumnos inscriptos en esta clase.</p>
              <article v-for="alumno in alumnosClase" :key="alumno.cedula_alumno">
                <strong>{{ alumno.nombre }} {{ alumno.apellido }}</strong>
                <span>{{ alumno.estado }}</span>
                <span>CI: {{ alumno.cedula_alumno }}</span>
              </article>
            </div>
          </template>
        </template>

        <template v-else-if="seccion === 'Banco de preguntas'">
          <form class="panel-form" @submit.prevent="crearConsigna">
            <h2>Crear consigna</h2>
            <label>
              Enunciado
              <textarea v-model.trim="formularioConsigna.consigna" required rows="4"></textarea>
            </label>
            <label>
              Rúbrica para corrección IA
              <textarea v-model.trim="formularioConsigna.rubrica" rows="3"></textarea>
            </label>
            <button type="submit">Guardar consigna</button>
          </form>

          <div class="panel-lista">
            <h2>Consignas</h2>
            <p v-if="!consignas.length">Todavía no hay consignas.</p>
            <article v-for="consigna in consignas" :key="consigna.id_consigna">
              <strong>#{{ consigna.id_consigna }}</strong>
              <span>{{ consigna.consigna }}</span>
              <form class="respuesta-form" @submit.prevent="guardarRespuesta(consigna.id_consigna)">
                <label>
                  Respuesta de referencia
                  <textarea v-model="respuestaCorrecta[consigna.id_consigna]" required rows="2"></textarea>
                </label>
                <button type="submit">Guardar respuesta</button>
              </form>
            </article>
          </div>
        </template>

        <template v-else-if="seccion === 'Evaluaciones'">
          <form class="panel-form panel-form-ancho" @submit.prevent="crearEvaluacion">
            <h2>Crear evaluación</h2>
            <label>
              Título
              <input v-model.trim="formularioEvaluacion.titulo" required>
            </label>
            <label>
              Descripción
              <input v-model.trim="formularioEvaluacion.descripcion" required>
            </label>
            <label>
              Clase
              <select v-model="formularioEvaluacion.id_clase" required>
                <option value="" disabled>Elegí una clase</option>
                <option v-for="clase in clases" :key="clase.id_clase" :value="clase.id_clase">
                  {{ clase.nombre }}
                </option>
              </select>
            </label>
            <label>
              Tipo
              <input v-model.trim="formularioEvaluacion.tipo" required placeholder="parcial, práctica…">
            </label>
            <label>
              Fecha
              <input v-model="formularioEvaluacion.fecha" type="date" required>
            </label>
            <label>
              Hora
              <input v-model="formularioEvaluacion.hora" type="time" required>
            </label>
            <label>
              Duración (minutos)
              <input v-model.number="formularioEvaluacion.duracion" type="number" min="1" required>
            </label>
            <label>
              Cantidad de preguntas
              <input v-model.number="formularioEvaluacion.cantidad_preguntas" type="number" min="1" required>
            </label>
            <button type="submit">Crear evaluación</button>
          </form>

          <form class="panel-form panel-form-ancho" @submit.prevent="agregarConsigna">
            <h2>Agregar pregunta existente</h2>
            <label>
              Evaluación
              <select v-model="asociacion.id_evaluacion" required @change="cargarPreguntasEvaluacion">
                <option value="" disabled>Elegí una evaluación</option>
                <option v-for="evaluacion in evaluaciones" :key="evaluacion.id_evaluacion" :value="evaluacion.id_evaluacion">
                  {{ evaluacion.titulo }}
                </option>
              </select>
            </label>
            <label>
              Consigna
              <select v-model="asociacion.id_consigna" required>
                <option value="" disabled>Elegí una consigna</option>
                <option v-for="consigna in consignas" :key="consigna.id_consigna" :value="consigna.id_consigna">
                  #{{ consigna.id_consigna }} · {{ consigna.consigna }}
                </option>
              </select>
            </label>
            <button type="submit">Agregar pregunta</button>
            <div class="panel-lista">
              <h3>Preguntas asociadas</h3>
              <article v-for="pregunta in preguntasEvaluacion" :key="pregunta.id_consigna">
                <span>{{ pregunta.consigna }}</span>
                <button type="button" @click="eliminarConsignaEvaluacion(pregunta.id_consigna)">Quitar</button>
              </article>
            </div>
          </form>

          <div class="panel-lista">
            <h2>Evaluaciones registradas</h2>
            <p v-if="!evaluaciones.length">Todavía no hay evaluaciones.</p>
            <article v-for="evaluacion in evaluaciones" :key="evaluacion.id_evaluacion">
              <strong>{{ evaluacion.titulo }}</strong>
              <span>{{ evaluacion.fecha }} · {{ evaluacion.tipo }}</span>
            </article>
          </div>
        </template>

        <template v-else-if="seccion === 'Calificaciones'">
          <div class="panel-form">
            <h2>Resultados por evaluación</h2>
            <label>
              Evaluación
              <select v-model="evaluacionResultados" required @change="cargarResultadosProfesor">
                <option value="" disabled>Elegí una evaluación</option>
                <option v-for="evaluacion in evaluaciones" :key="evaluacion.id_evaluacion" :value="evaluacion.id_evaluacion">
                  {{ evaluacion.titulo }}
                </option>
              </select>
            </label>
          </div>

          <div v-if="resultadosProfesor" class="panel-lista">
            <h2>{{ resultadosProfesor.evaluacion.titulo }}</h2>
            <p v-if="!resultadosProfesor.resultados.length">No hay alumnos activos en la clase.</p>
            <article
              v-for="alumno in resultadosProfesor.resultados"
              :key="alumno.cedula_alumno"
              class="resultado-docente"
            >
              <strong>{{ alumno.apellido }}, {{ alumno.nombre }}</strong>
              <span>{{ alumno.estado || 'Sin iniciar' }}</span>

              <div v-for="pregunta in alumno.preguntas" :key="pregunta.id_asignacion" class="detalle-nota">
                <p>{{ pregunta.consigna }}</p>
                <div v-if="pregunta.respuesta" class="nota-manual">
                  <p>Respuesta: {{ pregunta.respuesta }}</p>
                  <label>
                    Nota (0 a 10)
                    <input
                      v-model="notasProfesor[pregunta.id_respuesta]"
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                    >
                  </label>
                  <button
                    type="button"
                    :disabled="notasProfesor[pregunta.id_respuesta] === '' || notasProfesor[pregunta.id_respuesta] == null"
                    @click="guardarNota(pregunta.id_respuesta)"
                  >
                    Guardar nota
                  </button>
                </div>
                <p v-for="entrega in pregunta.entregas_codigo" :key="entrega.nombre_archivo">
                  {{ entrega.nombre_archivo }} · Corrección IA: {{ entrega.estado }} · {{ entrega.nota ?? 'Sin nota' }}
                </p>
              </div>
            </article>
          </div>
        </template>

        <template v-else-if="seccion === 'Solicitudes'">
          <div class="panel-lista">
            <h2>Solicitudes para ingresar a mis clases</h2>
            <p>Acá aparecerán las solicitudes de los alumnos que desean unirse a tus clases.</p>
            <p class="panel-ayuda">La aprobación y el rechazo se conectarán cuando estén disponibles las rutas correspondientes del backend.</p>
          </div>
        </template>

        <template v-else-if="seccion === 'Tareas y materiales'">
          <div class="panel-lista">
            <h2>Tareas y materiales</h2>
            <p>Desde esta sección podrás publicar tareas, compartir materiales y consultar las carpetas creadas por tus alumnos.</p>
            <p class="panel-ayuda">Las carpetas individuales y colaborativas se conectarán con el backend cuando estén implementadas sus rutas.</p>
          </div>
        </template>

        <template v-else-if="seccion === 'Chat'">
          <div class="panel-lista">
            <h2>Mensajes</h2>
            <p>Acá estarán tus conversaciones privadas y los chats grupales de las carpetas colaborativas.</p>
            <p class="panel-ayuda">El envío y la recepción de mensajes se conectarán cuando estén disponibles las rutas del backend.</p>
          </div>
        </template>

        <template v-else-if="seccion === 'Calendario'">
          <div class="panel-lista">
            <h2>Calendario</h2>
            <p>Acá aparecerán las evaluaciones, tareas y fechas importantes de tus clases.</p>
            <p class="panel-ayuda">El calendario se completará automáticamente con las actividades registradas.</p>
          </div>
        </template>

        <template v-else-if="seccion === 'Configuración'">
          <div class="configuracion-grid">
            <section class="panel-lista configuracion-foto">
              <h2>Foto de perfil</h2>
              <p>Elegí una imagen para identificar tu cuenta en el espacio docente.</p>

              <div class="configuracion-foto-vista">
                <img v-if="fotoPerfil" :src="fotoPerfil" alt="Foto de perfil">
                <span v-else class="configuracion-foto-vacia">👨🏻‍🏫</span>
              </div>

              <label class="boton-archivo">
                Elegir foto
                <input type="file" accept="image/*" @change="seleccionarFoto">
              </label>

              <button v-if="fotoPerfil" type="button" class="boton-secundario" @click="quitarFoto">
                Quitar foto
              </button>

              <p class="panel-ayuda">
                La imagen se guarda en este dispositivo por ahora. El guardado en tu cuenta requiere una función del backend.
              </p>
              <p class="panel-ayuda">Formato de imagen y tamaño máximo: 1,5 MB.</p>
            </section>

            <section class="panel-lista">
              <h2>Apariencia</h2>
              <p>Elegí cómo querés ver tu espacio docente.</p>

              <label class="configuracion-campo">
                Modo de pantalla
                <select v-model="preferencias.modo">
                  <option value="claro">Claro</option>
                  <option value="oscuro">Oscuro</option>
                </select>
              </label>

              <label class="configuracion-campo">
                Paleta de colores
                <select v-model="preferencias.paleta">
                  <option value="bosque">Bosque natural</option>
                  <option value="violeta">Violeta</option>
                  <option value="azul">Azul</option>
                  <option value="tierra">Tierra</option>
                </select>
              </label>

              <div class="muestras-paleta">
                <span class="muestra-color muestra-principal"></span>
                <span class="muestra-color muestra-acento"></span>
                <span class="muestra-color muestra-fondo"></span>
                <span class="muestra-color muestra-tarjeta"></span>
              </div>

              <label class="configuracion-campo">
                Tamaño de letra
                <select v-model="preferencias.fuente">
                  <option value="pequena">Pequeña</option>
                  <option value="normal">Normal</option>
                  <option value="grande">Grande</option>
                  <option value="extra-grande">Extra grande</option>
                </select>
              </label>

              <p class="panel-ayuda">Los cambios se aplican automáticamente y se guardan en este dispositivo.</p>
            </section>
          </div>
        </template>
      </section>
    </main>
  </div>
</template>