"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Brain,
  Home,
  Smile,
  Leaf,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  getStoredAuthToken,
  getElderDetail,
  getElderAssessmentResults,
  type ElderDetail,
  type ElderAssessmentResultsResponse,
} from "../../../../lib/api";

type Step = "overview" | "category";

interface InstructionItem {
  key: string;
  label: string;
}

const catMeta: Record<string, { icon: typeof Heart; label: string; description: string }> = {
  "bem-estar-psicologico": { icon: Brain, label: "Bem-Estar Psicologico", description: "Avalia energia, estabilidade emocional e satisfacao pessoal." },
  loneliness: { icon: Heart, label: "Solidao", description: "Avalia o sentimento de solidao e isolamento social." },
  selfcare: { icon: Home, label: "Autocuidado", description: "Avalia a capacidade de realizar atividades diarias." },
  depression: { icon: Smile, label: "Depressao Geriatrica", description: "Avalia sinais de depressao na pessoa idosa." },
  quality_of_life: { icon: Leaf, label: "Qualidade de Vida", description: "Avalia a percecao geral de qualidade de vida." },
};

const categoryInstructions: Record<string, InstructionItem[]> = {
  "bem-estar-psicologico": [
    { key: "1", label: "Nivel mais baixo" },
    { key: "6", label: "Nivel mais elevado" },
  ],
  loneliness: [
    { key: "1", label: "Nunca" },
    { key: "2", label: "Raramente" },
    { key: "3", label: "Algumas vezes" },
    { key: "4", label: "Frequentemente" },
  ],
  selfcare: [
    { key: "0", label: "Nao consegue" },
    { key: "1", label: "Com alguma ajuda" },
    { key: "2", label: "Sozinho" },
  ],
  depression: [
    { key: "Sim", label: "Sim" },
    { key: "Nao", label: "Nao" },
  ],
  quality_of_life: [
    { key: "1", label: "Nivel mais baixo" },
    { key: "5", label: "Nivel mais elevado" },
  ],
};

function extractPerQuestionInstructions(questions: Array<{ question_text: string; options: Array<{ text: string; points: number }> }>): Record<string, InstructionItem[]> {
  const map: Record<string, InstructionItem[]> = {};
  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    if (!q.options?.length) continue;
    map[String(qi)] = q.options.map((opt, i) => ({ key: String(i + 1), label: opt.text }));
  }
  return map;
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

type ElderThreshold = [number, number, string, string];

const elderThresholds: Record<string, { label: string; thresholds: ElderThreshold[] }> = {
  "bem-estar-psicologico": {
    label: "Bem-Estar Psicológico",
    thresholds: [[27,36,"elevado","Demonstra ter um elevado nível de bem-estar psicológico."],[17,26,"moderado","Apresenta um nível moderado de bem-estar, com algumas áreas a desenvolver."],[6,16,"baixo","Indica um baixo nível de bem-estar psicológico."]],
  },
  loneliness: {
    label: "Solidão",
    thresholds: [[16,32,"baixo","Baixo nível de solidão — sente-se emocionalmente ligada aos outros."],[33,40,"moderado","Nível moderado de solidão — pode experienciar algum isolamento."],[41,64,"elevado","Elevado sentimento de solidão — dificuldade em manter relações significativas."]],
  },
  selfcare: {
    label: "Autocuidado",
    thresholds: [[22,28,"independencia_total","Realiza todas as atividades sem ajuda, de forma autónoma."],[15,21,"dependencia_moderada","Maioritariamente autónoma, necessita de ajuda em tarefas específicas."],[8,14,"dependencia_significativa","Limitações importantes, precisa de apoio frequente."],[0,7,"dependencia_grave","Depende de terceiros para a maioria das atividades."]],
  },
  depression: {
    label: "Depressão Geriátrica",
    thresholds: [[0,2,"normal","Ausência de sintomatologia depressiva clinicamente significativa."],[3,4,"leve","Sintomatologia depressiva ligeira. Pode beneficiar de acompanhamento."],[5,6,"moderada","Sintomatologia depressiva moderada. Recomenda-se avaliação clínica."],[7,10,"grave","Sintomatologia depressiva grave. Recomenda-se avaliação clínica urgente."]],
  },
  quality_of_life: {
    label: "Qualidade de Vida",
    thresholds: [[25,32,"elevada","Perceção elevada de qualidade de vida."],[17,24,"moderada","Perceção moderada de qualidade de vida."],[9,16,"baixa","Perceção baixa de qualidade de vida."],[0,8,"muito_baixa","Perceção muito baixa de qualidade de vida."]],
  },
};

