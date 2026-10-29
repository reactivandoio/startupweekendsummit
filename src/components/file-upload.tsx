"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/button";

type Mode = "image" | "logo" | "photo";

const IMAGE_TYPES: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/webp": "webp",
};

// Tipos aceitos e textos de cada modo; o servidor (saveImageUpload) confere de novo pelos bytes
const modes: Record<Mode, { accepted: Record<string, string>; formats: string; current: string; change: string }> = {
  image: { accepted: IMAGE_TYPES, formats: "SVG, PNG ou WebP", current: "Imagem atual", change: "Trocar imagem" },
  logo: { accepted: IMAGE_TYPES, formats: "SVG, PNG ou WebP com fundo transparente", current: "Logo atual", change: "Trocar logo" },
  photo: {
    accepted: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
    formats: "JPG, PNG ou WebP",
    current: "Foto atual",
    change: "Trocar foto",
  },
};

const OPAQUE_MESSAGE = "Este arquivo tem fundo opaco e ficaria um bloco preto no site. Envie SVG, PNG ou WebP com fundo transparente.";

// Desenha a imagem num canvas e procura algum pixel com alfa < 255 (amostra em passos pra ser rápido)
async function hasTransparentPixels(file: File): Promise<boolean> {
  if (file.type === "image/svg+xml") return true;
  try {
    const bmp = await createImageBitmap(file);
    const w = Math.min(bmp.width, 256), h = Math.min(bmp.height, 256);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true;
    ctx.drawImage(bmp, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
    return false;
  } catch {
    return true; // sem como conferir aqui: o servidor confere de novo
  }
}

/* Na validação do formulário, cada campo inválido tenta focar a si mesmo; só o primeiro (em ordem no DOM) ganha,
   enquanto o foco ainda está no botão de envio (ou em lugar nenhum). */
function focusIsFree() {
  const a = document.activeElement;
  return !a || a === document.body || a.matches("button[type=submit], input[type=submit]");
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

/* Upload de imagem da marca: área de arrastar e soltar (ou clique/Enter pra escolher), prévia,
   nome e tamanho, trocar/remover. Valida tipo e tamanho no cliente antes do envio; o <input type="file">
   fica escondido mas é ele que vai no submit do formulário (Server Action). Com `current`, mostra o
   arquivo já salvo até que outro seja escolhido. */
export function FileUpload({
  id,
  name,
  required,
  maxBytes = 2 * 1024 * 1024,
  current,
  hint,
  label = "Arraste o arquivo aqui ou escolha no computador",
  preview = "image",
}: {
  id: string;
  name: string;
  required?: boolean;
  maxBytes?: number;
  current?: { url: string; alt: string };
  hint?: string;
  label?: string;
  /** "logo": prévia como no site (tinta sobre o papel do tema) e exige fundo transparente;
      "photo": foto JPG/PNG/WebP, prévia quadrada e recortada ao centro como no site */
  preview?: Mode;
}) {
  const mode = modes[preview];
  const ACCEPTED = mode.accepted;
  const input = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLButtonElement>(null);
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();
  const file = picked?.file ?? null;

  // libera a URL da prévia anterior quando o arquivo muda ou o componente sai da tela
  useEffect(() => {
    if (!picked) return;
    const { url } = picked;
    return () => URL.revokeObjectURL(url);
  }, [picked]);

  const clear = () => {
    if (input.current) input.current.value = "";
    setPicked(null);
  };

  const accept = async (f: File | undefined) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    const okType = f.type in ACCEPTED || (!f.type && ext && Object.values(ACCEPTED).includes(ext));
    if (!okType) {
      clear();
      setError(`Formato não aceito. Use ${mode.formats}.`);
      return;
    }
    if (f.size > maxBytes) {
      clear();
      setError(`O arquivo tem ${formatBytes(f.size)} e o limite é ${formatBytes(maxBytes)}. Exporte uma versão menor.`);
      return;
    }
    if (preview === "logo" && !(await hasTransparentPixels(f))) {
      clear();
      setError(OPAQUE_MESSAGE);
      return;
    }
    setError(null);
    setPicked({ file: f, url: URL.createObjectURL(f) });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (!f || !input.current) return;
    // coloca o arquivo solto dentro do input, pra ir junto no submit
    const dt = new DataTransfer();
    dt.items.add(f);
    input.current.files = dt.files;
    accept(f);
  };

  const describedBy = [hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  const shown = picked ? { src: picked.url, title: picked.file.name, meta: formatBytes(picked.file.size) } : current ? { src: current.url, title: mode.current, meta: null } : null;

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={input}
        id={id}
        name={name}
        type="file"
        accept={Object.keys(ACCEPTED).join(",")}
        required={required && !current}
        tabIndex={-1}
        className="sr-only"
        aria-describedby={describedBy}
        onChange={(e) => accept(e.target.files?.[0])}
        onInvalid={(e) => {
          e.preventDefault();
          setError("Escolha um arquivo.");
          if (focusIsFree()) zone.current?.focus();
        }}
      />

      {shown?.src ? (
        <div
          className={`flex flex-col gap-4 border-2 border-ink p-4 text-ink ${dragging ? "bg-marigold-wash" : "bg-paper"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="flex items-center gap-4">
            <span
              className={`relative block h-20 shrink-0 ${
                preview === "photo"
                  ? "w-20 border border-ash bg-ash"
                  : preview === "logo"
                    ? "w-32 border border-ash bg-paper"
                    : "w-32 bg-[repeating-conic-gradient(var(--color-ash)_0_25%,transparent_0_50%)] bg-[length:16px_16px]"
              }`}
              title={preview === "image" ? undefined : "Como vai aparecer no site"}
            >
              <Image
                src={shown.src}
                alt=""
                fill
                unoptimized
                sizes="128px"
                className={preview === "photo" ? "object-cover" : `object-contain p-2 ${preview === "logo" ? "logo-mono" : ""}`}
              />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-body font-semibold" title={shown.title}>
                {shown.title}
              </p>
              <p className="text-caption">
                {shown.meta ?? "Arraste outro arquivo aqui para trocar."}
                {preview === "logo" ? " Prévia como no site, no tema atual." : preview === "photo" ? " Recorte quadrado ao centro, como no site." : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button ref={zone} size="sm" onClick={() => input.current?.click()} aria-describedby={describedBy}>
              {file ? "Trocar arquivo" : mode.change}
            </Button>
            {file && (
              <Button size="sm" onClick={clear}>
                Remover
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          ref={zone}
          type="button"
          aria-describedby={describedBy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex w-full flex-col items-center gap-3 border-2 border-dashed px-6 py-10 text-center text-ink transition-colors ${
            dragging ? "border-ink bg-marigold-wash" : error ? "border-ink bg-paper" : "border-ash bg-paper hover:border-ink"
          }`}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 22V6M9 13l7-7 7 7M5 20v6h22v-6" />
          </svg>
          <span className="text-body font-semibold">{label}</span>
          <span className="text-caption">
            {mode.formats}, até {formatBytes(maxBytes)}
          </span>
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
    </div>
  );
}
