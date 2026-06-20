"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
  Camera,
  Heart,
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  LogOut,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import {
  clearAuthSession,
  type CurrentUserProfile,
  getCurrentUserProfile,
  getMyAssessmentResults,
  getStoredAuthToken,
  updateMyProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  type AssessmentResultsResponse,
} from "../../../lib/api";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function PerfilPage() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  //const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const [assessmentResults, setAssessmentResults] =
    useState<AssessmentResultsResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadResults() {
      const token = getStoredAuthToken();
      if (!token) return;
      try {
        const data = await getMyAssessmentResults(token);
        setAssessmentResults(data);
      } catch {
        // silently fail — results may not be available yet
      }
    }
    loadResults();
  }, []);

  const handleSave = async () => {
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
      setSaveMsg("Perfil atualizado.");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(
        err instanceof Error ? err.message : "Erro ao atualizar perfil.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getStoredAuthToken();
    if (!token) return;
    setPhotoUploading(true);
    try {
      const result = await uploadProfilePhoto(token, file);
      setProfile((prev) => prev ? { ...prev, photo: result.photo } : prev);
    } catch {
      // ignore
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePhotoDelete = async () => {
    const token = getStoredAuthToken();
    if (!token) return;
    setPhotoUploading(true);
    try {
      await deleteProfilePhoto(token);
      setProfile((prev) => prev ? { ...prev, photo: null } : prev);
    } catch {
      // ignore
    } finally {
      setPhotoUploading(false);
    }
  };

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

  return (
    <div className="flex min-h-screen">
      <MobileHeader />
      <Sidebar activeItem="perfil" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
          {/* Page Header */}
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
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <UserAvatar
                    photo={profile?.photo}
                    name={formData.nomeCompleto || "Voluntario"}
                    gender={formData.sexo}
                    size={112}
                  />
                  <div className="absolute -bottom-1 -right-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 disabled:opacity-50"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    {profile?.photo && (
                      <button
                        type="button"
                        onClick={handlePhotoDelete}
                        disabled={photoUploading}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-105 disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex flex-1 flex-col items-center gap-4 sm:items-start">
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-foreground lg:text-2xl">
                      {formData.nomeCompleto || "Utilizador PACTO"}
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
                    {saveMsg ? (
                      <p className={`mt-2 text-xs ${saveMsg.includes("Erro") ? "text-destructive" : "text-green-600"}`}>
                        {saveMsg}
                      </p>
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
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? "A guardar..." : "Guardar Alteracoes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Results */}
          {assessmentResults?.results &&
            Object.keys(assessmentResults.results).length > 0 && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Heart className="h-5 w-5 text-primary" />
                    Resultados das Avaliacoes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(assessmentResults.results).map(
                    ([key, result]) => {
                      const levelColor =
                        result.level === "elevado" ||
                        result.level === "elevada" ||
                        result.level === "elevadas"
                          ? "bg-green-100 text-green-700"
                          : result.level === "moderado" ||
                              result.level === "moderada" ||
                              result.level === "moderadas"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700";

                      return (
                        <div key={key} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">
                              {result.label || key}
                            </h3>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${levelColor}`}
                            >
                              {result.level}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Pontuacao
                              </span>
                              <span className="font-medium text-foreground">
                                {result.score}/{result.max} ({result.percentage}
                                %)
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-secondary">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  result.percentage >= 75
                                    ? "bg-green-500"
                                    : result.percentage >= 50
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${result.percentage}%` }}
                              />
                            </div>
                          </div>

                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {result.interpretation}
                          </p>

                          {/* Radar chart for dimensions */}
                          {result.dimensions &&
                            Object.keys(result.dimensions).length > 0 && (
                              <div className="rounded-xl border border-border bg-secondary/20 p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                  Dimensoes
                                </p>
                                <ResponsiveContainer width="100%" height={220}>
                                  <RadarChart
                                    data={Object.entries(result.dimensions).map(
                                      ([dk, dv]) => ({
                                        dimension: dv.label || dk,
                                        value: dv.average,
                                        fullMark: 5,
                                      }),
                                    )}
                                  >
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis
                                      dataKey="dimension"
                                      tick={{
                                        fontSize: 10,
                                        fill: "#6b7280",
                                      }}
                                    />
                                    <PolarRadiusAxis
                                      domain={[0, 5]}
                                      tick={{ fontSize: 9, fill: "#9ca3af" }}
                                    />
                                    <Radar
                                      name="Pontuacao"
                                      dataKey="value"
                                      stroke="#e6842d"
                                      fill="#e6842d"
                                      fillOpacity={0.3}
                                    />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                        </div>
                      );
                    },
                  )}
                </CardContent>
              </Card>
            )}

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

          {/* Spacer for mobile */}
          <div className="h-4" />
        </div>
      </main>
    </div>
  );
}
