/**
 * Valida si el rol del usuario logueado es profesor
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
 * Valida si el rol del usuario logueado es alumno
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

/**
 * Valida que el rol del usuario autenticado sea administrador
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */

const roleAdmin = (req, res, next) => {
    try {
        if (req.user?.rol?.toLowerCase() !== "admin") {
            return res.status(403).json({
                mensaje: "Acceso no permitido"
            })
        }

        next()
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}
/**
 * Valida que ese usuario sea admin o profesor
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */

const roleRevisorCuenta = (req, res, next) => {
    if (!["admin", "profesor"].includes(req.user?.rol)) {
        return res.status(403).json({
            mensaje: "Solo un docente o administrador puede revisar solicitudes"
        })
    }

    next()
}

/**
 * Valida que el solicitante de la informacion sea alumno o docente
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */

const roleSolicitanteCuenta = (req, res, next) => {
    if (!["alumno", "profesor"].includes(req.user?.rol)) {
        return res.status(403).json({
            mensaje: "Solo alumnos y docentes pueden solicitar acciones sobre cuentas"
        })
    }

    next()
}

export {
    roleProfesor,
    roleAlumno,
    roleAdmin,
    roleRevisorCuenta,
    roleSolicitanteCuenta
}
