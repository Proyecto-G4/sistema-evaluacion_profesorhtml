This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
src/
  config/
    database.js
  controllers/
    alumnoController.js
    alumnoEvaluacionController.js
    authController.js
    consignaController.js
    evaluacionController.js
    profesorController.js
  middlewares/
    auth.js
    role.js
    upload.js
  routes/
    alumnoEvaluacionRoutes.js
    alumnoRoutes.js
    authRoutes.js
    consignaRoutes.js
    evaluacionRoutes.js
    profesorRoutes.js
    testRoutes.js
  app.js
  server.js
uploads/
  1789832230689-archivo.js
  1789832854090-archivo.js
  1789837579173-archivo3.js
  1790019370981-archivo3.py
.gitignore
package.json
```

# Files

## File: src/config/database.js
```javascript
import mysql from "mysql2/promise"
import dotenv from "dotenv"

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

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});
```

## File: src/controllers/alumnoController.js
```javascript
import { pool } from "../config/database.js"

/**
 * Obtiene todos los alumnos 
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const obtenerAlumnos = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM alumno"
        );

        res.status(200).json(rows)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};

/**
 * Obtiene un alumno por su cédula
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const obtenerAlumnosPorCedula = async (req, res) => {
    try {
        const { cedula } = req.params;

        const [rows] = await pool.query(
            `
            SELECT *
            FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Alumno no encontrado"
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};

/**
 * Crear un nuevo alumno
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const crearAlumno = async (req, res) => {
    try {
        const {
            cedula_alumno,
            nombre,
            apellido,
            correo
        } = req.body;

        if (!cedula_alumno || !nombre || !apellido || !correo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            }); 
        }

        const [cedulaExistente] = await pool.query(
            `
            SELECT cedula_alumno
            FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula_alumno]
        );

        if (cedulaExistente.length > 0) {
            return res.status(409).json({
                mensaje: "La cedula ya está registrada"
            });
        }

        const [correoExistente] = await pool.query(
            `
            SELECT correo
            FROM alumno
            WHERE correo = ?
            `,
            [correo]
        );

        if (correoExistente.length > 0) {
            return res.status(409).json({
                mensaje: "Este correo ya está registrado"
            });
        }

        await pool.query(
            `
            INSERT INTO alumno (
                cedula_alumno,
                nombre,
                apellido,
                correo
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                cedula_alumno,
                nombre,
                apellido,
                correo
            ]
        );

        return res.status(201).json({
            mensaje: "Alumno creado correctamente"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Actualizar registro de un alumno existente
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const actualizarAlumno = async (req, res) => {
    try {
        const {cedula} = req.params;
        const {nombre, apellido, correo} = req.body;

        // Validar que todos los campos obligatorios hayan sido enviados
        if (!nombre || !apellido || !correo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            });
        }

        // Comprobar que el alumno exista
        const [alumnos] = await pool.query(
            `
            SELECT * 
            FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "Alumno no encontrado"
            });
        }

        // Comprobar si el correo pertenece a otro registro
        const [correoExistente] = await pool.query(
            `
            SELECT cedula_alumno
            FROM alumno
            WHERE correo = ?
            AND cedula_alumno != ?
            `,
            [correo, cedula]
        )

        if (correoExistente.length > 0) {
            return res.status(409).json({
                mensaje: "El correo ya está registrado por otro alumno"
            });
        }

        // Actualizo el alumno
        await pool.query(
            `
            UPDATE alumno
            SET nombre = ?, 
                apellido = ?, 
                correo = ?
            WHERE cedula_alumno = ?
            `,
            [nombre, apellido, correo, cedula]
        )

        return res.status(200).json({
            mensaje: "Alumno actualizado correctamente"
        })

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Eliminar un registro de alumno existente
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const eliminarAlumno = async (req, res) => {
    try {
        const {cedula} = req.params;

        const [alumno] = await pool.query(
            `SELECT cedula_alumno
            FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula]
        )

        if (alumno.length === 0) {
            return res.status(404).json({
                mensaje: "Alumno no encontrado"
            });
        }

        await pool.query(
            `DELETE FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula]
        )

        return res.status(200).json({
            mensaje: "Registro de alumno eliminado correctamente"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

export {
    obtenerAlumnos,
    obtenerAlumnosPorCedula,
    crearAlumno,
    actualizarAlumno,
    eliminarAlumno
};
```

## File: src/controllers/alumnoEvaluacionController.js
```javascript
import { pool } from "../config/database.js"
import fs from "fs/promises"

const obtenerMiPerfil = async (req, res) => {
    try {
        const idLogin = req.user.id

        const [usuarios] = await pool.query(
            `
            SELECT
                l.id_login,
                l.usuario,
                l.rol,
                l.alumno_cedula_alumno,
                a.cedula_alumno,
                a.nombre,
                a.apellido,
                a.correo
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        return res.status(200).json({
            alumno: usuarios[0]
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerEvaluaciones = async (req, res) => {
    try {
        const idLogin = req.user.id

        const [evaluaciones] = await pool.query(
            `
            SELECT DISTINCT
                e.id_evaluacion,
                e.titulo,
                e.descripcion,
                e.fecha,
                e.tipo
            FROM evaluacion e
            INNER JOIN evaluacion_consigna ec
                ON ec.evaluacion_id_evaluacion = e.id_evaluacion
            INNER JOIN login l
                ON l.id_login = ?
            WHERE l.rol = 'alumno'
            ORDER BY e.fecha
            `,
            [idLogin]
        )

        return res.status(200).json({
            evaluaciones
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const iniciarEvaluacion = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno,
                a.nombre,
                a.apellido
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Buscar la evaluación
        const [evaluaciones] = await pool.query(
            `
            SELECT
                id_evaluacion,
                titulo,
                descripcion,
                fecha,
                tipo
            FROM evaluacion
            WHERE id_evaluacion = ?
            `,
            [id]
        )

        if (evaluaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Evaluación no encontrada"
            })
        }

        const evaluacion = evaluaciones[0]

        // Comprobar si el alumno ya inició esta evaluación
        const [asignacionesExistentes] = await pool.query(
            `
            SELECT
                id_asignacion,
                consigna_id_consigna,
                estado
            FROM alumno_consigna
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            `,
            [alumno.cedula_alumno, id]
        )

        // Si ya existe, devolver las mismas preguntas
        if (asignacionesExistentes.length > 0) {

            const [preguntasAsignadas] = await pool.query(
                `
                SELECT
                    ac.id_asignacion,
                    ac.consigna_id_consigna,
                    ac.estado,
                    c.consigna
                FROM alumno_consigna ac
                INNER JOIN consigna c
                    ON c.id_consigna = ac.consigna_id_consigna
                WHERE ac.alumno_cedula_alumno = ?
                AND ac.evaluacion_id_evaluacion = ?
                ORDER BY ac.id_asignacion
                `,
                [alumno.cedula_alumno, id]
            )

            return res.status(200).json({
                mensaje: "La evaluación ya fue iniciada",
                preguntas_asignadas: preguntasAsignadas
            })
        }

        // Obtener 20 preguntas aleatorias de la evaluación
        const [preguntas] = await pool.query(
            `
            SELECT
                consigna_id_consigna
            FROM evaluacion_consigna
            WHERE evaluacion_id_evaluacion = ?
            ORDER BY RAND()
            LIMIT 20
            `,
            [id]
        )

        // Verificar que haya al menos 20 preguntas
        if (preguntas.length < 20) {
            return res.status(400).json({
                mensaje: "La evaluación no tiene suficientes preguntas",
                preguntas_disponibles: preguntas.length,
                preguntas_necesarias: 20
            })
        }

        // Crear conexión para realizar la transacción
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            // Guardar las 20 preguntas seleccionadas
            for (const pregunta of preguntas) {
                await connection.query(
                    `
                    INSERT INTO alumno_consigna (
                        estado,
                        consigna_id_consigna,
                        alumno_cedula_alumno,
                        evaluacion_id_evaluacion
                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        "pendiente",
                        pregunta.consigna_id_consigna,
                        alumno.cedula_alumno,
                        id
                    ]
                )
            }

            // Registrar que el alumno inició la evaluación
            await connection.query(
                `
                INSERT INTO alumno_evaluacion (
                    alumno_cedula_alumno,
                    evaluacion_id_evaluacion,
                    estado,
                    fecha_inicio
                )
                VALUES (?, ?, ?, NOW())
                `,
                [
                    alumno.cedula_alumno,
                    id,
                    "en_progreso"
                ]
            )

            await connection.commit()

        } catch (error) {
            await connection.rollback()
            throw error

        } finally {
            connection.release()
        }

        // Obtener las preguntas asignadas con su texto
        const [preguntasAsignadas] = await pool.query(
            `
            SELECT
                ac.id_asignacion,
                ac.estado,
                ac.consigna_id_consigna,
                c.consigna
            FROM alumno_consigna ac
            INNER JOIN consigna c
                ON c.id_consigna = ac.consigna_id_consigna
            WHERE ac.alumno_cedula_alumno = ?
            AND ac.evaluacion_id_evaluacion = ?
            ORDER BY ac.id_asignacion
            `,
            [alumno.cedula_alumno, id]
        )

        return res.status(201).json({
            mensaje: "Evaluación iniciada correctamente",
            alumno,
            evaluacion,
            preguntas_asignadas: preguntasAsignadas
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const guardarRespuesta = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params
        const { respuesta } = req.body

        // Verificar que se haya enviado una respuesta
        if (!respuesta) {
            return res.status(400).json({
                mensaje: "La respuesta es obligatoria"
            })
        }

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Buscar la asignación y comprobar que pertenece al alumno
        const [asignaciones] = await pool.query(
            `
            SELECT
                ac.id_asignacion,
                ac.evaluacion_id_evaluacion,
                ac.estado
            FROM alumno_consigna ac
            WHERE ac.id_asignacion = ?
            AND ac.alumno_cedula_alumno = ?
            `,
            [id, alumno.cedula_alumno]
        )

        if (asignaciones.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró la pregunta asignada al alumno"
            })
        }

        const asignacion = asignaciones[0]

        // Comprobar que la evaluación del alumno exista
        const [evaluacionesAlumno] = await pool.query(
            `
            SELECT estado
            FROM alumno_evaluacion
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            `,
            [
                alumno.cedula_alumno,
                asignacion.evaluacion_id_evaluacion
            ]
        )

        if (evaluacionesAlumno.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el registro de la evaluación"
            })
        }

        // No permitir respuestas después de finalizar
        if (evaluacionesAlumno[0].estado === "finalizada") {
            return res.status(400).json({
                mensaje: "La evaluación ya fue finalizada"
            })
        }

        // Comprobar si ya existe una respuesta para esta pregunta
        const [respuestasExistentes] = await pool.query(
            `
            SELECT
                id_respuesta
            FROM respuesta
            WHERE alumno_consigna_id_asignacion = ?
            `,
            [id]
        )

        if (respuestasExistentes.length > 0) {
            return res.status(409).json({
                mensaje: "Esta pregunta ya fue respondida"
            })
        }

        // Guardar la respuesta
        const [resultado] = await pool.query(
            `
            INSERT INTO respuesta (
                respuesta,
                nota_final,
                alumno_cedula_alumno,
                evaluacion_id_evaluacion,
                alumno_consigna_id_asignacion
            )
            VALUES (?, NULL, ?, ?, ?)
            `,
            [
                respuesta,
                alumno.cedula_alumno,
                asignacion.evaluacion_id_evaluacion,
                asignacion.id_asignacion
            ]
        )

        // Actualizar el estado de la asignación
        await pool.query(
            `
            UPDATE alumno_consigna
            SET estado = 'respondida'
            WHERE id_asignacion = ?
            `,
            [id]
        )

        return res.status(201).json({
            mensaje: "Respuesta guardada correctamente",
            id_respuesta: resultado.insertId,
            id_asignacion: asignacion.id_asignacion
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerProgresoEvaluacion = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Obtener las preguntas asignadas de la evaluación
        const [progreso] = await pool.query(
            `
            SELECT
                ac.id_asignacion,
                ac.consigna_id_consigna,
                ac.estado,
                c.consigna
            FROM alumno_consigna ac
            INNER JOIN consigna c
                ON c.id_consigna = ac.consigna_id_consigna
            WHERE ac.alumno_cedula_alumno = ?
            AND ac.evaluacion_id_evaluacion = ?
            ORDER BY ac.id_asignacion
            `,
            [alumno.cedula_alumno, id]
        )

        if (progreso.length === 0) {
            return res.status(404).json({
                mensaje: "El alumno no tiene esta evaluación iniciada"
            })
        }

        // Contar preguntas respondidas
        const respondidas = progreso.filter(
            pregunta => pregunta.estado === "respondida"
        ).length

        return res.status(200).json({
            evaluacion_id: Number(id),
            total_preguntas: progreso.length,
            respondidas,
            pendientes: progreso.length - respondidas,
            preguntas: progreso
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const finalizarEvaluacion = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Obtener las preguntas asignadas
        const [asignaciones] = await pool.query(
            `
            SELECT
                id_asignacion,
                estado
            FROM alumno_consigna
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            `,
            [alumno.cedula_alumno, id]
        )

        if (asignaciones.length === 0) {
            return res.status(404).json({
                mensaje: "El alumno no tiene esta evaluación iniciada"
            })
        }

        // Verificar si quedaron preguntas sin responder
        const pendientes = asignaciones.filter(
            asignacion => asignacion.estado === "pendiente"
        )

        if (pendientes.length > 0) {
            return res.status(400).json({
                mensaje: "No se puede finalizar la evaluación",
                preguntas_pendientes: pendientes.length
            })
        }

        // Marcar la evaluación como finalizada
        const [resultado] = await pool.query(
            `
            UPDATE alumno_evaluacion
            SET
                estado = 'finalizada',
                fecha_finalizacion = NOW()
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            AND estado = 'en_progreso'
            `,
            [
                alumno.cedula_alumno,
                id
            ]
        )

        if (resultado.affectedRows === 0) {
            return res.status(400).json({
                mensaje: "La evaluación no está en progreso o ya fue finalizada"
            })
        }

        return res.status(200).json({
            mensaje: "Evaluación finalizada correctamente",
            evaluacion_id: Number(id),
            total_preguntas: asignaciones.length,
            preguntas_respondidas: asignaciones.length
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const subirArchivo = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params

        // Verificar que se haya enviado un archivo
        if (!req.file) {
            return res.status(400).json({
                mensaje: "No se recibió ningún archivo"
            })
        }

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            await fs.unlink(req.file.path).catch(() => {})

            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Verificar que la asignación pertenece al alumno
        const [asignaciones] = await pool.query(
            `
            SELECT
                id_asignacion,
                evaluacion_id_evaluacion
            FROM alumno_consigna
            WHERE id_asignacion = ?
            AND alumno_cedula_alumno = ?
            `,
            [id, alumno.cedula_alumno]
        )

        if (asignaciones.length === 0) {
            await fs.unlink(req.file.path).catch(() => {})

            return res.status(404).json({
                mensaje: "No se encontró la pregunta asignada al alumno"
            })
        }

        const asignacion = asignaciones[0]

        // Comprobar el estado de la evaluación
        const [evaluacionesAlumno] = await pool.query(
            `
            SELECT estado
            FROM alumno_evaluacion
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            `,
            [
                alumno.cedula_alumno,
                asignacion.evaluacion_id_evaluacion
            ]
        )

        if (evaluacionesAlumno.length === 0) {
            await fs.unlink(req.file.path).catch(() => {})

            return res.status(404).json({
                mensaje: "No se encontró el registro de la evaluación"
            })
        }

        // No permitir archivos después de finalizar
        if (evaluacionesAlumno[0].estado === "finalizada") {
            await fs.unlink(req.file.path).catch(() => {})

            return res.status(400).json({
                mensaje: "La evaluación ya fue finalizada"
            })
        }

        try {
            // Guardar los datos del archivo en la base de datos
            const [resultado] = await pool.query(
                `
                INSERT INTO entrega_codigo (
                    nombre_archivo,
                    ruta_archivo,
                    fecha_entrega,
                    alumno_consigna_id_asignacion
                )
                VALUES (?, ?, CURDATE(), ?)
                `,
                [
                    req.file.originalname,
                    req.file.path,
                    asignacion.id_asignacion
                ]
            )

            return res.status(201).json({
                mensaje: "Archivo subido correctamente",
                id_entrega_codigo: resultado.insertId,
                nombre_archivo: req.file.originalname,
                ruta_archivo: req.file.path,
                id_asignacion: asignacion.id_asignacion
            })

        } catch (error) {
            // Si falla el registro en MySQL,
            // eliminar el archivo que Multer ya había guardado
            await fs.unlink(req.file.path).catch(() => {})

            throw error
        }

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerResultadoEvaluacion = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno,
                a.nombre,
                a.apellido
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Buscar el registro de la evaluación del alumno
        const [evaluacionesAlumno] = await pool.query(
            `
            SELECT
                ae.estado,
                ae.fecha_inicio,
                ae.fecha_finalizacion,
                e.id_evaluacion,
                e.titulo,
                e.descripcion,
                e.fecha,
                e.tipo
            FROM alumno_evaluacion ae
            INNER JOIN evaluacion e
                ON e.id_evaluacion = ae.evaluacion_id_evaluacion
            WHERE ae.alumno_cedula_alumno = ?
            AND ae.evaluacion_id_evaluacion = ?
            `,
            [alumno.cedula_alumno, id]
        )

        if (evaluacionesAlumno.length === 0) {
            return res.status(404).json({
                mensaje: "El alumno no tiene esta evaluación iniciada"
            })
        }

        const evaluacion = evaluacionesAlumno[0]

        // Obtener preguntas y respuestas del alumno
        const [resultados] = await pool.query(
            `
            SELECT
                ac.id_asignacion,
                ac.consigna_id_consigna,
                c.consigna,
                r.id_respuesta,
                r.respuesta,
                r.nota_final
            FROM alumno_consigna ac
            INNER JOIN consigna c
                ON c.id_consigna = ac.consigna_id_consigna
            LEFT JOIN respuesta r
                ON r.alumno_consigna_id_asignacion = ac.id_asignacion
            WHERE ac.alumno_cedula_alumno = ?
            AND ac.evaluacion_id_evaluacion = ?
            ORDER BY ac.id_asignacion
            `,
            [alumno.cedula_alumno, id]
        )

        // Calcular la suma solamente de las notas que ya existen
        const notas = resultados
            .map(resultado => resultado.nota_final)
            .filter(nota => nota !== null)

        const totalNotas = notas.reduce(
            (total, nota) => total + Number(nota),
            0
        )

        return res.status(200).json({
            alumno: {
                cedula: alumno.cedula_alumno,
                nombre: alumno.nombre,
                apellido: alumno.apellido
            },
            evaluacion: {
                id: evaluacion.id_evaluacion,
                titulo: evaluacion.titulo,
                descripcion: evaluacion.descripcion,
                fecha: evaluacion.fecha,
                tipo: evaluacion.tipo,
                estado: evaluacion.estado,
                fecha_inicio: evaluacion.fecha_inicio,
                fecha_finalizacion: evaluacion.fecha_finalizacion
            },
            resultado: {
                total_preguntas: resultados.length,
                preguntas_corregidas: notas.length,
                preguntas_sin_corregir: resultados.length - notas.length,
                total_notas: totalNotas
            },
            preguntas: resultados
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    obtenerMiPerfil,
    obtenerEvaluaciones,
    iniciarEvaluacion,
    guardarRespuesta,
    obtenerProgresoEvaluacion,
    finalizarEvaluacion,
    subirArchivo,
    obtenerResultadoEvaluacion
}
```

## File: src/controllers/authController.js
```javascript
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
        const {usuario, password, confirmarPassword, rol, cedula} = req.body;

        // Verifico que todos los campos hayan sido enviados
        if (!usuario || !password || !confirmarPassword || !rol || !cedula) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            });
        }

        // Verifico que coincidan las contraseñas
        if (password !== confirmarPassword) {
            return res.status(400).json({
                mensaje: "Las contraseñas no coinciden"
            })
        }

        if (password.length < 8) {
            return res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 carácteres"
            });
        }

        // Verifico que mande un rol existente
        if (rol !== "alumno" && rol !== "profesor") {
            return res.status(400).json({
                mensaje: "Rol inválido"
            });
        }

        if (rol === "alumno") {

            // Verifico el rol para alumno
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
        }

        if (rol === "profesor") {

            // Verifico el rol para profesor
            const [rolProfesor] = await pool.query(
                `
                SELECT cedula_profesor
                FROM profesor
                WHERE cedula_profesor = ?
                `,
                [cedula]
            )

            if (rolProfesor.length === 0) {
                return res.status(400).json({
                    mensaje: "No existe un profesor con esa cédula"
                });
            }

            // Verifico que no exista otra cuenta vinculada a un profesor
            const [cuentaProfesor] = await pool.query(
                `
                SELECT profesor_cedula_profesor
                FROM login
                WHERE profesor_cedula_profesor = ?
                `,
                [cedula]
            )

            if (cuentaProfesor.length > 0) {
                return res.status(409).json({
                    mensaje: "Este profesor ya tiene una cuenta"
                });
            }
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

        // Inserto los datos en la tabla login siendo alumno
        if (rol === "alumno") {
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
        }

        // Inserto los datos en la tabla login siendo profesor
        if (rol === "profesor") {
            await pool.query (
                `
                INSERT INTO login (
                usuario,
                password_hash,
                rol,
                profesor_cedula_profesor
                )
                VALUES (?, ?, ?, ?)
                `,
                [usuario, passwordHash, rol, cedula]
            )
        }

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
 * Inicio de sesion
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const login = async (req, res) => {
    try {
        // Recibo datos y los valido
        const {usuario, password} = req.body;

        if (!usuario || !password) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            });
        }

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
    login
}
```

## File: src/controllers/consignaController.js
```javascript
import { pool } from "../config/database.js"

const obtenerConsignas = async (req, res) => {
    try {
        const [consignas] = await pool.query(
            `
            SELECT
                id_consigna,
                consigna,
                respuesta_correcta
            FROM consigna
            ORDER BY id_consigna
            `
        )

        return res.status(200).json({
            consignas
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}


const crearConsigna = async (req, res) => {
    try {
        const { consigna, respuesta_correcta } = req.body

        if (!consigna || !respuesta_correcta) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            })
        }

        const [resultado] = await pool.query(
            `
            INSERT INTO consigna (
                consigna,
                respuesta_correcta
            )
            VALUES (?, ?)
            `,
            [consigna, respuesta_correcta]
        )

        return res.status(201).json({
            mensaje: "Pregunta creada correctamente",
            id_consigna: resultado.insertId
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerConsignaPorId = async (req, res) => {
    try {
        const { id } = req.params

        const [consignas] = await pool.query(
            `
            SELECT
                id_consigna,
                consigna,
                respuesta_correcta
            FROM consigna
            WHERE id_consigna = ?
            `,
            [id]
        )

        if (consignas.length === 0) {
            return res.status(404).json({
                mensaje: "Pregunta no encontrada"
            })
        }

        return res.status(200).json({
            consigna: consignas[0]
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const actualizarConsigna = async (req, res) => {
    try {
        const { id } = req.params
        const { consigna, respuesta_correcta } = req.body

        if (!consigna || !respuesta_correcta) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            })
        }

        const [resultado] = await pool.query(
            `
            UPDATE consigna
            SET
                consigna = ?,
                respuesta_correcta = ?
            WHERE id_consigna = ?
            `,
            [consigna, respuesta_correcta, id]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Pregunta no encontrada"
            })
        }

        return res.status(200).json({
            mensaje: "Pregunta actualizada correctamente"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const eliminarConsigna = async (req, res) => {
    try {
        const { id } = req.params

        const [resultado] = await pool.query(
            `
            DELETE FROM consigna
            WHERE id_consigna = ?
            `,
            [id]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Pregunta no encontrada"
            })
        }

        return res.status(200).json({
            mensaje: "Pregunta eliminada correctamente"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    obtenerConsignas,
    obtenerConsignaPorId,
    crearConsigna,
    actualizarConsigna,
    eliminarConsigna
}
```

## File: src/controllers/evaluacionController.js
```javascript
import { pool } from "../config/database.js"

const crearEvaluacion = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            fecha,
            tipo
        } = req.body

        if (!titulo || !descripcion || !fecha || !tipo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            })
        }

        const [resultado] = await pool.query(
            `
            INSERT INTO evaluacion (
                titulo,
                descripcion,
                fecha,
                tipo
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                titulo,
                descripcion,
                fecha,
                tipo
            ]
        )

        return res.status(201).json({
            mensaje: "Evaluación creada correctamente",
            id_evaluacion: resultado.insertId
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const agregarPreguntaAEvaluacion = async (req, res) => {
    try {
        const { id, idConsigna } = req.params

        // Verificar que la evaluación exista
        const [evaluaciones] = await pool.query(
            `
            SELECT id_evaluacion
            FROM evaluacion
            WHERE id_evaluacion = ?
            `,
            [id]
        )

        if (evaluaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Evaluación no encontrada"
            })
        }

        // Verificar que la pregunta exista
        const [consignas] = await pool.query(
            `
            SELECT id_consigna
            FROM consigna
            WHERE id_consigna = ?
            `,
            [idConsigna]
        )

        if (consignas.length === 0) {
            return res.status(404).json({
                mensaje: "Pregunta no encontrada"
            })
        }
         
        const [cantidadPreguntas] = await pool.query(
    `
    SELECT COUNT(*) AS cantidad
    FROM evaluacion_consigna
    WHERE evaluacion_id_evaluacion = ?
    `,
    [id]
)

    if (cantidadPreguntas[0].cantidad >= 50) {
     return res.status(400).json({
        mensaje: "La evaluación ya tiene el máximo de 50 preguntas"
    })
    }
    
    // Verificar que la pregunta no esté ya asociada
        const [asociacionExistente] = await pool.query(
            `
            SELECT *
            FROM evaluacion_consigna
            WHERE evaluacion_id_evaluacion = ?
            AND consigna_id_consigna = ?
            `,
            [id, idConsigna]
        )

        if (asociacionExistente.length > 0) {
            return res.status(409).json({
                mensaje: "La pregunta ya está asociada a esta evaluación"
            })
        }

        // Asociar pregunta con evaluación
        await pool.query(
            `
            INSERT INTO evaluacion_consigna (
                evaluacion_id_evaluacion,
                consigna_id_consigna
            )
            VALUES (?, ?)
            `,
            [id, idConsigna]
        )

        return res.status(201).json({
            mensaje: "Pregunta agregada a la evaluación correctamente"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerPreguntasDeEvaluacion = async (req, res) => {
    try {
        const { id } = req.params

        // Verificar que la evaluación exista
        const [evaluaciones] = await pool.query(
            `
            SELECT id_evaluacion
            FROM evaluacion
            WHERE id_evaluacion = ?
            `,
            [id]
        )

        if (evaluaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Evaluación no encontrada"
            })
        }

        // Obtener las preguntas asociadas
        const [preguntas] = await pool.query(
            `
            SELECT
                c.id_consigna,
                c.consigna,
                c.respuesta_correcta
            FROM evaluacion_consigna ec
            INNER JOIN consigna c
                ON c.id_consigna = ec.consigna_id_consigna
            WHERE ec.evaluacion_id_evaluacion = ?
            ORDER BY c.id_consigna
            `,
            [id]
        )

        return res.status(200).json({
            preguntas
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const eliminarPreguntaDeEvaluacion = async (req, res) => {
    try {
        const { id, idConsigna } = req.params

        const [resultado] = await pool.query(
            `
            DELETE FROM evaluacion_consigna
            WHERE evaluacion_id_evaluacion = ?
            AND consigna_id_consigna = ?
            `,
            [id, idConsigna]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "La pregunta no está asociada a esta evaluación"
            })
        }

        return res.status(200).json({
            mensaje: "Pregunta eliminada de la evaluación correctamente"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    crearEvaluacion,
    agregarPreguntaAEvaluacion,
    obtenerPreguntasDeEvaluacion,
    eliminarPreguntaDeEvaluacion
}
```

## File: src/controllers/profesorController.js
```javascript
import { pool } from "../config/database.js"

/**
 * Obtiene todos los profesores 
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const obtenerProfesores = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM profesor"
        );

        res.status(200).json(rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};

/**
 * Obtiene profesores por cedula
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const obtenerProfesoresPorCedula = async (req, res) => {
    try {
        const { cedula } = req.params;

        const [rows] = await pool.query(
            `
            SELECT *
            FROM profesor
            WHERE cedula_profesor = ?
            `,
            [cedula]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Profesor no encontrado"
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Crear un nuevo registro de profesor
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const crearProfesor = async (req, res) => {
    try {
        const {
            cedula_profesor,
            nombre,
            apellido,
            correo
        } = req.body;

        if (!cedula_profesor || !nombre || !apellido || !correo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            });
        }

        const [cedulaExistente] = await pool.query(
            `
            SELECT cedula_profesor
            FROM profesor
            WHERE cedula_profesor = ?
            `,
            [cedula_profesor]
        );

        if (cedulaExistente.length > 0) {
            return res.status(409).json({
                mensaje: "La cedula ya está registrada"
            });
        }

        const [correoExistente] = await pool.query(
            `
            SELECT correo
            FROM profesor
            WHERE correo = ?
            `,
            [correo]
        );

        if (correoExistente.length > 0) {
            return res.status(409).json({
                mensaje: "Este correo ya está registrado"
            });
        }

        await pool.query(
            `
            INSERT INTO profesor (
                cedula_profesor,
                nombre,
                apellido,
                correo
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                cedula_profesor,
                nombre,
                apellido,
                correo
            ]
        );

        return res.status(201).json({
            mensaje: "Profesor creado correctamente"
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Actualizar registro de un profesor existente
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const actualizarProfesor = async (req, res) => {
    try {
        const {cedula} = req.params;
        const {nombre, apellido, correo} = req.body;

        // Validar que todos los campos obligatorios hayan sido enviados
        if (!nombre || !apellido || !correo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            });
        }

        // Comprobar que el profesor exista
        const [profesores] = await pool.query(
            `
            SELECT *
            FROM profesor
            WHERE cedula_profesor = ?
            `,
            [cedula]
        )

        if (profesores.length === 0) {
            return res.status(404).json({
                mensaje: "Profesor no encontrado"
            });
        }

        // Comprobar si el correo pertenece a otro registro
        const [correoExistente] = await pool.query(
            `
            SELECT cedula_profesor
            FROM profesor
            WHERE correo = ?
            AND cedula_profesor != ?
            `,
            [correo, cedula]
        )

        if (correoExistente.length > 0) {
            return res.status(409).json({
                mensaje: "Este correo ya esta siendo utilizado por otro profesor"
            });
        }

        // Actualizar el profesor
        await pool.query(
            `
            UPDATE profesor
            SET nombre = ?,
                apellido = ?,
                correo = ?
            WHERE cedula_profesor = ?
            `,
            [nombre, apellido, correo, cedula]
        )

        return res.status(200).json({
            mensaje: "Profesor actualizado correctamente"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Eliminar un registro de profesor existente
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const eliminarProfesor = async (req, res) => {
    try {
        // Recibo la cedula por la URL
        const {cedula} = req.params;

        // Verifico que exista el profesor
        const [profesor] = await pool.query(
            `
            SELECT cedula_profesor
            FROM profesor
            WHERE cedula_profesor = ?
            `,
            [cedula]
        )

        if (profesor.length === 0) {
            return res.status(404).json({
                mensaje: "Profesor no encontrado"
            });
        }

        // Elimino registro
        await pool.query(
            `DELETE from profesor
            WHERE cedula_profesor = ?
            `,
            [cedula]
        )

        return res.status(200).json({
            mensaje: "Profesor eliminado correctamente"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

export {
    obtenerProfesores,
    obtenerProfesoresPorCedula,
    crearProfesor,
    actualizarProfesor,
    eliminarProfesor
}
```

## File: src/middlewares/auth.js
```javascript
import jwt from "jsonwebtoken"

/**
 * Valido token antes de pasar al controlador
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */


