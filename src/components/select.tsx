"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/* Na validação do formulário, cada campo inválido tenta focar a si mesmo; só o primeiro (em ordem no DOM) ganha,
   enquanto o foco ainda está no botão de envio (ou em lugar nenhum). */
function focusIsFree() {
  const a = document.activeElement;
  return !a || a === document.body || a.matches("button[type=submit], input[type=submit]");
}


/* Select da marca no lugar do <select> nativo (que abre o menu do sistema).
   Botão com role="combobox" + lista role="listbox"; teclado: setas, Home/End, Enter/Espaço, Esc,
   digitação pra buscar. Um <select> nativo escondido leva o valor no submit do formulário e dispara
   `required`; quando inválido, o foco volta pro botão e a mensagem aparece aqui embaixo. */
export function Select({
  id,
  name,
  options,
  defaultValue = "",
  placeholder = "Escolha",
  required,
  invalid,
  className = "",
  onChange,
}: {
  id: string;
  name: string;
  options: readonly SelectOption[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const listId = useId();
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const commit = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    setValue(opt.value);
    setError(null);
    onChange?.(opt.value);
  };
  const show = (startAt = selectedIndex >= 0 ? selectedIndex : 0) => {
    setActive(startAt);
    setOpen(true);
  };
  const hide = () => {
    setOpen(false);
    setActive(-1);
  };

  // fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) hide();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // mantém a opção ativa visível na lista
  useEffect(() => {
    if (!open || active < 0) return;
    list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  // busca por digitação: acumula letras por 700 ms (como o select nativo)
  const typeahead = (key: string) => {
    const now = Date.now();
    const text = (now - typed.current.at < 700 ? typed.current.text : "") + key.toLowerCase();
    typed.current = { text, at: now };
    const from = open ? active : selectedIndex;
    const n = options.length;
    for (let i = 1; i <= n; i++) {
      const idx = (from + i) % n;
      if (options[idx].label.toLowerCase().startsWith(text)) {
        if (open) setActive(idx);
        else commit(idx);
        return;
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = options.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) show();
        else setActive((a) => Math.min(a + 1, n - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) show();
        else setActive((a) => Math.max(a - 1, 0));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(n - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) show();
        else {
          commit(active);
          hide();
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          hide();
        }
        break;
      case "Tab":
        if (open) hide();
        break;
      default:
        if (e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          typeahead(e.key);
        }
    }
  };

  const isInvalid = invalid || !!error;
  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        aria-invalid={isInvalid || undefined}
        aria-required={required || undefined}
        className="field flex items-center justify-between gap-3 text-left aria-expanded:border-ink"
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!root.current?.contains(e.relatedTarget as Node)) hide();
        }}
      >
        <span className={`truncate ${selected ? "" : "text-ink/40"}`}>{selected ? selected.label : placeholder}</span>
        <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <ul
        ref={list}
        id={listId}
        role="listbox"
        aria-labelledby={id}
        tabIndex={-1}
        hidden={!open}
        className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto border-2 border-ink bg-paper py-2 text-ink shadow-hard-sm"
      >
        {options.map((o, i) => {
          const isSelected = o.value === value;
          const isActive = i === active;
          return (
            <li
              key={o.value}
              id={optionId(i)}
              role="option"
              aria-selected={isSelected}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-body ${isActive ? "bg-marigold-wash" : ""} ${isSelected ? "font-semibold" : ""}`}
              onPointerMove={() => setActive(i)}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                commit(i);
                hide();
                trigger.current?.focus();
              }}
            >
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 ${isSelected ? "bg-grass" : "bg-transparent"}`} />
              {o.label}
            </li>
          );
        })}
      </ul>

      {/* Valor pro formulário + validação nativa de `required` */}
      <select
        name={name}
        value={value}
        required={required}
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none absolute bottom-0 left-0 -m-px h-px w-px overflow-hidden opacity-0"
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e.target.value);
        }}
        onInvalid={(e) => {
          e.preventDefault();
          setError("Escolha uma opção.");
          if (focusIsFree()) trigger.current?.focus();
        }}
      >
        <option value="" />
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1.5 text-caption font-semibold" role="alert">
          — {error}
        </p>
      )}
    </div>
  );
}
