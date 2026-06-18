"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  User,
  Clock,
  XCircle,
} from "lucide-react";
import { SupervisorSidebar } from "@/components/supervisor-sidebar";
import { SupervisorMobileHeader } from "@/components/supervisor-mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getVolunteerTestDetail,
  approveVolunteer,
  getStoredAuthToken,
  type VolunteerTestDetail,
} from "../../../../lib/api";

export default function VolunteerTestDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [detail, setDetail] = useState<VolunteerTestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    async function load() {
      const token = getStoredAuthToken();
      if (!token) {
        setError("Sessao expirada.");
        setLoading(false);
        return;
      }

      try {
        const data = await getVolunteerTestDetail(token, userId);
        setDetail(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar detalhes do teste.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  const handleApprove = async () => {
    const token = getStoredAuthToken();
    if (!token) return;

    setApproving(true);
    try {
      await approveVolunteer(token, userId);
      setApproved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao aprovar.",
      );
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <SupervisorMobileHeader />
      <SupervisorSidebar activeItem="voluntarios" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
          {/* Back */}
          <div className="flex items-center gap-3">
            <Link href="/supervisor/voluntarios">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Voltar a lista
              </Button>
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : detail ? (
            <>
              {/* Volunteer header */}
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-foreground">
                          {detail.user_name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {detail.user_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Score badge */}
                      <div className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">
                        Pontuacao: {detail.score} / {detail.max_score}{" "}
                        ({detail.max_score > 0
                          ? Math.round(
                              (detail.score / detail.max_score) * 100,
                            )
                          : 0}
                        %)
                      </div>
                      <div
                        className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                          detail.passed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {detail.passed ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Aprovado ({detail.passing_score}% min.)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Reprovado ({detail.passing_score}% min.)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Approve button */}
                  <div className="mt-4 flex justify-end">
                    {approved ? (
                      <div className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        Voluntario aprovado com sucesso!
                      </div>
                    ) : (
                      <Button
                        size="lg"
                        className="gap-2 rounded-xl"
                        onClick={handleApprove}
                        disabled={approving}
                      >
                        <CheckCircle className="h-5 w-5" />
                        {approving ? "A aprovar..." : "Aprovar Voluntario"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Answers section */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Respostas do Teste
                </h2>
                <div className="space-y-3">
                  {detail.answers.map((answer) => (
                    <Card
                      key={answer.question_id}
                      className="border-border bg-card shadow-sm"
                    >
                      <CardContent className="p-5">
                        <p className="mb-3 text-base font-medium text-foreground">
                          {answer.question_text}
                        </p>
                        {answer.chosen_option_index >= 0 ? (
                          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                            <span className="text-sm text-foreground">
                              <span className="font-medium">Resposta: </span>
                              {answer.chosen_text}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">
                              {answer.points} / {answer.max_points} pts
                            </span>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                            Sem resposta
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {/* Bottom */}
          <Card className="border-border bg-gradient-to-r from-primary/5 to-transparent shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <Clock className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  Reveja com atencao.
                </p>
                <p className="text-sm text-muted-foreground">
                  As respostas do teste refletem o nivel de preparacao do
                  voluntario para apoiar os idosos do programa PACTO.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
