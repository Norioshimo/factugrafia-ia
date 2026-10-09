import { z } from "zod";

/**
 * Esquema de datos para comprobantes fiscales de Paraguay (DNIT / e-Kuatia).
 * Soporta facturas preimpresas tradicionales y electrónicas KuDE.
 */
export const FacturaParaguaySchema = z.object({
  // Validación de Documento (Detección y rechazo de archivos no fiscales)
  es_factura: z
    .boolean()
    .nullish()
    .transform((val) => (val === false ? false : true))
    .default(true)
    .describe("Indica si el documento adjunto es efectivamente una factura o comprobante fiscal válido"),
  tipo_documento_detectado: z
    .string()
    .nullish()
    .transform((val) => val ?? "FACTURA")
    .default("FACTURA")
    .describe("Tipo de documento detectado en la imagen o PDF (ej: FACTURA, FOTO_PERSONAL, DOCUMENTO_IDENTIDAD, TRANSFERENCIA_BANCARIA, DOCUMENTO_NO_FISCAL)"),
  motivo_no_factura: z
    .string()
    .nullish()
    .transform((val) => val ?? null)
    .describe("Si es_factura es false, motivo detallado por el cual se rechaza o descripción de lo detectado"),

  // Emisor
  emisor_nombre: z
    .string()
    .nullish()
    .transform((val) => val ?? "")
    .describe("Nombre o razón social del emisor de la factura"),
  emisor_ruc: z
    .string()
    .nullish()
    .transform((val) => val ?? "")
    .describe("RUC del emisor con dígito verificador, ej. 80012345-6 o 1234567-8"),
  emisor_direccion: z
    .string()
    .nullish()
    .transform((val) => val ?? "")
    .describe("Dirección del local o casa matriz"),

  // Datos del Comprobante
  timbrado: z
    .string()
    .nullish()
    .transform((val) => val ?? null)
    .describe("Número de timbrado de 8 dígitos numéricos"),
  fecha_inicio_vigencia: z
    .string()
    .nullish()
    .transform((val) => val ?? null)
    .describe("Fecha de inicio de vigencia del timbrado (YYYY-MM-DD)"),
  fecha_vigencia_timbrado: z
    .string()
    .nullish()
    .transform((val) => val ?? null)
    .describe("Fecha de fin o vencimiento del timbrado (YYYY-MM-DD)"),
  numero_factura: z
    .string()
    .nullish()
    .transform((val) => val ?? "001-001-0000000")
    .describe("Número de factura completo en formato XXX-XXX-XXXXXXX (ej. 001-001-0001234)"),
  tipo_comprobante: z
    .string()
    .nullish()
    .transform((val) => {
      const v = (val || "").toUpperCase();
      if (v.includes("AUTO")) return "AUTOFACTURA";
      if (v.includes("TICKET")) return "TICKET_FACTURA";
      return "FACTURA";
    })
    .default("FACTURA")
    .describe("Tipo de comprobante de venta"),
  condicion_venta: z
    .string()
    .nullish()
    .transform((val) => {
      const v = (val || "").toUpperCase();
      return v.includes("CRED") ? "CREDITO" : "CONTADO";
    })
    .default("CONTADO")
    .describe("Condición de la venta"),
  fecha_emision: z
    .string()
    .nullish()
    .transform((val) => val ?? new Date().toISOString().split("T")[0])
    .describe("Fecha de emisión del comprobante (YYYY-MM-DD)"),

  // Receptor / Cliente
  receptor_nombre: z
    .string()
    .nullish()
    .transform((val) => val ?? null)
    .describe("Nombre o razón social del cliente o comprador"),
  receptor_ruc: z
    .string()
    .nullish()
    .transform((val) => val ?? null)
    .describe("RUC o Cédula de Identidad del cliente (con o sin dígito verificador)"),

  // Totales y Desglose de Ventas (Normativa DNIT)
  moneda: z
    .string()
    .nullish()
    .transform((val) => {
      const v = (val || "").toUpperCase();
      return v.includes("USD") || v.includes("DOL") ? "USD" : "PYG";
    })
    .default("PYG")
    .describe("Moneda de la transacción: PYG (Guaraníes) o USD (Dólares)"),
  total_exentas: z
    .union([z.number(), z.string()])
    .nullish()
    .transform((val) => (val !== undefined && val !== null ? Number(String(val).replace(/[^0-9.-]+/g, "")) || 0 : 0))
    .describe("Subtotal de ventas en columna Exentas"),
  total_gravadas_5: z
    .union([z.number(), z.string()])
    .nullish()
    .transform((val) => (val !== undefined && val !== null ? Number(String(val).replace(/[^0-9.-]+/g, "")) || 0 : 0))
    .describe("Subtotal de ventas gravadas al 5% (incluye el IVA 5%)"),
  total_gravadas_10: z
    .union([z.number(), z.string()])
    .nullish()
    .transform((val) => (val !== undefined && val !== null ? Number(String(val).replace(/[^0-9.-]+/g, "")) || 0 : 0))
    .describe("Subtotal de ventas gravadas al 10% (incluye el IVA 10%)"),

  // Liquidación del IVA (Campos al pie de la factura)
  liquidacion_iva_5: z
    .union([z.number(), z.string()])
    .nullish()
    .transform((val) => (val !== undefined && val !== null ? Number(String(val).replace(/[^0-9.-]+/g, "")) || 0 : 0))
    .describe("Liquidación del IVA 5% (calculado o impreso: gravadas 5% dividido 21)"),
  liquidacion_iva_10: z
    .union([z.number(), z.string()])
    .nullish()
    .transform((val) => (val !== undefined && val !== null ? Number(String(val).replace(/[^0-9.-]+/g, "")) || 0 : 0))
    .describe("Liquidación del IVA 10% (calculado o impreso: gravadas 10% dividido 11)"),
  total_iva: z
    .union([z.number(), z.string()])
    .nullish()
    .transform((val) => (val !== undefined && val !== null ? Number(String(val).replace(/[^0-9.-]+/g, "")) || 0 : 0))
    .describe("Total del IVA liquidado (IVA 5% + IVA 10%)"),

  // Total General
  total_general: z
    .union([z.number(), z.string()])
    .nullish()
    .transform((val) => (val !== undefined && val !== null ? Number(String(val).replace(/[^0-9.-]+/g, "")) || 0 : 0))
    .describe("Monto total general a pagar (Exentas + Gravadas 5% + Gravadas 10%)"),

  // Ítems y líneas de detalle
  items: z
    .array(
      z.object({
        cantidad: z.number().default(1),
        descripcion: z.string().describe("Descripción del producto o servicio"),
        precio_unitario: z.number().default(0),
        tipo_impuesto: z
          .enum(["EXENTA", "IVA_5", "IVA_10"])
          .default("IVA_10")
          .describe("Columna tributaria en la que se ubica el ítem"),
        subtotal: z.number().default(0),
      })
    )
    .default([]),

  // Datos específicos de Factura Electrónica (KuDE / e-Kuatia)
  cdc: z
    .string()
    .nullable()
    .optional()
    .describe("Código Digital de Control (CDC) de 44 dígitos numéricos si es KuDE"),

  // Auditoría y Confianza de Lectura
  confianza_lectura: z
    .string()
    .nullish()
    .transform((val) => {
      const v = (val || "").toUpperCase();
      if (v.includes("BAJ") || v.includes("LOW")) return "BAJA";
      if (v.includes("MED")) return "MEDIA";
      return "ALTA";
    })
    .default("MEDIA")
    .describe("Nivel de legibilidad y precisión detectado por la IA"),
  observaciones: z
    .string()
    .nullish()
    .transform((val) => val ?? null)
    .describe("Observaciones o advertencias sobre campos borrosos, arrugados o cortados"),
});