const auth = (req, res, next) => {
    try {
        // Obtengo autorización
        const authHeader = req.headers.authorization;

        // Verifico si envió token
        if (!authHeader) {
            return res.status(401).json({
                mensaje: "Token no proporcionado"
            });
        }

        // Obtengo el token
        const token = authHeader.split(" ")[1];

        // Verifico si existe el token
        if (!token) {
            return res.status(401).json({
                mensaje: "Acceso denegado"
            });
        }

        // Verifico JWT y guardo el decoded en req.user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next()

    } catch (error) {

        // Si el token es inválido
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                mensaje: "Token Inválido"
            });
        }

        // Si el token expiró
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                mensaje: "Token caducado"
            });
        }

        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    auth
}
```

## File: src/middlewares/role.js
```javascript
/**
 * Valido si el rol del usuario logueado es profesor
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */

const roleProfesor = (req, res, next) => {
    try {
        if (req.user.rol !== "profesor") {
            return res.status(403).json({
                mensaje: "Acceso no permitido"
            });
        }

        
        next()
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Valido si el rol del usuario logueado es alumno
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */

const roleAlumno = (req, res, next) => {
    try {
        if (req.user.rol !== "alumno") {
            return res.status(403).json({
                mensaje: "Acceso no permitido"
            });
        }

        next()

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

export {
    roleProfesor,
    roleAlumno
}
```

## File: src/middlewares/upload.js
```javascript
import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/")
    },

    filename: (req, file, cb) => {
        const nombreOriginal = path.basename(file.originalname)
        cb(null, `${Date.now()}-${nombreOriginal}`)
    }
})

const extensionesPermitidas = [
    ".cs",
    ".java",
    ".py",
    ".cpp",
    ".html",
    ".css",
    ".js",
    ".zip"
]

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()

    if (!extensionesPermitidas.includes(extension)) {
        return cb(new Error("Tipo de archivo no permitido"))
    }

    cb(null, true)
}

