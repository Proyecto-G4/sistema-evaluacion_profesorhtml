import { Router } from "express"
import { obtenerAlumnos,
        obtenerAlumnosPorCedula, 
        crearAlumno, 
        actualizarAlumno, 
        eliminarAlumno } from "../controllers/alumnoController.js"
import { auth } from "../middlewares/auth.js"
import { roleAdmin } from "../middlewares/role.js"

const router = Router();
router.use(auth, roleAdmin) // Aplica ambos middlewares para todas las rutas nombradas

router.get("/", obtenerAlumnos)

router.get("/:cedula", obtenerAlumnosPorCedula)

router.post("/", crearAlumno)

router.put("/:cedula", actualizarAlumno)

router.delete("/:cedula", eliminarAlumno)

export default router;
