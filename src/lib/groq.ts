import { FacturaParaguay } from "@/types/factura";
import { SYSTEM_PROMPT, PROMPT_USUARIO, parsearRespuestaFactura } from "@/lib/prompt";
import { pdfAImagenes } from "@/lib/pdf-a-imagenes";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELO_DEFECTO = "qwen/qwen3.8-27b";

export async function analizarFacturaConGroq(
  buffer: Buffer,
  mimeType: string,
  modelo?: string
): Promise<FacturaParaguay> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY no está configurada en las variables de entorno (.env).");
  }

  // Groq solo acepta imágenes: los PDF se convierten a imagen (hasta 5 páginas)
  const imagenes: { buffer: Buffer; mime: string }[] =
    mimeType === "application/pdf"
      ? (await pdfAImagenes(buffer, 5)).map((b) => ({ buffer: b, mime: "image/png" }))
      : [{ buffer, mime: mimeType === "image/jpg" ? "image/jpeg" : mimeType }];

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelo || process.env.GROQ_MODEL || GROQ_MODELO_DEFECTO,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT_USUARIO },
            ...imagenes.map((img) => ({
              type: "image_url",
              image_url: { url: `data:${img.mime};base64,${img.buffer.toString("base64")}` },
            })),
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detalle = await response.text().catch(() => "");
    throw new Error(`Error de Groq (${response.status}): ${detalle.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return parsearRespuestaFactura(data.choices?.[0]?.message?.content ?? "", "Groq");
}
