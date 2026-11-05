import { Router } from "express"

import {
    crearEvaluacion,
    obtenerEvaluacionesProfesor,
    eliminarEvaluacion,
    agregarPreguntaAEvaluacion,
    obtenerPreguntasDeEvaluacion,
    eliminarPreguntaDeEvaluacion,
    obtenerResultadosProfesor,
    calificarRespuestaAlumno
} from "../controllers/evaluacionController.js"

import { auth } from "../middlewares/auth.js"
import { roleProfesor } from "../middlewares/role.js"

const router = Router()

router.use(auth, roleProfesor)

router.get(
    "/",
    obtenerEvaluacionesProfesor
)

router.post(
    "/",
    crearEvaluacion
)

router.delete(
    "/:id",
    eliminarEvaluacion
)

router.post(
    "/:id/preguntas/:idConsigna",
    agregarPreguntaAEvaluacion
)

router.get(
    "/:id/preguntas",
    obtenerPreguntasDeEvaluacion
)

router.get("/:id/resultados", obtenerResultadosProfesor)
router.patch("/:id/resultados/:idRespuesta", calificarRespuestaAlumno)

router.delete(
    "/:id/preguntas/:idConsigna",
    eliminarPreguntaDeEvaluacion
)

export default router
