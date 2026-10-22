import { pool } from "../config/database.js"

// Crear una nueva consigna en la base de datos
const crearConsigna = async (req, res) => {
    try {
        const { consigna } = req.body

        if (typeof consigna !== "string" || !consigna.trim()) {
            return res.status(400).json({
                mensaje: "La consigna es obligatoria"
            })
        }

        const [resultado] = await pool.query(
            `INSERT INTO consigna (
                consigna,
                respuesta_correcta,
                fecha_creacion
            ) VALUES (?, ?, NOW())`,
            [consigna.trim(), ""]
        )

        return res.status(201).json({
            mensaje: "Consigna creada correctamente",
            id_consigna: resultado.insertId
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

// Guardar la respuesta correcta de una consigna existente
const guardarRespuestaCorrecta = async (req, res) => {
    try {
        const { id } = req.params
        const { respuesta_correcta } = req.body

        if (
            typeof respuesta_correcta !== "string" ||
            !respuesta_correcta.trim()
        ) {
            return res.status(400).json({
                mensaje: "La respuesta correcta es obligatoria"
            })
        }

        const [resultado] = await pool.query(
            `
            UPDATE consigna
            SET respuesta_correcta = ?
            WHERE id_consigna = ?
            `,
            [respuesta_correcta.trim(), id]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Consigna no encontrada"
            })
        }

        return res.status(200).json({
            mensaje: "Respuesta correcta guardada correctamente"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

//Obtener todas las consignas desde la base de datos
const obtenerConsignas = async (req, res) => {
    const orden = req.query.orden === "antiguas" ? "ASC" : "DESC"
    try {
        const [consignas] = await pool.query(
            `
            SELECT
                id_consigna,
                consigna,
                respuesta_correcta,
                fecha_creacion
            FROM consigna
            ORDER BY fecha_creacion ${orden}
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
//Modificar una consigna existente en la base de datos
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
//Eliminar una consigna existente en la base de datos
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
    eliminarConsigna,
    guardarRespuestaCorrecta
}