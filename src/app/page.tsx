"use client";

import React, { useState } from "react";
import { ImageDropzone } from "@/components/ImageDropzone";
import { ImageViewer } from "@/components/ImageViewer";
import { FacturaForm } from "@/components/FacturaForm";
import { FacturaParaguay } from "@/types/factura";
import { MODELOS_DISPONIBLES } from "@/lib/gemini";
import {
  Receipt,
  Sparkles,
  FileSearch,
  RotateCcw,
  Info,
  Cpu,
  ShieldAlert,
  FileX2,
  AlertOctagon,
} from "lucide-react";
import { toast } from "sonner";

const formatTipoDetectado = (tipo?: string) => {
  switch (tipo?.toUpperCase()) {
    case "FOTO_PERSONAL":
      return "Fotografía personal / No documental";
    case "DOCUMENTO_IDENTIDAD":
      return "Documento de Identidad (C.I. / Pasaporte)";
    case "COMPROBANTE_TRANSFERENCIA":
      return "Comprobante de Transferencia Bancaria (No fiscal)";
    case "DOCUMENTO_NO_FISCAL":
      return "Documento no tributario";
    case "IMAGEN_ILEGIBLE":
      return "Imagen ilegible o sin texto fiscal";
    default:
      return tipo || "Archivo no fiscal";
  }
};

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [facturaData, setFacturaData] = useState<FacturaParaguay | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rejectedInfo, setRejectedInfo] = useState<{
    motivo: string;
    tipo: string;
  } | null>(null);

  const procesarArchivo = async (file: File, modeloAUsar?: string) => {
    const modelo = modeloAUsar || selectedModel;
    setIsLoading(true);
    setErrorMsg(null);
    setRejectedInfo(null);
    setLoadingStep(`Conectando con ${modelo}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", modelo);

      setLoadingStep("Verificando y extrayendo campos fiscales de Paraguay (DNIT)...");

      const response = await fetch("/api/analizar-factura", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Comprobar si fue rechazado por no ser una factura
        if (data.es_factura === false || data.motivo_no_factura) {
          const motivoRechazo =
            data.motivo_no_factura ||
            data.error ||
            "El archivo subido no corresponde a una factura o comprobante fiscal válido.";
          const tipoDetectado = data.tipo_documento_detectado || "DOCUMENTO_NO_FISCAL";

          setRejectedInfo({
            motivo: motivoRechazo,
            tipo: tipoDetectado,
          });
          setFacturaData(null);
          toast.error("Documento rechazado", {
            description: motivoRechazo,
            duration: 8000,
          });
          return;
        }

        throw new Error(data.error || "Error al procesar la factura.");
      }

      setFacturaData(data.factura);
      setRejectedInfo(null);
      setErrorMsg(null);
      toast.success("Factura analizada con éxito.");
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Error inesperado.";
      setErrorMsg(msg);
      toast.error("Error en la lectura", {
        description: msg,
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setRejectedInfo(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    procesarArchivo(file);
  };

  const handleReprocesar = () => {
    if (selectedFile) {
      setRejectedInfo(null);
      toast.info(`Reprocesando con ${selectedModel}...`);
      procesarArchivo(selectedFile, selectedModel);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFacturaData(null);
    setRejectedInfo(null);
    setErrorMsg(null);
    setIsLoading(false);
    toast.info("Espacio de trabajo reiniciado.");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Barra superior de navegación y estado */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md">
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
                <Sparkles className="w-3 h-3" /> IA DNIT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Lector Fiscal Inteligente para Facturas de Paraguay (DNIT & e-Kuatia)
            </p>
          </div>
        </div>

        {/* Selector de Modelos y Acciones */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Selector interactivo de modelos */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <label htmlFor="select-modelo-ia" className="text-[11px] text-slate-400 hidden md:inline">
              Modelo:
            </label>
            <select
              id="select-modelo-ia"
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                toast.info(`Cambiado a ${e.target.value}`);
              }}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {MODELOS_DISPONIBLES.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {(facturaData || selectedFile || rejectedInfo) && (
            <button
              type="button"
              onClick={handleClear}
              id="btn-reiniciar-todo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
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
            ) : rejectedInfo && selectedFile ? (
              // Estado de Rechazo: El archivo no es una factura tributaria
              <div
                id="estado-rechazado-no-factura"
                className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-rose-950/40 via-slate-900/90 to-slate-950 rounded-2xl border-2 border-rose-500/50 min-h-[460px] text-center shadow-2xl shadow-rose-950/40 animate-in fade-in zoom-in-95 duration-300"
              >
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1 bg-slate-950 rounded-full border border-rose-500/40 text-rose-400">
                    <FileX2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-3">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Documento Rechazado</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  No corresponde a una factura fiscal
                </h3>

                <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
                  El sistema analizó el archivo adjunto y determinó que{" "}
                  <strong className="text-rose-300">no es una factura o comprobante tributario</strong> de Paraguay.
                </p>

                {/* Caja con el motivo y tipo detectado */}
                <div className="w-full max-w-md bg-slate-950/90 border border-rose-500/30 rounded-xl p-4 text-left mb-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pb-1.5 border-b border-slate-800">
                    <span>CLASIFICACIÓN DETECTADA:</span>
                    <span className="text-rose-300 font-mono font-bold">
                      {formatTipoDetectado(rejectedInfo.tipo)}
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed font-sans">
                    {rejectedInfo.motivo}
                  </p>
                </div>

                {/* Guía de comprobantes aceptados */}
                <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-left mb-6 text-[11px] text-slate-400 space-y-1.5">
                  <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-400" /> Comprobantes admitidos en Factugrafía:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-[11px]">
                    <li>Facturas preimpresas tradicionales (con Timbrado de 8 dígitos y RUC).</li>
                    <li>Facturas Electrónicas KuDE (e-Kuatia con CDC de 44 dígitos).</li>
                    <li>Tickets o Boletas de venta fiscales válidas de Paraguay.</li>
                  </ul>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    id="btn-subir-otra-factura"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Subir otra factura</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReprocesar}
                    id="btn-forzar-reprocesar"
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Reintentar lectura ({selectedModel})
                  </button>
                </div>
              </div>
            ) : errorMsg && selectedFile ? (
              // Estado de Error con botón para Reprocesar
              <div
                id="estado-error"
                className="flex flex-col items-center justify-center p-8 bg-rose-950/20 rounded-2xl border border-rose-500/40 min-h-[420px] text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                  <RotateCcw className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  No se pudo completar la lectura
                </h3>
                <p className="text-xs text-rose-200/90 font-mono max-w-md mb-6 leading-relaxed bg-rose-950/40 p-3 rounded-xl border border-rose-500/20 text-left overflow-x-auto">
                  {errorMsg}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleReprocesar}
                    id="btn-reprocesar-lectura"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reprocesar Lectura ({selectedModel})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
                  >
                    Subir otro archivo
                  </button>
                </div>
              </div>
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
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Arrastra una factura en la columna izquierda o presiona{" "}
                  <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">Ctrl+V</kbd>{" "}
                  para comenzar la lectura con inteligencia artificial.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
