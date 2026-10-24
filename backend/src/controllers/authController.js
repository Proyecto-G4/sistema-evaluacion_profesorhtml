import { pool } from "../config/database.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

/**
 * Crear un registro nuevo de usuario
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const crearUsuario = async (req, res) => {
    try {
        // Recibo los datos ingresados
        const {usuario, password, rol, cedula} = req.body;

        // Verifico si la cedula pertenece a un alumno existente
        const [rolAlumno] = await pool.query(
            `
            SELECT cedula_alumno
            FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula]
        )

        if (rolAlumno.length === 0) {
            return res.status(400).json({
                mensaje: "No existe un alumno con esa cédula"
            });
        }

        // Verifico que no exista otra cuenta vinculada a un alumno
        const [cuentaAlumno] = await pool.query(
            `
            SELECT alumno_cedula_alumno
            FROM login
            WHERE alumno_cedula_alumno = ?
            `,
            [cedula]
        )

        if (cuentaAlumno.length > 0) {
            return res.status(409).json({
                mensaje: "Este alumnno ya tiene una cuenta"
            });
        }

        // Verifico que no exista el usuario
        const [usuarios] = await pool.query(
            `
            SELECT *
            FROM login
            WHERE usuario = ?
            `,
            [usuario]
        )

        if (usuarios.length > 0) {
            return res.status(409).json({
                mensaje: "El usuario ya está registrado"
            });
        }

        // Convierto la contraseña enviada a un codigo hash
        const passwordHash = await bcrypt.hash(password, 10)

        // Inserto los datos en la tabla login
        await pool.query(
            `
            INSERT INTO login (
                usuario,
                password_hash,
                rol,
                alumno_cedula_alumno
            )
            VALUES (?, ?, ?, ?)
            `,
            [usuario, passwordHash, rol, cedula]
        )

        return res.status(201).json({
            mensaje: "Usuario creado correctamente"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
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
        // Recibo datos enviados
        const {
            cedula_profesor,
            usuario,
            password,
        } = req.body;

        // Valido si la cedula recibida corresponde a un profe existente
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

        // Valido si el profesor ya tiene cuenta
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

        // Valido si ya existe el usuario
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

        // Codifico la contraseña
        const passwordHash = await bcrypt.hash(password, 10)

        // Inserto los datos validados anteriormente
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
        // Recibo los datos validados por el middleware
        const {usuario, password} = req.body;

        // Verifico que ese usuario exista
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

        // Usuario encontrado
        const usuarioEncontrado = usuarios[0];

        // Comparo contraseñas para verificar que haya puesto la correcta
        const passwordCorrecta = await bcrypt.compare(
            password,
            usuarioEncontrado.password_hash
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                mensaje: "Credenciales inválidas"
            });
        }

        const token = jwt.sign(
            {
                id: usuarioEncontrado.id_login,
                usuario: usuarioEncontrado.usuario,
                rol: usuarioEncontrado.rol
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
    login
}
