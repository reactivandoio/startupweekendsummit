import type { SocialKind } from "@/lib/organizers-core";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "square" as const, strokeLinejoin: "miter" as const };

/* Ícone de traço por rede (mesma linguagem dos ícones do menu): decorativo, o nome da rede vai no aria-label do link */
export function SocialIcon({ kind, size = 20 }: { kind: SocialKind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
      {kind === "linkedin" && (
        <>
          <path d="M2.75 2.75h14.5v14.5H2.75z" />
          <path d="M6.5 8.75V14M6.5 5.75v.5M9.75 14V8.75M9.75 11.25c0-1.5 1-2.5 2.25-2.5s2 .9 2 2.5V14" />
        </>
      )}
      {kind === "instagram" && (
        <>
          <rect x="2.75" y="2.75" width="14.5" height="14.5" rx="4" />
          <circle cx="10" cy="10" r="3.25" />
          <path d="M14.25 5.5v.5" />
        </>
      )}
      {kind === "x" && <path d="M3.5 3h3.75l9.25 14h-3.75zM16.25 3l-5.5 6.25M9.25 10.75 3.75 17" />}
      {kind === "site" && (
        <>
          <circle cx="10" cy="10" r="7.25" />
          <path d="M2.75 10h14.5M10 2.75c-2 2-3 4.5-3 7.25s1 5.25 3 7.25M10 2.75c2 2 3 4.5 3 7.25s-1 5.25-3 7.25" />
        </>
      )}
      {kind === "outra" && <path d="M8.5 11.5l3-3M7 9.5 5 11.5a2.5 2.5 0 0 0 3.5 3.5l2-2M13 10.5l2-2A2.5 2.5 0 0 0 11.5 5l-2 2" />}
    </svg>
  );
}
