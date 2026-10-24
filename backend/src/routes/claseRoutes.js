import { Router } from "express"
import {
    crearClase,
    obtenerMisClases,
    inscribirALumnoEnClase,
    obtenerAlumnosDeClase,
    actualizarEstadoAlumnoEnClase
} from "../controllers/claseController.js"
import { auth } from "../middlewares/auth.js"
import { roleProfesor } from "../middlewares/role.js"
import { validarBody, validarParams } from "../middlewares/validate.js"
import {
    crearClaseSchema,
    inscribirAlumnoSchema,
    actualizarEstadoBodySchema,
    idClaseParamsSchema,
    actualizarEstadoParamsSchema,
} from "../schemas/claseSchemas.js"

const router = Router()
router.use(auth, roleProfesor)

router.post("/", validarBody(crearClaseSchema), crearClase)

router.post(
    "/:id_clase/alumnos",
    validarParams(idClaseParamsSchema),
    validarBody(inscribirAlumnoSchema),
    inscribirALumnoEnClase
)
router.get("/", obtenerMisClases)

router.get(
        "/:id_clase/alumnos",
        validarParams(idClaseParamsSchema),
        obtenerAlumnosDeClase)

router.patch(
    "/:id_clase/alumnos/:cedula_alumno",
    validarParams(actualizarEstadoParamsSchema),
    validarBody(actualizarEstadoBodySchema),
    actualizarEstadoAlumnoEnClase
)

export default router
