"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/button";
import { PhotoCropper, type CropSource } from "@/components/photo-cropper";
import { type Crop } from "@/lib/photo-crop-core";

const ACCEPTED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 2 * 1024 * 1024;

export type CurrentPhoto = { url: string; sourceUrl: string | null; crop: Crop | null; alt: string };

type Result = { blob: Blob; url: string; crop: Crop };

function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagem inválida"));
    img.src = url;
  });
}

// Coloca um arquivo dentro de um <input type="file"> escondido, pra ir junto no submit do formulário (Server Action)
function setFile(input: HTMLInputElement | null, file: File | null) {
  if (!input) return;
  if (!file) {
    input.value = "";
    return;
  }
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
}

/* Foto do organizador no painel: escolher (arrastar, clicar ou Enter) abre o editor de recorte quadrado; "Aplicar"
   guarda o quadrado recortado (input "photo"), o original (input "photoSource", só quando a foto é nova) e o estado
   do recorte (input "photoCrop"), tudo no mesmo formulário. "Ajustar recorte" reabre o editor, inclusive numa foto já
   salva (baixa o original guardado; fotos de antes do editor usam a própria foto como original e passam a guardá-lo).
   "Remover" marca removePhoto. Os inputs de arquivo ficam escondidos: quem fala com a pessoa são os botões. */