function calcCatInterpretation(catKey: string, questions: Array<{ id: number; options: Array<{ points: number }> }>, answers: Record<string, string>): { score: number; max: number; pct: number; level: string; interpretation: string } | null {
  const scoring = elderThresholds[catKey];
  if (!scoring) return null;
  let score = 0, max = 0;
  for (const q of questions) {
    const opts = q.options || [];
    const qMax = opts.length > 0 ? Math.max(...opts.map(o => o.points || 0)) : 0;
    max += qMax;
    const ans = answers[String(q.id)];
    if (ans) {
      const idx = Number(ans) - 1;
      if (idx >= 0 && idx < opts.length) score += opts[idx].points || 0;
    }
  }
  if (max === 0) return null;
  const pct = Math.round((score / max) * 100);
  for (const [lo, hi, level, interp] of scoring.thresholds) {
    if (score >= lo && score <= hi) return { score, max, pct, level, interpretation: interp };
  }
  return { score, max, pct, level: "desconhecido", interpretation: "" };
}

export default function ElderAvaliacaoPage() {
  const params = useParams();
  const router = useRouter();
  const elderId = params.id as string;
  const token = getStoredAuthToken();

  const [elder, setElder] = useState<ElderDetail | null>(null);
  const [groupedQuestions, setGroupedQuestions] = useState<
    Array<{
      key: string;
      label: string;
      questions: Array<{ id: number; question_text: string; options: Array<{ text: string; points: number }>; order: number }>;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("overview");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [elderResults, setElderResults] = useState<ElderAssessmentResultsResponse | null>(null);
  const [perQuestionInstructions, setPerQuestionInstructions] = useState<Record<string, InstructionItem[]>>({});

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    async function load() {
      if (!token) { setError("Sessao expirada."); setLoading(false); return; }
      try {
        const [elderData, qRes] = await Promise.all([
          getElderDetail(token, elderId),
          fetch(`${apiBase}/elders/questions/grouped`, {
            headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
          }).then((r) => r.json()),
        ]);
        setElder(elderData);

        const existingAnswers: Record<string, string> = {};
        if (elderData.answers) {
          for (const a of elderData.answers) {
            existingAnswers[String(a.question_id)] = String(a.chosen_option_index + 1);
          }
        }
        setAnswers(existingAnswers);

        const cats = qRes.categories || [];
        setGroupedQuestions(cats);

        const totalQs = qRes.total_questions || 0;
        if (Object.keys(existingAnswers).length >= totalQs && totalQs > 0) {
          setComplete(true);
          getElderAssessmentResults(token, elderId).then(setElderResults).catch(() => {});
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [elderId, token]);

  const currentCatQuestions = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = groupedQuestions.find((c) => c.key === selectedCategory);
    return cat?.questions || [];
  }, [groupedQuestions, selectedCategory]);

  const currentCatMeta = useMemo(() => {
    if (!selectedCategory) return null;
    return catMeta[selectedCategory] || null;
  }, [selectedCategory]);

  const currentCatInstructions = useMemo(() => {
    if (!selectedCategory) return [];
    return categoryInstructions[selectedCategory] || [];
  }, [selectedCategory]);

  const answeredCount = useMemo(() => {
    return currentCatQuestions.filter((q) => !!answers[String(q.id)]).length;
  }, [currentCatQuestions, answers]);

  const totalInCategory = currentCatQuestions.length;
  const catProgress = totalInCategory > 0 ? (answeredCount / totalInCategory) * 100 : 0;

  const categoryCards = useMemo(() => {
    return groupedQuestions.map((cat) => {
      const meta = catMeta[cat.key] || { icon: Heart, label: cat.label, description: "" };
      const catIds = new Set(cat.questions.map((q) => String(q.id)));
      let answered = 0;
      for (const qId of catIds) { if (answers[qId]) answered++; }
      let status = "not_started";
      if (answered === cat.questions.length) status = "completed";
      else if (answered > 0) status = "in_progress";
      return { ...cat, ...meta, status, answered, total: cat.questions.length };
    });
  }, [groupedQuestions, answers]);

  const allDone = useMemo(() => {
    return groupedQuestions.every((cat) =>
      cat.questions.every((q) => !!answers[String(q.id)]),
    ) && groupedQuestions.length > 0;
  }, [groupedQuestions, answers]);

  const handleCategorySelect = (catKey: string) => {
    setSelectedCategory(catKey);
    const cat = groupedQuestions.find((c) => c.key === catKey);
    if (cat && catKey === "quality_of_life") {
      setPerQuestionInstructions(extractPerQuestionInstructions(cat.questions));
    }
    setStep("category");
  };

  const postAnswer = async (qId: string, idx: number) => {
    if (!token) return;
    setSaving(true);
    try {
      await fetch(`${apiBase}/elders/${elderId}/questionnaire/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question_id: Number(qId), chosen_option_index: idx }),
      });
    } catch {}
    finally { setSaving(false); }
  };

  const handleAnswerSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    postAnswer(questionId, Number(value) - 1);
  };

  const handleConcluirSeccao = async () => {
    if (allDone) {
      setComplete(true);
      getElderAssessmentResults(token!, elderId).then(setElderResults).catch(() => {});
    }
    setStep("overview"); setSelectedCategory(null);
  };

  if (loading) {
    return <div className="flex min-h-screen"><MobileHeader /><Sidebar /><main className="flex-1 pt-16 flex items-center justify-center"><p className="text-muted-foreground">A carregar...</p></main></div>;
  }

  if (complete) {
    return (
      <div className="flex min-h-screen">
        <MobileHeader />
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="mx-auto max-w-5xl space-y-8 p-4 lg:p-8">
            <Card className="border-0 bg-gradient-to-br from-primary/5 to-card shadow-sm">
              <CardContent className="flex flex-col items-center p-8 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-10 w-10 text-green-600" /></div>
                <h1 className="mb-4 text-3xl font-bold">Avaliacao Concluida</h1>
                <p className="mb-8 text-muted-foreground">A avaliacao de {elder?.name} foi concluida com sucesso.</p>
              </CardContent>
            </Card>

            {elderResults?.results && (
              <div>
                <h2 className="mb-4 text-2xl font-bold">Resultados</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {Object.entries(elderResults.results).map(([key, r]) => {
                    const meta = catMeta[key] || { icon: Heart, label: key, description: "" };
                    const Icon = meta.icon;
                    const lc = r.level === "elevado" || r.level === "elevada" ? "bg-green-100 text-green-700" : r.level === "moderado" || r.level === "moderada" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                    return (
                      <Card key={key} className="shadow-sm">
                        <CardContent className="flex flex-col p-6">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div><h3 className="font-semibold">{r.label || key}</h3></div>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${lc}`}>{r.level}</span>
                          </div>
                          <div className="space-y-1.5"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Pontuacao</span><span className="font-medium">{r.score}/{r.max} ({r.percentage || 0}%)</span></div><div className="h-2 rounded-full bg-secondary"><div className={`h-full rounded-full ${(r.percentage || 0) >= 75 ? "bg-green-500" : (r.percentage || 0) >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: (r.percentage || 0) + "%" }} /></div></div>
                          <p className="mt-3 text-sm text-muted-foreground">{r.interpretation}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <MobileHeader />
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-5xl space-y-8 p-4 lg:p-8">
          {/* Overview */}
          {step === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Avaliacao do Idoso</h1>
                <p className="mt-2 text-muted-foreground">{elder?.name} — Complete cada seccao da avaliacao.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {categoryCards.map((cat) => {
                  const Icon = cat.icon;
                  const statusColors: Record<string, string> = {
                    not_started: "bg-secondary text-muted-foreground",
                    in_progress: "bg-amber-100 text-amber-700",
                    completed: "bg-green-100 text-green-700",
                  };
                  const statusLabels: Record<string, string> = {
                    not_started: "Nao iniciado",
                    in_progress: "Em progresso",
                    completed: "Concluido",
                  };
                  const isComp = cat.status === "completed";
                  const interp = isComp ? calcCatInterpretation(cat.key, cat.questions, answers) : null;
                  return (
                    <Card key={cat.key} className={`shadow-sm ${!isComp ? "cursor-pointer hover:shadow-md" : ""}`} onClick={() => !isComp && handleCategorySelect(cat.key)}>
                      <CardContent className="flex flex-col p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[cat.status]}`}>{statusLabels[cat.status]}</span>
                        </div>
                        <h3 className="font-semibold">{cat.label}</h3>
                        <p className="mb-3 text-sm text-muted-foreground">{cat.description}</p>
                        {cat.total > 0 && <div className="mb-3 h-1.5 rounded-full bg-secondary"><div className={`h-full rounded-full ${isComp ? "bg-green-500" : "bg-primary"}`} style={{ width: `${Math.round((cat.answered / cat.total) * 100)}%` }} /></div>}
                        {interp ? (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pontuacao</span><span className="font-medium">{interp.score}/{interp.max} ({interp.pct}%)</span></div>
                            <div className="h-2 rounded-full bg-secondary"><div className={`h-full rounded-full ${interp.pct >= 75 ? "bg-green-500" : interp.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${interp.pct}%` }} /></div>
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${interp.level === "elevado" || interp.level === "elevada" || interp.level === "independencia_total" ? "bg-green-100 text-green-700" : interp.level === "moderado" || interp.level === "moderada" || interp.level === "dependencia_moderada" || interp.level === "leve" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{interp.level.replace(/_/g, " ")}</span>
                            <p className="text-sm text-muted-foreground">{interp.interpretation}</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{cat.answered}/{cat.total} perguntas</span>
                            {isComp ? <span className="text-sm font-medium text-green-600">Completo</span> : (
                              <Button size="sm" className="gap-1 rounded-lg" onClick={(e) => { e.stopPropagation(); handleCategorySelect(cat.key); }}>
                                {cat.status === "not_started" ? "Iniciar" : "Continuar"}
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {allDone && (
                <div className="flex justify-center pt-4">
                  <Button size="lg" className="gap-2 rounded-xl" onClick={handleConcluirSeccao}><CheckCircle2 className="h-5 w-5" /> Concluir Avaliacao</Button>
                </div>
              )}
            </div>
          )}

          {/* Inline Category Questions */}
          {step === "category" && selectedCategory && (
            <div className="mx-auto max-w-3xl space-y-6">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleConcluirSeccao}><ArrowLeft className="h-4 w-4" /> Voltar as seccoes</Button>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  {currentCatMeta && <currentCatMeta.icon className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <h1 className="text-xl font-bold lg:text-2xl">{currentCatMeta?.label || selectedCategory}</h1>
                  <p className="text-sm text-muted-foreground">{currentCatMeta?.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <span className="rounded-full bg-secondary px-4 py-2 text-sm font-medium">{totalInCategory} Perguntas</span>
              </div>

              {currentCatInstructions.length > 0 && (
                <Card className="border-primary/20 bg-primary/5 shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary">Como Responder</h2>
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                      {currentCatInstructions.map((item) => (
                        <div key={item.key} className="flex items-center gap-2 text-sm">
                          <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary/10 px-2 font-semibold text-primary">{item.key}</span>
                          <span className="text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{answeredCount} de {totalInCategory} respondidas</span>
                  <span className="text-muted-foreground">{Math.round(catProgress)}% concluido</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${catProgress}%` }} />
                </div>
                {saving && <p className="mt-1 text-right text-xs text-muted-foreground">A guardar...</p>}
              </div>

              <div className="flex flex-col gap-6">
                {currentCatQuestions.map((q, qi) => {
                  const qId = String(q.id);
                  const currentAnswer = answers[qId];
                  const options = q.options || [];
                  return (
                    <Card key={q.id} className="border-border bg-card shadow-sm">
                      <CardContent className="p-6 lg:p-8">
                        <div className="mb-6 flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{qi + 1}</span>
                          <p className="pt-1 text-lg font-medium leading-relaxed">&ldquo;{q.question_text}&rdquo;</p>
                        </div>

                        {selectedCategory === "quality_of_life" && perQuestionInstructions[String(qi)] && (
                          <div className="mb-5 rounded-xl bg-secondary/60 p-4">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Legenda</p>
                            <div className="flex flex-col gap-2">
                              {perQuestionInstructions[String(qi)].map((item) => (
                                <div key={item.key} className="flex items-start gap-2 text-sm">
                                  <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">{item.key}</span>
                                  <span className="pt-0.5 text-muted-foreground">{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

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
                                  onChange={() => handleAnswerSelect(qId, value)}
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
                  Concluir Seccao
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </main>
    </div>
  );
}
