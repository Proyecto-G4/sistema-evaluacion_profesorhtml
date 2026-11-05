
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch } from '../lib/api'
import { cerrarSesion } from '../lib/auth'
import '../assets/alumno.css'

const router = useRouter()

const seccion = ref('Inicio')
const evaluaciones = ref([])
const clases = ref([])
const cargandoClases = ref(false)
const actual = ref(null)
const preguntas = ref([])
const respuestas = ref({})
const resultados = ref(null)
const mensaje = ref('')
const error = ref('')
const ocupado = ref(false)
const mostrarMas = ref(false)

const tema = ref(localStorage.getItem('pet-tema-alumno') || 'claro')
const fuente = ref(localStorage.getItem('pet-fuente-alumno') || 'normal')
const paleta = ref(localStorage.getItem('pet-paleta-alumno') || 'violeta')

const pendientes = computed(() =>
  evaluaciones.value.filter(e =>
    !e.estado || !['finalizada', 'completada'].includes(String(e.estado).toLowerCase())
  ).length
)

const realizadas = computed(() => evaluaciones.value.length - pendientes.value)

async function cargarEvaluaciones() {
  try {
    const datos = await apiFetch('/alumnos/evaluaciones')
    evaluaciones.value = datos.evaluaciones || []
  } catch (err) {
    error.value = err.message
  }
}

async function cargarMisClases() {
  cargandoClases.value = true
  error.value = ''

  try {
    const datos = await apiFetch('/alumnos/clases')
    clases.value = datos.clases || []
  } catch (err) {
    error.value = err.message
  } finally {
    cargandoClases.value = false
  }
}

async function iniciar(evaluacion) {
  ocupado.value = true
  error.value = ''
  mensaje.value = ''

  try {
    const datos = await apiFetch(`/alumnos/evaluaciones/${evaluacion.id_evaluacion}/iniciar`, {
      method: 'POST'
    })

    actual.value = evaluacion
    preguntas.value = datos.preguntas_asignadas || []
    resultados.value = null
    respuestas.value = {}
    mensaje.value = datos.mensaje || ''
  } catch (err) {
    error.value = err.message
  } finally {
    ocupado.value = false
  }
}

async function guardarRespuesta(pregunta) {
  error.value = ''

  try {
    await apiFetch(`/alumnos/evaluaciones/respuestas/${pregunta.id_asignacion}`, {
      method: 'POST',
      body: JSON.stringify({
        respuesta: respuestas.value[pregunta.id_asignacion]
      })
    })

    pregunta.estado = 'respondida'
    mensaje.value = 'Respuesta guardada correctamente.'
  } catch (err) {
    error.value = err.message
  }
}

async function subirArchivo(pregunta, event) {
  const archivo = event.target.files?.[0]
  if (!archivo) return

  const cuerpo = new FormData()
  cuerpo.append('archivo', archivo)

  ocupado.value = true
  error.value = ''

  try {
    const datos = await apiFetch(`/alumnos/evaluaciones/entrega/${pregunta.id_asignacion}`, {
      method: 'POST',
      body: cuerpo
    })

    pregunta.estado = 'respondida'
    mensaje.value = datos.mensaje || 'Archivo entregado.'
  } catch (err) {
    error.value = err.message
  } finally {
    ocupado.value = false
    event.target.value = ''
  }
}

async function finalizar() {
  if (!actual.value) return

  error.value = ''
  ocupado.value = true

  try {
    await apiFetch(`/alumnos/evaluaciones/${actual.value.id_evaluacion}/finalizar`, {
      method: 'POST'
    })

    mensaje.value = 'Evaluación finalizada.'
    await verResultado()
    await cargarEvaluaciones()
  } catch (err) {
    error.value = err.message
  } finally {
    ocupado.value = false
  }
}

async function verResultado() {
  if (!actual.value) return

  try {
    resultados.value = await apiFetch(
      `/alumnos/evaluaciones/${actual.value.id_evaluacion}/resultados`
    )
  } catch (err) {
    error.value = err.message
  }
}

function volverEvaluaciones() {
  actual.value = null
  resultados.value = null
  preguntas.value = []
  cargarEvaluaciones()
}

