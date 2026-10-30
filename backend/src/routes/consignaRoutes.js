import { Router } from "express"

import {
    obtenerConsignas,
    obtenerConsignaPorId,
    crearConsigna,
    actualizarConsigna,
    eliminarConsigna,
    guardarRespuestaCorrecta
} from "../controllers/consignaController.js"

import { auth } from "../middlewares/auth.js"

import { roleProfesor } from "../middlewares/role.js"

const router = Router()
router.use(auth, roleProfesor)
router.put(
    "/:id/respuesta",
    guardarRespuestaCorrecta
)

router.get(
    "/",
    obtenerConsignas
)

router.get(
    "/:id",
    obtenerConsignaPorId
)

router.post(
    "/",
    crearConsigna
)

router.put(
    "/:id",
    actualizarConsigna
)

router.delete(
    "/:id",
    eliminarConsigna
)

export default router