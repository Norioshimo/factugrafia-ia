import { GoogleGenAI } from "@google/genai";
import { FacturaParaguay } from "@/types/factura";
import { SYSTEM_PROMPT, PROMPT_USUARIO, parsearRespuestaFactura } from "@/lib/prompt";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY no está configurada en las variables de entorno (.env)."
    );
  }
  return new GoogleGenAI({ apiKey });
}

export async function analizarFacturaConGemini(
  buffer: Buffer,
  mimeType: string,
  modeloSeleccionado?: string
): Promise<FacturaParaguay> {
  const ai = getGeminiClient();
  const base64Data = buffer.toString("base64");

  let modelo = modeloSeleccionado || process.env.GEMINI_MODEL || "gemini-3.5-flash";
  // Si se solicita un modelo obsoleto (como gemini-2.5 o gemini-1.5), migrar automáticamente
  if (modelo.includes("2.5") || modelo.includes("1.5") || modelo.includes("2.0")) {
    modelo = modelo.includes("lite") ? "gemini-3.5-flash-lite" : "gemini-3.5-flash";
  }

  const response = await ai.models.generateContent({
    model: modelo,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: PROMPT_USUARIO },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.1, // Baja temperatura para máxima precisión determinista
    },
  });

  return parsearRespuestaFactura(response.text ?? "", "Gemini");
}
