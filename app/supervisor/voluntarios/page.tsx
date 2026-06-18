"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Eye,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Heart,
} from "lucide-react";
import { SupervisorSidebar } from "@/components/supervisor-sidebar";
import { SupervisorMobileHeader } from "@/components/supervisor-mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  listVolunteersWithElders,
  getVolunteerAssessmentResults,
  getStoredAuthToken,
  type VolunteerWithElders,
  type AssessmentResultsResponse,
} from "../../../lib/api";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

export default function SupervisorVoluntariosPage() {
  const [volunteers, setVolunteers] = useState<VolunteerWithElders[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedResults, setExpandedResults] = useState<string | null>(null);
  const [volunteerResults, setVolunteerResults] =
    useState<AssessmentResultsResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    async function load() {
      const token = getStoredAuthToken();
      if (!token) {
        setError("Sessao expirada.");
        setLoading(false);
        return;
      }
      try {
        const data = await listVolunteersWithElders(token);
        setVolunteers(data.volunteers);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleViewResults = async (userId: string) => {
    if (expandedResults === userId) {
      setExpandedResults(null);
      setVolunteerResults(null);
      return;
    }
    setExpandedResults(userId);
    const token = getStoredAuthToken();
    if (!token) return;
    setLoadingDetail(true);
    try {
      const results = await getVolunteerAssessmentResults(token, userId);
      setVolunteerResults(results);
    } catch {
      setVolunteerResults(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <SupervisorMobileHeader />
      <SupervisorSidebar activeItem="voluntarios" />
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
          <Link href="/supervisor/painel">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Voluntarios
            </h1>
            <p className="mt-2 text-muted-foreground">
              Todos os voluntarios ativos e os seus idosos atribuidos.
            </p>
            {loading ? (
              <p className="mt-2 text-sm text-muted-foreground">A carregar...</p>
            ) : null}
            {error ? (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <div className="space-y-4">
            {volunteers.map((volunteer) => {
              const isExpanded = expandedResults === volunteer.id;
              return (
                <Card key={volunteer.id} className="border-border bg-card shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {volunteer.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {volunteer.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {volunteer.elders_count} idoso(s)
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 rounded-lg"
                          onClick={() => handleViewResults(volunteer.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" /> Fechar
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" /> Ver Resultados
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Elders */}
                    {volunteer.elders.length > 0 && (
                      <div className="mt-3 border-t border-border pt-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Idosos atribuidos:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {volunteer.elders.map((elder) => (
                            <span
                              key={elder.id}
                              className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground"
                            >
                              {elder.name}
                              {elder.age ? ` (${elder.age}a)` : ""} —{" "}
                              {elder.status === "completed"
                                ? "Concluido"
                                : "Em progresso"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assessment results */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-border pt-4">
                        {loadingDetail ? (
                          <p className="text-sm text-muted-foreground">
                            A carregar...
                          </p>
                        ) : volunteerResults?.results ? (
                          <div className="space-y-4">
                            {Object.entries(volunteerResults.results).map(
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
                                  <div key={key}>
                                    <div className="mb-1 flex items-center justify-between">
                                      <span className="text-sm font-medium">
                                        {result.label}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">
                                          {result.score}/{result.max} (
                                          {result.percentage}%)
                                        </span>
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColor}`}
                                        >
                                          {result.level}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mb-2 h-1.5 rounded-full bg-secondary">
                                      <div
                                        className={`h-full rounded-full ${
                                          result.percentage >= 75
                                            ? "bg-green-500"
                                            : result.percentage >= 50
                                              ? "bg-amber-500"
                                              : "bg-red-500"
                                        }`}
                                        style={{
                                          width: `${result.percentage}%`,
                                        }}
                                      />
                                    </div>
                                    {result.dimensions &&
                                      Object.keys(result.dimensions).length >
                                        0 && (
                                        <div className="mb-3 rounded-lg bg-secondary/20 p-2">
                                          <ResponsiveContainer
                                            width="100%"
                                            height={140}
                                          >
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
                                                  fontSize: 9,
                                                  fill: "#6b7280",
                                                }}
                                              />
                                              <PolarRadiusAxis
                                                domain={[0, 5]}
                                                tick={{
                                                  fontSize: 8,
                                                  fill: "#9ca3af",
                                                }}
                                              />
                                              <Radar
                                                dataKey="value"
                                                stroke="#e6842d"
                                                fill="#e6842d"
                                                fillOpacity={0.2}
                                              />
                                            </RadarChart>
                                          </ResponsiveContainer>
                                        </div>
                                      )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Nenhum resultado de avaliacao.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {!loading && volunteers.length === 0 && (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <Heart className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium text-foreground">
                    Nenhum voluntario ativo
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
