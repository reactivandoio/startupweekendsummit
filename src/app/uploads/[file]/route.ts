import type { NextRequest } from "next/server";
import { readImageUpload } from "@/lib/uploads";

// Arquivos enviados pelo painel (logos de patrocinadores), lidos do volume de uploads.
// O nome é um uuid novo a cada envio, então o cache pode ser eterno.
export async function GET(_req: NextRequest, ctx: RouteContext<"/uploads/[file]">) {
  const { file } = await ctx.params;
  const upload = await readImageUpload(file);
  if (!upload) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(upload.body), {
    headers: {
      "Content-Type": upload.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // SVG aberto direto no navegador não roda script nem carrega nada de fora
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
    },
  });
}
