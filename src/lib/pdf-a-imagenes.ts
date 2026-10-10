import { pdf } from "pdf-to-img";

/** Renderiza las primeras `maxPaginas` páginas de un PDF como imágenes PNG. */
export async function pdfAImagenes(buffer: Buffer, maxPaginas = 5): Promise<Buffer[]> {
  const documento = await pdf(buffer, { scale: 2 });
  const imagenes: Buffer[] = [];
  for await (const pagina of documento) {
    imagenes.push(Buffer.from(pagina));
    if (imagenes.length >= maxPaginas) break;
  }
  if (imagenes.length === 0) {
    throw new Error("No se pudo convertir el PDF a imagen (documento vacío o dañado).");
  }
  return imagenes;
}
