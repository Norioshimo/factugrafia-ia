"use client";

import React, { useMemo } from "react";
import {
  FacturaParaguay,
  validarAritmeticaFactura,
} from "@/types/factura";
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  Building2,
  User,
  Calculator,
  ListFilter,
  QrCode,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface FacturaFormProps {
  factura: FacturaParaguay;
  onChange?: (factura: FacturaParaguay) => void;
  isLoading?: boolean;
}

export function FacturaForm({ factura }: FacturaFormProps) {
  // Validación aritmética en tiempo real
  const validacion = useMemo(() => {
    return validarAritmeticaFactura(factura);
  }, [factura]);

  const handleCopiarJson = () => {
    navigator.clipboard.writeText(JSON.stringify(factura, null, 2));
    toast.success("JSON fiscal copiado al portapapeles.");
  };

  const handleDescargarJson = () => {
    const blob = new Blob([JSON.stringify(factura, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factura_${factura.numero_factura || "paraguay"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Archivo JSON descargado exitosamente.");
  };

  const handleCopiarCdc = () => {
    if (factura.cdc) {
      navigator.clipboard.writeText(factura.cdc);
      toast.success("CDC de 44 dígitos copiado.");
    }
  };

  const badgeConfianza = () => {
    switch (factura.confianza_lectura) {
      case "ALTA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Lectura Alta
          </span>
        );
      case "MEDIA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Lectura Media (Revisar)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Lectura Baja
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Barra de estado superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2.5 flex-wrap">
          {badgeConfianza()}
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {factura.tipo_comprobante || "FACTURA"}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {factura.condicion_venta || "CONTADO"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopiarJson}
            id="btn-copiar-json"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Copiar JSON</span>
          </button>
          <button
            type="button"
            onClick={handleDescargarJson}
            id="btn-descargar-json"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>
        </div>
      </div>

      {/* Banner de Validación Aritmética Tributaria DNIT */}
      <div
        id="banner-validacion-dnit"
        className={`p-4 rounded-2xl border transition-all ${
          validacion.esValida
            ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
            : "bg-amber-950/30 border-amber-500/40 text-amber-200"
        }`}
      >
        <div className="flex items-start gap-3">
          {validacion.esValida ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs space-y-1">
            <p className="font-semibold text-sm">
              {validacion.esValida
                ? "Cálculo Fiscal Cuadrado y Verificado (DNIT)"
                : "Atención: Descuadre en Totales de la Factura"}
            </p>
            <p className="text-slate-300">
              Suma de Subtotales (Exentas + Gravadas 5% + 10%):{" "}
              <strong className="text-white">
                {validacion.sumaSubtotales.toLocaleString("es-PY")}{" "}
                {factura.moneda}
              </strong>{" "}
              | Total General extraído:{" "}
              <strong className="text-white">
                {Number(factura.total_general).toLocaleString("es-PY")}{" "}
                {factura.moneda}
              </strong>
            </p>
            {!validacion.esValida && (
              <ul className="list-disc list-inside text-amber-300 font-medium pt-1">
                {validacion.mensajes.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: Datos del Emisor y Timbrado */}
      <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 pb-2 border-b border-slate-800">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Datos del Emisor y Timbrado</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="block text-slate-400 font-medium mb-1">
              Nombre / Razón Social Emisor
            </span>
            <input
              type="text"
              id="input-emisor-nombre"
              readOnly
              value={factura.emisor_nombre || "-"}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-slate-100 font-medium cursor-default focus:outline-none select-all"
            />
          </div>

          <div>
            <span className="block text-slate-400 font-medium mb-1">
              RUC del Emisor
            </span>
            <input
              type="text"
              id="input-emisor-ruc"
              readOnly
              value={factura.emisor_ruc || "-"}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-emerald-400 font-mono font-semibold cursor-default focus:outline-none select-all"
            />
          </div>

          <div>
            <span className="block text-slate-400 font-medium mb-1">
              N° de Timbrado
            </span>
            <input
              type="text"
              id="input-timbrado"
              readOnly
              value={factura.timbrado || "-"}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-slate-200 font-mono cursor-default focus:outline-none select-all"
            />
          </div>

          <div>
            <span className="block text-slate-400 font-medium mb-1">
              N° de Factura
            </span>
            <input
              type="text"
              id="input-numero-factura"
              readOnly
              value={factura.numero_factura || "-"}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-white font-mono font-bold cursor-default focus:outline-none select-all"
            />
          </div>

          <div>
            <span className="block text-slate-400 font-medium mb-1">
              Fecha de Emisión
            </span>
            <input
              type="text"
              id="input-fecha-emision"
              readOnly
              value={factura.fecha_emision || "-"}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-slate-200 font-mono cursor-default focus:outline-none select-all"
            />
          </div>

          <div>
            <span className="block text-slate-400 font-medium mb-1">
              Vencimiento / Vigencia Timbrado
            </span>
            <input
              type="text"
              id="input-fecha-vigencia"
              readOnly
              value={factura.fecha_vigencia_timbrado || "-"}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-slate-200 font-mono cursor-default focus:outline-none select-all"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Datos del Receptor / Cliente */}
      <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 pb-2 border-b border-slate-800">
          <User className="w-4 h-4 text-emerald-400" />
          <span>Datos del Cliente / Receptor</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="block text-slate-400 font-medium mb-1">
              Nombre o Razón Social Cliente
            </span>
            <input
              type="text"
              id="input-receptor-nombre"
              readOnly
              value={factura.receptor_nombre || "-"}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-slate-200 cursor-default focus:outline-none select-all"
            />
          </div>

          <div>
            <span className="block text-slate-400 font-medium mb-1">
              RUC o Cédula de Identidad
            </span>
            <input
              type="text"
              id="input-receptor-ruc"
              readOnly
              value={factura.receptor_ruc || "-"}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-slate-200 font-mono cursor-default focus:outline-none select-all"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: Desglose Tributario e Importes (Normativa Paraguay DNIT) */}
      <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-200 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Desglose de Ventas y Liquidación de IVA</span>
          </div>

          {/* Indicador de Moneda */}
          <div className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-emerald-400 rounded-lg text-xs font-bold font-mono">
            {factura.moneda || "PYG"}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="block text-slate-400 font-medium mb-1">
              Total Ventas Exentas
            </span>
            <span className="block text-slate-100 font-mono font-bold text-sm select-all">
              {Number(factura.total_exentas || 0).toLocaleString("es-PY")} {factura.moneda}
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="block text-slate-400 font-medium mb-1">
              Total Gravadas 5% (con IVA)
            </span>
            <span className="block text-slate-100 font-mono font-bold text-sm select-all">
              {Number(factura.total_gravadas_5 || 0).toLocaleString("es-PY")} {factura.moneda}
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="block text-slate-400 font-medium mb-1">
              Total Gravadas 10% (con IVA)
            </span>
            <span className="block text-slate-100 font-mono font-bold text-sm select-all">
              {Number(factura.total_gravadas_10 || 0).toLocaleString("es-PY")} {factura.moneda}
            </span>
          </div>
        </div>

        {/* Liquidación de IVA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
            <span className="block text-slate-400 text-[11px] mb-0.5">
              Liq. IVA 5% (Base 21)
            </span>
            <span className="block text-slate-300 font-mono text-xs select-all">
              {Number(factura.liquidacion_iva_5 || 0).toLocaleString("es-PY")} {factura.moneda}
            </span>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
            <span className="block text-slate-400 text-[11px] mb-0.5">
              Liq. IVA 10% (Base 11)
            </span>
            <span className="block text-slate-300 font-mono text-xs select-all">
              {Number(factura.liquidacion_iva_10 || 0).toLocaleString("es-PY")} {factura.moneda}
            </span>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
            <span className="block text-slate-400 text-[11px] mb-0.5">
              Total IVA Liquidado
            </span>
            <span className="block text-slate-300 font-mono text-xs select-all">
              {Number(factura.total_iva || 0).toLocaleString("es-PY")} {factura.moneda}
            </span>
          </div>
        </div>

        {/* Total General Destacado */}
        <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 rounded-xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold block">
              Total General Extraído
            </span>
            <span className="text-xs text-slate-400">
              Monto total final del comprobante
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-white select-all">
              {Number(factura.total_general || 0).toLocaleString("es-PY")}
            </span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {factura.moneda}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: Detalle de Ítems (Solo lectura) */}
      <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-200 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-emerald-400" />
            <span>Detalle de Productos / Servicios ({factura.items?.length || 0})</span>
          </div>
        </div>

        {(!factura.items || factura.items.length === 0) ? (
          <p className="text-xs text-slate-400 italic py-2">No se desglosaron ítems individuales en este comprobante.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Cant.</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3 text-right">P. Unitario</th>
                  <th className="py-2.5 px-3 text-center">IVA</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {factura.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/40 transition-colors select-all">
                    <td className="py-2 px-3 w-14 font-mono text-slate-300">
                      {item.cantidad}
                    </td>
                    <td className="py-2 px-3 text-slate-200 font-medium">
                      {item.descripcion}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      {Number(item.precio_unitario || 0).toLocaleString("es-PY")}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.tipo_impuesto === "IVA_10"
                          ? "10%"
                          : item.tipo_impuesto === "IVA_5"
                          ? "5%"
                          : "Exenta"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                      {Number(item.subtotal || 0).toLocaleString("es-PY")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECCIÓN 5: KuDE CDC & Observaciones */}
      {(factura.cdc || factura.observaciones) && (
        <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-3">
          {factura.cdc && (
            <div>
              <span className="block text-slate-400 text-xs font-medium mb-1">
                Código Digital de Control (CDC) - e-Kuatia
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={factura.cdc}
                  className="flex-1 px-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs cursor-default select-all"
                />
                <button
                  type="button"
                  onClick={handleCopiarCdc}
                  id="btn-copiar-cdc"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiar CDC</span>
                </button>
              </div>
            </div>
          )}

          {factura.observaciones && (
            <div className="text-xs text-slate-400 pt-1">
              <span className="font-semibold text-slate-300">Notas de lectura de IA: </span>
              {factura.observaciones}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
