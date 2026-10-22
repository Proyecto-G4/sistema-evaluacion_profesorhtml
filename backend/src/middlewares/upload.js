import multer from "multer"
import path from "path"

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/")
    },

    filename: (req, file, cb) => {
        const nombreOriginal = path.basename(file.originalname)
        cb(null, `${Date.now()}-${nombreOriginal}`)
    }
})
// Filtro de archivos permitidos
const extensionesPermitidas = [
    ".cs",
    ".java",
    ".py",
    ".cpp",
    ".html",
    ".css",
    ".js",
    ".json",
    ".txt",
    ".zip"
]

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()

    if (!extensionesPermitidas.includes(extension)) {
        return cb(new Error("Tipo de archivo no permitido"))
    }

    cb(null, true)
}
// Configuración de multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 
    }
})

export { upload }