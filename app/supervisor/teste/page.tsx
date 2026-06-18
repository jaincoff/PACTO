"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Heart,
  Brain,
  Users,
  MessageCircle,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import {
  getSkillTestQuestions,
  getTestProgress,
  saveTestProgress,
  submitSkillTest,
  getCurrentUserProfile,
  getStoredAuthToken,
  getStoredAuthUser,
  type SkillTestQuestion,
  type SkillTestGroupedResponse,
  type SkillTestCategory,
  type TestProgressResponse,
  type SkillTestResult,
} from "../../../lib/api";

type Step = "overview" | "category" | "complete";

const categoryMeta: Record<
  string,
  { icon: LucideIcon; description: string }
> = {
  "bem-estar-psicologico": {
    icon: Heart,
    description:
      "Avalia energia, estabilidade emocional, satisfacao pessoal e bem-estar geral.",
  },
  "capacidade-compassiva": {
    icon: Brain,
    description:
      "Avalia a capacidade de reconhecer, compreender e aliviar o sofrimento humano.",
  },
  "habilidades-sociais": {
    icon: MessageCircle,
    description:
      "Avalia competencias de comunicacao, empatia e relacionamento interpessoal.",
  },
  "motivacoes-voluntariado": {
    icon: Users,
    description:
      "Avalia as motivacoes que influenciam a participacao em atividades de voluntariado.",
  },
};

const defaultCategoryMeta = {
  icon: Sparkles,
  description: "Avaliacao de competencias para o perfil.",
};

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  not_started: {
    label: "Nao iniciado",
    className: "bg-secondary text-muted-foreground",
  },
  in_progress: {
    label: "Em progresso",
    className: "bg-amber-100 text-amber-700",
  },
  completed: {
    label: "Concluido",
    className: "bg-green-100 text-green-700",
  },
};

export default function TestePage() {
  return (
    <Suspense fallback={null}>
      <TestePageContent />
    </Suspense>
  );
}

