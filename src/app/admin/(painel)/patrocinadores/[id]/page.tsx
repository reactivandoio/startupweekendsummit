import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/eyebrow";
import { SponsorForm } from "@/components/sponsor-form";
import { getSponsor } from "@/lib/sponsors";
import { uploadUrl } from "@/lib/uploads";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditarPatrocinadorPage({ params }: PageProps<"/admin/patrocinadores/[id]">) {
  const { id } = await params;
  // id que não é uuid faria o Postgres lançar erro em vez de não achar
  const sponsor = UUID.test(id) ? await getSponsor(id) : null;
  if (!sponsor) notFound();

  return (
    <div className="flex max-w-[480px] flex-col gap-6">
      <Eyebrow>Patrocinadores</Eyebrow>
      <h1 className="font-display text-heading">Editar {sponsor.name}</h1>
      <SponsorForm
        sponsor={{
          id: sponsor.id,
          name: sponsor.name,
          tier: sponsor.tier,
          logoAlt: sponsor.logoAlt,
          url: sponsor.url,
          logoUrl: uploadUrl(sponsor.logo),
        }}
      />
    </div>
  );
}
