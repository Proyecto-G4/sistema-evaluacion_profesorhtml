import express from "express"
import cors from "cors"
import alumnoRoutes from "./routes/alumnoRoutes.js"
import alumnoEvaluacionRoutes from "./routes/alumnoEvaluacionRoutes.js"
import profesorRoutes from "./routes/profesorRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import consignaRoutes from "./routes/consignaRoutes.js"
import evaluacionRoutes from "./routes/evaluacionRoutes.js"
import claseRoutes from "./routes/claseRoutes.js"

const app = express()

app.use(cors())
    
app.use(express.json())

app.use("/api/alumnos", alumnoEvaluacionRoutes)
app.use("/api/alumnos", alumnoRoutes)
app.use("/api/profesores", profesorRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/consignas", consignaRoutes)
app.use("/api/evaluaciones", evaluacionRoutes)
app.use("/api/clases", claseRoutes)

export default app