"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin-mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera,
  Heart,
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  clearAuthSession,
  type CurrentUserProfile,
  getCurrentUserProfile,
  getStoredAuthToken,
  updateMyProfile,
} from "../../../lib/api";

export default function AdminPerfilPage() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    nomeCompleto: "",
    email: "",
    telemovel: "",
    anoNascimento: "",
    sexo: "Prefiro nao dizer",
  });

  useEffect(() => {
    async function loadProfile() {
      const token = getStoredAuthToken();
      if (!token) {
        setError("Sessao expirada. Inicie sessao novamente.");
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUserProfile(token);
        setProfile(data);
        setFormData((current) => ({
          ...current,
          nomeCompleto: data.name,
          email: data.email,
          telemovel: data.phone || "",
          anoNascimento: data.birth_year ? data.birth_year.toString() : "",
          sexo: data.gender || "Prefiro nao dizer",
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar perfil.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const roleLabel = useMemo(() => {
    switch (profile?.role) {
      case "admin":
        return "Administrador";
      case "elder":
        return "Idoso";
      case "supervisor":
        return "Supervisor";
      case "volunteer":
      default:
        return "Voluntario";
    }
  }, [profile]);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");
    const token = getStoredAuthToken();
    if (!token) return;

    setSaving(true);
    try {
      const updated = await updateMyProfile(token, {
        name: formData.nomeCompleto,
        email: formData.email,
        phone: formData.telemovel || undefined,
        birth_year: formData.anoNascimento ? parseInt(formData.anoNascimento) : undefined,
        gender: formData.sexo !== "Prefiro nao dizer" ? formData.sexo : undefined,
      });
      setProfile(updated);
      setSuccess("Perfil atualizado com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao guardar alteracoes.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminMobileHeader />
      <AdminSidebar activeItem="perfil" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
          <div className="mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Meu Perfil
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie as suas informacoes pessoais e preferencias da conta.
            </p>
          </div>

          {/* Profile Summary Card */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6 lg:p-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <div className="relative">
                  <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-primary/20">
                    <Image
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
                      alt={`Foto de perfil de ${formData.nomeCompleto || "administrador"}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-1 flex-col items-center gap-4 sm:items-start">
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-foreground lg:text-2xl">
                      {formData.nomeCompleto || "Administrador PACTO"}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      <User className="h-3.5 w-3.5" />
                      {roleLabel}
                    </span>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {profile?.created_at
                        ? `Membro desde ${new Date(profile.created_at).toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}`
                        : "Membro PACTO"}
                    </p>
                    {loading ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        A carregar dados...
                      </p>
                    ) : null}
                    {!loading && error ? (
                      <p className="mt-2 text-xs text-destructive">{error}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5 text-primary" />
                Informacoes Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {success ? (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </div>
              ) : null}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="nomeCompleto"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nome Completo
                  </Label>
                  <Input
                    id="nomeCompleto"
                    value={formData.nomeCompleto}
                    onChange={(e) =>
                      setFormData({ ...formData, nomeCompleto: e.target.value })
                    }
                    className="h-12 rounded-xl border-input bg-background focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-12 rounded-xl border-input bg-background focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="telemovel"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Telemovel
                  </Label>
                  <Input
                    id="telemovel"
                    value={formData.telemovel}
                    onChange={(e) =>
                      setFormData({ ...formData, telemovel: e.target.value })
                    }
                    className="h-12 rounded-xl border-input bg-background focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="anoNascimento"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Ano de Nascimento
                  </Label>
                  <Input
                    id="anoNascimento"
                    value={formData.anoNascimento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        anoNascimento: e.target.value,
                      })
                    }
                    className="h-12 rounded-xl border-input bg-background focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Genero
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {["Masculino", "Feminino", "Prefiro nao dizer"].map(
                      (option) => (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all ${
                            formData.sexo === option
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:bg-secondary/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="sexo"
                            value={option}
                            checked={formData.sexo === option}
                            onChange={(e) =>
                              setFormData({ ...formData, sexo: e.target.value })
                            }
                            className="sr-only"
                          />
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                              formData.sexo === option
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {formData.sexo === option && (
                              <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{option}</span>
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? "A guardar..." : "Guardar Alteracoes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Lock className="h-5 w-5 text-primary" />
                Seguranca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-1 sm:max-w-md">
                <div className="space-y-2">
                  <Label
                    htmlFor="currentPassword"
                    className="text-sm font-medium"
                  >
                    Palavra-passe Atual
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-input bg-background pr-12 focus:border-primary focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    Nova Palavra-passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-input bg-background pr-12 focus:border-primary focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Confirmar Nova Palavra-passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-input bg-background pr-12 focus:border-primary focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                  Alterar Palavra-passe
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Appreciation */}
          <Card className="border-border bg-gradient-to-r from-primary/5 to-primary/10 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Obrigado por fazer parte do PACTO
                </h3>
                <p className="text-sm text-muted-foreground">
                  A sua dedicacao ajuda a criar uma comunidade mais humana,
                  inclusiva e solidaria.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="h-4" />
        </div>
      </main>
    </div>
  );
}
