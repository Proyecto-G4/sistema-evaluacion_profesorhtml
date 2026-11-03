import { pool } from "../config/database.js"

const obtenerSolicitudesAltaAlumno = async (req, res) => {
    try {
        const estado = req.query.estado || "pendiente"
        const estadosValidos = ["pendiente", "aprobada", "rechazada", "todas"]

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                mensaje: "El estado solicitado no es valido"
            })
        }

        // Los docentes solo revisan solicitudes pendientes
        if (req.user.rol === "profesor" && estado !== "pendiente") {
            return res.status(403).json({
                mensaje: "Los docentes solo pueden consultar solicitudes pendientes"
            })
        }

        // Si buscamos todos los estados no añadimos ningun filtro, caso contrario agregamos
        const filtroEstado = estado === "todas"
            ? ""
            : "AND s.estado = ?"

        // Preparamos los parametros para enviarlos a MySQL
        const parametros = estado === "todas" ? [] : [estado]

        const [solicitudes] = await pool.query(
            `
            SELECT
                s.id_solicitud,
                s.alumno_cedula_alumno,
                s.usuario,
                s.estado,
                s.motivo_rechazo,
                s.fecha_solicitud,
                s.fecha_resolucion,
                s.resuelta_por_usuario,
                s.resuelta_por_rol,
                a.nombre,
                a.apellido,
                a.correo
            FROM solicitud_alta_alumno s
            INNER JOIN alumno a
                ON a.cedula_alumno = s.alumno_cedula_alumno
            WHERE 1 = 1 ${filtroEstado}
            ORDER BY s.fecha_solicitud ASC
            `,
            parametros
        )

        return res.status(200).json({ solicitudes })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const resolverSolicitudAltaAlumno = async (req, res) => {
    let conexion

    try {
        const idSolicitud = Number(req.params.id)
        const { decision, motivo } = req.body

        conexion = await pool.getConnection()
        await conexion.beginTransaction()

        // El bloqueo evita que dos revisores resuelvan la misma solicitud a la vez
        const [solicitudes] = await conexion.query(
            `
            SELECT
                id_solicitud,
                alumno_cedula_alumno,
                usuario,
                password_hash,
                estado
            FROM solicitud_alta_alumno
            WHERE id_solicitud = ?
            FOR UPDATE
            `,
            [idSolicitud]
        )

        if (solicitudes.length === 0) {
            await conexion.rollback()
            return res.status(404).json({
                mensaje: "Solicitud no encontrada"
            })
        }

        const solicitud = solicitudes[0]

        if (solicitud.estado !== "pendiente") {
            await conexion.rollback()
            return res.status(409).json({
                mensaje: "La solicitud ya fue resuelta"
            })
        }

        let cuentaCreadaId = null

        // Verifico si la decision es "aprobar"
        if (decision === "aprobar") {
            const [cuentasExistentes] = await conexion.query(
                `
                SELECT id_login
                FROM login
                WHERE alumno_cedula_alumno = ? OR usuario = ?
                FOR UPDATE
                `,
                [solicitud.alumno_cedula_alumno, solicitud.usuario]
            )

            if (cuentasExistentes.length > 0) {
                await conexion.rollback()
                return res.status(409).json({
                    mensaje: "La cédula o el usuario ya están asociados a una cuenta"
                })
            }

            const [cuenta] = await conexion.query(
                `
                INSERT INTO login (
                    usuario,
                    password_hash,
                    rol,
                    alumno_cedula_alumno,
                    estado
                )
                VALUES (?, ?, 'alumno', ?, 'activo')
                `,
                [
                    solicitud.usuario,
                    solicitud.password_hash,
                    solicitud.alumno_cedula_alumno
                ]
            )

            cuentaCreadaId = cuenta.insertId
        }

        const estadoNuevo = decision === "aprobar"
            ? "aprobada"
            : "rechazada"

        const motivoRechazo = decision === "rechazar"
            ? motivo.trim()
            : null

        // Al resolver, se borra el hash de contraseña de la solicitud
        await conexion.query(
            `
            UPDATE solicitud_alta_alumno
            SET
                estado = ?,
                motivo_rechazo = ?,
                password_hash = NULL,
                resuelta_por_login_id = ?,
                resuelta_por_usuario = ?,
                resuelta_por_rol = ?,
                fecha_resolucion = CURRENT_TIMESTAMP
            WHERE id_solicitud = ?
            `,
            [
                estadoNuevo,
                motivoRechazo,
                req.user.id,
                req.user.usuario,
                req.user.rol,
                idSolicitud
            ]
        )

        // Registra quien tomo la decision y cual fue
        await conexion.query(
            `
            INSERT INTO auditoria_cuenta (
                tipo_solicitud,
                solicitud_id,
                accion,
                cuenta_objetivo_id,
                alumno_cedula,
                actor_login_id,
                actor_usuario,
                actor_rol,
                motivo
            )
            VALUES ('alta_alumno', ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                idSolicitud,
                decision === "aprobar"
                    ? "solicitud_aprobada"
                    : "solicitud_rechazada",
                cuentaCreadaId,
                solicitud.alumno_cedula_alumno,
                req.user.id,
                req.user.usuario,
                req.user.rol,
                motivoRechazo
            ]
        )

        await conexion.commit()

        return res.status(200).json({
            mensaje: decision === "aprobar"
                ? "Solicitud aprobada"
                : "Solicitud rechazada",
            estado: estadoNuevo,
            cuenta_id: cuentaCreadaId
        })
    } catch (error) {
        
        if (conexion) {
            await conexion.rollback().catch(() => {})
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensaje: "La cédula o el usuario ya están registrados"
            })
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

const obtenerCuentas = async (req, res) => {
    try {
        const [cuentas] = await pool.query(`
            SELECT
                l.id_login,
                l.usuario,
                l.rol,
                l.estado,
                COALESCE(a.cedula_alumno, p.cedula_profesor) AS cedula,
                COALESCE(a.nombre, p.nombre) AS nombre,
                COALESCE(a.apellido, p.apellido) AS apellido,
                COALESCE(a.correo, p.correo) AS correo
            FROM login l
            LEFT JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            LEFT JOIN profesor p
                ON p.cedula_profesor = l.profesor_cedula_profesor
            ORDER BY l.rol, l.usuario
        `)

        return res.status(200).json({ cuentas })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const cambiarEstadoCuenta = async (req, res) => {
    let conexion

    try {
        const idCuenta = Number(req.params.id)
        const { estado, motivo } = req.body

        // Evita que el administrador que esta usando la sesion se bloquee a si mismo
        if (idCuenta === Number(req.user.id) && estado !== "activo") {
            return res.status(400).json({
                mensaje: "No podés suspender ni eliminar tu propia cuenta"
            })
        }

        conexion = await pool.getConnection()
        await conexion.beginTransaction()

        const [cuentas] = await conexion.query(
            `SELECT id_login, estado
             FROM login
             WHERE id_login = ?
             FOR UPDATE`,
            [idCuenta]
        )

        if (cuentas.length === 0) {
            await conexion.rollback()
            return res.status(404).json({
                mensaje: "Cuenta no encontrada"
            })
        }

        const estadoActual = cuentas[0].estado

        if (estadoActual === "eliminado" && estado !== "eliminado") {
            await conexion.rollback()
            return res.status(409).json({
                mensaje: "Una cuenta eliminada no se puede reactivar"
            })
        }

        if (estadoActual === estado) {
            await conexion.rollback()
            return res.status(409).json({
                mensaje: "La cuenta ya tiene ese estado"
            })
        }

        await conexion.query(
            `UPDATE login
             SET estado = ?
             WHERE id_login = ?`,
            [estado, idCuenta]
        )

        await conexion.query(
            `INSERT INTO auditoria_cuenta (
                tipo_solicitud,
                accion,
                cuenta_objetivo_id,
                actor_login_id,
                actor_usuario,
                actor_rol,
                motivo
             )
             VALUES ('administracion', ?, ?, ?, ?, ?, ?)`,
            [
                estado === "activo" ? "cuenta_reactivada" : `cuenta_${estado}`,
                idCuenta,
                req.user.id,
                req.user.usuario,
                req.user.rol,
                motivo || null
            ]
        )

        await conexion.commit()

        return res.status(200).json({
            mensaje: "Estado de cuenta actualizado",
            estado
        })
    } catch (error) {
        if (conexion) {
            await conexion.rollback().catch(() => {})
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

const solicitarGestionCuenta = async (req, res) => {
    let conexion

    try {
        const idObjetivo = Number(req.params.id)
        const { accion, motivo } = req.body

        conexion = await pool.getConnection()
        await conexion.beginTransaction()

        const [cuentas] = await conexion.query(
            `
            SELECT id_login, rol, estado, alumno_cedula_alumno
            FROM login
            WHERE id_login = ?
            FOR UPDATE
            `,
            [idObjetivo]
        )

        if (cuentas.length === 0) {
            await conexion.rollback()
            return res.status(404).json({
                mensaje: "Cuenta no encontrada"
            })
        }

        const cuentaObjetivo = cuentas[0]

        if (cuentaObjetivo.rol !== "alumno") {
            await conexion.rollback()
            return res.status(403).json({
                mensaje: "Solo se pueden solicitar acciones sobre cuentas de alumnos"
            })
        }

        if (cuentaObjetivo.estado !== "activo") {
            await conexion.rollback()
            return res.status(409).json({
                mensaje: "La cuenta ya no está activa"
            })
        }

        if (
            req.user.rol === "alumno" &&
            (
                idObjetivo !== Number(req.user.id) ||
                accion !== "eliminar"
            )
        ) {
            await conexion.rollback()
            return res.status(403).json({
                mensaje: "El alumno solo puede solicitar la eliminación de su propia cuenta"
            })
        }

        const [solicitudesExistentes] = await conexion.query(
            `
            SELECT id_solicitud
            FROM solicitud_gestion_cuenta
            WHERE cuenta_objetivo_id = ?
              AND estado = 'pendiente'
            FOR UPDATE
            `,
            [idObjetivo]
        )

        if (solicitudesExistentes.length > 0) {
            await conexion.rollback()
            return res.status(409).json({
                mensaje: "Ya existe una solicitud pendiente para esta cuenta"
            })
        }

        const [resultado] = await conexion.query(
            `
            INSERT INTO solicitud_gestion_cuenta (
                cuenta_objetivo_id,
                cuenta_solicitante_id,
                solicitante_usuario,
                solicitante_rol,
                accion,
                motivo
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                idObjetivo,
                req.user.id,
                req.user.usuario,
                req.user.rol,
                accion,
                motivo
            ]
        )

        await conexion.query(
            `
            INSERT INTO auditoria_cuenta (
                tipo_solicitud,
                solicitud_id,
                accion,
                cuenta_objetivo_id,
                alumno_cedula,
                actor_login_id,
                actor_usuario,
                actor_rol,
                motivo
            )
            VALUES ('gestion_cuenta', ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                resultado.insertId,
                accion === "eliminar"
                    ? "eliminacion_solicitada"
                    : "suspension_solicitada",
                idObjetivo,
                cuentaObjetivo.alumno_cedula_alumno,
                req.user.id,
                req.user.usuario,
                req.user.rol,
                motivo
            ]
        )

        await conexion.commit()

        return res.status(201).json({
            mensaje: "Solicitud enviada al administrador",
            id_solicitud: resultado.insertId,
            estado: "pendiente"
        })

    } catch (error) {
        if (conexion) {
            await conexion.rollback().catch(() => {})
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensaje: "Ya existe una solicitud pendiente para esta cuenta"
            })
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

const obtenerSolicitudesGestion = async (req, res) => {
    try {
        const [solicitudes] = await pool.query(`
            SELECT
                s.id_solicitud,
                s.cuenta_objetivo_id,
                objetivo.usuario AS cuenta_objetivo,
                s.cuenta_solicitante_id,
                s.solicitante_usuario,
                s.solicitante_rol,
                s.accion,
                s.motivo,
                s.fecha_solicitud
            FROM solicitud_gestion_cuenta s
            INNER JOIN login objetivo
                ON objetivo.id_login = s.cuenta_objetivo_id
            WHERE s.estado = 'pendiente'
            ORDER BY s.fecha_solicitud ASC
        `)

        return res.status(200).json({ solicitudes })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const resolverSolicitudGestion = async (req, res) => {
    let conexion

    try {
        const idSolicitud = Number(req.params.id)
        const { decision, motivo } = req.body

        conexion = await pool.getConnection()
        await conexion.beginTransaction()

        // Primero leemos el ID objetivo sin bloquear
        // despues bloqueamos la cuenta y la solicitud en ese orden
        const [referencias] = await conexion.query(
            `SELECT cuenta_objetivo_id
             FROM solicitud_gestion_cuenta
             WHERE id_solicitud = ?`,
            [idSolicitud]
        )

        if (referencias.length === 0) {
            await conexion.rollback()
            return res.status(404).json({
                mensaje: "Solicitud no encontrada"
            })
        }

        const idObjetivo = referencias[0].cuenta_objetivo_id

        const [cuentas] = await conexion.query(
            `SELECT id_login, rol, estado, alumno_cedula_alumno
             FROM login
             WHERE id_login = ?
             FOR UPDATE`,
            [idObjetivo]
        )

        const [solicitudes] = await conexion.query(
            `SELECT id_solicitud, cuenta_objetivo_id, accion, estado
             FROM solicitud_gestion_cuenta
             WHERE id_solicitud = ?
             FOR UPDATE`,
            [idSolicitud]
        )

        if (solicitudes.length === 0) {
            await conexion.rollback()
            return res.status(404).json({
                mensaje: "Solicitud no encontrada"
            })
        }

        const solicitud = solicitudes[0]

        if (solicitud.estado !== "pendiente") {
            await conexion.rollback()
            return res.status(409).json({
                mensaje: "La solicitud ya fue resuelta"
            })
        }

        if (cuentas.length === 0) {
            await conexion.rollback()
            return res.status(409).json({
                mensaje: "La cuenta solicitada ya no existe"
            })
        }

        const cuenta = cuentas[0]
        let estadoCuentaNuevo = null

        if (decision === "aprobar") {
            if (cuenta.rol !== "alumno" || cuenta.estado !== "activo") {
                await conexion.rollback()
                return res.status(409).json({
                    mensaje: "La cuenta ya no está activa o no es una cuenta de alumno"
                })
            }

            estadoCuentaNuevo = solicitud.accion === "suspender"
                ? "suspendido"
                : "eliminado"

            await conexion.query(
                `UPDATE login
                 SET estado = ?
                 WHERE id_login = ?`,
                [estadoCuentaNuevo, cuenta.id_login]
            )
        }

        const estadoSolicitud = decision === "aprobar"
            ? "aprobada"
            : "rechazada"

        const motivoResolucion = motivo?.trim() || null

        await conexion.query(
            `UPDATE solicitud_gestion_cuenta
             SET estado = ?,
                 motivo_resolucion = ?,
                 resuelta_por_login_id = ?,
                 resuelta_por_usuario = ?,
                 fecha_resolucion = CURRENT_TIMESTAMP
             WHERE id_solicitud = ?`,
            [
                estadoSolicitud,
                motivoResolucion,
                req.user.id,
                req.user.usuario,
                idSolicitud
            ]
        )

        await conexion.query(
            `INSERT INTO auditoria_cuenta (
                tipo_solicitud,
                solicitud_id,
                accion,
                cuenta_objetivo_id,
                alumno_cedula,
                actor_login_id,
                actor_usuario,
                actor_rol,
                motivo
             )
             VALUES ('gestion_cuenta', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                idSolicitud,
                decision === "aprobar"
                    ? `cuenta_${solicitud.accion}`
                    : "solicitud_rechazada",
                cuenta.id_login,
                cuenta.alumno_cedula_alumno,
                req.user.id,
                req.user.usuario,
                req.user.rol,
                motivoResolucion
            ]
        )

        await conexion.commit()

        return res.status(200).json({
            mensaje: decision === "aprobar"
                ? "Solicitud aprobada"
                : "Solicitud rechazada",
            estado: estadoSolicitud,
            estado_cuenta: estadoCuentaNuevo
        })
    } catch (error) {
        if (conexion) {
            await conexion.rollback().catch(() => {})
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

const obtenerMisSolicitudesGestion = async (req, res) => {
    try {
        const [solicitudes] = await pool.query(
            `
            SELECT
                s.id_solicitud,
                s.cuenta_objetivo_id,
                objetivo.usuario AS cuenta_objetivo,
                s.accion,
                s.motivo,
                s.estado,
                s.motivo_resolucion,
                s.resuelta_por_usuario,
                s.fecha_solicitud,
                s.fecha_resolucion
            FROM solicitud_gestion_cuenta s
            INNER JOIN login objetivo
                ON objetivo.id_login = s.cuenta_objetivo_id
            WHERE s.cuenta_solicitante_id = ?
            ORDER BY s.fecha_solicitud DESC
            `,
            [req.user.id]
        )

        return res.status(200).json({ solicitudes })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    obtenerSolicitudesAltaAlumno,
    resolverSolicitudAltaAlumno,
    obtenerCuentas,
    cambiarEstadoCuenta,
    solicitarGestionCuenta,
    obtenerSolicitudesGestion,
    resolverSolicitudGestion,
    obtenerMisSolicitudesGestion
}