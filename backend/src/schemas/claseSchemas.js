import { z } from "zod"

const crearClaseSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, "Ingresa un nombre valido")
        .max(100, "Demasiados caracteres"),

    periodo_lectivo: z.string()
        .trim()
        .min(1, "Ingresa un nombre valido")
        .max(30, "Demasiados caracteres")
})

const idPositivoSchema = z.coerce.number()
    .int("Debe ser un numero entero")
    .positive("Debe ser un numero positivo")
    .max(2147483647, "El valor esta fuera del rango permitido")

const inscribirAlumnoSchema = z.object({
    cedula_alumno: idPositivoSchema
})

const idClaseParamsSchema = z.object({
    id_clase: idPositivoSchema
})

const actualizarEstadoParamsSchema = z.object({
    id_clase: idPositivoSchema,
    cedula_alumno: idPositivoSchema
})

const actualizarEstadoBodySchema = z.object({
    estado: z.enum(["activo", "retirado"], {
        error: "El estado debe ser activo o retirado"
    })
})

export {
    crearClaseSchema,
    inscribirAlumnoSchema,
    idClaseParamsSchema,
    actualizarEstadoParamsSchema,
    actualizarEstadoBodySchema
}
