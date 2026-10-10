import { FacturaParaguay } from "@/types/factura";
import { proveedorDeModelo } from "@/lib/modelos";
import { analizarFacturaConGemini } from "@/lib/gemini";
import { analizarFacturaConGroq } from "@/lib/groq";

export async function analizarFactura(
  buffer: Buffer,
  mimeType: string,
  modelo?: string
): Promise<FacturaParaguay> {
  return proveedorDeModelo(modelo) === "groq"
    ? analizarFacturaConGroq(buffer, mimeType, modelo)
    : analizarFacturaConGemini(buffer, mimeType, modelo);
}
