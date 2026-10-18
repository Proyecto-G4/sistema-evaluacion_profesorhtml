import { Router } from "express"
import { crearUsuario, crearCuentaProfesor, login } from "../controllers/authController.js"
import { auth } from "../middlewares/auth.js"
import { roleAdmin } from "../middlewares/role.js"

const router = Router()

router.post("/profesores", auth, roleAdmin, crearCuentaProfesor)
router.post("/register", crearUsuario)
router.post("/login", login)

export default router
