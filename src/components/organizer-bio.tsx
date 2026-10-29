"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { trapTabKey } from "@/components/dialog-focus";

/* Bio do card: até `lines` linhas; se o texto passar disso (medido no DOM, não por contagem de caracteres),
   aparece "Ver mais", que abre a bio completa num <dialog> modal (Esc fecha, foco volta ao botão). */
export function OrganizerBio({ name, role, bio, lines = 4 }: { name: string; role: string; bio: string; lines?: number }) {
  const text = useRef<HTMLParagraphElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [clipped, setClipped] = useState(false);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useLayoutEffect(() => {
    const el = text.current;
    if (!el) return;
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bio]);

  // o <dialog> fica montado: showModal() ao abrir, close() ao fechar (e o foco volta pro "Ver mais")
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) {
      d.close();
      trigger.current?.focus();
    }
  }, [open]);

  return (
    <>
      <p ref={text} className="whitespace-pre-line text-body leading-normal text-graphite" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" }}>
        {bio}
      </p>
      {clipped && (
        <button ref={trigger} type="button" onClick={() => setOpen(true)} className="self-start text-body font-semibold underline underline-offset-4 hover:text-grass-deep" aria-label={`Ver mais sobre ${name}`}>
          Ver mais
        </button>
      )}
      {clipped && (
        <dialog
          ref={dialog}
          aria-labelledby={titleId}
          onKeyDown={trapTabKey}
          onCancel={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false); // clique no fundo
          }}
          className="m-auto w-[min(100vw-24px,560px)] max-h-[calc(100dvh-24px)] overflow-y-auto border-2 border-ink bg-paper p-0 text-ink shadow-hard backdrop:bg-obsidian/70"
        >
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div className="flex flex-col gap-1">
              <h3 id={titleId} className="font-display text-subheading">
                {name}
              </h3>
              {role && <p className="text-body font-semibold text-grass-deep">{role}</p>}
            </div>
            <p className="whitespace-pre-line text-body-md leading-normal">{bio}</p>
            <Button size="sm" onClick={() => setOpen(false)} className="self-end" autoFocus>
              Fechar
            </Button>
          </div>
        </dialog>
      )}
    </>
  );
}
