"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Brain,
  Users,
  MessageCircle,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import {
  getSkillTestQuestions,
  getTestProgress,
  saveTestProgress,
  getMyAssessmentResults,
  getCurrentUserProfile,
  getStoredAuthToken,
  getStoredAuthUser,
  getDashboardRouteForRole,
  type SkillTestQuestion,
  type SkillTestGroupedResponse,
  type SkillTestCategory,
  type TestProgressResponse,
  type TestProgressCategory,
  type AssessmentResultsResponse,
} from "../../../lib/api";

type Step = "overview" | "category";

const categoryMeta: Record<string, { icon: LucideIcon; description: string }> =
  {
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

const statusConfig: Record<string, { label: string; className: string }> = {
  not_started: {
    label: "Nao iniciado",
    className: "bg-secondary text-muted-foreground",
  },
  in_progress: {
    label: "Em progresso",
    className: "bg-amber-100 text-amber-700",
  },
  completed: { label: "Concluido", className: "bg-green-100 text-green-700" },
};

interface InstructionItem {
  key: string;
  label: string;
}

const categoryInstructions: Record<string, InstructionItem[]> = {
  "capacidade-compassiva": [
    { key: "1", label: "Nunca" },
    { key: "2", label: "Raramente" },
    { key: "3", label: "Algumas vezes" },
    { key: "4", label: "Frequentemente" },
    { key: "5", label: "Sempre" },
  ],
  "motivacoes-voluntariado": [
    { key: "1", label: "Discordo Totalmente" },
    { key: "2", label: "Discordo" },
    { key: "3", label: "Discordo Parcialmente" },
    { key: "4", label: "Neutro" },
    { key: "5", label: "Concordo Parcialmente" },
    { key: "6", label: "Concordo" },
    { key: "7", label: "Concordo Totalmente" },
  ],
  "habilidades-sociais": [
    { key: "1", label: "Raramente" },
    { key: "2", label: "Pouco Frequente" },
    { key: "3", label: "Frequente" },
    { key: "4", label: "Muito Frequente" },
    { key: "5", label: "Quase Sempre" },
  ],
};

// function extractPerQuestionInstructions(questions: SkillTestQuestion[]): Record<string, InstructionItem[]> {
//   const map: Record<string, InstructionItem[]> = {};
//   for (const q of questions) {
//     if (!q.options || q.options.length === 0) continue;
//     const items: InstructionItem[] = q.options.map((opt, i) => ({
//       key: String(i + 1),
//       label: opt.text,
//     }));
//     map[String(q.id)] = items;
//   }
//   return map;
// }

export default function AvaliacoesPage() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState("");
  const isUnderReview =
    userStatus === "pending_approval" ||
    userStatus === "pending_admin_approval" ||
    userStatus === "active";

  const [grouped, setGrouped] = useState<SkillTestGroupedResponse | null>(null);
  const [progress, setProgress] = useState<TestProgressResponse | null>(null);
  const [results, setResults] = useState<AssessmentResultsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState<Step>("overview");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // const [perQuestionInstructions, setPerQuestionInstructions] = useState<Record<string, InstructionItem[]>>({});

  const currentRole = useMemo(() => {
    const user = getStoredAuthUser();
    if (user?.role === "supervisor") return "supervisor" as const;
    return "volunteer" as const;
  }, []);

  const token = useMemo(() => getStoredAuthToken(), []);

  useEffect(() => {
    const user = getStoredAuthUser();
    setUserStatus(user?.status || "");
  }, []);

  useEffect(() => {
    async function load() {
      if (!token) {
        setError("Sessao expirada.");
        setLoading(false);
        return;
      }
      const stored = getStoredAuthUser();
      const storedStatus = stored?.status || "";
      const underReview =
        storedStatus === "pending_approval" ||
        storedStatus === "pending_admin_approval" ||
        storedStatus === "active";
      if (underReview) {
        try {
          const data = await getMyAssessmentResults(token);
          setResults(data);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Falha ao carregar resultados.",
          );
        } finally {
          setLoading(false);
        }
        return;
      }
      try {
        const [questions, prog] = await Promise.all([
          getSkillTestQuestions(token, currentRole),
          getTestProgress(token, currentRole),
        ]);
        setGrouped(questions);
        setProgress(prog);
        const saved: Record<string, string> = {};
        for (const cat of prog.categories) {
          for (const [qId, idx] of Object.entries(cat.answers)) {
            saved[qId] = String(idx + 1);
          }
        }
        setAnswers(saved);

        for (const cat of questions.categories) {
          if (cat.key === "bem-estar-psicologico") {
            // setPerQuestionInstructions(extractPerQuestionInstructions(cat.questions));
            break;
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar avaliacoes.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentRole, token]);

  const currentCategoryQuestions: SkillTestQuestion[] = useMemo(() => {
    if (!grouped || !selectedCategory) return [];
    return (
      grouped.categories.find((c) => c.key === selectedCategory)?.questions ||
      []
    );
  }, [grouped, selectedCategory]);

  const currentCatMeta = useMemo(() => {
    if (!selectedCategory) return defaultCategoryMeta;
    return categoryMeta[selectedCategory] || defaultCategoryMeta;
  }, [selectedCategory]);

  const currentCatInstructions: InstructionItem[] = useMemo(() => {
    if (!selectedCategory) return [];
    return categoryInstructions[selectedCategory] || [];
  }, [selectedCategory]);

  const answeredCount = useMemo(() => {
    return currentCategoryQuestions.filter((q) => !!answers[String(q.id)])
      .length;
  }, [currentCategoryQuestions, answers]);

  const totalInCategory = currentCategoryQuestions.length;
  const catProgress =
    totalInCategory > 0 ? (answeredCount / totalInCategory) * 100 : 0;

  const assessments = useMemo(() => {
    if (!grouped || !progress)
      return [] as Array<
        SkillTestCategory & {
          status: string;
          answered: number;
          total: number;
          meta: { icon: LucideIcon; description: string };
          progCat: TestProgressCategory | undefined;
        }
      >;
    return grouped.categories.map((cat) => {
      const prog = progress.categories.find((c) => c.key === cat.key);
      const meta = categoryMeta[cat.key] || defaultCategoryMeta;
      return {
        ...cat,
        status: prog?.status || "not_started",
        answered: prog?.answered_count || 0,
        total: cat.questions.length,
        meta,
        progCat: prog,
      };
    });
  }, [grouped, progress]);

  const collectCategoryAnswers = useCallback(
    (qs: SkillTestQuestion[]): Record<string, number> => {
      const r: Record<string, number> = {};
      for (const [id, val] of Object.entries(answers)) {
        if (qs.some((q) => String(q.id) === id) && val) r[id] = Number(val) - 1;
      }
      return r;
    },
    [answers],
  );

  // const isBemEstar = selectedCategory === "bem-estar-psicologico";

  // --- Handlers ---
  const handleCategorySelect = (catKey: string) => {
    setSelectedCategory(catKey);
    setStep("category");
  };

  const refreshStoredStatus = async () => {
    if (!token) return;
    try {
      const profile = await getCurrentUserProfile(token);
      setUserStatus(profile.status);
      const stored = getStoredAuthUser();
      if (stored) {
        localStorage.setItem(
          "auth_user",
          JSON.stringify({ ...stored, status: profile.status }),
        );
      }
    } catch {}
  };

  const handleAnswerSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (token && selectedCategory) {
      setSaving(true);
      const catAnswers: Record<string, number> = {};
      const qs = currentCategoryQuestions;
      for (const [id, val] of Object.entries({
        ...answers,
        [questionId]: value,
      })) {
        if (qs.some((q) => String(q.id) === id) && val)
          catAnswers[id] = Number(val) - 1;
      }
      saveTestProgress(token, currentRole, {
        category: selectedCategory,
        answers: catAnswers,
      })
        .then((upd) => {
          setProgress(upd);
          refreshStoredStatus();
        })
        .catch(() => {})
        .finally(() => setSaving(false));
    }
  };

  const handleConcluirSeccao = async () => {
    if (selectedCategory && token) {
      const catAnswers = collectCategoryAnswers(currentCategoryQuestions);
      if (Object.keys(catAnswers).length > 0) {
        const alreadyDone = progress?.categories.every(
          (c) => c.status === "completed",
        );
        let result = progress;
        if (!alreadyDone) {
          setLoading(true);
          try {
            result = await saveTestProgress(token, currentRole, {
              category: selectedCategory,
              answers: catAnswers,
            });
            setProgress(result);
          } catch {
          } finally {
            setLoading(false);
          }
        }
        await refreshStoredStatus();
        if (result?.categories.every((c) => c.status === "completed")) {
          const user = getStoredAuthUser();
          router.replace(getDashboardRouteForRole(user?.role || currentRole));
          return;
        }
      }
      await refreshStoredStatus();
    }
    setStep("overview");
    setSelectedCategory(null);
  };

  return (
    <div className="flex min-h-screen">
      <MobileHeader />
      <Sidebar activeItem="avaliacoes" />
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-5xl space-y-8 p-4 lg:p-8">
          {/* ── OVERVIEW ── */}
          {step === "overview" && !isUnderReview && (
            <>
              <div>
                <h1 className="text-3xl font-bold">Avaliacoes</h1>
                <p className="mt-2 text-muted-foreground">
                  Complete as avaliacoes do seu percurso enquanto voluntario
                  PACTO.
                </p>
                {loading && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    A carregar...
                  </p>
                )}
                {error && (
                  <p className="mt-2 text-sm text-destructive">{error}</p>
                )}
              </div>
              <Card className="border-border bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Avaliacoes do Voluntario
                    </h2>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      As avaliacoes permitem acompanhar o seu desenvolvimento
                      pessoal, bem-estar, capacidade compassiva e competencias.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-6 md:grid-cols-2">
                {assessments.map((a) => {
                  const Icon = a.meta.icon;
                  const status =
                    statusConfig[a.status] || statusConfig.not_started;
                  const isComp = a.status === "completed";
                  const hasProg = a.answered > 0;
                  return (
                    <Card
                      key={a.key}
                      className={`border-border bg-card shadow-sm ${!isComp ? "cursor-pointer hover:shadow-md" : ""}`}
                    >
                      <CardContent className="flex flex-col p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                            <Icon className="h-7 w-7 text-primary" />
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">
                          {a.label}
                        </h3>
                        {isComp && a.progCat?.interpretation ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Pontuacao
                              </span>
                              <span className="font-medium">
                                {a.progCat.score}/{a.progCat.max_score} (
                                {a.progCat.percentage}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-secondary">
                              <div
                                className={`h-full rounded-full ${(a.progCat.percentage || 0) >= 75 ? "bg-green-500" : (a.progCat.percentage || 0) >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{
                                  width: `${a.progCat.percentage || 0}%`,
                                }}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {a.progCat.interpretation}
                            </p>
                            <span className="text-sm font-medium text-green-600">
                              Completo
                            </span>
                          </div>
                        ) : (
                          <>
                            <p className="mb-4 flex-1 text-sm text-muted-foreground">
                              {a.meta.description}
                            </p>
                            {a.total > 0 && (
                              <div className="mb-4 h-1.5 rounded-full bg-secondary">
                                <div
                                  className={`h-full rounded-full ${isComp ? "bg-green-500" : "bg-primary"}`}
                                  style={{
                                    width: `${Math.round((a.answered / a.total) * 100)}%`,
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {a.answered}/{a.total} perguntas
                              </span>
                              {isComp ? (
                                <span className="text-sm font-medium text-green-600">
                                  Completo
                                </span>
                              ) : (
                                <Button
                                  className="gap-2 rounded-xl"
                                  onClick={() => handleCategorySelect(a.key)}
                                >
                                  {hasProg ? "Continuar" : "Iniciar Avaliacao"}
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                <Card className="border-border bg-card opacity-70 shadow-sm">
                  <CardContent className="flex flex-col p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                        <Sparkles className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        Disponivel em breve
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      Valores de Vida
                    </h3>
                    <p className="mb-4 flex-1 text-sm text-muted-foreground">
                      Avalia valores pessoais e significado atribuido ao
                      voluntariado.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Em desenvolvimento
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        Brevemente
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* ── RESULTS (under review / active) ── */}
          {step === "overview" && isUnderReview && results?.results && (
            <div>
              <h1 className="text-3xl font-bold">Avaliacoes</h1>
              <p className="mt-2 text-muted-foreground">
                Resultados das suas avaliacoes de competencias.
              </p>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {Object.entries(results.results).map(([key, r]) => {
                  const meta = categoryMeta[key] || defaultCategoryMeta;
                  const levelColor =
                    r.level === "elevado" ||
                    r.level === "elevada" ||
                    r.level === "elevadas"
                      ? "bg-green-100 text-green-700"
                      : r.level === "moderado" ||
                          r.level === "moderada" ||
                          r.level === "moderadas"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700";
                  return (
                    <Card key={key} className="border-border bg-card shadow-sm">
                      <CardContent className="flex flex-col p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                            {meta.icon && (
                              <meta.icon className="h-7 w-7 text-primary" />
                            )}
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${levelColor}`}
                          >
                            {r.level}
                          </span>
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">
                          {r.label || key}
                        </h3>
                        <div className="mb-3 space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Pontuacao
                            </span>
                            <span className="font-medium">
                              {r.score}/{r.max} ({r.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary">
                            <div
                              className={`h-full rounded-full ${r.percentage >= 75 ? "bg-green-500" : r.percentage >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${r.percentage}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {r.interpretation}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── INLINE CATEGORY QUESTIONS ── */}
          {step === "category" && selectedCategory && (
            <div className="mx-auto max-w-3xl space-y-6">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={handleConcluirSeccao}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar as seccoes
              </Button>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  {(() => {
                    const Icon = currentCatMeta.icon;
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                </div>
                <div>
                  <h1 className="text-xl font-bold lg:text-2xl">
                    {currentCatMeta.label || selectedCategory}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {currentCatMeta.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <span className="rounded-full bg-secondary px-4 py-2 text-sm font-medium">
                  {totalInCategory} Perguntas
                </span>
                <span className="rounded-full bg-secondary px-4 py-2 text-sm font-medium">
                  Escala de 1 a{" "}
                  {currentCategoryQuestions[0]?.options?.length || 5}
                </span>
              </div>

              {/* Como Responder legend */}
              {currentCatInstructions.length > 0 && (
                <Card className="border-primary/20 bg-primary/5 shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary">
                      Como Responder
                    </h2>
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                      {currentCatInstructions.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary/10 px-2 font-semibold text-primary">
                            {item.key}
                          </span>
                          <span className="text-muted-foreground">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {answeredCount} de {totalInCategory} respondidas
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(catProgress)}% concluido
                  </span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${catProgress}%` }}
                  />
                </div>
                {saving && (
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    A guardar...
                  </p>
                )}
              </div>

              {/* Questions inline */}
              <div className="flex flex-col gap-6">
                {currentCategoryQuestions.map((q, qi) => {
                  const qId = String(q.id);
                  const currentAnswer = answers[qId];
                  // const perQInstructions = perQuestionInstructions[qId];
                  const options = q.options || [];
                  return (
                    <Card
                      key={q.id}
                      className="border-border bg-card shadow-sm"
                    >
                      <CardContent className="p-6 lg:p-8">
                        <div className="mb-6 flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {qi + 1}
                          </span>
                          <p className="pt-1 text-lg font-medium leading-relaxed">
                            &ldquo;{q.question_text}&rdquo;
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3" role="radiogroup">
                          {options.map((opt, oi) => {
                            const value = String(oi + 1);
                            const isSelected = currentAnswer === value;
                            return (
                              <label
                                key={oi}
                                className={`flex min-h-14 min-w-16 flex-1 cursor-pointer items-center justify-center rounded-xl border-2 px-5 py-3 text-base font-semibold transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input bg-background text-foreground hover:border-primary/50 hover:bg-secondary/50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  value={value}
                                  checked={isSelected}
                                  onChange={() =>
                                    handleAnswerSelect(qId, value)
                                  }
                                  className="sr-only"
                                />
                                {value}
                              </label>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  className="gap-2 rounded-xl"
                  onClick={handleConcluirSeccao}
                  disabled={answeredCount < totalInCategory}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {loading ? "A guardar..." : "Concluir Seccao"}
                </Button>
              </div>
            </div>
          )}

          {!isUnderReview && (
            <Card className="border-border bg-gradient-to-r from-primary/5 to-transparent shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <Heart className="h-6 w-6 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">O seu desenvolvimento importa.</p>
                  <p className="text-sm text-muted-foreground">
                    Cada avaliacao e uma oportunidade de autoconhecimento e
                    crescimento pessoal.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
