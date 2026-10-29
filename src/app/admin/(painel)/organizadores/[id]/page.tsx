import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/eyebrow";
import { OrganizerForm } from "@/components/organizer-form";
import { getOrganizer } from "@/lib/organizers";
import { uploadUrl } from "@/lib/uploads";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditarOrganizadorPage({ params }: PageProps<"/admin/organizadores/[id]">) {
  const { id } = await params;
  // id que não é uuid faria o Postgres lançar erro em vez de não achar
  const organizer = UUID.test(id) ? await getOrganizer(id) : null;
  if (!organizer) notFound();

  return (
    <div className="flex max-w-[480px] flex-col gap-6">
      <Eyebrow>Organizadores</Eyebrow>
      <h1 className="font-display text-heading">Editar {organizer.name}</h1>
      <OrganizerForm
        organizer={{
          id: organizer.id,
          name: organizer.name,
          role: organizer.role,
          bio: organizer.bio,
          photoAlt: organizer.photoAlt,
          active: organizer.active,
          socials: organizer.socials,
          photo: organizer.photo
            ? {
                url: uploadUrl(organizer.photo),
                sourceUrl: organizer.photoSource ? uploadUrl(organizer.photoSource) : null,
                crop: organizer.photoCrop,
                alt: organizer.photoAlt || organizer.name,
              }
            : null,
        }}
      />
    </div>
  );
}
