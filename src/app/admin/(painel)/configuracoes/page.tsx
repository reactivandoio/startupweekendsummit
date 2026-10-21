import { Eyebrow } from "@/components/eyebrow";
import { SiteThemeForm } from "@/components/site-theme-form";
import { getDefaultTheme } from "@/lib/theme";
import { themeLabel } from "@/lib/theme-core";

export default async function ConfiguracoesPage() {
  const theme = await getDefaultTheme();
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <div className="flex flex-col gap-6">
        <Eyebrow>Configurações</Eyebrow>
        <h1 className="font-display text-heading">Tema padrão: {themeLabel[theme].toLowerCase()}</h1>
        <p className="max-w-[40ch] text-body-md">
          É o tema que quem chega ao site vê na primeira visita, independente da preferência do sistema. O botão de tema no
          site (e aqui na barra do painel) guarda a escolha da pessoa, que passa na frente deste padrão.
        </p>
        <p className="max-w-[40ch] text-body">As imagens de compartilhamento (og-image) e os e-mails não mudam com o tema.</p>
      </div>
      <div className="max-w-[560px] self-start">
        <SiteThemeForm current={theme} />
      </div>
    </div>
  );
}