export function PhotoField({ id, current, hint }: { id: string; current?: CurrentPhoto; hint?: string }) {
  const pick = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const sourceInput = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLButtonElement>(null);
  const adjust = useRef<HTMLButtonElement>(null);
  const [source, setSource] = useState<(CropSource & { file: File | null }) | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [editing, setEditing] = useState<{ initial: Crop | null; firstTime: boolean } | null>(null);
  const [removed, setRemoved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();
  // quem recebe o foco quando o editor fecha (depois que o estado novo já foi renderizado)
  const focusNext = useRef<"adjust" | "zone" | null>(null);
  useEffect(() => {
    if (editing || !focusNext.current) return;
    (focusNext.current === "adjust" ? adjust.current : zone.current)?.focus();
    focusNext.current = null;
  }, [editing, result]);

  // libera as URLs de objeto quando mudam ou o componente sai da tela
  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const showing = removed ? null : result ? { src: result.url, alt: "", meta: `Recorte aplicado · ${formatBytes(result.blob.size)}` } : current ? { src: current.url, alt: current.alt, meta: "Foto atual" } : null;

  const openWithFile = async (f: File | undefined) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    const okType = f.type in ACCEPTED || (!f.type && ext && Object.values(ACCEPTED).includes(ext));
    if (!okType) return setError("Formato não aceito. Use JPG, PNG ou WebP.");
    if (f.size > MAX_BYTES) return setError(`A foto tem ${formatBytes(f.size)} e o limite é ${formatBytes(MAX_BYTES)}. Exporte uma versão menor.`);
    setError(null);
    setLoading(true);
    try {
      const url = URL.createObjectURL(f);
      const img = await loadImage(url);
      setSource({ img, url, file: f });
      setEditing({ initial: null, firstTime: true });
    } catch {
      setError("Não conseguimos abrir essa imagem. Tente outro arquivo.");
    } finally {
      setLoading(false);
      if (pick.current) pick.current.value = "";
    }
  };

  // Reabre o recorte: da foto escolhida agora, ou baixando o original da foto já salva
  const reopen = async () => {
    setError(null);
    if (source) return setEditing({ initial: result?.crop ?? current?.crop ?? null, firstTime: false });
    if (!current) return;
    setLoading(true);
    try {
      const res = await fetch(current.sourceUrl ?? current.url);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const img = await loadImage(url);
      // sem original guardado (foto de antes do editor), a própria foto vira o original e passa a ser salva como tal
      const file = current.sourceUrl ? null : new File([blob], "original.webp", { type: blob.type || "image/webp" });
      setSource({ img, url, file });
      setEditing({ initial: current.crop, firstTime: false });
    } catch {
      setError("Não conseguimos baixar a foto salva para recortar. Tente de novo ou envie outra.");
    } finally {
      setLoading(false);
    }
  };

  const onApply = (crop: Crop, blob: Blob) => {
    const ext = blob.type === "image/png" ? "png" : "webp";
    setFile(photoInput.current, new File([blob], `recorte.${ext}`, { type: blob.type }));
    setFile(sourceInput.current, source?.file ?? null);
    setResult({ blob, url: URL.createObjectURL(blob), crop });
    setRemoved(false);
    focusNext.current = "adjust";
    setEditing(null);
  };

  const onCancel = () => {
    const first = editing?.firstTime;
    // desistiu da foto nova: volta ao que havia antes (foto salva ou recorte anterior, se houver)
    if (first) setSource(null);
    focusNext.current = !first || result || (current && !removed) ? "adjust" : "zone";
    setEditing(null);
  };

  const remove = () => {
    setFile(photoInput.current, null);
    setFile(sourceInput.current, null);
    setResult(null);
    setSource(null);
    setRemoved(!!current);
    setError(null);
    queueMicrotask(() => zone.current?.focus());
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    openWithFile(e.dataTransfer.files[0]);
  };
  const dragProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop,
  };

  return (
    <div className="flex flex-col gap-3">
      {/* seletor (não vai no submit) e os três campos que vão */}
      <input ref={pick} id={id} type="file" accept={Object.keys(ACCEPTED).join(",")} tabIndex={-1} className="sr-only" aria-describedby={hint ? hintId : undefined} onChange={(e) => openWithFile(e.target.files?.[0])} />
      <input ref={photoInput} type="file" name="photo" tabIndex={-1} aria-hidden="true" className="hidden" />
      <input ref={sourceInput} type="file" name="photoSource" tabIndex={-1} aria-hidden="true" className="hidden" />
      <input type="hidden" name="photoCrop" value={result ? JSON.stringify(result.crop) : ""} />
      {removed && <input type="hidden" name="removePhoto" value="on" />}

      {showing ? (
        <div className={`flex flex-col gap-4 border-2 border-ink p-4 text-ink ${dragging ? "bg-marigold-wash" : "bg-paper"}`} {...dragProps}>
          <div className="flex items-center gap-4">
            <span className="relative block size-24 shrink-0 overflow-hidden border-2 border-ink bg-ash shadow-hard-sm" title="Como vai aparecer no site">
              <Image src={showing.src} alt={showing.alt} fill unoptimized sizes="96px" className="object-cover" />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-grass to-marigold" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-body font-semibold">{showing.meta}</p>
              <p className="text-caption">Quadrado, como no site. Arraste outra foto aqui para trocar.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button ref={adjust} size="sm" onClick={reopen} disabled={loading}>
              {loading ? "Abrindo…" : "Ajustar recorte"}
            </Button>
            <Button ref={zone} size="sm" onClick={() => pick.current?.click()}>
              Trocar foto
            </Button>
            <Button size="sm" onClick={remove}>
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <button
          ref={zone}
          type="button"
          aria-describedby={hint ? hintId : undefined}
          disabled={loading}
          onClick={() => pick.current?.click()}
          {...dragProps}
          className={`flex w-full flex-col items-center gap-3 border-2 border-dashed px-6 py-10 text-center text-ink transition-colors ${
            dragging ? "border-ink bg-marigold-wash" : error ? "border-ink bg-paper" : "border-ash bg-paper hover:border-ink"
          }`}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 22V6M9 13l7-7 7 7M5 20v6h22v-6" />
          </svg>
          <span className="text-body font-semibold">{loading ? "Abrindo a foto…" : "Arraste a foto aqui ou escolha no computador"}</span>
          <span className="text-caption">JPG, PNG ou WebP, até {formatBytes(MAX_BYTES)}. Depois você recorta.</span>
        </button>
      )}

      {error && (
        <p className="text-caption font-semibold text-ink" role="alert">
          — {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-caption">
          {hint}
        </p>
      )}

      {editing && source && <PhotoCropper source={source} initial={editing.initial} onApply={onApply} onCancel={onCancel} />}
    </div>
  );
}
