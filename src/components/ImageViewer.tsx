"use client";

import React, { useState } from "react";
import {
  TransformWrapper,
  TransformComponent,
} from "react-zoom-pan-pinch";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Trash2,
  FileText,
  ExternalLink,
} from "lucide-react";

interface ImageViewerProps {
  file: File;
  previewUrl: string;
  onClear: () => void;
}

export function ImageViewer({ file, previewUrl, onClear }: ImageViewerProps) {
  const [rotation, setRotation] = useState<number>(0);

  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const formatearTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      id="visor-comprobante"
      className="relative flex flex-col w-full h-[640px] lg:h-[calc(100vh-140px)] bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-sm"
    >
      {/* Barra de herramientas superior */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 z-10 select-none">
        <div className="flex items-center gap-2.5 truncate max-w-[280px] sm:max-w-xs">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            {isPdf ? <FileText className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
            <p className="text-[10px] text-slate-400">{formatearTamano(file.size)}</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          {isPdf ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Abrir en pestaña</span>
            </a>
          ) : null}

          <button
            type="button"
            onClick={onClear}
            id="btn-cambiar-archivo"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
            title="Quitar archivo y subir otro"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cambiar</span>
          </button>
        </div>
      </div>

      {/* Área del visor */}
      <div className="relative flex-1 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {isPdf ? (
          <div className="w-full h-full p-2">
            <iframe
              src={previewUrl}
              title="Previsualización de Documento PDF"
              className="w-full h-full rounded-xl border border-slate-800 bg-slate-900"
            />
          </div>
        ) : (
          <TransformWrapper
            initialScale={1}
            minScale={0.4}
            maxScale={6}
            centerOnInit
            wheel={{ step: 0.15 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Controles flotantes de imagen */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-full shadow-xl backdrop-blur-md z-20">
                  <button
                    type="button"
                    onClick={() => zoomIn()}
                    id="btn-zoom-in"
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    title="Acercar (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => zoomOut()}
                    id="btn-zoom-out"
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    title="Alejar (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => resetTransform()}
                    id="btn-reset-zoom"
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    title="Restablecer tamaño (100%)"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-slate-700 mx-1" />

                  <button
                    type="button"
                    onClick={handleRotate}
                    id="btn-rotar-imagen"
                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    title="Rotar 90 grados a la derecha"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{rotation}°</span>
                  </button>
                </div>

                <TransformComponent
                  wrapperClass="!w-full !h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                  contentClass="!w-full !h-full flex items-center justify-center"
                >
                  {/* Contenedor con rotación */}
                  <div
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: "transform 0.25s ease-in-out",
                    }}
                    className="flex items-center justify-center p-4 max-w-full max-h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Factura para auditar"
                      className="max-h-[600px] lg:max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-2xl select-none"
                    />
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}
      </div>
    </div>
  );
}
