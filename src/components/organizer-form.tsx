"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { saveOrganizer, type OrganizerFormState } from "@/app/admin/actions";
import { Button } from "@/components/button";
import { FileUpload } from "@/components/file-upload";
import { Select } from "@/components/select";
import { SocialIcon } from "@/components/social-icon";
import { ALT_MAX, BIO_MAX, isSocialKind, NAME_MAX, ROLE_MAX, SOCIALS_MAX, socialKinds, URL_MAX } from "@/lib/organizers-core";

const kindOptions = socialKinds.map((k) => ({ value: k.id, label: k.label }));

const placeholders: Record<string, string> = {
  linkedin: "https://linkedin.com/in/fulano",
  instagram: "@fulano ou https://instagram.com/fulano",
  x: "@fulano ou https://x.com/fulano",
  site: "https://fulano.com.br",
  outra: "https://…",
};

type SocialRow = { key: number; kind: string; url: string };

type Editing = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoAlt: string;
  active: boolean;
  socials: { kind: string; url: string }[];
  photoUrl: string | null;
};

// Sem `organizer`: cadastro. Com `organizer`: edição (a foto atual fica se nenhum arquivo novo for enviado).
export function OrganizerForm({ organizer }: { organizer?: Editing }) {
  const [state, action, pending] = useActionState(saveOrganizer, { status: "idle" } as OrganizerFormState);
  const v = state.status === "error" && state.values ? state.values : organizer;
  // key do formulário muda a cada envio: os campos remontam com `v` (o que foi digitado, ou vazio depois de adicionar)
  return <Fields key={state.at ?? 0} organizer={organizer} values={v} state={state} action={action} pending={pending} />;
}

function Fields({
  organizer,
  values: v,
  state,
  action,
  pending,
}: {
  organizer?: Editing;
  values?: Omit<Editing, "id" | "photoUrl">;
  state: OrganizerFormState;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  const [bio, setBio] = useState(v?.bio ?? "");
  const [nextKey, setNextKey] = useState(() => (v?.socials.length ?? 0) + 1);
  const [socials, setSocials] = useState<SocialRow[]>(() => (v?.socials ?? []).map((s, i) => ({ key: i + 1, ...s })));
  const bioCountId = useId();
  const left = BIO_MAX - bio.length;

  const add = () => {
    setSocials((rows) => [...rows, { key: nextKey, kind: "", url: "" }]);
    setNextKey((k) => k + 1);
  };
  const update = (key: number, patch: Partial<SocialRow>) => setSocials((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: number) => setSocials((rows) => rows.filter((r) => r.key !== key));

  return (
    <form action={action} className="flex flex-col gap-4">
      {organizer && <input type="hidden" name="id" value={organizer.id} />}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="o-name" className="text-body font-semibold">
          Nome
        </label>
        <input id="o-name" name="name" type="text" required maxLength={NAME_MAX} defaultValue={v?.name} className="field" placeholder="Ex.: Maria Souza" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="o-role" className="text-body font-semibold">
          Papel ou cargo
        </label>
        <input id="o-role" name="role" type="text" maxLength={ROLE_MAX} defaultValue={v?.role} className="field" placeholder="Ex.: Coordenação geral" />
        <p className="text-caption">Opcional.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="o-bio" className="text-body font-semibold">
          Biografia
        </label>
        <textarea
          id="o-bio"
          name="bio"
          rows={4}
          maxLength={BIO_MAX}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          aria-describedby={bioCountId}
          className="field resize-y"
          placeholder="Duas ou três frases sobre a pessoa e o papel dela no Summit."
        />
        <p id={bioCountId} className={`text-caption ${left <= 20 ? "font-semibold text-ink" : ""}`}>
          {bio.length}/{BIO_MAX} caracteres{left <= 20 ? ` — faltam ${left}` : ""}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="o-photo" className="text-body font-semibold">
          Foto
        </label>
        <FileUpload
          id="o-photo"
          name="photo"
          label="Arraste a foto aqui ou escolha no computador"
          preview="photo"
          current={organizer?.photoUrl ? { url: organizer.photoUrl, alt: organizer.photoAlt || organizer.name } : undefined}
          hint={`Opcional. JPG, PNG ou WebP até 2 MB; no site a foto é recortada em quadrado, ao centro — prefira rosto centralizado. Sem foto, o card mostra as iniciais.${organizer?.photoUrl ? " Para manter a atual, não escolha outra." : ""}`}
        />
        {organizer?.photoUrl && (
          <label className="flex items-center gap-2 text-body">
            <input type="checkbox" name="removePhoto" className="h-4 w-4 accent-ink" />
            Remover a foto atual
          </label>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="o-alt" className="text-body font-semibold">
          Texto alternativo da foto
        </label>
        <input id="o-alt" name="photoAlt" type="text" maxLength={ALT_MAX} defaultValue={v?.photoAlt} className="field" placeholder="Ex.: Maria sorrindo, de blazer verde" />
        <p className="text-caption">Lido por leitores de tela. Se ficar vazio, usamos “Foto de” + o nome.</p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1.5 text-body font-semibold">Redes sociais</legend>
        {socials.length === 0 && <p className="text-caption">Nenhuma rede. Opcional.</p>}
        <ul className="flex flex-col gap-3">
          {socials.map((s, i) => {
            const n = i + 1;
            return (
              <li key={s.key} className="flex flex-col gap-2 border border-ash p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-caption font-semibold">
                    {isSocialKind(s.kind) && <SocialIcon kind={s.kind} size={16} />}
                    Rede {n}
                  </span>
                  <Button size="sm" onClick={() => remove(s.key)} aria-label={`Remover rede ${n}`}>
                    Remover
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`o-social-kind-${s.key}`} className="sr-only">
                      Tipo da rede {n}
                    </label>
                    <Select
                      id={`o-social-kind-${s.key}`}
                      name="socialKind"
                      required
                      options={kindOptions}
                      defaultValue={s.kind}
                      placeholder="Tipo"
                      onChange={(kind) => update(s.key, { kind })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`o-social-url-${s.key}`} className="sr-only">
                      Link da rede {n}
                    </label>
                    <input
                      id={`o-social-url-${s.key}`}
                      name="socialUrl"
                      type="text"
                      inputMode="url"
                      required
                      maxLength={URL_MAX}
                      defaultValue={s.url}
                      onChange={(e) => update(s.key, { url: e.target.value })}
                      className="field"
                      placeholder={placeholders[s.kind] ?? "https://…"}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {socials.length < SOCIALS_MAX && (
          <Button size="sm" onClick={add} className="self-start">
            + Adicionar rede
          </Button>
        )}
        <p className="text-caption">No site, cada rede vira um ícone com link em nova aba. Conferimos o domínio: LinkedIn precisa ser linkedin.com, e assim por diante.</p>
      </fieldset>

      <label className="flex items-center gap-2 text-body">
        <input type="checkbox" name="active" defaultChecked={v?.active ?? true} className="h-4 w-4 accent-ink" />
        Ativo (aparece no site)
      </label>

      {state.message && (
        <p className="text-caption font-semibold" role="status">
          — {state.message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : organizer ? "Salvar alterações" : "Adicionar organizador"}
        </Button>
        {organizer && (
          <Link href="/admin/organizadores" className="text-body underline underline-offset-4">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
