"use client";

import React, { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, Image as ImageIcon, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";

interface ImageDropzoneProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export function ImageDropzone({ onFileSelected, isLoading }: ImageDropzoneProps) {
  const handleAcceptedFiles = useCallback(
    (files: File[]) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleAcceptedFiles,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  // Soporte global para Ctrl + V (Pegar imagen desde el portapapeles)
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (isLoading) return;
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/") || item.type === "application/pdf") {
          const file = item.getAsFile();
          if (file) {
            toast.info("Comprobante detectado desde el portapapeles.");
            onFileSelected(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onFileSelected, isLoading]);

  return (
    <div
      {...getRootProps()}
      id="dropzone-factura"
      className={`group relative flex flex-col items-center justify-center w-full min-h-[380px] p-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center select-none ${
        isDragActive
          ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 scale-[1.01]"
          : isDragReject
          ? "border-rose-500 bg-rose-500/10"
          : "border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-900/90"
      } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
    >
      <input {...getInputProps()} id="input-archivo-factura" />

      {/* Halo de luz decorativo */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-md">
        <div className="w-16 h-16 mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-2">
          {isDragActive
            ? "Suelta el comprobante aquí..."
            : "Arrastra tu factura o ticket aquí"}
        </h3>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Soporta fotos tomadas con el celular, tickets térmicos escaneados o
          archivos PDF digitales (KuDE / e-Kuatia).
        </p>

        {/* Atajo rápido de Pegar Ctrl+V */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 mb-5 shadow-sm">
          <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
          <span>También puedes presionar <kbd className="font-mono bg-slate-700 px-1.5 py-0.5 rounded text-[11px] text-slate-200">Ctrl</kbd> + <kbd className="font-mono bg-slate-700 px-1.5 py-0.5 rounded text-[11px] text-slate-200">V</kbd> para pegar directamente</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> JPG, PNG, WEBP
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> PDF Digital
          </span>
        </div>
      </div>
    </div>
  );
}