function TestePageContent() {
  const [grouped, setGrouped] = useState<SkillTestGroupedResponse | null>(null);
  const [progress, setProgress] = useState<TestProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SkillTestResult | null>(null);
  const [step, setStep] = useState<Step>("overview");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [categoryAnswers, setCategoryAnswers] = useState<Record<string, Record<string, string>>>({});

  const initialRedirectDone = useRef(false);
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const currentRole = useMemo(() => {
    const user = getStoredAuthUser();
    if (user?.role === "supervisor") return "supervisor" as const;
    return "volunteer" as const;
  }, []);

  const token = useMemo(() => getStoredAuthToken(), []);

  // Load questions and progress on mount
  useEffect(() => {
    async function load() {
      if (!token) {
        setError("Sessao expirada. Inicie sessao novamente.");
        setLoading(false);
        return;
      }

      try {
        const [questions, prog] = await Promise.all([
          getSkillTestQuestions(token, currentRole),
          getTestProgress(token, currentRole),
        ]);
        setGrouped(questions);
        setProgress(prog);

        // Restore answers from backend progress
        const allAnswers: Record<string, string> = {};
        for (const cat of prog.categories) {
          for (const [qId, optIdx] of Object.entries(cat.answers)) {
            allAnswers[qId] = String(optIdx + 1);
          }
        }
        setAnswers(allAnswers);

        // Jump to category from URL param or saved progress
        if (!initialRedirectDone.current && prog.categories.length > 0) {
          let targetCat: string | null = null;
          let startQuestion = 0;

          if (categoryParam) {
            const match = prog.categories.find(
              (c) => c.key === categoryParam && c.status !== "completed",
            );
            if (match) {
              targetCat = match.key;
              startQuestion = match.answered_count;
            }
          }

          if (!targetCat && prog.current_category) {
            const match = prog.categories.find(
              (c) => c.key === prog.current_category && c.status !== "completed",
            );
            if (match) {
              targetCat = match.key;
              startQuestion = match.answered_count;
            }
          }

          if (!targetCat) {
            const match = prog.categories.find(
              (c) => c.status !== "completed",
            );
            if (match) {
              targetCat = match.key;
              startQuestion = match.answered_count;
            }
          }

          if (targetCat) {
            setSelectedCategory(targetCat);
            setStep("category");
            setCurrentQuestion(startQuestion);
            initialRedirectDone.current = true;
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar teste.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentRole, token]);

  // Flatten questions for the current category
  const currentCategoryQuestions: SkillTestQuestion[] = useMemo(() => {
    if (!grouped || !selectedCategory) return [];
    const cat = grouped.categories.find((c) => c.key === selectedCategory);
    return cat ? cat.questions : [];
  }, [grouped, selectedCategory]);

  const currentCatMeta = useMemo(() => {
    if (!selectedCategory) return defaultCategoryMeta;
    return categoryMeta[selectedCategory] || defaultCategoryMeta;
  }, [selectedCategory]);

  const totalInCategory = currentCategoryQuestions.length;
  const catProgress =
    totalInCategory > 0
      ? ((currentQuestion + 1) / totalInCategory) * 100
      : 0;

  const canProceed = answers[String(currentCategoryQuestions[currentQuestion]?.id)] !== undefined;

  // Build category card data from local answers (NOT from backend progress)
  const categoryCards = useMemo(() => {
    if (!grouped) return [] as Array<SkillTestCategory & { meta: { icon: LucideIcon; description: string }; status: string; answered: number; total: number }>;

    return grouped.categories.map((cat) => {
      const meta = categoryMeta[cat.key] || defaultCategoryMeta;
      const catQIds = new Set(cat.questions.map((q) => String(q.id)));
      let answered = 0;
      for (const qId of catQIds) {
        if (answers[qId]) answered++;
      }

      let catStatus = "not_started";
      if (answered === cat.questions.length) catStatus = "completed";
      else if (answered > 0) catStatus = "in_progress";

      return {
        ...cat,
        meta,
        status: catStatus,
        answered,
        total: cat.questions.length,
      };
    });
  }, [grouped, answers]);

  const allCategoriesCompleted = useMemo(() => {
    if (!grouped) return false;
    return grouped.categories.every((cat) => {
      const catQIds = new Set(cat.questions.map((q) => String(q.id)));
      for (const qId of catQIds) {
        if (!answers[qId]) return false;
      }
      return true;
    });
  }, [grouped, answers]);

  // Collect backend-format answers for a category
  const collectCategoryAnswers = useCallback(
    (categoryQuestions: SkillTestQuestion[]): Record<string, number> => {
      const result: Record<string, number> = {};
      for (const [id, val] of Object.entries(answers)) {
        const isInCategory = categoryQuestions.some(
          (q) => String(q.id) === id,
        );
        if (isInCategory && val) {
          result[id] = Number(val) - 1;
        }
      }
      return result;
    },
    [answers],
  );

  // ── Handlers ──

  const handleCategorySelect = (catKey: string) => {
    const cat = grouped?.categories.find((c) => c.key === catKey);
    setSelectedCategory(catKey);
    // Count how many were already answered in this category
    let answered = 0;
    if (cat) {
      const ids = new Set(cat.questions.map((q) => String(q.id)));
      for (const qId of ids) {
        if (answers[qId]) answered++;
      }
    }
    setCurrentQuestion(answered);
    setStep("category");
  };

  const handleAnswerSelect = (value: string) => {
    const qId = String(currentCategoryQuestions[currentQuestion]?.id);
    if (!qId) return;
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleNextInCategory = () => {
    if (currentQuestion < totalInCategory - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevInCategory = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  // Save current category to backend and go back to overview
  const handleBackToOverview = async () => {
    if (selectedCategory && token) {
      const catAnswers = collectCategoryAnswers(currentCategoryQuestions);
      if (Object.keys(catAnswers).length > 0) {
        setLoading(true);
        try {
          const updated = await saveTestProgress(token, currentRole, {
            category: selectedCategory,
            answers: catAnswers,
          });
          setProgress(updated);
        } catch {
          // continue anyway
        } finally {
          setLoading(false);
        }
      }
    }
    setStep("overview");
    setSelectedCategory(null);
    setCurrentQuestion(0);
  };

  // Concluir Seccao: save to backend and go back to overview
  const handleCompleteCategory = async () => {
    if (selectedCategory && token) {
      const catAnswers = collectCategoryAnswers(currentCategoryQuestions);
      setLoading(true);
      try {
        const updated = await saveTestProgress(token, currentRole, {
          category: selectedCategory,
          answers: catAnswers,
        });
        setProgress(updated);

        // If backend auto-completed the test, refresh stored user status
        if (updated.categories.every((c) => c.status === "completed")) {
          try {
            const profile = await getCurrentUserProfile(token);
            const storedUser = getStoredAuthUser();
            if (storedUser && profile) {
              storedUser.status = profile.status;
              localStorage.setItem("auth_user", JSON.stringify(storedUser));
            }
          } catch {
            // silent — the Submit button will handle status update too
          }
        }
      } catch {
        // continue
      } finally {
        setLoading(false);
      }
    }
    setStep("overview");
    setSelectedCategory(null);
    setCurrentQuestion(0);
  };

  const handleSubmitTest = async () => {
    if (!token) {
      setError("Sessao expirada.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const allSubmitAnswers: Array<{
        question_id: number;
        chosen_option_index: number;
      }> = Object.entries(answers).map(([qId, val]) => ({
        question_id: Number(qId),
        chosen_option_index: Number(val) - 1,
      }));

      const payload = await submitSkillTest(
        token,
        currentRole,
        allSubmitAnswers,
      );
      setResult(payload);

      // Update localStorage user status so sidebar/UI reflects new status
      const storedUser = getStoredAuthUser();
      if (storedUser) {
        storedUser.status = payload.new_status;
        localStorage.setItem("auth_user", JSON.stringify(storedUser));
      }

      setStep("complete");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao submeter teste.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──

  return (
    <div className="flex min-h-screen">
      <MobileHeader />
      <Sidebar activeItem="teste" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-3xl p-4 lg:p-8">
          {/* ── Category Overview ── */}
          {step === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Avaliacao de Competencias
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Complete cada seccao da avaliacao. As suas respostas serao
                  guardadas quando voltar as seccoes ou concluir cada uma.
                </p>
              </div>

              {loading && !grouped ? (
                <p className="text-sm text-muted-foreground">
                  A carregar avaliacoes...
                </p>
              ) : null}
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              {/* Category Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                {categoryCards.map((cat) => {
                  const Icon = cat.meta.icon;
                  const status = statusConfig[cat.status] || statusConfig.not_started;
                  const isClickable = cat.status !== "completed";

                  return (
                    <Card
                      key={cat.key}
                      className={`border-border bg-card shadow-sm transition-all ${
                        isClickable
                          ? "cursor-pointer hover:shadow-md"
                          : "opacity-80"
                      }`}
                      onClick={() => isClickable && handleCategorySelect(cat.key)}
                    >
                      <CardContent className="flex flex-col p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <h3 className="mb-1 text-base font-semibold text-foreground">
                          {cat.label}
                        </h3>
                        <p className="mb-3 flex-1 text-xs leading-relaxed text-muted-foreground">
                          {cat.meta.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {cat.answered}/{cat.total} perguntas
                          </span>
                          {isClickable ? (
                            <Button
                              size="sm"
                              className="gap-1.5 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategorySelect(cat.key);
                              }}
                            >
                              {cat.status === "not_started"
                                ? "Iniciar"
                                : "Continuar"}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Submit all button */}
              {allCategoriesCompleted && (
                <div className="flex justify-center pt-4">
                  <Button
                    size="lg"
                    className="h-14 gap-2 rounded-xl px-10 text-base font-semibold"
                    onClick={handleSubmitTest}
                    disabled={loading}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    {loading ? "A submeter..." : "Submeter Avaliacao Completa"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Per-Category Question Flow ── */}
          {step === "category" && selectedCategory && (
            <div className="space-y-6">
              {/* Back to overview */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={handleBackToOverview}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar as seccoes
              </Button>

              {/* Category header */}
              <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-5 py-3">
                {(() => {
                  const Icon = currentCatMeta.icon;
                  return <Icon className="h-5 w-5 text-primary shrink-0" />;
                })()}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {grouped
                      ? `Seccao ${grouped.categories.findIndex((c) => c.key === selectedCategory) + 1} de ${grouped.categories.length}`
                      : ""}
                  </span>
                  <h2 className="text-base font-semibold text-foreground">
                    {currentCatMeta.label || selectedCategory}
                  </h2>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    Pergunta {currentQuestion + 1} de {totalInCategory}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(catProgress)}% concluido
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${catProgress}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              {currentCategoryQuestions[currentQuestion] && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 lg:p-8">
                    <div className="mb-8">
                      <p className="text-xl font-medium leading-relaxed text-foreground lg:text-2xl">
                        {currentCategoryQuestions[currentQuestion].question_text}
                      </p>
                    </div>

                    <RadioGroup
                      value={
                        answers[
                          String(currentCategoryQuestions[currentQuestion].id)
                        ] || ""
                      }
                      onValueChange={handleAnswerSelect}
                      className="space-y-3"
                    >
                      {(
                        currentCategoryQuestions[currentQuestion].options || []
                      ).map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                            answers[
                              String(
                                currentCategoryQuestions[currentQuestion].id,
                              )
                            ] === String(optionIndex + 1)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30 hover:bg-secondary/50"
                          }`}
                        >
                          <RadioGroupItem
                            value={String(optionIndex + 1)}
                            id={`option-${optionIndex + 1}`}
                            className="h-5 w-5 border-2"
                          />
                          <span className="text-base font-medium text-foreground">
                            {option.text}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 gap-2 rounded-xl px-6"
                  onClick={handlePrevInCategory}
                  disabled={currentQuestion === 0}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Button>

                {currentQuestion === totalInCategory - 1 ? (
                  <Button
                    size="lg"
                    className="h-12 gap-2 rounded-xl px-6"
                    onClick={handleCompleteCategory}
                    disabled={!canProceed}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir Seccao
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="h-12 gap-2 rounded-xl px-6"
                    onClick={handleNextInCategory}
                    disabled={!canProceed}
                  >
                    Seguinte
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── Completion ── */}
          {step === "complete" && (
            <div className="space-y-6">
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
                <CardContent className="p-8 lg:p-10">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>

                    <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
                      Obrigado pela sua participacao
                    </h1>

                    <p className="mb-8 max-w-md leading-relaxed text-muted-foreground">
                      {result?.message ||
                        "As suas respostas foram registadas com sucesso e serao analisadas pela equipa PACTO."}
                    </p>

                    <div className="mb-8 w-full max-w-sm rounded-xl border border-border bg-card p-6">
                      <div className="mb-3 flex items-center justify-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="text-lg font-semibold text-foreground">
                          Em Processamento
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        As suas respostas estao a ser analisadas. Sera notificado
                        quando forem revistas por um supervisor.
                      </p>
                    </div>

                    <Button
                      asChild
                      size="lg"
                      className="h-14 gap-3 rounded-xl px-8 text-base font-semibold"
                    >
                      <Link href="/painel">
                        Voltar ao Painel
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
