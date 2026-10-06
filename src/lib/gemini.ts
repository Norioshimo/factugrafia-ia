import { GoogleGenAI } from "@google/genai";
import { FacturaParaguay, FacturaParaguaySchema } from "@/types/factura";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY no está configurada en las variables de entorno (.env.local)."
    );
  }
  return new GoogleGenAI({ apiKey });
}

const SYSTEM_PROMPT = `
Eres un experto auditor tributario y extractor de documentos fiscales especializado en la República del Paraguay (DNIT - Dirección Nacional de Ingresos Tributarios, Sistema Marangatu y Facturación Electrónica e-Kuatia / KuDE).

Tu tarea es leer y extraer con máxima precisión todos los datos de la factura o ticket fiscal adjunto (imagen o PDF).

REGLAS TRIBUTARIAS CRÍTICAS DE PARAGUAY:
1. RUC: Suele tener el formato 'XXXXXXX-X' o '800XXXXX-X' con su dígito verificador. Extráelo completo.
2. Timbrado: Es un número de 8 dígitos. Si no es legible o no existe, usa null.
3. Número de Factura: Formato estándar de 3 bloques 'XXX-XXX-XXXXXXX' (Establecimiento de 3 dígitos, Punto de expedición de 3 dígitos, Secuencia de 7 dígitos). Ejemplo: 001-001-0012345. Si faltan ceros a la izquierda en la secuencia, completa a 7 dígitos.
4. Tipo de Comprobante: FACTURA, AUTOFACTURA, TICKET_FACTURA u OTRO.
5. Condición de Venta: CONTADO o CREDITO.
6. Moneda: Por defecto 'PYG' (Guaraníes) o 'USD' (Dólares americanos si está explícito). En Guaraníes no uses centavos.
7. DESGLOSE DE VENTAS (Muy Importante):
   - 'total_exentas': Monto de la columna Exentas.
   - 'total_gravadas_5': Monto de la columna Gravadas 5% (es el valor total del ítem con el IVA 5% ya incluido).
   - 'total_gravadas_10': Monto de la columna Gravadas 10% (es el valor total del ítem con el IVA 10% ya incluido).
   - 'total_general': Suma total a pagar (total_exentas + total_gravadas_5 + total_gravadas_10).
8. LIQUIDACIÓN DEL IVA (Al pie del comprobante):
   - 'liquidacion_iva_5': Valor impreso o calculado (Gravadas 5% dividido 21).
   - 'liquidacion_iva_10': Valor impreso o calculado (Gravadas 10% dividido 11).
   - 'total_iva': Suma de liquidacion_iva_5 + liquidacion_iva_10.
9. CDC (Facturación Electrónica KuDE): Si es una factura electrónica (KuDE / e-Kuatia), busca el Código Digital de Control (CDC) de 44 dígitos numéricos ubicado usualmente cerca del código QR o en el encabezado.
10. Confianza: Evalúa la legibilidad general como 'ALTA', 'MEDIA' o 'BAJA'. Si algún sector está roto, borroso o doblado, explícalo brevemente en 'observaciones'.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO QUE INCLUYA SIEMPRE ESTAS CLAVES EXACTAS (usa null o cadenas vacías si no están presentes, NUNCA omitas las claves):
{
  "emisor_nombre": "string o null",
  "emisor_ruc": "string o null",
  "emisor_direccion": "string o null",
  "timbrado": "string o null",
  "fecha_inicio_vigencia": "string o null",
  "fecha_vigencia_timbrado": "string o null",
  "numero_factura": "001-001-0001234",
  "tipo_comprobante": "FACTURA",
  "condicion_venta": "CONTADO",
  "fecha_emision": "YYYY-MM-DD",
  "receptor_nombre": "string o null",
  "receptor_ruc": "string o null",
  "moneda": "PYG",
  "total_exentas": 0,
  "total_gravadas_5": 0,
  "total_gravadas_10": 0,
  "liquidacion_iva_5": 0,
  "liquidacion_iva_10": 0,
  "total_iva": 0,
  "total_general": 0,
  "items": [],
  "cdc": "string o null",
  "confianza_lectura": "ALTA",
  "observaciones": "string o null"
}
`;

export const MODELOS_DISPONIBLES = [
  { id: "gemini-2.5-flash", nombre: "Gemini 2.5 Flash (Recomendado)", descripcion: "Estable y rápido" },
  { id: "gemini-2.5-flash-lite", nombre: "Gemini 2.5 Flash-Lite (Ultrarrápido)", descripcion: "Menor latencia y alta cuota" },
  { id: "gemini-3.5-flash", nombre: "Gemini 3.5 Flash", descripcion: "Generación avanzada" },
  { id: "gemini-3.8-flash", nombre: "Gemini 3.8 Flash", descripcion: "Última generación" },
  { id: "gemini-2.5-pro", nombre: "Gemini 2.5 Pro (Máxima Precisión)", descripcion: "Para fotos complejas o arrugadas" },
];

export async function analizarFacturaConGemini(
  buffer: Buffer,
  mimeType: string,
  modeloSeleccionado?: string
): Promise<FacturaParaguay> {
  const ai = getGeminiClient();
  const base64Data = buffer.toString("base64");

  const modelo = modeloSeleccionado || process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model: modelo,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: "Extrae todos los datos fiscales de este comprobante tributario de Paraguay siguiendo estrictamente el esquema JSON requerido.",
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.1, // Baja temperatura para máxima precisión determinista
    },
  });

  const responseText = response.text?.trim() || "";
  if (!responseText) {
    throw new Error("El modelo de IA no devolvió ningún contenido para el documento proporcionado.");
  }

  // Limpiar posibles delimitadores de markdown si vinieran
  const cleanedJson = responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(cleanedJson);
  } catch (err) {
    throw new Error(
      `Error al decodificar la respuesta JSON de Gemini: ${(err as Error).message}. Contenido: ${responseText.slice(0, 200)}...`
    );
  }

  // Validar y aplicar defaults con Zod
  const validado = FacturaParaguaySchema.parse(parsedRaw);
  return validado;
}
