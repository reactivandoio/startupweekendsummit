"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { trapTabKey } from "@/components/dialog-focus";
import { clampCrop, CROP_SIZE, defaultCrop, nextRotation, scaleFor, ZOOM_MAX, ZOOM_MIN, type Crop } from "@/lib/photo-crop-core";

/* Editor de recorte quadrado da foto do organizador, num <dialog> modal.
   A imagem é um <img> com transform CSS (translate → rotate → scale em torno do centro), dentro de um quadro com
   overflow hidden; a prévia "como no site" repete a mesma transformação num quadro menor. Ao aplicar, o mesmo
   cálculo vai pro canvas (CROP_SIZE × CROP_SIZE) e sai um WebP (PNG onde o navegador não exporta WebP; o servidor
   converte). Arrastar, roda do mouse e pinça pelos Pointer Events; teclado no quadro (setas, + −, R); slider de zoom. */

const PAN_STEP = 0.02;
const ZOOM_STEP = 1.1;
const WHEEL_SENSITIVITY = 0.0015;

export type CropSource = { img: HTMLImageElement; url: string };

export function PhotoCropper({
  source,
  initial,
  title = "Recortar a foto",
  onApply,
  onCancel,
}: {
  source: CropSource;
  initial: Crop | null;
  title?: string;
  onApply: (crop: Crop, blob: Blob) => void;
  onCancel: () => void;
}) {
  const imgW = source.img.naturalWidth;
  const imgH = source.img.naturalHeight;
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(320);
  const [crop, setCropRaw] = useState<Crop>(() => clampCrop(initial ?? defaultCrop, imgW, imgH));
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const helpId = useId();
  const zoomId = useId();
  const liveId = useId();
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ crop: Crop; x: number; y: number; dist: number } | null>(null);

  const setCrop = useCallback((update: Crop | ((c: Crop) => Crop)) => {
    setCropRaw((c) => clampCrop(typeof update === "function" ? update(c) : update, imgW, imgH));
  }, [imgW, imgH]);

  // abre como modal ao montar; Esc dispara "cancel" → onCancel (o navegador devolve o foco a quem abriu)
  useEffect(() => {
    const d = dialog.current;
    if (!d || d.open) return;
    d.showModal();
    frame.current?.focus();
  }, []);

  // lado do quadro em px, pra converter arrasto em frações
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => setSide(el.getBoundingClientRect().width || 320);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // roda do mouse: zoom (listener não passivo, pra impedir a página de rolar)
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * WHEEL_SENSITIVITY);
      setCrop((c) => ({ ...c, zoom: c.zoom * factor }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setCrop]);

  const startGesture = () => {
    const pts = [...pointers.current.values()];
    const [a, b] = pts;
    gesture.current = {
      crop,
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      dist: b ? Math.hypot(b.x - a.x, b.y - a.y) : 0,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    let zoom = g.crop.zoom;
    if (pts.length >= 2 && g.dist > 0) {
      const [a, b] = pts;
      zoom = g.crop.zoom * (Math.hypot(b.x - a.x, b.y - a.y) / g.dist);
    }
    setCrop({ ...g.crop, zoom, x: g.crop.x + (cx - g.x) / side, y: g.crop.y + (cy - g.y) / side });
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
    else startGesture(); // de dois dedos pra um: recomeça a partir da posição atual, sem pulo
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? PAN_STEP * 5 : PAN_STEP;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (e.key in moves) {
      const [dx, dy] = moves[e.key];
      setCrop((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
    } else if (e.key === "+" || e.key === "=") {
      setCrop((c) => ({ ...c, zoom: c.zoom * ZOOM_STEP }));
    } else if (e.key === "-" || e.key === "_") {
      setCrop((c) => ({ ...c, zoom: c.zoom / ZOOM_STEP }));
    } else if (e.key === "r" || e.key === "R") {
      rotate();
    } else {
      return;
    }
    e.preventDefault();
  };

  const rotate = () => setCrop((c) => ({ ...c, rotation: nextRotation(c.rotation) }));
  const reset = () => setCrop({ ...defaultCrop, rotation: crop.rotation });

  const apply = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await render(source.img, crop);
      onApply(crop, blob);
    } catch (err) {
      console.error("[PhotoCropper]", err);
      setError("Não deu pra gerar o recorte neste navegador. Tente de novo ou use outro navegador.");
      setExporting(false);
    }
  };

  const transformFor = (frameSide: number) => {
    const s = scaleFor(imgW, imgH, crop, frameSide);
    return `translate(calc(-50% + ${crop.x * frameSide}px), calc(-50% + ${crop.y * frameSide}px)) rotate(${crop.rotation}deg) scale(${s})`;
  };
  const imgStyle = (frameSide: number): React.CSSProperties => ({
    position: "absolute",
    left: "50%",
    top: "50%",
    width: imgW,
    height: imgH,
    maxWidth: "none",
    transform: transformFor(frameSide),
    transformOrigin: "center",
  });

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onKeyDown={trapTabKey}
      onCancel={(e) => {
        // Esc: quem abriu desmonta o editor (e o navegador devolve o foco ao botão que o abriu)
        e.preventDefault();
        onCancel();
      }}
      className="photo-cropper m-auto w-[min(100vw-24px,640px)] max-h-[calc(100dvh-24px)] overflow-y-auto border-2 border-ink bg-paper p-0 text-ink shadow-hard backdrop:bg-obsidian/70"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="font-display text-subheading">
            {title}
          </h2>
          <p id={helpId} className="text-caption text-graphite">
            Arraste para posicionar. Zoom com a roda do mouse, a pinça ou o controle abaixo. No teclado: setas movem (Shift
            move mais), + e − dão zoom, R gira.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
          <div
            ref={frame}
            role="application"
            tabIndex={0}
            aria-label="Área de recorte da foto"
            aria-describedby={`${helpId} ${liveId}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onKeyDown={onKeyDown}
            className="relative mx-auto aspect-square w-full max-w-[400px] cursor-grab touch-none select-none overflow-hidden border-2 border-ink bg-ash active:cursor-grabbing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- transform CSS sobre o tamanho natural */}
            <img src={source.url} alt="" draggable={false} style={imgStyle(side)} />
            {/* guias de terços, só visuais */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-50">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} className={`border-white ${i % 3 !== 2 ? "border-r" : ""} ${i < 6 ? "border-b" : ""}`} />
              ))}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 sm:w-[140px]">
            <p className="text-caption font-semibold">Como fica no site</p>
            <div className="relative size-[112px]">
              <div className="relative size-full overflow-hidden border-2 border-ink bg-ash shadow-hard-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={source.url} alt="" draggable={false} style={imgStyle(112)} />
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-grass to-marigold" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label htmlFor={zoomId} className="text-body font-semibold">
              Zoom
            </label>
            <Button size="sm" onClick={() => setCrop((c) => ({ ...c, zoom: c.zoom / ZOOM_STEP }))} aria-label="Menos zoom" disabled={crop.zoom <= ZOOM_MIN}>
              −
            </Button>
            <input
              id={zoomId}
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={crop.zoom}
              onChange={(e) => setCrop((c) => ({ ...c, zoom: Number(e.target.value) }))}
              aria-valuetext={`${Math.round(crop.zoom * 100)}%`}
              className="min-w-0 flex-1 accent-ink"
            />
            <Button size="sm" onClick={() => setCrop((c) => ({ ...c, zoom: c.zoom * ZOOM_STEP }))} aria-label="Mais zoom" disabled={crop.zoom >= ZOOM_MAX}>
              +
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={rotate}>
              Girar 90°
            </Button>
            <Button size="sm" onClick={reset} disabled={crop.x === 0 && crop.y === 0 && crop.zoom === 1}>
              Centralizar
            </Button>
          </div>
          <p id={liveId} className="sr-only" aria-live="polite">
            Zoom {Math.round(crop.zoom * 100)}%{crop.rotation ? `, girada ${crop.rotation} graus` : ""}
          </p>
        </div>

        {error && (
          <p className="text-caption font-semibold" role="alert">
            — {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ash pt-4">
          <Button size="md" onClick={onCancel}>
            Cancelar
          </Button>
          <Button size="md" variant="primary" onClick={apply} disabled={exporting}>
            {exporting ? "Gerando…" : "Aplicar"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

// Desenha o recorte num canvas CROP_SIZE × CROP_SIZE com a mesma transformação da prévia e exporta
async function render(img: HTMLImageElement, crop: Crop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CROP_SIZE;
  canvas.height = CROP_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d indisponível");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
  ctx.imageSmoothingQuality = "high";
  const s = scaleFor(img.naturalWidth, img.naturalHeight, crop, CROP_SIZE);
  ctx.translate(CROP_SIZE / 2 + crop.x * CROP_SIZE, CROP_SIZE / 2 + crop.y * CROP_SIZE);
  ctx.rotate((crop.rotation * Math.PI) / 180);
  ctx.scale(s, s);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);
  const toBlob = (type: string, quality?: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = await toBlob("image/webp", 0.9);
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/png"); // Safari: o servidor converte pra WebP
  if (!blob) throw new Error("toBlob falhou");
  return blob;
}
