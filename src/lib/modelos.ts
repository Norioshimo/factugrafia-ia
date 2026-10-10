export type Proveedor = "gemini" | "groq";

export const MODELOS_DISPONIBLES: {
  id: string;
  nombre: string;
  descripcion: string;
  proveedor: Proveedor;
}[] = [
  { id: "gemini-3.5-flash", nombre: "Gemini 3.5 Flash (Recomendado)", descripcion: "Rápido y máxima precisión", proveedor: "gemini" },
  { id: "gemini-3.5-flash-lite", nombre: "Gemini 3.5 Flash-Lite (Ultrarrápido)", descripcion: "Menor latencia y alta cuota", proveedor: "gemini" },
  { id: "gemini-3.8-flash", nombre: "Gemini 3.8 Flash", descripcion: "Última generación multimodal", proveedor: "gemini" },
  { id: "qwen/qwen3.8-27b", nombre: "Qwen 3.8 27B", descripcion: "Visión (Groq)", proveedor: "groq" },
];

export function proveedorDeModelo(id?: string | null): Proveedor {
  const m = MODELOS_DISPONIBLES.find((x) => x.id === id);
  if (m) return m.proveedor;
  return id && (id.includes("/")) ? "groq" : "gemini";
}

/** Modelo alternativo para reintentos automáticos (Groq solo tiene un modelo con visión). */
export function modeloFallback(id?: string | null): string {
  return id === "gemini-3.5-flash-lite" ? "gemini-3.5-flash" : "gemini-3.5-flash-lite";
}
