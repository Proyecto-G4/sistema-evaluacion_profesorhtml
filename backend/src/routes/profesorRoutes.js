import { Router } from "express"
import { obtenerProfesores, 
        obtenerProfesoresPorCedula, 
        crearProfesor, 
        actualizarProfesor, 
        eliminarProfesor } from "../controllers/profesorController.js"
import { auth } from "../middlewares/auth.js"
import { roleAdmin } from "../middlewares/role.js"

const router = Router();
router.use(auth, roleAdmin) // Esto aplica ambos middlewares para todas las rutas nombradas abajo

router.get("/", obtenerProfesores)

router.get("/:cedula", obtenerProfesoresPorCedula)

router.post("/", crearProfesor)

router.put("/:cedula", actualizarProfesor)

router.delete("/:cedula", eliminarProfesor)

export default router;
