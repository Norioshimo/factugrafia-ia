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
  ListPlus,
  Trash2,
  QrCode,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface FacturaFormProps {
  factura: FacturaParaguay;
  onChange: (factura: FacturaParaguay) => void;
  isLoading?: boolean;
}

export function FacturaForm({ factura, onChange, isLoading }: FacturaFormProps) {
  // Validación aritmética en tiempo real
  const validacion = useMemo(() => {
    return validarAritmeticaFactura(factura);
  }, [factura]);

  const updateField = <K extends keyof FacturaParaguay>(
    key: K,
    value: FacturaParaguay[K]
  ) => {
    onChange({
      ...factura,
      [key]: value,
    });
  };

  const updateItem = (
    index: number,
    field: "descripcion" | "cantidad" | "precio_unitario" | "tipo_impuesto" | "subtotal",
    value: string | number
  ) => {
    const nuevosItems = [...(factura.items || [])];
    const itemActual = { ...nuevosItems[index] };

    if (field === "cantidad") {
      itemActual.cantidad = Number(value) || 0;
      itemActual.subtotal = itemActual.cantidad * itemActual.precio_unitario;
    } else if (field === "precio_unitario") {
      itemActual.precio_unitario = Number(value) || 0;
      itemActual.subtotal = itemActual.cantidad * itemActual.precio_unitario;
    } else if (field === "subtotal") {
      itemActual.subtotal = Number(value) || 0;
    } else if (field === "tipo_impuesto") {
      itemActual.tipo_impuesto = value as "EXENTA" | "IVA_5" | "IVA_10";
    } else {
      itemActual.descripcion = String(value);
    }

    nuevosItems[index] = itemActual;
    onChange({
      ...factura,
      items: nuevosItems,
    });
  };

  const addItem = () => {
    const nuevosItems = [
      ...(factura.items || []),
      {
        cantidad: 1,
        descripcion: "Nuevo ítem",
        precio_unitario: 0,
        tipo_impuesto: "IVA_10" as const,
        subtotal: 0,
      },
    ];
    onChange({ ...factura, items: nuevosItems });
  };

  const removeItem = (index: number) => {
    const nuevosItems = (factura.items || []).filter((_, i) => i !== index);
    onChange({ ...factura, items: nuevosItems });
  };

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
            {factura.tipo_comprobante}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {factura.condicion_venta}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopiarJson}
            id="btn-copiar-json"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Copiar JSON</span>
          </button>
          <button
            type="button"
            onClick={handleDescargarJson}
            id="btn-descargar-json"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition-colors"
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
              | Total General declarado:{" "}
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
            <label className="block text-slate-400 font-medium mb-1">
              Nombre / Razón Social Emisor
            </label>
            <input
              type="text"
              id="input-emisor-nombre"
              value={factura.emisor_nombre || ""}
              onChange={(e) => updateField("emisor_nombre", e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              RUC del Emisor
            </label>
            <input
              type="text"
              id="input-emisor-ruc"
              value={factura.emisor_ruc || ""}
              onChange={(e) => updateField("emisor_ruc", e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              placeholder="Ej: 80012345-6"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              N° de Timbrado
            </label>
            <input
              type="text"
              id="input-timbrado"
              value={factura.timbrado || ""}
              onChange={(e) => updateField("timbrado", e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              placeholder="8 dígitos"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              N° de Factura
            </label>
            <input
              type="text"
              id="input-numero-factura"
              value={factura.numero_factura || ""}
              onChange={(e) => updateField("numero_factura", e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono font-semibold"
              placeholder="001-001-0012345"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Fecha de Emisión
            </label>
            <input
              type="date"
              id="input-fecha-emision"
              value={factura.fecha_emision || ""}
              onChange={(e) => updateField("fecha_emision", e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Vencimiento / Vigencia Timbrado
            </label>
            <input
              type="date"
              id="input-fecha-vigencia"
              value={factura.fecha_vigencia_timbrado || ""}
              onChange={(e) => updateField("fecha_vigencia_timbrado", e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
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
            <label className="block text-slate-400 font-medium mb-1">
              Nombre o Razón Social Cliente
            </label>
            <input
              type="text"
              id="input-receptor-nombre"
              value={factura.receptor_nombre || ""}
              onChange={(e) => updateField("receptor_nombre", e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              RUC o Cédula de Identidad
            </label>
            <input
              type="text"
              id="input-receptor-ruc"
              value={factura.receptor_ruc || ""}
              onChange={(e) => updateField("receptor_ruc", e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
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

          {/* Selector de Moneda */}
          <div className="flex items-center gap-1.5 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={factura.moneda}
              onChange={(e) => updateField("moneda", e.target.value as "PYG" | "USD")}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs font-bold"
            >
              <option value="PYG">PYG (Guaraníes)</option>
              <option value="USD">USD (Dólares)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <label className="block text-slate-400 font-medium mb-1">
              Total Ventas Exentas
            </label>
            <input
              type="number"
              id="input-total-exentas"
              value={factura.total_exentas}
              onChange={(e) => updateField("total_exentas", Number(e.target.value) || 0)}
              className="w-full bg-transparent text-slate-100 font-mono font-semibold text-sm focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <label className="block text-slate-400 font-medium mb-1">
              Total Gravadas 5% (con IVA)
            </label>
            <input
              type="number"
              id="input-total-gravadas-5"
              value={factura.total_gravadas_5}
              onChange={(e) => updateField("total_gravadas_5", Number(e.target.value) || 0)}
              className="w-full bg-transparent text-slate-100 font-mono font-semibold text-sm focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <label className="block text-slate-400 font-medium mb-1">
              Total Gravadas 10% (con IVA)
            </label>
            <input
              type="number"
              id="input-total-gravadas-10"
              value={factura.total_gravadas_10}
              onChange={(e) => updateField("total_gravadas_10", Number(e.target.value) || 0)}
              className="w-full bg-transparent text-slate-100 font-mono font-semibold text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Liquidación de IVA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
            <label className="block text-slate-400 text-[11px] mb-0.5">
              Liq. IVA 5% (Base 21)
            </label>
            <input
              type="number"
              value={factura.liquidacion_iva_5}
              onChange={(e) => updateField("liquidacion_iva_5", Number(e.target.value) || 0)}
              className="w-full bg-transparent text-slate-300 font-mono text-xs focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
            <label className="block text-slate-400 text-[11px] mb-0.5">
              Liq. IVA 10% (Base 11)
            </label>
            <input
              type="number"
              value={factura.liquidacion_iva_10}
              onChange={(e) => updateField("liquidacion_iva_10", Number(e.target.value) || 0)}
              className="w-full bg-transparent text-slate-300 font-mono text-xs focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
            <label className="block text-slate-400 text-[11px] mb-0.5">
              Total IVA Liquidado
            </label>
            <input
              type="number"
              value={factura.total_iva}
              onChange={(e) => updateField("total_iva", Number(e.target.value) || 0)}
              className="w-full bg-transparent text-slate-300 font-mono text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Total General Destacado */}
        <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 rounded-xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold block">
              Total General a Pagar
            </span>
            <span className="text-xs text-slate-400">
              Incluye todas las ventas gravadas y exentas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="input-total-general"
              value={factura.total_general}
              onChange={(e) => updateField("total_general", Number(e.target.value) || 0)}
              className="text-right bg-transparent text-2xl font-bold font-mono text-white focus:outline-none border-b border-emerald-500/40 max-w-[220px]"
            />
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {factura.moneda}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: Detalle de Ítems */}
      <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-200 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ListPlus className="w-4 h-4 text-emerald-400" />
            <span>Detalle de Productos / Servicios ({factura.items?.length || 0})</span>
          </div>

          <button
            type="button"
            onClick={addItem}
            id="btn-agregar-item"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"
          >
            + Agregar ítem
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Cant.</th>
                <th className="py-2.5 px-3">Descripción</th>
                <th className="py-2.5 px-3 text-right">P. Unitario</th>
                <th className="py-2.5 px-3">IVA</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
                <th className="py-2.5 px-2 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(factura.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-2 px-3 w-16">
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => updateItem(idx, "cantidad", e.target.value)}
                      className="w-full bg-transparent text-slate-100 font-mono focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                      className="w-full bg-transparent text-slate-200 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right w-28">
                    <input
                      type="number"
                      value={item.precio_unitario}
                      onChange={(e) => updateItem(idx, "precio_unitario", e.target.value)}
                      className="w-full bg-transparent text-slate-200 font-mono text-right focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 w-24">
                    <select
                      value={item.tipo_impuesto}
                      onChange={(e) => updateItem(idx, "tipo_impuesto", e.target.value)}
                      className="bg-slate-950 text-slate-300 border border-slate-800 rounded px-1.5 py-0.5 text-[11px]"
                    >
                      <option value="IVA_10">10%</option>
                      <option value="IVA_5">5%</option>
                      <option value="EXENTA">Exenta</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-right w-28 font-mono font-medium text-slate-100">
                    <input
                      type="number"
                      value={item.subtotal}
                      onChange={(e) => updateItem(idx, "subtotal", e.target.value)}
                      className="w-full bg-transparent text-slate-100 font-mono text-right focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-2 text-center w-8">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Eliminar ítem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 5: KuDE CDC & Observaciones */}
      {(factura.cdc || factura.observaciones) && (
        <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-3">
          {factura.cdc && (
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">
                Código Digital de Control (CDC) - e-Kuatia
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={factura.cdc}
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleCopiarCdc}
                  id="btn-copiar-cdc"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors flex items-center gap-1.5"
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
