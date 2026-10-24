const validarBody = (schema) => (req, res, next) => {
    const resultado = schema.safeParse(req.body)

    if (!resultado.success) {
        return res.status(400).json({
            mensaje: "Los datos enviados no son validos",
            errores: resultado.error.issues.map(error => ({
                campo: error.path.join("."),
                mensaje: error.message
            }))
        })
    }

    req.body = resultado.data
    next()
}

const validarParams = (schema) => (req, res, next) => {
    const resultado = schema.safeParse(req.params)

    if (!resultado.success) {
        return res.status(400).json({
            mensaje: "Los parametros enviados no son validos",
            errores: resultado.error.issues.map(error => ({
                campo: error.path.join("."),
                mensaje: error.message
            }))
        })
    }

    req.params = resultado.data
    next()
}

export {
    validarBody,
    validarParams
}