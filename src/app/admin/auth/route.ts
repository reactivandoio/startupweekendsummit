import { redirect } from "next/navigation";
import { consumeLoginToken } from "@/lib/auth";

// Destino do link enviado por e-mail: valida o token, cria a sessão e manda pro painel
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const ok = token ? await consumeLoginToken(token) : false;
  redirect(ok ? "/admin" : "/admin/login?erro=token");
}
