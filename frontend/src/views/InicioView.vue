
<template>
  <main class="inicio">
    <header class="encabezado" :class="{ 'nav-crema': zonaCrema }">
      <a class="marca" href="/" aria-label="Capi, inicio">
        <img
          src="/logo-capi.png"
          alt="Logo de Capi"
          class="marca-logo"
        >
        <span class="marca-texto">
          <strong>Capi</strong>
          <small>Sistema de Evaluaciones</small>
        </span>
      </a>
    </header>

    <div class="inicio-contenido">
      <section class="bienvenida">
        <span class="etiqueta">TU ESPACIO EDUCATIVO</span>

        <h1>¡Bienvenido a Capi!</h1>

        <p>
          Un espacio para aprender, enseñar y evaluar.
        </p>

        <div class="acciones">
          <RouterLink to="/login" class="boton boton-principal">
            Iniciar sesión
          </RouterLink>

          <RouterLink to="/registro" class="boton boton-secundario">
            Crear cuenta
          </RouterLink>
        </div>
      </section>

      <section class="novedades">
        <div class="titulo-seccion">
          <span>01 / INSTITUCIÓN</span>
          <h2>Novedades institucionales</h2>
          <p>Las noticias y los avisos importantes, en un solo lugar.</p>
        </div>

        <div class="pizarron">
          <article class="nota nota-amarilla">
            <span>15 NOV</span>
            <h3>Aviso institucional</h3>
            <p>Acá podrás consultar los avisos de tu institución.</p>
          </article>

          <article class="nota nota-rosa">
            <span>20 NOV</span>
            <h3>Nueva actividad</h3>
            <p>Acá aparecerán las actividades y comunicaciones.</p>
          </article>

          <article class="nota nota-lila">
            <span>25 NOV</span>
            <h3>Información importante</h3>
            <p>Un espacio para las novedades de Capi.</p>
          </article>
        </div>
      </section>
    </div>

    <section class="eventos">
      <div class="titulo-seccion">
        <span>02 / AGENDA</span>
        <h2>Próximos eventos</h2>
        <p>Descubrí las actividades que se vienen.</p>
      </div>

      <div class="lista-eventos">
        <article class="evento">
          <div class="evento-icono">01</div>
          <div>
            <h3>Evento institucional</h3>
            <p>Próximamente podrás consultar los detalles.</p>
          </div>
        </article>

        <article class="evento">
          <div class="evento-icono">02</div>
          <div>
            <h3>Actividad educativa</h3>
            <p>Fechas y novedades de las próximas actividades.</p>
          </div>
        </article>

        <article class="evento">
          <div class="evento-icono">03</div>
          <div>
            <h3>Agenda Capi</h3>
            <p>Información para toda la comunidad educativa.</p>
          </div>
        </article>
      </div>
    </section>


<footer class="pie">
  <div class="pie-marca">
    <img src="/logo-capi.png" alt="Logo de Capi">
    <div>
      <strong>Capi</strong>
      <span>Sistema de Evaluaciones</span>
    </div>
  </div>

  <div class="pie-redes">
    <span class="pie-titulo">NUESTRA INSTITUCIÓN</span>

    <a
      href="https://www.instagram.com/polotecno.melo/"
      target="_blank"
      rel="noopener noreferrer"
    >
      Instagram
    </a>

    <a
      href="https://www.facebook.com/share/1CaneCb2D6/?mibextid=wwXIfr"
      target="_blank"
      rel="noopener noreferrer"
    >
      Facebook
    </a>
  </div>

  <div class="pie-final">
    <span>© 2026 Capi</span>
    <span>Sistema de Evaluaciones</span>
  </div>
</footer>

  </main>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '../assets/inicio.css'

const zonaCrema = ref(false)

const controlarNav = () => {
  zonaCrema.value = window.scrollY >= 450
}

onMounted(() => {
  window.addEventListener('scroll', controlarNav)
  controlarNav()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', controlarNav)
})
</script>
