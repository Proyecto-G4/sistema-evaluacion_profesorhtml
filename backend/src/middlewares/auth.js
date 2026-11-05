import jwt from "jsonwebtoken"
import { pool } from "../config/database.js"

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({
                mensaje: "Token no proporcionado"
            })
        }

        const [tipo, token] = authHeader.split(" ")

        if (tipo !== "Bearer" || !token) {
            return res.status(401).json({
                mensaje: "Formato de autorización inválido"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const [cuentas] = await pool.query(
            `
            SELECT id_login, usuario, rol, estado
            FROM login
            WHERE id_login = ?
            `,
            [decoded.id]
        )

        if (cuentas.length === 0) {
            return res.status(401).json({
                mensaje: "La cuenta asociada al token ya no existe"
            })
        }

        const cuenta = cuentas[0]

        if (cuenta.estado !== "activo") {
            return res.status(403).json({
                mensaje: cuenta.estado === "suspendido"
                    ? "La cuenta está suspendida"
                    : "La cuenta está eliminada"
            })
        }

        // Se usan los datos vigentes de la base, no el rol viejo del token.
        req.user = {
            id: cuenta.id_login,
            usuario: cuenta.usuario,
            // Unifica el rol vigente antes de aplicar middleware y lógica de controladores.
            rol: String(cuenta.rol || "").trim().toLowerCase()
        }

        next()
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                mensaje: error.name === "TokenExpiredError"
                    ? "Token caducado"
                    : "Token inválido"
            })
        }

        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    auth
}
