import { pool } from "../config/database.js"

const crearClase = async (req, res) => {
    try {
        // Recibo datos 
        const { nombre, periodo_lectivo } = req.body

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
                mensaje: "No se encontrÃ³ el profesor autenticado"
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
            [nombre, periodo_lectivo, cedulaProfesor]
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
        const idClase = req.params.id_clase
        const cedulaAlumno = req.body.cedula_alumno

        // Compruebo que la clase pertenece al profesor autenticado
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
                mensaje: "El alumno ya estÃ¡ inscrito en esta clase"
            })
        }

        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerAlumnosDeClase = async (req, res) => {
    try {
        const idClase = req.params.id_clase

        // Verificar que la clase pertenezca al profesor autenticado
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

        // Listo los alumnos inscritos en una clase
        const [alumnos] = await pool.query(
            `
            SELECT 
                a.cedula_alumno,
                a.nombre,
                a.apellido,
                a.correo,
                ca.fecha_inscripcion,
                ca.estado
            FROM clase_alumno ca
            INNER JOIN alumno a
                ON a.cedula_alumno = ca.alumno_cedula_alumno
            WHERE ca.id_clase = ?
            ORDER BY ca.estado, a.apellido, a.nombre
            `,
            [idClase]
        )

        return res.status(200).json({ alumnos })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const actualizarEstadoAlumnoEnClase = async (req, res) => {
    try {
        // Recibo los datos y los valido
        const idClase = req.params.id_clase
        const cedulaAlumno = req.params.cedula_alumno
        const estado = req.body?.estado

        // Compruebo que la clase pertenece al profesor autenticado
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

        // Compruebo que el alumno estÃ¡ inscrito en esa clase
        const [inscripciones] = await pool.query(
            `
            SELECT alumno_cedula_alumno
            from clase_alumno
            WHERE id_clase = ?
            AND alumno_cedula_alumno = ?
            `,
            [idClase, cedulaAlumno]
        )

        if (inscripciones.length === 0) {
            return res.status(404).json({
                mensaje: "Inscripcion no encontrada"
            })
        }

        // Actualizo los datos del alumno
        await pool.query(
            `
            UPDATE clase_alumno
            SET estado = ?
            WHERE id_clase = ?
            AND alumno_cedula_alumno = ?
            `,
            [estado, idClase, cedulaAlumno]
        )

        return res.status(200).json({
            mensaje: "Estado de inscripcion actualizado"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    crearClase,
    obtenerMisClases,
    inscribirALumnoEnClase,
    obtenerAlumnosDeClase,
    actualizarEstadoAlumnoEnClase
}




