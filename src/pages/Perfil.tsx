import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  Button,
  Card,
  Field,
  Input,
  Page,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import {
  useMyBusinesses,
  useProfile,
  useUpdateBusiness,
  useUpdateProfile,
} from "@/hooks/useData";
import { resolveAccountType } from "@/lib/user";

export default function Perfil() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: myBusinesses = [] } = useMyBusinesses();
  const business = myBusinesses[0];
  const updateBusiness = useUpdateBusiness();

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);
  const [businessSaved, setBusinessSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessError, setBusinessError] = useState<string | null>(null);

  const isBusiness = resolveAccountType(profile, myBusinesses) === "business";

  useEffect(() => {
    const name = profile?.full_name || user?.name || "";
    if (name && !fullName) setFullName(name);
    const savedCountry = profile?.country || "";
    if (savedCountry && !country) setCountry(savedCountry);
  }, [profile, user?.name, fullName, country]);

  useEffect(() => {
    if (!business) return;
    setCategory(business.category);
    setDescription(business.description ?? "");
  }, [business?.id, business?.category, business?.description]);

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

  async function handleBusinessSave(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    setBusinessError(null);
    setBusinessSaved(false);
    try {
      await updateBusiness.mutateAsync({
        businessId: business.id,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
      });
      setBusinessSaved(true);
    } catch (err) {
      setBusinessError(
        err instanceof Error ? err.message : "Error al guardar comercio",
      );
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

      {isBusiness && business ? (
        <>
          {businessError ? (
            <p className="shrink-0 text-xs text-[var(--color-danger)]">
              {businessError}
            </p>
          ) : null}
          <SectionTitle>Perfil del comercio</SectionTitle>
          <Card>
            <form className="space-y-4" onSubmit={handleBusinessSave}>
              <Field label="Nombre del comercio">
                <Input readOnly value={business.name} />
              </Field>
              <Field label="Categoria">
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej. moda, electronica, alimentos"
                />
              </Field>
              <Field label="Descripcion">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cuenta que vende tu tienda y que la hace unica"
                  rows={4}
                />
              </Field>
              <div className="flex items-center justify-end gap-2">
                {businessSaved ? (
                  <span className="text-xs text-[var(--color-accent)]">
                    Guardado
                  </span>
                ) : null}
                <Button
                  type="submit"
                  variant="primary"
                  full
                  className="sm:w-auto"
                  disabled={updateBusiness.isPending}
                >
                  {updateBusiness.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </Card>
        </>
      ) : null}
    </Page>
  );
}