const upload = multer({
    storage,
    fileFilter
})

export { upload }
```

## File: src/routes/alumnoEvaluacionRoutes.js
```javascript
import { Router } from "express"
import { auth } from "../middlewares/auth.js"
import { roleAlumno } from "../middlewares/role.js"
import { upload } from "../middlewares/upload.js"
import {
    obtenerMiPerfil,
    obtenerEvaluaciones,
    iniciarEvaluacion,
    guardarRespuesta,
    obtenerProgresoEvaluacion,
    finalizarEvaluacion,
    subirArchivo,
    obtenerResultadoEvaluacion
} from "../controllers/alumnoEvaluacionController.js"
const router = Router()

router.get(
    "/perfil",
    auth,
    roleAlumno,
    obtenerMiPerfil
)

router.get(
    "/evaluaciones",
    auth,
    roleAlumno,
    obtenerEvaluaciones
)

router.post(
    "/evaluaciones/:id/iniciar",
    auth,
    roleAlumno,
    iniciarEvaluacion
)


router.post(
    "/evaluaciones/respuestas/:id",
    auth,
    roleAlumno,
    guardarRespuesta
)

router.get(
    "/evaluaciones/:id/progreso",
    auth,
    roleAlumno,
    obtenerProgresoEvaluacion
)

