import { Router } from "express"
import { auth } from "../middlewares/auth.js"
import { roleRevisorCuenta, roleAdmin, roleSolicitanteCuenta } from "../middlewares/role.js"
import { validarBody, validarParams } from "../middlewares/validate.js"
import {
    idSolicitudParamsSchema,
    resolverSolicitudAltaSchema,
    idCuentaParamsSchema,
    cambiarEstadoCuentaSchema,
    solicitarGestionCuentaSchema,
    resolverSolicitudGestionSchema
} from "../schemas/cuentaSchemas.js"
import {
    obtenerSolicitudesAltaAlumno,
    resolverSolicitudAltaAlumno,
    obtenerCuentas,
    cambiarEstadoCuenta,
    solicitarGestionCuenta,
    obtenerSolicitudesGestion,
    resolverSolicitudGestion,
    obtenerMisSolicitudesGestion
} from "../controllers/cuentaController.js"

const router = Router()

router.use(auth)

router.get(
    "/solicitudes/alumnos",
    roleRevisorCuenta,
    obtenerSolicitudesAltaAlumno)

router.get(
    "/",
    roleAdmin,
    obtenerCuentas
)

router.get(
    "/solicitudes/gestion",
    roleAdmin,
    obtenerSolicitudesGestion
)

router.get(
    "/solicitudes/gestion/mias",
    roleSolicitanteCuenta,
    obtenerMisSolicitudesGestion
)

router.patch(
    "/solicitudes/gestion/:id",
    roleAdmin,
    validarParams(idSolicitudParamsSchema),
    validarBody(resolverSolicitudGestionSchema),
    resolverSolicitudGestion
)

router.post(
    "/:id/solicitudes",
    roleSolicitanteCuenta,
    validarParams(idCuentaParamsSchema),
    validarBody(solicitarGestionCuentaSchema),
    solicitarGestionCuenta
)

router.patch(
    "/:id/estado",
    roleAdmin,
    validarParams(idCuentaParamsSchema),
    validarBody(cambiarEstadoCuentaSchema),
    cambiarEstadoCuenta
)

router.patch(
    "/solicitudes/alumnos/:id",
    roleRevisorCuenta,
    validarParams(idSolicitudParamsSchema),
    validarBody(resolverSolicitudAltaSchema),
    resolverSolicitudAltaAlumno)

export default router