export type FacturaParaguay = z.infer<typeof FacturaParaguaySchema>;

/**
 * Resultado de validación aritmética tributaria
 */
export interface ValidacionAritmetica {
  esValida: boolean;
  sumaSubtotales: number;
  diferenciaTotal: number;
  liquidacionIva5Esperada: number;
  liquidacionIva10Esperada: number;
  diferenciaIva: number;
  mensajes: string[];
}

/**
 * Función utilitaria para verificar la coherencia aritmética según las reglas de la DNIT
 */
export function validarAritmeticaFactura(factura: FacturaParaguay): ValidacionAritmetica {
  const sumaSubtotales = Math.round(
    factura.total_exentas + factura.total_gravadas_5 + factura.total_gravadas_10
  );
  const totalGeneral = Math.round(factura.total_general);
  const diferenciaTotal = sumaSubtotales - totalGeneral;

  const liq5Esperada = Math.round(factura.total_gravadas_5 / 21);
  const liq10Esperada = Math.round(factura.total_gravadas_10 / 11);
  const totalIvaEsperado = liq5Esperada + liq10Esperada;
  const diferenciaIva = Math.round(factura.total_iva) - totalIvaEsperado;

  const mensajes: string[] = [];

  if (Math.abs(diferenciaTotal) > 1) {
    mensajes.push(
      `Descuadre en Total: La suma de Exentas + Gravadas 5% + Gravadas 10% (${sumaSubtotales.toLocaleString("es-PY")}) no coincide con el Total General (${totalGeneral.toLocaleString("es-PY")}). Diferencia: ${diferenciaTotal.toLocaleString("es-PY")}.`
    );
  }

  if (factura.total_gravadas_5 > 0 && Math.abs(factura.liquidacion_iva_5 - liq5Esperada) > 2) {
    mensajes.push(
      `Liquidación IVA 5%: El valor impreso (${factura.liquidacion_iva_5}) difiere del cálculo base 21 (${liq5Esperada}).`
    );
  }

  if (factura.total_gravadas_10 > 0 && Math.abs(factura.liquidacion_iva_10 - liq10Esperada) > 2) {
    mensajes.push(
      `Liquidación IVA 10%: El valor impreso (${factura.liquidacion_iva_10}) difiere del cálculo base 11 (${liq10Esperada}).`
    );
  }

  return {
    esValida: mensajes.length === 0,
    sumaSubtotales,
    diferenciaTotal,
    liquidacionIva5Esperada: liq5Esperada,
    liquidacionIva10Esperada: liq10Esperada,
    diferenciaIva,
    mensajes,
  };
}
