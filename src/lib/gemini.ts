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

Tu tarea primordial consta de dos pasos:

PASO 1 - CLASIFICACIÓN Y VERIFICACIÓN DE COMPROBANTE FISCAL:
Determina en primer lugar si la imagen o PDF corresponde a un comprobante fiscal o factura válida (Factura preimpresa de Paraguay, Factura Electrónica e-Kuatia / KuDE, Ticket Factura, Autofactura, Boleta de Venta o Comprobante Fiscal con validez tributaria).

SI EL DOCUMENTO NO ES UNA FACTURA O COMPROBANTE FISCAL:
Ejemplos de imágenes o archivos que NO son facturas:
- Fotos personales, personas, rostros/selfies, animales, paisajes, comida, objetos, memes, capturas de chat o redes sociales.
- Cédulas de identidad (C.I.), pasaportes, licencias de conducir, tarjetas de crédito/débito.
- Comprobantes de transferencias bancarias simples (SIPAP, extractos de cuenta, depósitos bancarios, vouchers de POS sin timbrado fiscal).
- Contratos, cartas, currículums, notas no fiscales, documentos de texto genéricos.
- Imágenes en blanco, completamente borrosas, oscuras o ilegibles.

Si determinas que NO es una factura o comprobante fiscal:
- "es_factura": false
- "tipo_documento_detectado": "<TIPO>" (ejemplos: "FOTO_PERSONAL", "DOCUMENTO_IDENTIDAD", "COMPROBANTE_TRANSFERENCIA", "DOCUMENTO_NO_FISCAL", "IMAGEN_ILEGIBLE")
- "motivo_no_factura": "<Explicación detallada y respetuosa en español indicando qué tipo de imagen/documento se detectó y por qué no es una factura fiscal de Paraguay>"
- Para los demás campos fiscales pon null, cadenas vacías o 0 según corresponda.

SI EL DOCUMENTO SÍ ES UNA FACTURA O COMPROBANTE FISCAL:
- "es_factura": true
- "tipo_documento_detectado": "FACTURA" (o "FACTURA_ELECTRONICA_KUDE", "TICKET_FACTURA", "AUTOFACTURA")
- "motivo_no_factura": null
- Procede al PASO 2 para extraer todos los datos.

PASO 2 - REGLAS TRIBUTARIAS CRÍTICAS DE PARAGUAY:
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
  "es_factura": true,
  "tipo_documento_detectado": "FACTURA",
  "motivo_no_factura": null,
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
  { id: "gemini-3.5-flash", nombre: "Gemini 3.5 Flash (Recomendado)", descripcion: "Rápido y máxima precisión" },
  { id: "gemini-3.5-flash-lite", nombre: "Gemini 3.5 Flash-Lite (Ultrarrápido)", descripcion: "Menor latencia y alta cuota" },
  { id: "gemini-3.8-flash", nombre: "Gemini 3.8 Flash", descripcion: "Última generación multimodal" },
];

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
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: "Determina si este archivo es una factura o comprobante fiscal de Paraguay y extrae los datos correspondientes en formato JSON estricto.",
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

  // Verificación heurística de seguridad: Si indicó es_factura = true pero carece totalmente de campos fiscales
  const tieneEmisor = Boolean(validado.emisor_nombre && validado.emisor_nombre.trim().length > 1);
  const tieneRuc = Boolean(validado.emisor_ruc && validado.emisor_ruc.trim().length > 3);
  const tieneTimbrado = Boolean(validado.timbrado && validado.timbrado.trim().length > 4);
  const tieneMonto = validado.total_general > 0 || validado.items.length > 0;

  if (validado.es_factura && !tieneEmisor && !tieneRuc && !tieneTimbrado && !tieneMonto) {
    validado.es_factura = false;
    validado.tipo_documento_detectado = validado.tipo_documento_detectado === "FACTURA" ? "DOCUMENTO_NO_FISCAL" : validado.tipo_documento_detectado;
    validado.motivo_no_factura = validado.motivo_no_factura || "No se detectaron datos fiscales mínimos (sin emisor, sin RUC, sin timbrado y sin montos).";
  }

  return validado;
}
