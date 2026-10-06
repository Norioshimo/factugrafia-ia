"use client";

import React, { useState } from "react";
import { ImageDropzone } from "@/components/ImageDropzone";
import { ImageViewer } from "@/components/ImageViewer";
import { FacturaForm } from "@/components/FacturaForm";
import { FacturaParaguay } from "@/types/factura";
import {
  Receipt,
  Sparkles,
  FileSearch,
  RotateCcw,
  Zap,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// Factura de prueba de Paraguay para demostración rápida
const FACTURA_EJEMPLO: FacturaParaguay = {
  emisor_nombre: "BARCOS Y RODADOS S.A.",
  emisor_ruc: "80023456-7",
  emisor_direccion: "Avda. Mariscal López c/ San Martín, Asunción",
  timbrado: "15984321",
  fecha_inicio_vigencia: "2024-01-01",
  fecha_vigencia_timbrado: "2024-12-31",
  numero_factura: "001-002-0045612",
  tipo_comprobante: "FACTURA",
  condicion_venta: "CONTADO",
  fecha_emision: "2024-05-15",
  receptor_nombre: "JUAN PEREZ CARDOZO",
  receptor_ruc: "4123567-8",
  moneda: "PYG",
  total_exentas: 0,
  total_gravadas_5: 0,
  total_gravadas_10: 250000,
  liquidacion_iva_5: 0,
  liquidacion_iva_10: 22727,
  total_iva: 22727,
  total_general: 250000,
  items: [
    {
      cantidad: 1,
      descripcion: "DIESEL PODIUM S10 (35.21 Lts)",
      precio_unitario: 250000,
      tipo_impuesto: "IVA_10",
      subtotal: 250000,
    },
  ],
  cdc: "0180023456700100200456122024051512345678901234",
  confianza_lectura: "ALTA",
  observaciones: "Comprobante verificado con éxito.",
};

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [facturaData, setFacturaData] = useState<FacturaParaguay | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsLoading(true);
    setLoadingStep("Leyendo archivo y conectando con Gemini Flash...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setLoadingStep("Extrayendo campos fiscales de Paraguay (DNIT)...");

      const response = await fetch("/api/analizar-factura", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al procesar la factura.");
      }

      setFacturaData(data.factura);
      toast.success("Factura analizada con éxito.");
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Error inesperado.";
      toast.error(msg, {
        description:
          "Si no has configurado tu GEMINI_API_KEY en .env.local, configúrala y reinicia el servidor.",
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFacturaData(null);
    setIsLoading(false);
    toast.info("Espacio de trabajo reiniciado.");
  };

  const handleCargarEjemplo = () => {
    setFacturaData(FACTURA_EJEMPLO);
    toast.success("Datos fiscales de ejemplo cargados.");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Barra superior de navegación y estado */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
            <Receipt className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                Factugrafía
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" /> Gemini Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Lector Fiscal Inteligente para Facturas de Paraguay (DNIT & e-Kuatia)
            </p>
          </div>
        </div>

        {/* Acciones de la barra */}
        <div className="flex items-center gap-2">
          {!facturaData && !selectedFile && (
            <button
              type="button"
              onClick={handleCargarEjemplo}
              id="btn-cargar-ejemplo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Ejemplo</span>
            </button>
          )}

          {(facturaData || selectedFile) && (
            <button
              type="button"
              onClick={handleClear}
              id="btn-reiniciar-todo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Nueva Factura</span>
            </button>
          )}
        </div>
      </header>

      {/* Contenedor principal: Split Screen de 2 columnas */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* COLUMNA IZQUIERDA: Visor / Zona de Carga */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span>DOCUMENTO DE ORIGEN (FOTO O PDF)</span>
              {selectedFile && (
                <span className="text-emerald-400 font-mono">
                  {selectedFile.type.includes("pdf") ? "PDF Digital" : "Imagen"}
                </span>
              )}
            </div>

            {!selectedFile ? (
              <ImageDropzone
                onFileSelected={handleFileSelected}
                isLoading={isLoading}
              />
            ) : (
              previewUrl && (
                <ImageViewer
                  file={selectedFile}
                  previewUrl={previewUrl}
                  onClear={handleClear}
                />
              )
            )}

            {/* Guía rápida de ayuda */}
            <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 text-xs text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-slate-300">
                  Consejos para máxima precisión tributaria:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Asegúrate de que el <strong>RUC</strong>, <strong>Timbrado</strong> y el <strong>bloque de subtotales</strong> (Exentas, 5%, 10% y Liquidación) estén bien iluminados y enfocados. El visor permite rotar la foto si fue tomada de lado.
                </p>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Formulario de Auditoría Humano-en-el-Bucle */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span>AUDITORÍA FISCAL (PARAGUAY DNIT)</span>
              {facturaData && (
                <span className="text-emerald-400 font-mono font-bold">
                  {facturaData.numero_factura}
                </span>
              )}
            </div>

            {isLoading ? (
              // Estado de carga con Skeleton dinámico
              <div
                id="estado-cargando"
                className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800/80 min-h-[480px] text-center"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
                    <Receipt className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  Extrayendo datos de la factura...
                </h3>

                <p className="text-xs text-emerald-400/90 font-mono mb-6 max-w-sm">
                  {loadingStep}
                </p>

                {/* Skeletons representativos */}
                <div className="w-full max-w-md space-y-3 opacity-60">
                  <div className="h-4 bg-slate-800 rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-9 bg-slate-800 rounded-lg animate-pulse" />
                    <div className="h-9 bg-slate-800 rounded-lg animate-pulse" />
                  </div>
                  <div className="h-20 bg-slate-800/70 rounded-xl animate-pulse" />
                </div>
              </div>
            ) : facturaData ? (
              <FacturaForm
                factura={facturaData}
                onChange={setFacturaData}
              />
            ) : (
              // Estado vacío inicial
              <div
                id="estado-vacio"
                className="flex flex-col items-center justify-center p-12 bg-slate-900/30 rounded-2xl border border-slate-800/60 min-h-[420px] text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4">
                  <FileSearch className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-200 mb-1">
                  Ningún comprobante cargado
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                  Arrastra una factura en la columna izquierda o presiona{" "}
                  <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">Ctrl+V</kbd>{" "}
                  para comenzar la lectura con inteligencia artificial.
                </p>
                <button
                  type="button"
                  onClick={handleCargarEjemplo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl transition-all shadow-sm"
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Probar con datos de ejemplo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
