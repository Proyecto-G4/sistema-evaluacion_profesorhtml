import { pool } from "../config/database.js"

const crearClase = async (req, res) => {
    try {
        // Recibo datos 
        const { nombre, periodo_lectivo } = req.body

        // Valido que sean datos válidos
        if (
            typeof nombre !== "string" || // typeof permite saber el tipo de dato
            !nombre.trim() || // trim() elimina espacios al principio y final
            typeof periodo_lectivo !== "string" ||
            !periodo_lectivo.trim() 
        ) {
            return res.status(400).json({
                mensaje: "Los datos ingresados no son válidos"
            })
        }

        // Obtenemos la cedula del profesor desde la base de datos
        const [profesores] = await pool.query(
            `
            SELECT profesor_cedula_profesor
            FROM login
            WHERE id_login = ? AND rol = 'profesor'
            `,
            [req.user.id]
        )

        if (profesores.length === 0) {
            return res.status(403).json({
                mensaje: "No se encontró el profesor autenticado"
            })
        }

        const cedulaProfesor = profesores[0].profesor_cedula_profesor

        const [resultado] = await pool.query(
            `
            INSERT INTO clase (
            nombre,
            periodo_lectivo,
            profesor_cedula_profesor
            )
            VALUES (?, ?, ?)
            `,
            [nombre.trim(), periodo_lectivo.trim(), cedulaProfesor]
        )

        return res.status(201).json({
            mensaje: "Clase creada correctamente",
            id_clase: resultado.insertId
        })

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensaje: "Ya existe una clase con ese nombre en ese periodo"
            })
        }

        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerMisClases = async (req, res) => {
    try {
        const [clases] = await pool.query(
            `
            SELECT 
                c.id_clase,
                c.nombre,
                c.periodo_lectivo,
                c.fecha_creacion
            FROM clase c
            INNER JOIN login l
                ON l.profesor_cedula_profesor = c.profesor_cedula_profesor
            WHERE l.id_login = ?
            AND l.rol = 'profesor'
            ORDER BY c.fecha_creacion DESC
            `,
            [req.user.id]
        )

        return res.status(200).json({ clases })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const inscribirALumnoEnClase = async (req, res) => {
    try {
        const idClase = Number(req.params.id_clase)
        const cedulaAlumno = Number(req.body?.cedula_alumno)

        if (
            !Number.isInteger(idClase) || 
            idClase <= 0 ||
            !Number.isInteger(cedulaAlumno) ||
            cedulaAlumno <= 0
        ) {
            return res.status(400).json({
                mensaje: "Los datos ingresados no son válidos"
            })

        }

        // Compruebo que la clase pertenece al profesor autenticado
        const [clases] = await pool.query(
            `
            SELECT c.id_clase
            FROM clase c
            INNER JOIN login l
                ON l.profesor_cedula_profesor =  c.profesor_cedula_profesor
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

        // Compruebo que la cedula corresponde a un alumno existente
        const [alumnos] = await pool.query(
            `
            SELECT cedula_alumno
            FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedulaAlumno]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "Alumno no encontrado"
            })
        }

        // Inserto los datos validos
        await pool.query(
            `
            INSERT INTO clase_alumno (
            id_clase,
            alumno_cedula_alumno
            )
            VALUES (?, ?)
            `,
            [idClase, cedulaAlumno]
        )

        return res.status(201).json({
            mensaje: "Alumno inscrito correctamente"
        })

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensaje: "El alumno ya está inscrito en esta clase"
            })
        }

        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    crearClase,
    obtenerMisClases,
    inscribirALumnoEnClase
}