// Fotos dos organizadores: o navegador recorta (components/photo-cropper.tsx) e manda o quadrado;
// aqui o sharp garante formato, tamanho e peso, seja qual for o navegador.
// Sem "server-only" pra ser testável com node --test; só é importado por código de servidor (uploads.ts).
import sharp from "sharp";
import { CROP_SIZE, SOURCE_MAX } from "./photo-crop-core.ts";

const WEBP_QUALITY = 82;

// Recorte exibido no site: WebP quadrado de CROP_SIZE, fundo branco se vier transparência (o card não tem xadrez).
// Se o navegador não conseguiu exportar WebP (Safari manda PNG) ou mandou algo fora do quadrado, resolve aqui.
export async function processCroppedPhoto(input: Uint8Array): Promise<Buffer> {
  return sharp(input)
    .rotate() // aplica EXIF, caso o cliente tenha mandado o arquivo original sem recortar
    .resize(CROP_SIZE, CROP_SIZE, { fit: "cover", position: "centre", withoutEnlargement: false })
    .flatten({ background: "#ffffff" })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

// Original guardado pra recortar de novo: orientação EXIF aplicada (o editor e o canvas não leem EXIF igual
// em todo navegador), no máximo SOURCE_MAX no lado maior, WebP. Mantém transparência: o recorte achata depois.
export async function processSourcePhoto(input: Uint8Array): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(SOURCE_MAX, SOURCE_MAX, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY + 4 })
    .toBuffer();
}
