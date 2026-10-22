import mysql from "mysql2/promise"
import dotenv from "dotenv"
import fs from "node:fs"

dotenv.config()

console.log("DB_HOST:", process.env.DB_HOST)
console.log("DB_PORT:", process.env.DB_PORT)
console.log("DB_USER:", process.env.DB_USER)
console.log("DB_NAME:", process.env.DB_NAME)

/**
 * Pool de conexiones MYSQL
 * 
 * Permite reutilizar conexiones y mejora el rendimiento
 */

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: {
        ca: fs.readFileSync(
            new URL("../../certs/ca.pem", import.meta.url)
        )
    }
});

async function verificarConexion() {
    try {
        const conexion = await pool.getConnection()

        console.log("✅ Conexión a la base de datos exitosa")

        conexion.release()

    } catch (error) {
        console.error("❌ Error al conectarse con la base de datos: ", error.message)
    }
}

export {
    pool,
    verificarConexion
}