// Detecta transparência pelos bytes do arquivo (sem decodificar a imagem). Sem "server-only" pra ser testável com node --test.
// O site mostra os logos em tinta (filter: brightness(0), invertido no escuro); uma imagem com fundo opaco viraria um retângulo chapado.
export type ImageExt = "png" | "jpg" | "webp" | "svg";

export function hasTransparency(buf: Uint8Array, ext: ImageExt): boolean {
  if (ext === "svg") return true;
  if (ext === "jpg") return false;
  const ascii = (from: number, to: number) => String.fromCharCode(...buf.subarray(from, to));
  if (ext === "png") {
    // IHDR: tipo de cor 4 (cinza+alfa) e 6 (RGBA) têm canal alfa; paleta/RGB podem ter transparência via chunk tRNS
    const colorType = buf[25];
    if (colorType === 4 || colorType === 6) return true;
    const head = ascii(0, Math.min(buf.length, 64 * 1024));
    return head.includes("tRNS");
  }
  // WebP: VP8L (lossless) sempre pode ter alfa; VP8X traz a flag de alfa no bit 4; "VP8 " simples não tem
  const chunk = ascii(12, 16);
  if (chunk === "VP8L") return true;
  if (chunk === "VP8X") return (buf[20] & 0x10) !== 0;
  return false;
}
