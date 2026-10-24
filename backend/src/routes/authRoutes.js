import { Router } from "express"
import { crearUsuario, crearCuentaProfesor, login } from "../controllers/authController.js"
import { auth } from "../middlewares/auth.js"
import { roleAdmin } from "../middlewares/role.js"
import { validarBody } from "../middlewares/validate.js"
import { registroAlumnoSchema, 
        registroProfeSchema,
        loginSchema } from "../schemas/authSchemas.js"

const router = Router()

router.post(
        "/profesores", 
        auth, roleAdmin, 
        validarBody(registroProfeSchema), 
        crearCuentaProfesor)
        
router.post("/register", validarBody(registroAlumnoSchema), crearUsuario)
router.post("/login", validarBody(loginSchema), login)

export default router
