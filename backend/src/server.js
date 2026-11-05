import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import app from "./app.js"
import { verificarConexion } from "./config/database.js"

// Carga backend/.env aunque el servidor se lance desde la raíz del repositorio.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const PORT = process.env.PORT || 2323

app.listen(PORT, async () => {
    console.log(`Servidor ejecutandose en puerto ${PORT}`)

    await verificarConexion()
});
