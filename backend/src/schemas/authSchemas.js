import { z } from "zod"

const registroAlumnoSchema = z.object({
    usuario: z.string()
        .trim()
        .min(1, "Ingresa un nombre válido")
        .max(50, "Demasiados caracteres"),
    
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres"),

    confirmarPassword: z.string(),

    rol: z.literal("alumno"),

    cedula: z.coerce.number()
        .int("La cedula debe ser un numero entero")
        .positive("La cedula debe ser positiva")
        .max(2147483647, "La cedula esta fuera del rango permitido")

}).refine(
    datos => datos.password === datos.confirmarPassword,
    {
        path: ["confirmarPassword"],
        message: "Las contraseñas no coinciden"
    }
)

const registroProfeSchema = z.object({
    cedula_profesor: z.coerce.number()
        .int("La cedula debe ser un numero entero")
        .positive("La cedula debe ser positiva")
        .max(2147483647, "La cedula esta fuera del rango permitido"),
    
    usuario: z.string()
        .trim()
        .min(1, "Ingresa un nombre valido")
        .max(50, "Demasiados caracteres"),

    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres"),

    confirmarPassword: z.string(),

}).refine(
    datos => datos.password === datos.confirmarPassword,
    {
        path: ["confirmarPassword"],
        message: "Las contraseñas no coinciden"
    }
)

const loginSchema = z.object({
    usuario: z.string()
        .trim()
        .min(1, "Ingresa un nombre valido")
        .max(50, "Demasiados caracteres"),
    
    password: z.string()
        .min(1, "La contraseña es obligatoria")
})

export {
    registroAlumnoSchema,
    registroProfeSchema,
    loginSchema
}