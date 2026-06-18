"use client";

import { useEffect, useMemo, useState } from "react";
import { SupervisorSidebar } from "@/components/supervisor-sidebar";
import { SupervisorMobileHeader } from "@/components/supervisor-mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  User,
  Mail,
  LogOut,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  clearAuthSession,
  getCurrentUserProfile,
  getMyAssessmentResults,
  getStoredAuthToken,
  updateMyProfile,
  type AssessmentResultsResponse,
  type CurrentUserProfile,
} from "../../../lib/api";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

export default function SupervisorPerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [assessmentResults, setAssessmentResults] =
    useState<AssessmentResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nomeCompleto: "",
    email: "",
  });

  useEffect(() => {
    async function load() {
      const token = getStoredAuthToken();
      if (!token) return;
      setLoading(true);
      try {
        const [prof, results] = await Promise.all([
          getCurrentUserProfile(token),
          getMyAssessmentResults(token),
        ]);
        setProfile(prof);
        setAssessmentResults(results);
        setFormData({ nomeCompleto: prof.name, email: prof.email });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar perfil.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    const token = getStoredAuthToken();
    if (!token) return;
    setSaving(true);
    try {
      await updateMyProfile(token, {
        name: formData.nomeCompleto,
        email: formData.email,
      });
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

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  const roleLabel = useMemo(() => {
    switch (profile?.role) {
      case "admin":
        return "Administrador";
      case "supervisor":
        return "Supervisor";
      case "elder":
        return "Idoso";
      default:
        return "Voluntario";
    }
  }, [profile?.role]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <SupervisorMobileHeader />
        <SupervisorSidebar activeItem="" />
        <main className="flex-1 pt-16 lg:pt-0 flex items-center justify-center">
          <p className="text-muted-foreground">A carregar perfil...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SupervisorMobileHeader />
      <SupervisorSidebar activeItem="" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Meu Perfil
            </h1>
            <p className="mt-2 text-muted-foreground">
              Gira as suas informacoes pessoais e visualize os resultados das
              suas avaliacoes.
            </p>
            {error ? (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            ) : null}
            {saveMsg ? (
              <p
                className={`mt-2 text-sm ${saveMsg.includes("Erro") ? "text-destructive" : "text-green-600"}`}
              >
                {saveMsg}
              </p>
            ) : null}
          </div>

          {/* Profile Summary */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex items-center gap-6 p-6">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-primary/20">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face"
                  alt="Foto de perfil"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {profile?.name || "Utilizador PACTO"}
                </h2>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {roleLabel}
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Membro desde{" "}
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("pt-PT")
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5 text-primary" />
                Informacoes Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nomeCompleto}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeCompleto: e.target.value })
                  }
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="rounded-xl"
                  onClick={handleSave}
                  disabled={saving}
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
                      if (key === "capacidade-supervisao") return null;
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

                          {result.dimensions &&
                            Object.keys(result.dimensions).length > 0 && (
                              <div className="rounded-xl border border-border bg-secondary/20 p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                  Dimensoes
                                </p>
                                <ResponsiveContainer width="100%" height={220}>
                                  <RadarChart
                                    data={Object.entries(
                                      result.dimensions,
                                    ).map(([dk, dv]) => ({
                                      dimension: dv.label || dk,
                                      value: dv.average,
                                      fullMark: 5,
                                    }))}
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

          {/* Account */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Lock className="h-5 w-5 text-primary" />
                Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Terminar Sessao
              </Button>
            </CardContent>
          </Card>

          {/* Bottom */}
          <Card className="border-border bg-gradient-to-r from-primary/5 to-transparent shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <Heart className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  O seu trabalho faz a diferenca.
                </p>
                <p className="text-sm text-muted-foreground">
                  Obrigado por coordenar e apoiar o programa PACTO.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
