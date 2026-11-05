import { pool } from "../config/database.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { createHash, randomBytes } from "node:crypto"

const hashConsulta = (token) =>
    createHash("sha256").update(token).digest("hex")

/**
 * Crear un registro nuevo de usuario
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const crearUsuario = async (req, res) => {
    let conexion

    try {
        const { usuario, password, cedula } = req.body

        conexion = await pool.getConnection()
        await conexion.beginTransaction()

        const [alumnos] = await conexion.query(
            `SELECT cedula_alumno
             FROM alumno
             WHERE cedula_alumno = ?
             FOR UPDATE`,
            [cedula]
        )

        if (alumnos.length === 0) {
            await conexion.rollback()
            return res.status(400).json({
                mensaje: "No existe un alumno con esa cedula"
            })
        }

        const [cuentas] = await conexion.query(
            `SELECT id_login
             FROM login
             WHERE alumno_cedula_alumno = ? OR usuario = ?`,
            [cedula, usuario]
        )

        if (cuentas.length > 0) {
            await conexion.rollback()
            return res.status(409).json({
                mensaje: "La cedula o el usuario ya estan asociados a una cuenta"
            })
        }

        const [solicitudesPendientes] = await conexion.query(
            `SELECT id_solicitud
             FROM solicitud_alta_alumno
             WHERE estado = 'pendiente'
               AND (alumno_cedula_alumno = ? OR usuario = ?)
             FOR UPDATE`,
            [cedula, usuario]
        )

        if (solicitudesPendientes.length > 0) {
            await conexion.rollback()
            return res.status(409).json({
                mensaje: "Ya existe una solicitud pendiente para esos datos"
            })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const tokenConsulta = randomBytes(32).toString("base64url")
        const tokenConsultaHash = hashConsulta(tokenConsulta)

        const [resultado] = await conexion.query(
            `INSERT INTO solicitud_alta_alumno (
                alumno_cedula_alumno,
                usuario,
                password_hash,
                token_consulta_hash
             )
             VALUES (?, ?, ?, ?)`,
            [cedula, usuario, passwordHash, tokenConsultaHash]
        )

        await conexion.query(
            `INSERT INTO auditoria_cuenta (
                tipo_solicitud,
                solicitud_id,
                accion,
                alumno_cedula,
                actor_usuario,
                actor_rol
             )
             VALUES ('alta_alumno', ?, 'solicitud_enviada', ?, ?, 'alumno_solicitante')`,
            [resultado.insertId, cedula, `cedula:${cedula}`]
        )

        await conexion.commit()

        return res.status(202).json({
            mensaje: "Solicitud enviada. Un docente o administrador debe revisarla.",
            solicitud: {
                id: resultado.insertId,
                estado: "pendiente",
                token_consulta: tokenConsulta
            }
        })

    } catch (error) {

        if (conexion) {
            await conexion.rollback().catch(() => {})
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensaje: "Ya existe una solicitud pendiente para esos datos"
            })
        }

        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })

    } finally {
        if (conexion) {
            conexion.release()
        }
    }
}

const consultarSolicitudAlumno = async (req, res) => {
    try {
        const { id, token } = req.body

        const [solicitudes] = await pool.query(
            `
            SELECT
                estado,
                motivo_rechazo,
                fecha_solicitud,
                fecha_resolucion
            FROM solicitud_alta_alumno
            WHERE id_solicitud = ?
              AND token_consulta_hash = ?
            `,
            [id, hashConsulta(token)]
        )

        if (solicitudes.length === 0) {
            return res.status(404).json({
                mensaje: "Solicitud no encontrada"
            })
        }

        return res.status(200).json({
            solicitud: solicitudes[0]
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

/**
 * Crear un registro de cuenta para profesor
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const crearCuentaProfesor = async (req, res) => {
    try {
        const {
            cedula_profesor,
            usuario,
            password,
        } = req.body;

        const [profesores] = await pool.query(
            `
            SELECT cedula_profesor
            FROM profesor
            WHERE cedula_profesor = ?
            `,
            [cedula_profesor]
        )

        if (profesores.length === 0) {
            return res.status(404).json({
                mensaje: "No existe un profesor con esa cedula"
            })
        }

        const [cuentasProfesor] = await pool.query (
            `
            SELECT id_login
            FROM login
            WHERE profesor_cedula_profesor = ?
            `,
            [cedula_profesor]
        );

        if (cuentasProfesor.length > 0) {
            return res.status(409).json({
                mensaje: "Este profesor ya tiene una cuenta"
            })
        }

        const [usuarios] = await pool.query (
            `
            SELECT id_login
            FROM login
            WHERE usuario = ?
            `,
            [usuario]
        )

        if (usuarios.length > 0) {
            return res.status(409).json({
                mensaje: "Este usuario ya está registrado"
            })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        await pool.query (
            `
            INSERT INTO login (
            usuario,
            password_hash,
            rol,
            profesor_cedula_profesor
            )
            VALUES (?, ?, "profesor", ?)
            `,
            [usuario, passwordHash, cedula_profesor]
        )

        return res.status(201).json({
            mensaje: "Cuenta de profesor creada correctamente"
        })

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

/**
 * Inicio de sesion
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const login = async (req, res) => {
    try {
        const {usuario, password} = req.body;

        const [usuarios] = await pool.query(
            `
            SELECT *
            FROM login
            WHERE usuario = ?
            `,
            [usuario]
        )

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensaje: "Credenciales inválidas"
            });
        }

        const usuarioEncontrado = usuarios[0];

        const passwordCorrecta = await bcrypt.compare(
            password,
            usuarioEncontrado.password_hash
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                mensaje: "Credenciales inválidas"
            });
        }

        if (usuarioEncontrado.estado !== "activo") {
            return res.status(403).json({
                mensaje: usuarioEncontrado.estado === "suspendido"
                    ? "La cuenta está suspendida"
                    : "La cuenta está eliminada"
            })
        }

        const rol = String(usuarioEncontrado.rol || "").trim().toLowerCase()
        if (!["alumno", "profesor", "admin"].includes(rol)) {
            return res.status(403).json({ mensaje: "El rol de la cuenta no es válido" })
        }

        const token = jwt.sign(
            {
                id: usuarioEncontrado.id_login,
                usuario: usuarioEncontrado.usuario,
                rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            mensaje: "Login exitoso",
            token
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

export {
    crearUsuario,
    crearCuentaProfesor,
    login,
    consultarSolicitudAlumno
}
