import multer from "multer"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const uploadsDir = fileURLToPath(new URL("../../uploads/", import.meta.url))
fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir)
    },

    filename: (req, file, cb) => {
        const nombreOriginal = path.basename(file.originalname)
        cb(null, `${Date.now()}-${nombreOriginal}`)
    }
})
const extensionesPermitidas = [
    ".c",
    ".cs",
    ".java",
    ".py",
    ".cpp",
    ".html",
    ".css",
    ".js",
    ".json",
    ".txt",
    ".zip",
    ".h",
    ".ts"
]

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()

    if (!extensionesPermitidas.includes(extension)) {
        return cb(new Error("Tipo de archivo no permitido"))
    }

    cb(null, true)
}
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10_000_000 
    }
})

export { upload }
