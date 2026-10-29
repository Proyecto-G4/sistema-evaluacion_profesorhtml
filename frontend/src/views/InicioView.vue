
<template>
  <main class="inicio">
    <header class="encabezado">
      <a class="marca" href="/" aria-label="PET, inicio">
        <span class="marca-icono">P</span>
        <span class="marca-texto">
          <strong>PET</strong>
          <small>Sistema de Evaluaciones</small>
        </span>
      </a>
    </header>

    <section class="bienvenida">
      <span class="etiqueta">TU ESPACIO EDUCATIVO</span>

      <h1>¡Bienvenido a PET!</h1>

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
          <p>Un espacio para las novedades de PET.</p>
        </article>
      </div>
    </section>

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
            <h3>Agenda PET</h3>
            <p>Información para toda la comunidad educativa.</p>
          </div>
        </article>
      </div>
    </section>

    <footer class="pie">
      <strong>PET</strong>
      <span>Sistema de Evaluaciones</span>
    </footer>
  </main>
</template>

<style scoped>
.inicio {
  min-height: 100vh;
  background: #faf9fc;
  color: #201b2b;
  font-family: Arial, sans-serif;
}

.encabezado {
  padding: 22px 7%;
  border-bottom: 1px solid #e8e3ef;
}

.marca {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.marca-icono {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: #7545c8;
  color: white;
  font-size: 23px;
  font-weight: bold;
}

.marca-texto {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.marca-texto strong {
  font-size: 21px;
  letter-spacing: 2px;
}

.marca-texto small {
  color: #777080;
}

.bienvenida {
  padding: 90px 20px 100px;
  text-align: center;
  background:
    radial-gradient(ellipse at top, #eee5ff 0%, transparent 65%);
}

.etiqueta,
.titulo-seccion > span {
  color: #7545c8;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2px;
}

.bienvenida h1 {
  margin: 20px 0 14px;
  font-size: clamp(36px, 5vw, 58px);
}

.bienvenida > p {
  color: #70697b;
  font-size: 18px;
}

.acciones {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 32px;
}

.boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 24px;
  border: 1px solid #7545c8;
  border-radius: 10px;
  font-weight: bold;
  text-decoration: none;
  transition: transform 0.2s, background 0.2s;
}

.boton:hover {
  transform: translateY(-2px);
}

.boton-principal {
  background: #7545c8;
  color: white;
}

.boton-principal:hover {
  background: #6035a9;
}

.boton-secundario {
  background: white;
  color: #7545c8;
}

.novedades,
.eventos {
  padding: 65px 7%;
}

.titulo-seccion {
  margin-bottom: 30px;
}

.titulo-seccion h2 {
  margin: 12px 0;
  font-size: clamp(26px, 3vw, 36px);
}

.titulo-seccion p {
  color: #777080;
}

.pizarron {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  padding: 35px;
  border: 10px solid #68452f;
  border-radius: 8px;
  background: #286342;
  box-shadow: inset 0 0 20px #143b28;
}

.nota {
  min-height: 175px;
  padding: 22px;
  color: #302b32;
  box-shadow: 3px 5px 9px #0003;
  transform: rotate(-1deg);
}

.nota span {
  font-size: 12px;
  font-weight: bold;
}

.nota h3 {
  margin-top: 18px;
}

.nota p {
  line-height: 1.5;
}

.nota-amarilla {
  background: #ffed9a;
}

.nota-rosa {
  background: #f8c5d8;
  transform: rotate(1deg);
}

.nota-lila {
  background: #d9c8ff;
}

.eventos {
  background: #f0ebf8;
}

.lista-eventos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.evento {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border: 1px solid #e4d9f5;
  border-radius: 14px;
  background: white;
}

.evento-icono {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #e9ddff;
  color: #7545c8;
  font-weight: bold;
}

.evento h3 {
  margin-top: 4px;
}

.evento p {
  color: #777080;
  line-height: 1.5;
}

.pie {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 28px;
  color: #777080;
}

.pie strong {
  color: #7545c8;
}

@media (max-width: 750px) {
  .bienvenida {
    padding: 65px 20px;
  }

  .pizarron {
    grid-template-columns: 1fr;
    padding: 22px;
  }

  .lista-eventos {
    grid-template-columns: 1fr;
  }

  .nota {
    min-height: auto;
  }
}
</style>
