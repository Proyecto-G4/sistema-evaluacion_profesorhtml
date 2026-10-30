import { pool } from "../config/database.js"
import fs from "fs/promises"
import { corregirEntregaCodigo } from "../services/ollamaGradingService.js"   

const obtenerAlumno = async (req, res) => {
    const [alumnos] = await pool.query(`
        SELECT a.cedula_alumno, a.nombre, a.apellido
        FROM login l
        INNER JOIN alumno a ON a.cedula_alumno = l.alumno_cedula_alumno
        WHERE l.id_login = ? AND l.rol = 'alumno'
    `, [req.user.id])

    if (alumnos.length === 0) {
        res.status(404).json({ mensaje: "No se encontró el alumno" })
        return null
    }

    return alumnos[0]
}
const eliminarArchivo = async (ruta) => {
    if (ruta) await fs.unlink(ruta).catch(() => {})
}
const obtenerMiPerfil = async (req, res) => {
    try {
        const [usuarios] = await pool.query(`
            SELECT l.id_login, l.usuario, l.rol, l.alumno_cedula_alumno,
                   a.cedula_alumno, a.nombre, a.apellido, a.correo
            FROM login l
            INNER JOIN alumno a ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ? AND l.rol = 'alumno'
        `, [req.user.id])

        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: "No se encontró el alumno" })
        }

        return res.status(200).json({ alumno: usuarios[0] })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ mensaje: "Error interno del servidor" })
    }
}

