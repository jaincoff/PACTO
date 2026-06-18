"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Heart,
  Phone,
  User,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getElderDetail,
  getStoredAuthToken,
  type ElderDetail,
} from "../../../lib/api";

const statusLabels: Record<string, string> = {
  in_progress: "Em acompanhamento",
  completed: "Concluido",
};

export default function ElderDynamicProfilePage() {
  const params = useParams<{ id: string }>();
  const elderId = params?.id;

  const [elder, setElder] = useState<ElderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadElder() {
      if (!elderId) {
        setError("ID do idoso inválido.");
        setLoading(false);
        return;
      }

      const token = getStoredAuthToken();
      if (!token) {
        setError("Sessao expirada. Inicie sessao novamente.");
        setLoading(false);
        return;
      }

      try {
        const payload = await getElderDetail(token, elderId);
        setElder(payload);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar perfil do idoso.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadElder();
  }, [elderId]);

  return (
    <div className="flex min-h-screen">
      <MobileHeader />
      <Sidebar activeItem="gerir" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
          <div className="flex items-center gap-4">
            <Link
              href="/gerir-idosos"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Perfil do Idoso
            </h1>
          </div>

          {loading ? (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6 text-sm text-muted-foreground">
                A carregar dados do idoso...
              </CardContent>
            </Card>
          ) : null}

          {!loading && error ? (
            <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
              <CardContent className="p-6 text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          ) : null}

          {!loading && elder ? (
            <>
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="space-y-4 p-6 lg:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">
                        {elder.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {elder.age ?? "-"} anos •{" "}
                        {statusLabels[elder.status] || elder.status}
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2 rounded-xl">
                      <Phone className="h-4 w-4" />
                      Contactar
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs uppercase text-muted-foreground">
                        Email
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {elder.email || "-"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs uppercase text-muted-foreground">
                        Telefone
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {elder.phone || "-"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4 sm:col-span-2">
                      <p className="text-xs uppercase text-muted-foreground">
                        Morada
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {elder.address || "-"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4 sm:col-span-2">
                      <p className="text-xs uppercase text-muted-foreground">
                        Resumo de Bem-Estar
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {elder.wellbeing_summary || "Sem resumo ainda."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardContent className="space-y-4 p-6 lg:p-8">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Respostas da Avaliação
                    </h3>
                  </div>

                  {elder.answers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Ainda não existem respostas registadas.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {elder.answers.map((answer) => (
                        <div
                          key={answer.question_id}
                          className="rounded-xl border border-border bg-background p-4"
                        >
                          <p className="text-sm font-medium text-foreground">
                            {answer.question_text}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Resposta: {answer.chosen_option}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Pontos: {answer.points}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Atualizado em{" "}
                    {new Date(elder.updated_at).toLocaleString("pt-PT")}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4 text-primary" />
                    Score total: {elder.total_score ?? "-"}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
