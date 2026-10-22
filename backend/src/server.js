import dotenv from "dotenv"
import app from "./app.js"
import { verificarConexion } from "./config/database.js"

dotenv.config();

const PORT = process.env.PORT || 2323

app.listen(PORT, async () => {
    console.log(`Servidor ejecutandose en puerto ${PORT}`)

    await verificarConexion()
});