router.get(
    "/evaluaciones/:id/resultados",
    auth,
    roleAlumno,
    obtenerResultadoEvaluacion)

router.post(
    "/evaluaciones/:id/finalizar",
    auth,
    roleAlumno,
    finalizarEvaluacion
)

router.post(
    "/evaluaciones/entrega/:id",
    auth,
    roleAlumno,
    (req, res, next) => {
        upload.single("archivo")(req, res, (error) => {
            if (error) {
                if (error.message === "Tipo de archivo no permitido") {
                    return res.status(400).json({
                        mensaje: "Tipo de archivo no permitido"
                    })
                }

                return res.status(500).json({
                    mensaje: "Error al subir el archivo"
                })
            }

            next()
        })
    },
    subirArchivo
)

export default router
```

## File: src/routes/alumnoRoutes.js
```javascript
import { Router } from "express"
import { obtenerAlumnos, obtenerAlumnosPorCedula, crearAlumno, actualizarAlumno, eliminarAlumno } from "../controllers/alumnoController.js"

const router = Router();

router.get("/", obtenerAlumnos)

router.get("/:cedula", obtenerAlumnosPorCedula)

router.post("/", crearAlumno)

router.put("/:cedula", actualizarAlumno)

router.delete("/:cedula", eliminarAlumno)

