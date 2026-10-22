export const MIN_PREGUNTAS = 20
export const MAX_PREGUNTAS = 50

if (MAX_PREGUNTAS < MIN_PREGUNTAS) {
throw new Error(
"Configuración inválida: MAX_PREGUNTAS no puede ser menor que MIN_PREGUNTAS"
)
}