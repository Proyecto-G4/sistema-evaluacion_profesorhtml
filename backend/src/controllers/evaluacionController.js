import { pool } from "../config/database.js"

const crearEvaluacion = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            fecha,
            tipo,
            id_clase,
            cantidad_preguntas
        } = req.body ?? {}

        const idClase = Number(id_clase)
        const cantidadPreguntas = Number(cantidad_preguntas)

        if (!titulo || !descripcion || !fecha || !tipo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
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
                tipo,
                id_clase,
                cantidad_preguntas
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                titulo,
                descripcion,
                fecha,
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

export {
    crearEvaluacion,
    agregarPreguntaAEvaluacion,
    obtenerPreguntasDeEvaluacion,
    eliminarPreguntaDeEvaluacion
}