export default router;
```

## File: src/routes/authRoutes.js
```javascript
import { Router } from "express"
import { crearUsuario, login } from "../controllers/authController.js"

const router = Router()

router.post("/register", crearUsuario)
router.post("/login", login)

export default router
```

## File: src/routes/consignaRoutes.js
```javascript
import { Router } from "express"

import {
    obtenerConsignas,
    obtenerConsignaPorId,
    crearConsigna,
    actualizarConsigna,
    eliminarConsigna
} from "../controllers/consignaController.js"

import { auth } from "../middlewares/auth.js"

import { roleProfesor } from "../middlewares/role.js"

const router = Router()

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
```

## File: src/routes/evaluacionRoutes.js
```javascript
import { Router } from "express"

import {
    crearEvaluacion,
    agregarPreguntaAEvaluacion,
    obtenerPreguntasDeEvaluacion,
    eliminarPreguntaDeEvaluacion
} from "../controllers/evaluacionController.js"

import { auth } from "../middlewares/auth.js"
import { roleProfesor } from "../middlewares/role.js"

const router = Router()

router.post(
    "/",
    auth,
    roleProfesor,
    crearEvaluacion
)

router.post(
    "/:id/preguntas/:idConsigna",
    auth,
    roleProfesor,
    agregarPreguntaAEvaluacion
)

