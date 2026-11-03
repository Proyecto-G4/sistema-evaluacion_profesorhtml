import { Router } from "express"
import { crearUsuario, crearCuentaProfesor, login, consultarSolicitudAlumno } from "../controllers/authController.js"
import { auth } from "../middlewares/auth.js"
import { roleAdmin } from "../middlewares/role.js"
import { validarBody } from "../middlewares/validate.js"
import { registroAlumnoSchema, 
        registroProfeSchema,
        loginSchema } from "../schemas/authSchemas.js"
import { consultarSolicitudSchema } from "../schemas/cuentaSchemas.js"

const router = Router()

router.post(
        "/profesores", 
        auth, roleAdmin, 
        validarBody(registroProfeSchema), 
        crearCuentaProfesor)

router.post(
        "/register/estado",
        validarBody(consultarSolicitudSchema),
        consultarSolicitudAlumno)
        
router.post("/register", validarBody(registroAlumnoSchema), crearUsuario)
router.post("/login", validarBody(loginSchema), login)

export default router
