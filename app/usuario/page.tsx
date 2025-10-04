import Image from "next/image";
import { redirect } from "next/navigation";

import { ChangePhoto } from "@/components/ChangePhoto";
import { auth } from "@/lib/auth";

export default async function UsuarioPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;
  const displayName = user.name?.trim() ? user.name : "Usuário";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="rounded-lg bg-white/80 p-6 shadow">
        <h1 className="text-2xl font-semibold">Perfil do usuário</h1>
        <p className="mt-2 text-sm text-slate-600">
          Atualize sua foto de perfil para personalizar sua experiência em toda a
          plataforma.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {user.image ? (
            <Image
              src={user.image}
              alt={`Foto de ${displayName}`}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-slate-100 text-xl font-semibold text-slate-500">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-1 text-sm text-slate-700">
            <p>
              <strong>Nome:</strong> {displayName}
            </p>
            {user.email && (
              <p>
                <strong>E-mail:</strong> {user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      <ChangePhoto />
    </div>
  );
}