router.get(
    "/:id/preguntas",
    auth,
    roleProfesor,
    obtenerPreguntasDeEvaluacion
)

router.delete(
    "/:id/preguntas/:idConsigna",
    auth,
    roleProfesor,
    eliminarPreguntaDeEvaluacion
)

export default router
```

## File: src/routes/profesorRoutes.js
```javascript
import { Router } from "express"
import { obtenerProfesores, obtenerProfesoresPorCedula, crearProfesor, actualizarProfesor, eliminarProfesor } from "../controllers/profesorController.js"

const router = Router();

router.get("/", obtenerProfesores)
router.get("/:cedula", obtenerProfesoresPorCedula)

router.post("/", crearProfesor)

router.put("/:cedula", actualizarProfesor)

router.delete("/:cedula", eliminarProfesor)

export default router;
```

## File: src/routes/testRoutes.js
```javascript
import { Router } from "express"
import { auth } from "../middlewares/auth.js"
import { roleProfesor, roleAlumno } from "../middlewares/role.js";

const router = Router();

router.get("/prueba", auth, (req, res) => {
    res.json({
        mensaje: "Llegaste al controlador",
        usuario: req.user
    })
});

router.get("/profesor", auth, roleProfesor, (req, res) => {
    return res.status(200).json({
        mensaje: "Bienvenido profesor"
    })
});

