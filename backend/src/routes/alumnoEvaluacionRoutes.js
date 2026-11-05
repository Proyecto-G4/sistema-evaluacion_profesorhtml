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
    obtenerResultadoEvaluacion,
    obtenerMisClasesAlumno,
} from "../controllers/alumnoEvaluacionController.js"
const router = Router()

router.use(auth)

router.get(
    "/perfil",
    roleAlumno,
    obtenerMiPerfil
)

router.get(
    "/perfil",
    roleAlumno,
    obtenerMiPerfil
)

router.get(
    "/clases",
    roleAlumno,
    obtenerMisClasesAlumno
)

router.get(
    "/evaluaciones",
    roleAlumno,
    obtenerEvaluaciones
)

router.post(
    "/evaluaciones/:id/iniciar",
    roleAlumno,
    iniciarEvaluacion
)


router.post(
    "/evaluaciones/respuestas/:id",
    roleAlumno,
    guardarRespuesta
)

router.get(
    "/evaluaciones/:id/progreso",
    roleAlumno,
    obtenerProgresoEvaluacion
)

router.get(
    "/evaluaciones/:id/resultados",
    roleAlumno,
    obtenerResultadoEvaluacion)

router.post(
    "/evaluaciones/:id/finalizar",
    roleAlumno,
    finalizarEvaluacion
)

router.post(
    "/evaluaciones/entrega/:id",
    roleAlumno,
    (req, res, next) => {
        upload.single("archivo")(req, res, (error) => {
            if (error) {
                if (error.message === "Tipo de archivo no permitido") {
                    return res.status(400).json({
                        mensaje: "Tipo de archivo no permitido"
                    })
                }

                if (error.code === "LIMIT_FILE_SIZE") {
                    return res.status(413).json({
                        mensaje: "El archivo supera el tamaño permitido"
                    })
                }

                if (error.code === "LIMIT_UNEXPECTED_FILE") {
                    return res.status(400).json({
                        mensaje: "El campo del archivo no es válido o se enviaron demasiados archivos"
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
