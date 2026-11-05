
import { createRouter, createWebHistory } from 'vue-router'

import InicioView from '../views/InicioView.vue'
import LoginView from '../views/LoginView.vue'
import RegistroView from '../views/RegistroView.vue'
import Profesor from '../views/Profesor.vue'
import { leerSesion } from '../lib/auth'
import Alumno from '../views/Alumno.vue'
import Admin from '../views/Admin.vue'

const routes = [
  {
    path: '/',
    name: 'inicio',
    component: InicioView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/registro',
    name: 'registro',
    component: RegistroView
  },
  {
    path: '/profesor',
    name: 'profesor',
    component: Profesor,
    meta: { requiereRol: 'profesor' }
  },
  {
    path: '/alumno',
    name: 'alumno',
    component: Alumno,
    meta: { requiereRol: 'alumno' }
  },
  {
    path: '/admin',
    name: 'admin',
    component: Admin,
    meta: { requiereRol: 'admin' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// La UI solo usa los claims para navegación; la API vuelve a validar el JWT.
router.beforeEach((to) => {
  if (!to.meta.requiereRol) return true
  const sesion = leerSesion()
  if (!sesion) return { name: 'login', query: { destino: to.fullPath } }
  if (sesion.rol !== to.meta.requiereRol) return { name: 'inicio' }
  return true
})

// Si una API detecta token vencido, se abandona la vista privada en el momento.
window.addEventListener('capi:session-expired', () => {
  if (router.currentRoute.value.meta.requiereRol) router.replace({ name: 'login' })
})

export default router
