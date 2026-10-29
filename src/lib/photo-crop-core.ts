// Matemática do recorte quadrado da foto (painel e Server Action), sem DOM: testável com node --test.
// O recorte é descrito em relação ao quadro, não em pixels da imagem, então vale pra qualquer tamanho de tela:
//   x, y: deslocamento do centro da imagem em relação ao centro do quadro, em frações do lado do quadro;
//   zoom: 1 = a imagem girada cobre o quadro exatamente (lado menor = lado do quadro);
//   rotation: múltiplos de 90°, sentido horário.
// A mesma transformação (translate → rotate → scale, em torno do centro da imagem) é usada na prévia por CSS
// e na exportação por canvas, por isso o que se vê é o que se salva.

export const CROP_SIZE = 720; // lado do arquivo salvo: o maior card do site tem ~384px, em telas 2x
export const SOURCE_MAX = 1600; // lado maior do original guardado pra recortar de novo
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
const OFFSET_MAX = 2; // folga máxima teórica com ZOOM_MAX numa imagem quadrada é (4 - 1) / 2 = 1.5

export type Rotation = 0 | 90 | 180 | 270;
export type Crop = { x: number; y: number; zoom: number; rotation: Rotation };

export const defaultCrop: Crop = { x: 0, y: 0, zoom: 1, rotation: 0 };

const isRotation = (r: unknown): r is Rotation => r === 0 || r === 90 || r === 180 || r === 270;

export const nextRotation = (r: Rotation): Rotation => (((r + 90) % 360) as Rotation);

export function rotatedSize(w: number, h: number, rotation: Rotation) {
  return rotation === 90 || rotation === 270 ? { w: h, h: w } : { w, h };
}

// Pixels do quadro por pixel da imagem
export function scaleFor(imgW: number, imgH: number, crop: Pick<Crop, "zoom" | "rotation">, side: number): number {
  const { w, h } = rotatedSize(imgW, imgH, crop.rotation);
  return (side / Math.min(w, h)) * crop.zoom;
}

// `+ 0` normaliza -0 (vinha de clamp(-0.3, -0, 0)) e evita "-0" no JSON salvo
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v)) + 0;

// Mantém a imagem cobrindo o quadro inteiro (sem faixa vazia) e o zoom dentro dos limites
export function clampCrop(crop: Crop, imgW: number, imgH: number): Crop {
  const zoom = clamp(crop.zoom, ZOOM_MIN, ZOOM_MAX);
  const { w, h } = rotatedSize(imgW, imgH, crop.rotation);
  const scale = scaleFor(imgW, imgH, { zoom, rotation: crop.rotation }, 1); // lado do quadro = 1 → tudo em frações
  const maxX = Math.max(0, (w * scale - 1) / 2);
  const maxY = Math.max(0, (h * scale - 1) / 2);
  return { x: clamp(crop.x, -maxX, maxX), y: clamp(crop.y, -maxY, maxY), zoom, rotation: crop.rotation };
}

// Lê o recorte vindo do formulário (string JSON) ou do banco (jsonb); qualquer coisa fora do esperado vira null
export function parseCrop(raw: unknown): Crop | null {
  let value = raw;
  if (typeof value === "string") {
    if (!value.trim()) return null;
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const { x, y, zoom, rotation } = value as Record<string, unknown>;
  if (![x, y, zoom].every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  if (!isRotation(rotation)) return null;
  return {
    x: clamp(x as number, -OFFSET_MAX, OFFSET_MAX),
    y: clamp(y as number, -OFFSET_MAX, OFFSET_MAX),
    zoom: clamp(zoom as number, ZOOM_MIN, ZOOM_MAX),
    rotation,
  };
}
