import express from "express"
import cors from "cors"
import alumnoRoutes from "./routes/alumnoRoutes.js"
import alumnoEvaluacionRoutes from "./routes/alumnoEvaluacionRoutes.js"
import profesorRoutes from "./routes/profesorRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import consignaRoutes from "./routes/consignaRoutes.js"
import evaluacionRoutes from "./routes/evaluacionRoutes.js"
import claseRoutes from "./routes/claseRoutes.js"
import helmet from "helmet"
import cuentaRoutes from "./routes/cuentaRoutes.js"
import dotenv from "dotenv"
import { fileURLToPath } from "node:url"

// Carga la configuración antes de construir CORS, también si app.js se importa directamente.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) })

const app = express()

app.use(helmet())
// Restringe el acceso desde navegador a los orígenes configurados en despliegue.
const origins = (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean)
app.use(cors({ origin: origins }))
    
app.use(express.json())

app.use("/api/alumnos", alumnoEvaluacionRoutes)
app.use("/api/alumnos", alumnoRoutes)
app.use("/api/profesores", profesorRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/consignas", consignaRoutes)
app.use("/api/evaluaciones", evaluacionRoutes)
app.use("/api/clases", claseRoutes)
app.use("/api/cuentas", cuentaRoutes)

export default app
