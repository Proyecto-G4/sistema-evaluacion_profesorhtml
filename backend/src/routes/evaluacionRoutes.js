import { Router } from "express"

import {
    crearEvaluacion,
    agregarPreguntaAEvaluacion,
    obtenerPreguntasDeEvaluacion,
    eliminarPreguntaDeEvaluacion
} from "../controllers/evaluacionController.js"

import { auth } from "../middlewares/auth.js"
import { roleProfesor } from "../middlewares/role.js"

const router = Router()
router.use(auth, roleProfesor)
router.post(
    "/",
    crearEvaluacion
)

router.post(
    "/:id/preguntas/:idConsigna",
    agregarPreguntaAEvaluacion
)

router.get(
    "/:id/preguntas",
    obtenerPreguntasDeEvaluacion
)

router.delete(
    "/:id/preguntas/:idConsigna",
    eliminarPreguntaDeEvaluacion
)

export default router