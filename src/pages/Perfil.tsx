import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  Button,
  Card,
  Field,
  Input,
  Page,
  SectionTitle,
} from "@/components/ui";
import { useProfile, useUpdateProfile } from "@/hooks/useData";

export default function Perfil() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const name = profile?.full_name || user?.name || "";
    if (name && !fullName) setFullName(name);
    const savedCountry = profile?.country || "";
    if (savedCountry && !country) setCountry(savedCountry);
  }, [profile, user?.name, fullName, country]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">
        Cargando perfil...
      </div>
    );
  }

  const displayName = fullName || profile?.full_name || user?.name || "";
  const displayCountry = country || profile?.country || "";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await updateProfile.mutateAsync({
        full_name: displayName || undefined,
        country: displayCountry || undefined,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  return (
    <Page>
      <h1 className="shrink-0 text-lg font-semibold">Perfil</h1>

      {error ? (
        <p className="shrink-0 text-xs text-[var(--color-danger)]">{error}</p>
      ) : null}

      <SectionTitle>Datos de la cuenta</SectionTitle>
      <Card>
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nombre completo">
              <Input
                value={displayName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={profile?.full_name ?? ""}
              />
            </Field>
            <Field label="Email">
              <Input readOnly value={profile?.email ?? ""} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Pais">
              <Input
                value={displayCountry}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={profile?.country ?? ""}
              />
            </Field>
            <Field label="Tipo de cuenta">
              <Input readOnly value={profile?.account_type ?? "client"} />
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2">
            {saved ? (
              <span className="text-xs text-[var(--color-accent)]">Guardado</span>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              full
              className="sm:w-auto"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}
