import { z } from "zod"

const idSolicitudParamsSchema = z.object({
    id: z.coerce.number()
        .int()
        .positive()
        .max(Number.MAX_SAFE_INTEGER)
})

const resolverSolicitudAltaSchema = z.object({
    decision: z.enum(["aprobar", "rechazar"]),
    motivo: z.string().trim().max(2000).optional()
}).refine(
    datos =>
        datos.decision !== "rechazar" ||
        Boolean(datos.motivo && datos.motivo.length >= 5),
    {
        path: ["motivo"],
        message: "El rechazo requiere un motivo de al menos 5 caracteres"
    }
)

const consultarSolicitudSchema = z.object({
    id: z.coerce.number()
        .int()
        .positive()
        .max(Number.MAX_SAFE_INTEGER),
    token: z.string()
        .min(32)
        .max(128)
})

const idCuentaParamsSchema = z.object({
    id: z.coerce.number()
        .int()
        .positive()
        .max(2147483647)
})

const cambiarEstadoCuentaSchema = z.object({
    estado: z.enum(["activo", "suspendido", "eliminado"]),
    motivo: z.string().trim().max(2000).optional()
})

const solicitarGestionCuentaSchema = z.object({
    accion: z.enum(["suspender", "eliminar"]),
    motivo: z.string()
        .trim()
        .min(5, "Explicá el motivo con al menos 5 caracteres")
        .max(2000)
})

const resolverSolicitudGestionSchema = z.object({
    decision: z.enum(["aprobar", "rechazar"]),
    motivo: z.string().trim().max(2000).optional()
}).refine(
    datos =>
        datos.decision !== "rechazar" ||
        Boolean(datos.motivo && datos.motivo.length >= 5),
    {
        path: ["motivo"],
        message: "El rechazo requiere un motivo de al menos 5 caracteres"
    }
)

export {
    idSolicitudParamsSchema,
    resolverSolicitudAltaSchema,
    consultarSolicitudSchema,
    idCuentaParamsSchema,
    cambiarEstadoCuentaSchema,
    solicitarGestionCuentaSchema,
    resolverSolicitudGestionSchema
}