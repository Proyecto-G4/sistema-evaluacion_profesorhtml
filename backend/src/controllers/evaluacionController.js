import { pool } from "../config/database.js"

const crearEvaluacion = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            fecha,
            hora,
            duracion,
            tipo,
            id_clase,
            cantidad_preguntas
        } = req.body ?? {}

        const idClase = Number(id_clase)
        const cantidadPreguntas = Number(cantidad_preguntas)
        const duracionMinutos = Number(duracion)

        if (
            !titulo ||
            !descripcion ||
            !fecha ||
            !hora ||
            !tipo ||
            duracion === undefined ||
            duracion === null
        ) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            })
        }

        const fechaParseada = typeof fecha === "string"
            ? new Date(`${fecha}T00:00:00Z`)
            : null
        if (
            typeof fecha !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
            !fechaParseada || Number.isNaN(fechaParseada.getTime()) ||
            fechaParseada.toISOString().slice(0, 10) !== fecha
        ) {
            return res.status(400).json({
                mensaje: "La fecha debe tener el formato YYYY-MM-DD y ser válida"
            })
        }

        if (
            typeof hora !== "string" ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)
        ) {
            return res.status(400).json({
                mensaje: "La hora debe tener el formato HH:mm"
            })
        }

        if (
            !Number.isInteger(duracionMinutos) ||
            duracionMinutos < 1 ||
            duracionMinutos > 65535
        ) {
            return res.status(400).json({
                mensaje: "La duración debe ser un entero entre 1 y 65535 minutos"
            })
        }

        if (!Number.isInteger(idClase) || idClase <= 0) {
            return res.status(400).json({
                mensaje: "Los datos de la clase no son válidos"
            })
        }

        if (
            !Number.isInteger(cantidadPreguntas) ||
            cantidadPreguntas < 1
        ) {
            return res.status(400).json({
                mensaje: "La cantidad de preguntas debe ser un entero mayor que cero"
            })
        }

        const [clases] = await pool.query(
            `
            SELECT c.id_clase
            FROM clase c
            INNER JOIN login l
                ON l.profesor_cedula_profesor = c.profesor_cedula_profesor
            WHERE c.id_clase = ?
            AND l.id_login = ?
            AND l.rol = 'profesor'
            `,
            [idClase, req.user.id]
        )

        if (clases.length === 0) {
            return res.status(404).json({
                mensaje: "Clase no encontrada"
            })
        }

        const [resultado] = await pool.query(
            `
            INSERT INTO evaluacion (
                titulo,
                descripcion,
                fecha,
                hora,
                duracion,
                tipo,
                id_clase,
                cantidad_preguntas
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                titulo,
                descripcion,
                fecha,
                hora,
                duracionMinutos,
                tipo,
                idClase,
                cantidadPreguntas
            ]
        )

        return res.status(201).json({
            mensaje: "Evaluación creada correctamente",
            id_evaluacion: resultado.insertId,
            cantidad_preguntas: cantidadPreguntas
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerEvaluacionesProfesor = async (req, res) => {
    try {
       
        const ordenarPor = req.query.ordenarPor || "fecha"
        const orden = req.query.orden || "desc"

        if (!["fecha", "id"].includes(ordenarPor)) {
            return res.status(400).json({
                mensaje: "El campo de orden debe ser 'fecha' o 'id'"
            })
        }

        if (!["asc", "desc"].includes(orden)) {
            return res.status(400).json({
                mensaje: "El orden debe ser 'asc' o 'desc'"
            })
        }

        const columnaOrden = ordenarPor === "fecha"
            ? "e.fecha"
            : "e.id_evaluacion"

        const ordenSQL = orden.toUpperCase()

        const [evaluaciones] = await pool.query(
            `
            SELECT
                e.id_evaluacion,
                e.id_clase,
                e.titulo,
                e.descripcion,
                e.fecha,
                e.hora,
                e.duracion,
                e.tipo,
                e.cantidad_preguntas
            FROM evaluacion e
            INNER JOIN clase c
                ON c.id_clase = e.id_clase
            INNER JOIN login l
                ON l.profesor_cedula_profesor = c.profesor_cedula_profesor
            WHERE l.id_login = ?
            AND l.rol = 'profesor'
            ORDER BY ${columnaOrden} ${ordenSQL}, e.id_evaluacion DESC
            `,
            [req.user.id]
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
const eliminarEvaluacion = async (req, res) => {
    let conexion

    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: "El ID de la evaluación no es válido"
            })
        }

        conexion = await pool.getConnection()

        await conexion.beginTransaction()

        const [evaluaciones] = await conexion.query(
            `
            SELECT e.id_evaluacion
            FROM evaluacion e
            INNER JOIN clase c
                ON c.id_clase = e.id_clase
            INNER JOIN login l
                ON l.profesor_cedula_profesor = c.profesor_cedula_profesor
            WHERE e.id_evaluacion = ?
            AND l.id_login = ?
            AND l.rol = 'profesor'
            FOR UPDATE
            `,
            [id, req.user.id]
        )

        if (evaluaciones.length === 0) {
            await conexion.rollback()

            return res.status(404).json({
                mensaje: "Evaluación no encontrada"
            })
        }

        const [actividad] = await conexion.query(
            `
            SELECT evaluacion_id_evaluacion AS id_evaluacion
            FROM alumno_evaluacion
            WHERE evaluacion_id_evaluacion = ?

            UNION

            SELECT evaluacion_id_evaluacion AS id_evaluacion
            FROM alumno_consigna
            WHERE evaluacion_id_evaluacion = ?

            LIMIT 1
            `,
            [id, id]
        )

        if (actividad.length > 0) {
            await conexion.rollback()

            return res.status(409).json({
                mensaje: "No se puede eliminar la evaluación porque ya tiene actividad de alumnos"
            })
        }

        await conexion.query(
            `
            DELETE FROM evaluacion_consigna
            WHERE evaluacion_id_evaluacion = ?
            `,
            [id]
        )

        await conexion.query(
            `
            DELETE FROM evaluacion
            WHERE id_evaluacion = ?
            `,
            [id]
        )

        await conexion.commit()

        return res.status(200).json({
            mensaje: "Evaluación eliminada correctamente"
        })

    } catch (error) {
        if (conexion) {
            await conexion.rollback()
        }

        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })

    } finally {
        if (conexion) {
            conexion.release()
        }
    }
}

const agregarPreguntaAEvaluacion = async (req, res) => {
    try {
        const { id, idConsigna } = req.params

        const [evaluaciones] = await pool.query(
            `
            SELECT e.id_evaluacion
            FROM evaluacion e
            INNER JOIN clase c
                ON c.id_clase = e.id_clase
            INNER JOIN login l
                ON l.profesor_cedula_profesor = c.profesor_cedula_profesor
            WHERE e.id_evaluacion = ?
            AND l.id_login = ?
            AND l.rol = 'profesor'
            `,
            [id, req.user.id]
        )

        if (evaluaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Evaluación no encontrada"
            })
        }

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

        const [evaluaciones] = await pool.query(
            `
            SELECT e.id_evaluacion
            FROM evaluacion e
            INNER JOIN clase c
                ON c.id_clase = e.id_clase
            INNER JOIN login l
                ON l.profesor_cedula_profesor = c.profesor_cedula_profesor
            WHERE e.id_evaluacion = ?
            AND l.id_login = ?
            AND l.rol = 'profesor'
            `,
            [id, req.user.id]
        )

        if (evaluaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Evaluación no encontrada"
            })
        }

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

        const [evaluaciones] = await pool.query(
            `
            SELECT e.id_evaluacion
            FROM evaluacion e
            INNER JOIN clase c
                ON c.id_clase = e.id_clase
            INNER JOIN login l
                ON l.profesor_cedula_profesor = c.profesor_cedula_profesor
            WHERE e.id_evaluacion = ?
            AND l.id_login = ?
            AND l.rol = 'profesor'
            `,
            [id, req.user.id]
        )

        if (evaluaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Evaluación no encontrada"
            })
        }

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

const obtenerResultadosProfesor = async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ mensaje: "El ID de la evaluación no es válido" })
        }

        const [evaluaciones] = await pool.query(`
            SELECT e.id_evaluacion, e.id_clase, e.titulo
            FROM evaluacion e
            INNER JOIN clase c ON c.id_clase = e.id_clase
            INNER JOIN login l ON l.profesor_cedula_profesor = c.profesor_cedula_profesor
            WHERE e.id_evaluacion = ? AND l.id_login = ? AND l.rol = 'profesor'
        `, [id, req.user.id])

        if (evaluaciones.length === 0) {
            return res.status(404).json({ mensaje: "Evaluación no encontrada" })
        }

        const evaluacion = evaluaciones[0]
        const [alumnos] = await pool.query(`
            SELECT a.cedula_alumno, a.nombre, a.apellido,
                   ae.estado, ae.fecha_inicio, ae.fecha_finalizacion
            FROM clase_alumno ca
            INNER JOIN alumno a ON a.cedula_alumno = ca.alumno_cedula_alumno
            LEFT JOIN alumno_evaluacion ae
                ON ae.alumno_cedula_alumno = ca.alumno_cedula_alumno
               AND ae.evaluacion_id_evaluacion = ?
            WHERE ca.id_clase = ? AND ca.estado = 'activo'
            ORDER BY a.apellido, a.nombre
        `, [id, evaluacion.id_clase])

        const [entregas] = await pool.query(`
            SELECT ac.alumno_cedula_alumno, ac.id_asignacion, c.consigna,
                   r.id_respuesta, r.respuesta, r.nota_final,
                   ec.id_entrega_codigo, ec.nombre_archivo,
                   cc.estado AS estado_correccion, cc.nota AS nota_ia,
                   cc.feedback_json
            FROM alumno_consigna ac
            INNER JOIN consigna c ON c.id_consigna = ac.consigna_id_consigna
            LEFT JOIN respuesta r
                ON r.alumno_consigna_id_asignacion = ac.id_asignacion
            LEFT JOIN entrega_codigo ec
                ON ec.alumno_consigna_id_asignacion = ac.id_asignacion
            LEFT JOIN correccion_codigo cc
                ON cc.entrega_codigo_id = ec.id_entrega_codigo
            WHERE ac.evaluacion_id_evaluacion = ?
            ORDER BY ac.alumno_cedula_alumno, ac.id_asignacion, ec.id_entrega_codigo
        `, [id])

        const porAlumno = new Map()
        for (const fila of entregas) {
            const preguntas = porAlumno.get(fila.alumno_cedula_alumno) || []
            let pregunta = preguntas.find(item => item.id_asignacion === fila.id_asignacion)
            if (!pregunta) {
                pregunta = {
                    id_asignacion: fila.id_asignacion,
                    consigna: fila.consigna,
                    id_respuesta: fila.id_respuesta,
                    respuesta: fila.respuesta,
                    nota: fila.nota_final,
                    entregas_codigo: []
                }
                preguntas.push(pregunta)
            }
            if (fila.id_entrega_codigo !== null) {
                pregunta.entregas_codigo.push({
                    nombre_archivo: fila.nombre_archivo,
                    estado: fila.estado_correccion,
                    nota: fila.nota_ia,
                    devolucion: fila.feedback_json
                })
            }
            porAlumno.set(fila.alumno_cedula_alumno, preguntas)
        }

        return res.status(200).json({
            evaluacion: { id: evaluacion.id_evaluacion, titulo: evaluacion.titulo },
            resultados: alumnos.map(alumno => ({
                ...alumno,
                preguntas: porAlumno.get(alumno.cedula_alumno) || []
            }))
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ mensaje: "Error interno del servidor" })
    }
}

const calificarRespuestaAlumno = async (req, res) => {
    try {
        const idEvaluacion = Number(req.params.id)
        const idRespuesta = Number(req.params.idRespuesta)
        const nota = Number(req.body?.nota)
        if (!Number.isInteger(idEvaluacion) || idEvaluacion <= 0 ||
            !Number.isInteger(idRespuesta) || idRespuesta <= 0 ||
            !Number.isFinite(nota) || nota < 0 || nota > 10) {
            return res.status(400).json({ mensaje: "La nota debe ser un número entre 0 y 10" })
        }


        const [resultado] = await pool.query(`
            UPDATE respuesta r
            INNER JOIN alumno_consigna ac
                ON ac.id_asignacion = r.alumno_consigna_id_asignacion
            INNER JOIN evaluacion e
                ON e.id_evaluacion = ac.evaluacion_id_evaluacion
            INNER JOIN clase c ON c.id_clase = e.id_clase
            INNER JOIN login l
                ON l.profesor_cedula_profesor = c.profesor_cedula_profesor
            SET r.nota_final = ?
            WHERE r.id_respuesta = ?
              AND e.id_evaluacion = ?
              AND l.id_login = ?
              AND l.rol = 'profesor'
        `, [nota, idRespuesta, idEvaluacion, req.user.id])

        if (resultado.affectedRows === 0) {
            const [existentes] = await pool.query(`
                SELECT r.id_respuesta
                FROM respuesta r
                INNER JOIN alumno_consigna ac ON ac.id_asignacion = r.alumno_consigna_id_asignacion
                INNER JOIN evaluacion e ON e.id_evaluacion = ac.evaluacion_id_evaluacion
                INNER JOIN clase c ON c.id_clase = e.id_clase
                INNER JOIN login l ON l.profesor_cedula_profesor = c.profesor_cedula_profesor
                WHERE r.id_respuesta = ? AND e.id_evaluacion = ? AND l.id_login = ?
            `, [idRespuesta, idEvaluacion, req.user.id])
            if (existentes.length === 0) {
                return res.status(404).json({ mensaje: "Respuesta no encontrada para esta evaluación" })
            }
        }
        return res.status(200).json({ mensaje: "Nota guardada", nota })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ mensaje: "Error interno del servidor" })
    }
}

export {
    crearEvaluacion,
    obtenerEvaluacionesProfesor,
    eliminarEvaluacion,
    agregarPreguntaAEvaluacion,
    obtenerPreguntasDeEvaluacion,
    eliminarPreguntaDeEvaluacion,
    obtenerResultadosProfesor,
    calificarRespuestaAlumno
}