function cambiarTema(valor) {
  tema.value = valor
  localStorage.setItem('pet-tema-alumno', valor)
}

function cambiarFuente(valor) {
  fuente.value = valor
  localStorage.setItem('pet-fuente-alumno', valor)
}

function cambiarPaleta(valor) {
  paleta.value = valor
  localStorage.setItem('pet-paleta-alumno', valor)
}

function seleccionarSeccion(nombre) {
  seccion.value = nombre
  mostrarMas.value = false
  mensaje.value = ''
  error.value = ''

  if (nombre === 'Mis clases') {
    cargarMisClases()
  }
}

function salir() {
  cerrarSesion()
  router.replace('/login')
}

onMounted(cargarEvaluaciones)
</script>

<template>
  <main
    class="pet-alumno"
    :class="[tema, `fuente-${fuente}`, `paleta-${paleta}`]"
  >
    <header class="barra-superior-alumno">
      <div class="marca-alumno">
        <div class="marca-icono-alumno">P</div>
        <div>
          <strong>PET</strong>
          <small>Espacio del alumno</small>
        </div>
      </div>

      <nav class="navegacion-alumno">
        <button :class="{ activa: seccion === 'Inicio' }" @click="seleccionarSeccion('Inicio')">
          Inicio
        </button>
        <button :class="{ activa: seccion === 'Mis clases' }" @click="seleccionarSeccion('Mis clases')">
          Mis clases
        </button>
        <button :class="{ activa: seccion === 'Evaluaciones' }" @click="seleccionarSeccion('Evaluaciones')">
          Evaluaciones
        </button>
        <button :class="{ activa: seccion === 'Calificaciones' }" @click="seleccionarSeccion('Calificaciones')">
          Calificaciones
        </button>

        <div class="menu-mas-alumno">
          <button
            :class="{ activa: ['Tareas', 'Calendario', 'Profesores', 'Configuración'].includes(seccion) }"
            @click="mostrarMas = !mostrarMas"
          >
            Más⌄
          </button>

          <div v-if="mostrarMas" class="menu-desplegable-alumno">
            <button @click="seleccionarSeccion('Tareas')">Tareas y carpetas</button>
            <button @click="seleccionarSeccion('Calendario')">Calendario</button>
            <button @click="seleccionarSeccion('Profesores')">Evaluar profesores</button>
            <button @click="seleccionarSeccion('Configuración')">Configuración</button>
          </div>
        </div>
      </nav>

      <button class="salir-alumno" @click="salir">Cerrar sesión ↗</button>
    </header>

    <div class="contenido-alumno">
      <div class="encabezado-alumno">
        <div>
          <span class="sobretitulo-alumno">MI ESPACIO DE APRENDIZAJE</span>
          <h1>{{ seccion === 'Inicio' ? '¡Hola! Bienvenido a PET' : seccion }}</h1>
          <p>Todo lo que necesitás para seguir tu recorrido académico.</p>
        </div>
        <div class="avatar-alumno">A</div>
      </div>

      <p v-if="mensaje" class="aviso-alumno exito-alumno" role="status">{{ mensaje }}</p>
      <p v-if="error" class="aviso-alumno error-alumno" role="alert">{{ error }}</p>

      <!-- INICIO -->
      <section v-if="seccion === 'Inicio' && !actual">
        <div class="bienvenida-alumno">
          <div>
            <span>TU ESPACIO, TU PROGRESO</span>
            <h2>Aprendé, participá y avanzá.</h2>
            <p>Consultá tus actividades y mantenete al día con tus clases.</p>
            <button @click="seleccionarSeccion('Evaluaciones')">Ver mis evaluaciones →</button>
          </div>
          <div class="ilustracion-alumno">📚</div>
        </div>

        <div class="resumen-alumno">
          <article class="indicador-alumno">
            <span>Evaluaciones</span>
            <strong>{{ evaluaciones.length }}</strong>
            <small>Asignadas</small>
          </article>
          <article class="indicador-alumno">
            <span>Pendientes</span>
            <strong>{{ pendientes }}</strong>
            <small>Por completar</small>
          </article>
          <article class="indicador-alumno">
            <span>Finalizadas</span>
            <strong>{{ realizadas }}</strong>
            <small>Completadas</small>
          </article>
          <article class="indicador-alumno">
            <span>Mi espacio</span>
            <strong>✦</strong>
            <small>Seguí aprendiendo</small>
          </article>
        </div>

        <div class="columnas-alumno">
          <section class="panel-alumno">
            <div class="titulo-panel-alumno">
              <div>
                <h3>Próximas actividades</h3>
                <p>Lo que tenés por delante</p>
              </div>
              <button class="enlace-alumno" @click="seleccionarSeccion('Evaluaciones')">
                Ver todas →
              </button>
            </div>

            <article
              v-for="ev in evaluaciones.slice(0, 3)"
              :key="ev.id_evaluacion"
              class="actividad-alumno"
            >
              <div class="actividad-icono-alumno">📝</div>
              <div class="actividad-info-alumno">
                <strong>{{ ev.titulo }}</strong>
                <small>{{ ev.fecha || 'Fecha no especificada' }}</small>
              </div>
              <span class="estado-alumno">{{ ev.estado || 'Asignada' }}</span>
            </article>

            <p v-if="!evaluaciones.length" class="vacio-alumno">
              No tenés actividades asignadas por el momento.
            </p>
          </section>

          <section class="panel-alumno panel-consejo-alumno">
            <span class="sobretitulo-alumno">UN CONSEJO PARA VOS</span>
            <div class="consejo-icono-alumno">💡</div>
            <h3>¡Organizá tu tiempo!</h3>
            <p>Revisá tus evaluaciones y tareas con frecuencia para no perderte ninguna entrega.</p>
          </section>
        </div>
      </section>

      <!-- EVALUACIONES -->
      <section v-if="seccion === 'Evaluaciones'">
        <template v-if="!actual">
          <div class="panel-alumno titulo-panel-alumno">
            <div>
              <h3>Mis evaluaciones</h3>
              <p>Consultá y completá las actividades asignadas por tus profesores.</p>
            </div>
            <button class="boton-secundario-alumno" @click="cargarEvaluaciones">
              ↻ Actualizar
            </button>
          </div>

          <div class="lista-evaluaciones-alumno">
            <article
              v-for="ev in evaluaciones"
              :key="ev.id_evaluacion"
              class="tarjeta-evaluacion-alumno"
            >
              <div class="evaluacion-icono-alumno">📝</div>
              <div class="evaluacion-datos-alumno">
                <span class="sobretitulo-alumno">
                  {{ ev.fecha || 'Sin fecha indicada' }} · {{ ev.tipo || 'Evaluación' }}
                </span>
                <h3>{{ ev.titulo }}</h3>
                <p>{{ ev.descripcion || 'Actividad asignada por tu profesor.' }}</p>
              </div>
              <button :disabled="ocupado" @click="iniciar(ev)">
                Iniciar / continuar →
              </button>
            </article>

            <div v-if="!evaluaciones.length" class="panel-alumno vacio-alumno">
              No tenés evaluaciones asignadas.
            </div>
          </div>
        </template>

        <section v-else class="panel-alumno evaluacion-activa-alumno">
          <button class="enlace-alumno" @click="volverEvaluaciones">
            ← Volver a mis evaluaciones
          </button>

          <h2>{{ actual.titulo }}</h2>

          <div v-if="resultados" class="resultados-alumno">
            <h3>Resultado de la evaluación</h3>
            <p>Estado: {{ resultados.evaluacion?.estado || 'Finalizada' }}</p>

            <article
              v-for="pregunta in resultados.preguntas || []"
              :key="pregunta.numero"
              class="pregunta-alumno"
            >
              <strong>{{ pregunta.pregunta }}</strong>
              <p>{{ pregunta.respuesta || 'Entrega de código' }}</p>

              <div
                v-for="entrega in pregunta.entregas_codigo || []"
                :key="entrega.id_entrega_codigo"
              >
                <p>{{ entrega.nombre_archivo }} · {{ entrega.correccion_ia?.estado || 'Sin corrección' }}</p>
                <p v-if="entrega.correccion_ia?.nota != null">
                  Nota IA: {{ entrega.correccion_ia.nota }}/10
                </p>
                <p v-if="entrega.correccion_ia?.devolucion">
                  {{ entrega.correccion_ia.devolucion.resumen }}
                </p>
              </div>
            </article>
          </div>

          <template v-else>
            <article
              v-for="pregunta in preguntas"
              :key="pregunta.id_asignacion"
              class="pregunta-alumno"
            >
              <span class="sobretitulo-alumno">PREGUNTA</span>
              <h3>{{ pregunta.consigna }}</h3>

              <template v-if="pregunta.estado === 'pendiente'">
                <textarea
                  v-model="respuestas[pregunta.id_asignacion]"
                  rows="4"
                  placeholder="Escribí tu respuesta..."
                ></textarea>

                <button class="boton-primario-alumno" @click="guardarRespuesta(pregunta)">
                  Guardar respuesta
                </button>

                <label class="subir-archivo-alumno">
                  También podés entregar un archivo de código
                  <input
                    type="file"
                    accept=".zip,.c,.cs,.java,.py,.cpp,.html,.css,.js,.json,.txt,.h,.ts"
                    :disabled="ocupado"
                    @change="subirArchivo(pregunta, $event)"
                  >
                </label>
              </template>

              <span v-else class="estado-alumno">✓ Respondida</span>
            </article>

            <button
              v-if="preguntas.length"
              class="boton-finalizar-alumno"
              :disabled="ocupado || preguntas.some(p => p.estado === 'pendiente')"
              @click="finalizar"
            >
              {{ ocupado ? 'Procesando...' : 'Finalizar evaluación' }}
            </button>
          </template>
        </section>
      </section>

      <!-- MIS CLASES -->
      <section v-if="seccion === 'Mis clases'" class="panel-alumno">
        <div class="titulo-panel-alumno">
          <div>
            <h3>Mis clases</h3>
            <p>Consultá los grupos en los que estás inscripto.</p>
          </div>

          <button
            class="boton-secundario-alumno"
            :disabled="cargandoClases"
            @click="cargarMisClases"
          >
            ↻ Actualizar
          </button>
        </div>

        <div v-if="cargandoClases" class="vacio-grande-alumno">
          Cargando tus clases...
        </div>

        <div v-else-if="clases.length" class="lista-clases-alumno">
          <article
            v-for="clase in clases"
            :key="clase.id_clase"
            class="tarjeta-clase-alumno"
          >
            <div class="clase-icono-alumno">🎓</div>

            <div class="clase-info-alumno">
              <h3>{{ clase.nombre }}</h3>
              <p>Período lectivo: {{ clase.periodo_lectivo || 'No especificado' }}</p>
              <small>
                Inscripción:
                {{ clase.fecha_inscripcion
                  ? new Date(clase.fecha_inscripcion).toLocaleDateString('es-UY')
                  : 'Sin fecha registrada' }}
              </small>
            </div>

            <span
              class="estado-clase-alumno"
              :class="`estado-${String(clase.estado || 'activo').toLowerCase()}`"
            >
              {{ clase.estado || 'Activa' }}
            </span>
          </article>
        </div>

        <div v-else class="vacio-grande-alumno">
          <span>🎓</span>
          <h3>Todavía no estás inscripto en ninguna clase</h3>
          <p>
            Cuando un profesor o administrador te incorpore a un grupo,
            aparecerá acá.
          </p>
        </div>
      </section>

      <!-- TAREAS -->
      <section v-if="seccion === 'Tareas'" class="panel-alumno">
        <h3>Tareas y carpetas</h3>
        <p>Un espacio para organizar tus trabajos y actividades individuales o grupales.</p>
        <div class="vacio-grande-alumno">
          <span>📁</span>
          <h3>Tus carpetas aparecerán acá</h3>
          <p>Vas a poder consultar materiales del profesor, crear trabajos en equipo y compartir entregas con tus compañeros.</p>
        </div>
      </section>

      <!-- CALIFICACIONES -->
      <section v-if="seccion === 'Calificaciones'" class="panel-alumno">
        <h3>Mis calificaciones</h3>
        <p>Acá vas a poder consultar tus notas y devoluciones de los profesores.</p>
        <div class="vacio-grande-alumno">
          <span>📊</span>
          <h3>Tus resultados académicos</h3>
          <p>Las calificaciones estarán disponibles cuando tus evaluaciones hayan sido corregidas.</p>
          <button class="boton-secundario-alumno" @click="seleccionarSeccion('Evaluaciones')">
            Ver evaluaciones
          </button>
        </div>
      </section>

      <!-- CALENDARIO -->
      <section v-if="seccion === 'Calendario'" class="panel-alumno">
        <h3>Mi calendario</h3>
        <p>Organizá tus próximas evaluaciones, tareas y fechas importantes.</p>
        <div class="vacio-grande-alumno">
          <span>📅</span>
          <h3>Tu calendario académico</h3>
          <p>Las fechas de tus actividades aparecerán acá.</p>
        </div>
      </section>

      <!-- PROFESORES -->
      <section v-if="seccion === 'Profesores'" class="panel-alumno">
        <h3>Evaluar a mis profesores</h3>
        <p>Tu opinión ayuda a mejorar la experiencia de aprendizaje.</p>
        <div class="vacio-grande-alumno">
          <span>⭐</span>
          <h3>Encuestas a profesores</h3>
          <p>Cuando tengas una evaluación docente disponible, podrás completarla desde acá.</p>
        </div>
      </section>

      <!-- CONFIGURACIÓN -->
      <section v-if="seccion === 'Configuración'" class="panel-alumno configuracion-alumno">
        <h3>Configuración</h3>
        <p>Personalizá cómo se ve tu espacio PET.</p>

        <div class="opcion-config-alumno">
          <div>
            <strong>Modo de visualización</strong>
            <small>Elegí el aspecto de la plataforma.</small>
          </div>
          <div class="opciones-alumno">
            <button
              :class="{ seleccionada: tema === 'claro' }"
              @click="cambiarTema('claro')"
            >
              ☀ Claro
            </button>
            <button
              :class="{ seleccionada: tema === 'oscuro' }"
              @click="cambiarTema('oscuro')"
            >
              ☾ Oscuro
            </button>
          </div>
        </div>

        <div class="opcion-config-alumno">
          <div>
            <strong>Paleta de colores</strong>
            <small>Elegí los colores de tu espacio PET.</small>
          </div>

          <div class="opciones-alumno paletas-alumno">
            <button
              :class="{ seleccionada: paleta === 'violeta' }"
              @click="cambiarPaleta('violeta')"
            >
              <span class="muestra-paleta muestra-violeta"></span>
              Violeta
            </button>

            <button
              :class="{ seleccionada: paleta === 'bosque' }"
              @click="cambiarPaleta('bosque')"
            >
              <span class="muestra-paleta muestra-bosque"></span>
              Bosque
            </button>

            <button
              :class="{ seleccionada: paleta === 'azul' }"
              @click="cambiarPaleta('azul')"
            >
              <span class="muestra-paleta muestra-azul"></span>
              Azul
            </button>

            <button
              :class="{ seleccionada: paleta === 'tierra' }"
              @click="cambiarPaleta('tierra')"
            >
              <span class="muestra-paleta muestra-tierra"></span>
              Tierra
            </button>
          </div>
        </div>

        <div class="opcion-config-alumno">
          <div>
            <strong>Tamaño de letra</strong>
            <small>Ajustá la lectura a tu comodidad.</small>
          </div>
          <div class="opciones-alumno">
            <button
              :class="{ seleccionada: fuente === 'normal' }"
              @click="cambiarFuente('normal')"
            >
              Normal
            </button>
            <button
              :class="{ seleccionada: fuente === 'grande' }"
              @click="cambiarFuente('grande')"
            >
              Grande
            </button>
          </div>
        </div>
      </section>
    </div>

    <footer class="pie-alumno">© PET · Sistema de Evaluaciones</footer>
  </main>
</template>
