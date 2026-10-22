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
router.put(
    "/:id/respuesta",
    auth,
    roleProfesor,
    guardarRespuestaCorrecta
)

router.get(
    "/",
    auth,
    roleProfesor,
    obtenerConsignas
)

router.get(
    "/:id",
    auth,
    roleProfesor,
    obtenerConsignaPorId
)

router.post(
    "/",
    auth,
    roleProfesor,
    crearConsigna
)

router.put(
    "/:id",
    auth,
    roleProfesor,
    actualizarConsigna
)

router.delete(
    "/:id",
    auth,
    roleProfesor,
    eliminarConsigna
)

export default router