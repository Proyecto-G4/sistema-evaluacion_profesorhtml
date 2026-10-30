# Corrección automática con Ollama

## Qué hace cada parte

- **Ollama** ejecuta localmente el modelo de lenguaje. El proyecto usa `qwen2.5-coder:7b` por defecto y no necesita una clave de proveedor externo.
- **`src/services/ollamaGradingService.js`** lee el código fuente o el ZIP, prepara la consigna, la respuesta de referencia y la rúbrica, llama a Ollama y valida el JSON devuelto.
- **`src/middlewares/upload.js`** recibe el archivo multipart `archivo`, filtra extensiones permitidas y limita la subida a 5 MB.
- **`src/controllers/alumnoEvaluacionController.js`** comprueba que la pregunta asignada pertenezca al alumno, registra la entrega, solicita la corrección y expone los resultados guardados.
- **`migrations/001_ollama_correcciones.sql`** agrega una rúbrica a cada consigna y crea la tabla que persiste el estado, la nota, la devolución, el modelo y los errores de corrección.
- Esta integración añade los endpoints de backend. La interfaz Vue del repositorio todavía no muestra la carga de código ni la devolución de IA.

## 1. Instalar y preparar Ollama

Instala Ollama para Windows desde https://ollama.com/download. En PowerShell descarga el modelo:

```powershell
ollama pull qwen2.5-coder:7b
ollama list
```

El modelo se descarga una vez y Ollama debe estar ejecutándose mientras el backend corrige. Si el equipo tiene poca memoria, puedes probar `qwen2.5-coder:3b`; configura el mismo valor en `OLLAMA_MODEL`.

Comprueba que la API local responde:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:11434/api/chat -Method Post -ContentType 'application/json' -Body '{"model":"qwen2.5-coder:7b","messages":[{"role":"user","content":"Responde exactamente: listo"}],"stream":false}'
```

## 2. Configurar backend y frontend

En `backend`, completa el `.env` que ya usa la conexión MySQL:

```env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

No pongas estas variables en el frontend. Es el backend quien se conecta directamente a Ollama. El frontend apunta por defecto a `http://localhost:2323`; si el backend usa otra dirección, configura `VITE_API_URL` antes de iniciar Vite.

Este backend declara pnpm `^11.22.0`. Si tienes otra versión activa, usa Corepack para activar una versión compatible e instala sus dependencias:

```powershell
corepack prepare pnpm@11.22.0 --activate
pnpm install
```

## 3. Actualizar MySQL

Haz una copia de seguridad. Ejecuta `migrations/001_ollama_correcciones.sql` en la base de datos configurada para el backend. La migración agrega `consigna.rubrica` y crea `correccion_codigo`.

La migración asume que ya existen `consigna` y `entrega_codigo`. Ejecuta el script una sola vez en cada base de datos.

## 4. Definir la rúbrica de una consigna

Los endpoints protegidos de consignas permiten guardar criterios. El campo `rubrica` es opcional y se envía junto a `consigna` y `respuesta_correcta`; por ejemplo:

```json
{
  "consigna": "Escribe una función que ordene una lista de números.",
  "respuesta_correcta": "Debe devolver la lista ordenada de menor a mayor.",
  "rubrica": "Cumplimiento funcional: 5 puntos. Casos límite, incluida lista vacía: 2 puntos. Claridad del código: 2 puntos. Complejidad razonable: 1 punto. Nota total de 0 a 10."
}
```

La rúbrica se guarda en MySQL y se añade al contexto de corrección. Si se omite, Ollama usa criterios generales de cumplimiento, corrección, casos límite y claridad.

## 5. Iniciar y probar la corrección

1. Ejecuta la migración, inicia Ollama y verifica que el modelo aparece con `ollama list`.
2. Desde `backend`, inicia el backend con `pnpm dev`.
3. Inicia sesión como alumno y obtén el `id_asignacion` de una pregunta de su evaluación.
4. Envía el archivo al endpoint indicado abajo. La respuesta incluye el estado, la nota y la devolución de IA; si Ollama falla, la entrega queda guardada y el error se devuelve para que pueda reintentarse.

El endpoint de subida también puede probarse directamente. El identificador indicado es el `id_asignacion` de la pregunta asignada:

```powershell
curl.exe -X POST "http://localhost:2323/api/alumnos/evaluaciones/entrega/ID_ASIGNACION" -H "Authorization: Bearer TOKEN_JWT" -F "archivo=@C:\ruta\a\entrega.zip"
```

Los resultados guardados están disponibles con `GET /api/alumnos/evaluaciones/ID_EVALUACION/resultados` usando el mismo token. Cada pregunta incluye `entregas_codigo`; cada entrega relaciona su `correccion_ia`, con `estado`, `nota`, `devolucion` (resumen, criterios, fortalezas y mejoras), `mensaje` si hubo un error y `modelo`. Si todavía no hay corrección asociada, `correccion_ia` es `null`.

## Límites

- Se admiten archivos `.c`, `.cpp`, `.cs`, `.h`, `.java`, `.py`, `.ts`, `.html`, `.css`, `.js`, `.json` y `.txt`, o un `.zip` con archivos de esos tipos. El ZIP se lee sin extraerlo al disco; se analizan hasta 20 fuentes, 150 KB por archivo y 400 KB en total. La subida se limita a 10 MB.
- Ollama revisa estáticamente el contenido; el backend no ejecuta el código del alumno. La nota no demuestra que el programa compile o funcione.
- La nota se genera en escala de 0 a 10 y se almacena aparte de `respuesta.nota_final`.
- La corrección es sincrónica y puede tardar hasta dos minutos; durante ese tiempo la petición de subida sigue abierta.
- La nota de IA es una sugerencia y debe revisarse según las necesidades del curso.
