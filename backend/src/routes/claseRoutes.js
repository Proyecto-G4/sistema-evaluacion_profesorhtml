import { Router } from "express"
import { crearClase, 
        obtenerMisClases,
        inscribirALumnoEnClase,
        obtenerAlumnosDeClase,
        actualizarEstadoAlumnoEnClase } from "../controllers/claseController.js"
import { auth } from "../middlewares/auth.js"
import { roleProfesor } from "../middlewares/role.js"

const router = Router()
router.use(auth, roleProfesor)

router.post("/", crearClase)
router.post("/:id_clase/alumnos", inscribirALumnoEnClase)
router.get("/", obtenerMisClases)
router.get("/:id_clase/alumnos", obtenerAlumnosDeClase)
router.patch("/:id_clase/alumnos/:cedula_alumno", actualizarEstadoAlumnoEnClase)

export default router