const obtenerEvaluaciones = async (req, res) => {
    try {
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
            INNER JOIN clase_alumno ca
                ON ca.id_clase = e.id_clase
                AND ca.estado = 'activo'
            INNER JOIN login l 
                ON l.alumno_cedula_alumno = ca.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            ORDER BY e.fecha
            `, 
            [req.user.id]
        )

        return res.status(200).json({ evaluaciones })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ mensaje: "Error interno del servidor" })
    }
}
const iniciarEvaluacion = async (req, res) => {
    try {
        const { id } = req.params
        const alumno = await obtenerAlumno(req, res)
        if (!alumno) return

        const [evaluaciones] = await pool.query(
            `
            SELECT
                e.id_evaluacion,
                e.titulo,
                e.descripcion,
                e.fecha,
                e.tipo,
                e.cantidad_preguntas
            FROM evaluacion e
            INNER JOIN clase_alumno ca
                ON ca.id_clase = e.id_clase
                AND ca.alumno_cedula_alumno = ?
                AND ca.estado = 'activo'
            WHERE e.id_evaluacion = ?
            `,
            [alumno.cedula_alumno, id]
        )

        if (evaluaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Evaluación no encontrada"
            })
        }

        const evaluacion = evaluaciones[0]

        const [asignacionesExistentes] = await pool.query(
            `
            SELECT id_asignacion, consigna_id_consigna, estado
            FROM alumno_consigna
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            `,
            [alumno.cedula_alumno, id]
        )

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

        const cantidadSolicitada = Number(evaluacion.cantidad_preguntas)

        if (
            !Number.isInteger(cantidadSolicitada) ||
            cantidadSolicitada < 1
        ) {
            return res.status(400).json({
                mensaje: "La cantidad de preguntas configurada no es válida"
            })
        }

        const [cantidadDisponible] = await pool.query(
            `
            SELECT COUNT(*) AS cantidad
            FROM evaluacion_consigna
            WHERE evaluacion_id_evaluacion = ?
            `,
            [id]
        )

        const totalDisponible = Number(cantidadDisponible[0].cantidad)

        if (totalDisponible < cantidadSolicitada) {
            return res.status(400).json({
                mensaje: "La evaluación no tiene suficientes consignas para la cantidad de preguntas configurada",
                preguntas_disponibles: totalDisponible,
                preguntas_necesarias: cantidadSolicitada
            })
        }

        const [preguntas] = await pool.query(
            `
            SELECT consigna_id_consigna
            FROM evaluacion_consigna
            WHERE evaluacion_id_evaluacion = ?
            ORDER BY RAND()
            LIMIT ?
            `,
            [id, cantidadSolicitada]
        )

        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

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
                [alumno.cedula_alumno, id, "en_progreso"]
            )

            await connection.commit()
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }

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
        const { id } = req.params
        const { respuesta } = req.body

        if (!respuesta) {
            return res.status(400).json({ mensaje: "La respuesta es obligatoria" })
        }

        const alumno = await obtenerAlumno(req, res)
        if (!alumno) return
        const [asignaciones] = await pool.query(`
            SELECT id_asignacion, evaluacion_id_evaluacion, estado
            FROM alumno_consigna
            WHERE id_asignacion = ? AND alumno_cedula_alumno = ?
        `, [id, alumno.cedula_alumno])

        if (asignaciones.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró la pregunta asignada al alumno"
            })
        }

        const asignacion = asignaciones[0]
        const [evaluacionesAlumno] = await pool.query(`
            SELECT estado
            FROM alumno_evaluacion
            WHERE alumno_cedula_alumno = ? AND evaluacion_id_evaluacion = ?
        `, [alumno.cedula_alumno, asignacion.evaluacion_id_evaluacion])

        if (evaluacionesAlumno.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el registro de la evaluación"
            })
        }

        if (evaluacionesAlumno[0].estado === "finalizada") {
            return res.status(400).json({ mensaje: "La evaluación ya fue finalizada" })
        }
        const [respuestasExistentes] = await pool.query(`
            SELECT id_respuesta
            FROM respuesta
            WHERE alumno_consigna_id_asignacion = ?
        `, [id])

        if (respuestasExistentes.length > 0) {
            return res.status(409).json({ mensaje: "Esta pregunta ya fue respondida" })
        }
        const [resultado] = await pool.query(`
            INSERT INTO respuesta (
                respuesta, nota_final, alumno_cedula_alumno,
                evaluacion_id_evaluacion, alumno_consigna_id_asignacion
            )
            VALUES (?, NULL, ?, ?, ?)
        `, [
            respuesta,
            alumno.cedula_alumno,
            asignacion.evaluacion_id_evaluacion,
            asignacion.id_asignacion
        ])

        await pool.query(`
            UPDATE alumno_consigna
            SET estado = 'respondida'
            WHERE id_asignacion = ?
        `, [id])

        return res.status(201).json({
            mensaje: "Respuesta guardada correctamente",
            id_respuesta: resultado.insertId,
            id_asignacion: asignacion.id_asignacion
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ mensaje: "Error interno del servidor" })
    }
}
const obtenerProgresoEvaluacion = async (req, res) => {
    try {
        const { id } = req.params
        const alumno = await obtenerAlumno(req, res)
        if (!alumno) return
        const [progreso] = await pool.query(`
            SELECT ac.id_asignacion, ac.consigna_id_consigna, ac.estado, c.consigna
            FROM alumno_consigna ac
            INNER JOIN consigna c ON c.id_consigna = ac.consigna_id_consigna
            WHERE ac.alumno_cedula_alumno = ? AND ac.evaluacion_id_evaluacion = ?
            ORDER BY ac.id_asignacion
        `, [alumno.cedula_alumno, id])

        if (progreso.length === 0) {
            return res.status(404).json({
                mensaje: "El alumno no tiene esta evaluación iniciada"
            })
        }
        
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
        return res.status(500).json({ mensaje: "Error interno del servidor" })
    }
}
const finalizarEvaluacion = async (req, res) => {
    try {
        const { id } = req.params
        const alumno = await obtenerAlumno(req, res)
        if (!alumno) return

        const [asignaciones] = await pool.query(`
            SELECT id_asignacion, estado
            FROM alumno_consigna
            WHERE alumno_cedula_alumno = ? AND evaluacion_id_evaluacion = ?
        `, [alumno.cedula_alumno, id])
        
        if (asignaciones.length === 0) {
            return res.status(404).json({
                mensaje: "El alumno no tiene esta evaluación iniciada"
            })
        }
        const pendientes = asignaciones.filter(
            asignacion => asignacion.estado === "pendiente"
        )

        if (pendientes.length > 0) {
            return res.status(400).json({
                mensaje: "No se puede finalizar la evaluación",
                preguntas_pendientes: pendientes.length
            })
        }
        
        const [resultado] = await pool.query(`
            UPDATE alumno_evaluacion
            SET estado = 'finalizada', fecha_finalizacion = NOW()
            WHERE alumno_cedula_alumno = ? AND evaluacion_id_evaluacion = ?
            AND estado = 'en_progreso'
        `, [alumno.cedula_alumno, id])

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
        return res.status(500).json({ mensaje: "Error interno del servidor" })
    }
}
const subirArchivo = async (req, res) => {
    let archivoRegistrado = false;

    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                mensaje: "No se recibió ningún archivo"
            });
        }

        const alumno = await obtenerAlumno(req, res);

        if (!alumno) {
            await eliminarArchivo(req.file.path);
            return;
        }

        const [asignaciones] = await pool.query(`
            SELECT
                ac.id_asignacion,
                ac.evaluacion_id_evaluacion,
                c.consigna,
                c.respuesta_correcta,
                c.rubrica
            FROM alumno_consigna ac
            INNER JOIN consigna c
                ON c.id_consigna = ac.consigna_id_consigna
            WHERE
                ac.id_asignacion = ?
                AND ac.alumno_cedula_alumno = ?
        `, [id, alumno.cedula_alumno]);

        if (asignaciones.length === 0) {
            await eliminarArchivo(req.file.path);

            return res.status(404).json({
                mensaje: "No se encontró la pregunta asignada al alumno"
            });
        }

        const asignacion = asignaciones[0];

        const [evaluacionesAlumno] = await pool.query(`
            SELECT estado
            FROM alumno_evaluacion
            WHERE
                alumno_cedula_alumno = ?
                AND evaluacion_id_evaluacion = ?
        `, [
            alumno.cedula_alumno,
            asignacion.evaluacion_id_evaluacion
        ]);

        if (evaluacionesAlumno.length === 0) {
            await eliminarArchivo(req.file.path);

            return res.status(404).json({
                mensaje: "No se encontró el registro de la evaluación"
            });
        }

        if (evaluacionesAlumno[0].estado === "finalizada") {
            await eliminarArchivo(req.file.path);

            return res.status(400).json({
                mensaje: "La evaluación ya fue finalizada"
            });
        }

        const [resultado] = await pool.query(`
            INSERT INTO entrega_codigo (
                nombre_archivo,
                ruta_archivo,
                fecha_entrega,
                alumno_consigna_id_asignacion
            )
            VALUES (?, ?, CURDATE(), ?)
        `, [
            req.file.originalname,
            req.file.path,
            asignacion.id_asignacion
        ]);

        archivoRegistrado = true;

        const correccion = await corregirEntregaCodigo({
            idEntrega: resultado.insertId,
            nombreArchivo: req.file.originalname,
            rutaArchivo: req.file.path,
            consigna: asignacion.consigna,
            respuestaCorrecta: asignacion.respuesta_correcta,
            rubrica: asignacion.rubrica
        });

        return res.status(201).json({
            mensaje: correccion.estado === "corregida"
                ? "Archivo subido y corregido automáticamente"
                : "Archivo guardado, pero no se pudo corregir automáticamente",
            id_entrega_codigo: resultado.insertId,
            nombre_archivo: req.file.originalname,
            id_asignacion: asignacion.id_asignacion,
            correccion
        });

    } catch (error) {
        if (req.file && !archivoRegistrado) {
            await eliminarArchivo(req.file.path);
        }

        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};
const obtenerResultadoEvaluacion = async (req, res) => {
    try {
        const { id } = req.params
        const alumno = await obtenerAlumno(req, res)
        if (!alumno) return
        const [evaluacionesAlumno] = await pool.query(`
            SELECT ae.estado, ae.fecha_inicio, ae.fecha_finalizacion,
                   e.id_evaluacion, e.titulo, e.descripcion, e.fecha, e.tipo
            FROM alumno_evaluacion ae
            INNER JOIN evaluacion e ON e.id_evaluacion = ae.evaluacion_id_evaluacion
            WHERE ae.alumno_cedula_alumno = ?
            AND ae.evaluacion_id_evaluacion = ?
        `, [alumno.cedula_alumno, id])
        if (evaluacionesAlumno.length === 0) {
            return res.status(404).json({
                mensaje: "El alumno no tiene esta evaluación iniciada"
            })
        }
        const evaluacion = evaluacionesAlumno[0]
        const [resultados] = await pool.query(`
            SELECT ac.id_asignacion, ac.consigna_id_consigna,
                   c.consigna, r.id_respuesta, r.respuesta, r.nota_final
            FROM alumno_consigna ac
            INNER JOIN consigna c ON c.id_consigna = ac.consigna_id_consigna
            LEFT JOIN respuesta r
                ON r.alumno_consigna_id_asignacion = ac.id_asignacion
            WHERE ac.alumno_cedula_alumno = ?
            AND ac.evaluacion_id_evaluacion = ?
            ORDER BY ac.id_asignacion
        `, [alumno.cedula_alumno, id])
        return res.status(200).json({
    evaluacion: {
        titulo: evaluacion.titulo,
        estado: evaluacion.estado,
        fecha_inicio: evaluacion.fecha_inicio,
        fecha_finalizacion: evaluacion.fecha_finalizacion
    },
    resultado: {
        total_preguntas: resultados.length
    },
    preguntas: resultados.map(resultado => ({
        numero: resultado.id_asignacion,
        pregunta: resultado.consigna,
        respuesta: resultado.respuesta
    }))
})

    } catch (error) {
        console.error(error)
        return res.status(500).json({ mensaje: "Error interno del servidor" })
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