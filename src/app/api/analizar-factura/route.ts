import { NextRequest, NextResponse } from "next/server";
import { analizarFacturaConGemini } from "@/lib/gemini";
import { validarAritmeticaFactura } from "@/types/factura";

// Configurar encabezados CORS para llamadas de otros proyectos o dominios
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

// Manejador OPTIONS para el preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

const TIPOS_MIME_PERMITIDOS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// Tamaño máximo permitido: 15 MB
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // 1. Verificación opcional de clave de API para integraciones externas
    const apiSecretEsperado = process.env.FACTUGRAFIA_API_SECRET;
    const secFetchSite = request.headers.get("sec-fetch-site");
    const isSameOrigin = secFetchSite === "same-origin" || !request.headers.get("origin");

    // Si viene de un cliente externo (Cross-site, cors o herramientas sin origen local) y hay secret configurado:
    if (apiSecretEsperado && !isSameOrigin) {
      const apiKeyRecibida =
        request.headers.get("x-api-key") ||
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

      if (apiKeyRecibida !== apiSecretEsperado) {
        return NextResponse.json(
          {
            success: false,
            error: "No autorizado: x-api-key inválida o ausente.",
          },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // 2. Comprobar que el Content-Type sea multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El formato de la petición debe ser multipart/form-data con un campo 'file'.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Procesar FormData
    const formData = await request.formData();

    // Comprobar archivos: Recibir exactamente un archivo adjunto
    const allFileEntries = Array.from(formData.entries()).filter(
      ([, value]) => value instanceof File && value.size > 0
    );

    if (allFileEntries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se encontró ningún archivo adjunto. Asegúrate de enviar un archivo en el campo 'file'.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (allFileEntries.length > 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Solo se permite procesar un adjunto a la vez. Envía un único archivo en el campo 'file'.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "El campo 'file' es obligatorio y debe ser un archivo válido.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Validar tamaño y tipo MIME
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `El archivo supera el tamaño máximo permitido (${MAX_FILE_SIZE / 1024 / 1024} MB).`,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    let mimeType = file.type || "application/octet-stream";
    // Si viene sin type específico, inferir por extensión
    if (mimeType === "application/octet-stream") {
      const nombre = file.name.toLowerCase();
      if (nombre.endsWith(".pdf")) mimeType = "application/pdf";
      else if (nombre.endsWith(".png")) mimeType = "image/png";
      else if (nombre.endsWith(".webp")) mimeType = "image/webp";
      else if (nombre.endsWith(".jpg") || nombre.endsWith(".jpeg"))
        mimeType = "image/jpeg";
    }

    if (!TIPOS_MIME_PERMITIDOS.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tipo de archivo no soportado (${mimeType}). Formatos aceptados: JPG, PNG, WEBP, PDF.`,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. Convertir a Buffer y llamar a Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const modeloSolicitado = formData.get("model")?.toString();

    let facturaExtraida;
    try {
      facturaExtraida = await analizarFacturaConGemini(buffer, mimeType, modeloSolicitado);
    } catch (apiErr: any) {
      // Si el modelo da 503 por alta demanda o 404, reintentar automáticamente con gemini-3.5-flash-lite o gemini-3.5-flash
      const errorMsg = apiErr?.message || "";
      if (
        errorMsg.includes("503") ||
        errorMsg.includes("UNAVAILABLE") ||
        errorMsg.includes("high demand") ||
        errorMsg.includes("404") ||
        errorMsg.includes("NOT_FOUND")
      ) {
        const fallbackModel =
          modeloSolicitado === "gemini-3.5-flash-lite"
            ? "gemini-3.5-flash"
            : "gemini-3.5-flash-lite";
        console.warn(`Reintentando automáticamente con modelo alternativo: ${fallbackModel}`);
        facturaExtraida = await analizarFacturaConGemini(buffer, mimeType, fallbackModel);
      } else {
        throw apiErr;
      }
    }

    const validacionAritmetica = validarAritmeticaFactura(facturaExtraida);

    return NextResponse.json(
      {
        success: true,
        factura: facturaExtraida,
        validacion_aritmética: validacionAritmetica,
        metadatos_archivo: {
          nombre: file.name,
          tamano_bytes: file.size,
          tipo_mime: mimeType,
        },
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error en /api/analizar-factura:", error);
    const mensaje =
      error instanceof Error ? error.message : "Error interno del servidor.";

    return NextResponse.json(
      {
        success: false,
        error: mensaje,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
