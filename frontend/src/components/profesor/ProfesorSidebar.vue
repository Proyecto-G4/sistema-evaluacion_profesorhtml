<script setup>
import { ref } from 'vue'

defineProps({
  activa: { type: String, default: 'Inicio' },
  fotoPerfil: { type: String, default: '' },
  nombreProfesor: { type: String, default: 'Profesor' }
})

const emit = defineEmits(['seleccionar', 'salir'])
const masAbierto = ref(false)

const menuPrincipal = [
  { nombre: 'Inicio', icono: '⌂' },
  { nombre: 'Mis clases', icono: '▦' },
  { nombre: 'Evaluaciones', icono: '▤' },
  { nombre: 'Tareas y materiales', icono: '📁' },
  { nombre: 'Solicitudes', icono: '✉' },
  { nombre: 'Calificaciones', icono: '▥' },
  { nombre: 'Chat', icono: '💬' }
]

const menuSecundario = [
  { nombre: 'Banco de preguntas', icono: '▧' },
  { nombre: 'Configuración', icono: '⚙' }
]

function seleccionar(nombre) {
  emit('seleccionar', nombre)
  masAbierto.value = false
}
</script>

<template>
  <nav class="profesor-navegacion">
    <div class="nav-marca">
      <div class="nav-logo">C</div>
      <div>
        <strong>Capi</strong>
        <span>Espacio docente</span>
      </div>
    </div>

    <div class="nav-enlaces">
      <button
        v-for="item in menuPrincipal"
        :key="item.nombre"
        type="button"
        :class="{ activo: activa === item.nombre }"
        @click="seleccionar(item.nombre)"
      >
        <span>{{ item.icono }}</span>
        {{ item.nombre }}
      </button>

      <div class="nav-mas">
        <button
          type="button"
          :class="{ activo: menuSecundario.some(item => item.nombre === activa) }"
          @click="masAbierto = !masAbierto"
        >
          Más <span>▾</span>
        </button>

        <div v-if="masAbierto" class="nav-desplegable">
          <button
            v-for="item in menuSecundario"
            :key="item.nombre"
            type="button"
            :class="{ activo: activa === item.nombre }"
            @click="seleccionar(item.nombre)"
          >
            <span>{{ item.icono }}</span>
            {{ item.nombre }}
          </button>
        </div>
      </div>
    </div>

    <div class="nav-perfil">
      <img
        v-if="fotoPerfil"
        :src="fotoPerfil"
        class="nav-avatar nav-avatar-foto"
        alt="Foto de perfil"
      >
      <span v-else class="nav-avatar">👨🏻‍🏫</span>
      <span>{{ nombreProfesor }}</span>
      <button type="button" class="nav-salir" @click="emit('salir')">
        ↪
      </button>
    </div>
  </nav>
</template>