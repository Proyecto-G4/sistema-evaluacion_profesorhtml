import { Router } from "express"
import { crearClase, 
        obtenerMisClases,
        inscribirALumnoEnClase } from "../controllers/claseController.js"
import { auth } from "../middlewares/auth.js"
import { roleProfesor } from "../middlewares/role.js"

const router = Router()
router.use(auth, roleProfesor)

router.post("/", crearClase)
router.post("/:id_clase/alumnos", inscribirALumnoEnClase)
router.get("/", obtenerMisClases)

export default router