router.get("/alumno", auth, roleAlumno, (req, res) => {
    return res.status(200).json({
        mensaje: "Bienvenido alumno"
    })
});

export default router;
```

## File: src/app.js
```javascript
import express from "express"
import cors from "cors"
import alumnoRoutes from "./routes/alumnoRoutes.js"
import alumnoEvaluacionRoutes from "./routes/alumnoEvaluacionRoutes.js"
import profesorRoutes from "./routes/profesorRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import testRoutes from "./routes/testRoutes.js"
import consignaRoutes from "./routes/consignaRoutes.js"
import evaluacionRoutes from "./routes/evaluacionRoutes.js"

const app = express()

app.use(cors())
    
app.use(express.json())

app.use("/api/alumnos", alumnoEvaluacionRoutes)
app.use("/api/alumnos", alumnoRoutes)

app.use("/api/profesores", profesorRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/test", testRoutes)
app.use("/api/consignas", consignaRoutes)
app.use("/api/evaluaciones", evaluacionRoutes)
export default app
```

## File: src/server.js
```javascript
import dotenv from "dotenv"
import app from "./app.js"

dotenv.config();

const PORT = process.env.PORT || 2323

app.listen(PORT, () => {
    console.log(`Servidor ejecutandose en puerto ${PORT}`)
});
```

## File: uploads/1789832230689-archivo.js
```javascript
ahhh
```

## File: uploads/1789832854090-archivo.js
```javascript
ahhh
```

## File: uploads/1789837579173-archivo3.js
```javascript
ahhh
```

## File: uploads/1790019370981-archivo3.py
```python
ahhh
```

## File: .gitignore
```
node_modules/
.env
```

## File: package.json
```json
{
  "name": "sistema_evaluacion_ia",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "node --watch src/server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "^11.22.0",
      "onFail": "download"
    }
  },
  "type": "module",
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "multer": "^2.4.0",
    "mysql2": "^3.23.3"
  },
  "devDependencies": {
    "jsdocs": "^1.0.0"
  }
}
```
