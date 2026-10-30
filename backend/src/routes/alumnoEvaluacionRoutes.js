import { Router } from "express"
import { auth } from "../middlewares/auth.js"
import { roleAlumno } from "../middlewares/role.js"
import { upload } from "../middlewares/upload.js"
import {
    obtenerMiPerfil,
    obtenerEvaluaciones,
    iniciarEvaluacion,
    guardarRespuesta,
    obtenerProgresoEvaluacion,
    finalizarEvaluacion,
    subirArchivo,
    obtenerResultadoEvaluacion
} from "../controllers/alumnoEvaluacionController.js"
const router = Router()
router.use(auth, roleAlumno)

router.get(
    "/perfil",
    obtenerMiPerfil
)

router.get(
    "/evaluaciones",
    obtenerEvaluaciones
)

router.post(
    "/evaluaciones/:id/iniciar",
    iniciarEvaluacion
)


router.post(
    "/evaluaciones/respuestas/:id",
    guardarRespuesta
)

router.get(
    "/evaluaciones/:id/progreso",
    obtenerProgresoEvaluacion
)

router.get(
    "/evaluaciones/:id/resultados",
    obtenerResultadoEvaluacion)

router.post(
    "/evaluaciones/:id/finalizar",
    finalizarEvaluacion
)

router.post(
    "/evaluaciones/entrega/:id",
    (req, res, next) => {
        upload.single("archivo")(req, res, (error) => {
            if (error) {
                if (error.message === "Tipo de archivo no permitido") {
                    return res.status(400).json({
                        mensaje: "Tipo de archivo no permitido"
                    })
                }

                return res.status(500).json({
                    mensaje: "Error al subir el archivo"
                })
            }

            next()
        })
    },
    subirArchivo
)

export default router