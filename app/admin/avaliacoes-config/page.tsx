"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin-mobile-header";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save,
  Trash2,
  Plus,
  SlidersHorizontal,
  Layers,
  ListChecks,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import {
  getStoredAuthToken,
  getEvaluationConfig,
  updateEvaluationDimension,
  createEvaluationDimension,
  deleteEvaluationDimension,
  createEvaluationThreshold,
  updateEvaluationThreshold,
  deleteEvaluationThreshold,
  listAdminTestQuestions,
  listAdminAssessmentQuestions,
  type QuestionnaireKey,
  type EvaluationConfigResponse,
  type EvaluationDimensionOut,
  type EvaluationThresholdOut,
  type AdminTestQuestion,
  type AdminAssessmentQuestion,
} from "../../../lib/api";

const QUESTIONNAIRE_TABS: { key: QuestionnaireKey; label: string }[] = [
  { key: "volunteer", label: "Voluntario" },
  { key: "supervisor", label: "Supervisor" },
  { key: "elder", label: "Idoso" },
];

const FORMULA_LABELS: Record<string, string> = {
  sum: "Soma",
  average: "Media por pergunta",
  percentage: "Percentagem",
};

// const FORMULA_OPTIONS: { value: string; label: string }[] = [
//   { value: "sum", label: "Soma" },
//   { value: "average", label: "Media por pergunta" },
//   { value: "percentage", label: "Percentagem" },
// ];

const BASIS_OPTIONS: { value: string; label: string }[] = [
  { value: "absolute", label: "Pontuacao absoluta" },
  { value: "percentage", label: "Percentagem" },
];

interface QuestionOption {
  id: number;
  text: string;
  category: string | null;
}

export default function AdminEvaluationConfigPage() {
  return (
    <AuthGuard roles={["admin"]}>
      <EvaluationConfigContent />
    </AuthGuard>
  );
}

function EvaluationConfigContent() {
  const [questionnaire, setQuestionnaire] =
    useState<QuestionnaireKey>("volunteer");
  const [config, setConfig] = useState<EvaluationConfigResponse | null>(null);
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatKey, setNewCatKey] = useState("");
  const [newCatCustomKey, setNewCatCustomKey] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");

  const load = useCallback(async (q: QuestionnaireKey) => {
    const token = getStoredAuthToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [cfg, questionRows] = await Promise.all([
        getEvaluationConfig(token, q),
        q === "elder"
          ? listAdminAssessmentQuestions(token)
          : listAdminTestQuestions(token, q),
      ]);
      setConfig(cfg);
      setQuestions(
        (questionRows as (AdminTestQuestion | AdminAssessmentQuestion)[]).map(
          (row) => ({
            id: row.id,
            text: row.question_text,
            category: row.category,
          }),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar configuracao.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(questionnaire);
  }, [questionnaire, load]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [questionnaire]);

  const categories = useMemo(() => {
    if (!config) return [];
    const dimsByCat = new Map<string, EvaluationDimensionOut[]>();
    for (const d of config.dimensions) {
      const list = dimsByCat.get(d.category_key) ?? [];
      list.push(d);
      dimsByCat.set(d.category_key, list);
    }
    return config.categories.map((cat) => ({
      ...cat,
      dimensions: dimsByCat.get(cat.category_key) ?? [],
    }));
  }, [config]);

  const questionsForCategory = useCallback(
    (categoryKey: string) =>
      questions.filter((q) => (q.category ?? "default") === categoryKey),
    [questions],
  );

  const configuredCatKeys = useMemo(
    () => new Set((config?.categories ?? []).map((c) => c.category_key)),
    [config],
  );

  const availableCatKeys = useMemo(() => {
    const keys = new Set(questions.map((q) => q.category ?? "default"));
    return [...keys].filter((k) => !configuredCatKeys.has(k)).sort();
  }, [questions, configuredCatKeys]);

  const resolvedNewCatKey =
    newCatKey === "__new__" ? newCatCustomKey.trim() : newCatKey.trim();

  const numNewCatQuestions = resolvedNewCatKey
    ? questions.filter((q) => (q.category ?? "default") === resolvedNewCatKey)
        .length
    : 0;

  const resetNewCatForm = () => {
    setShowNewCatForm(false);
    setNewCatKey("");
    setNewCatCustomKey("");
    setNewCatLabel("");
  };

  const handleCreateCategory = () => {
    if (!resolvedNewCatKey) return;
    const label = newCatLabel.trim() || resolvedNewCatKey;
    const question_ids = questions
      .filter((q) => (q.category ?? "default") === resolvedNewCatKey)
      .map((q) => q.id);
    runSave(
      () =>
        createEvaluationDimension(getStoredAuthToken()!, {
          questionnaire,
          category_key: resolvedNewCatKey,
          scope: "category",
          label,
          question_ids,
          formula: "sum",
        }),
      "Categoria criada.",
    );
    resetNewCatForm();
  };

  const notify = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage("");
    } else {
      setMessage(msg);
      setError("");
    }
  };

  const flash = (msg: string, isError = false) => {
    notify(msg, isError);
    setTimeout(() => {
      setMessage("");
      setError("");
    }, 4000);
  };

  const runSave = async (fn: () => Promise<unknown>, successMsg: string) => {
    setSaving(true);
    try {
      await fn();
      await load(questionnaire);
      flash(successMsg);
      return true;
    } catch (err) {
      flash(
        err instanceof Error ? err.message : "Erro ao guardar alteracoes.",
        true,
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminMobileHeader />
      <AdminSidebar activeItem="avaliacoes-config" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Configuracao de Avaliacoes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Defina as categorias, dimensoes e interpretacoes dos resultados
              das avaliacoes.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => load(questionnaire)}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Questionnaire selector */}
        <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1">
          {QUESTIONNAIRE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setQuestionnaire(tab.key);
                resetNewCatForm();
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                questionnaire === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* New category */}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl"
            onClick={() => setShowNewCatForm((s) => !s)}
          >
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        </div>

        {showNewCatForm && (
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="space-y-4 p-5">
              <h3 className="font-semibold text-foreground">
                Nova categoria
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoria (chave)</Label>
                  <select
                    value={newCatKey}
                    onChange={(e) => {
                      setNewCatKey(e.target.value);
                      if (e.target.value && e.target.value !== "__new__") {
                        setNewCatLabel(e.target.value);
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Escolher categoria...</option>
                    {availableCatKeys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                    <option value="__new__">+ Chave personalizada ...</option>
                  </select>
                </div>
                {newCatKey === "__new__" && (
                  <div className="space-y-2">
                    <Label>Chave da nova categoria</Label>
                    <Input
                      value={newCatCustomKey}
                      onChange={(e) => {
                        setNewCatCustomKey(e.target.value);
                        setNewCatLabel(e.target.value);
                      }}
                      placeholder="ex: competencias-digitais"
                      className="h-10 rounded-xl"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Rotulo (nome visivel)</Label>
                  <Input
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    placeholder="Nome da categoria"
                    className="h-10 w-full rounded-xl"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Alinha automaticamente {numNewCatQuestions} pergunta(s) desta
                categoria e usa a formula "sum".
              </p>
              {availableCatKeys.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Todas as categorias presentes nas questoes ja estao
                  configuradas. Use "Chave personalizada" para criar uma nova.
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 rounded-xl"
                  disabled={!resolvedNewCatKey || saving}
                  onClick={handleCreateCategory}
                >
                  <Save className="h-4 w-4" />
                  Criar categoria
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={resetNewCatForm}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert className="mb-4 border-emerald-300 bg-emerald-50 text-emerald-800">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {loading && !config && (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
            A carregar configuracao...
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Sem categorias configuradas para este questionario.
          </div>
        )}

        <div className="space-y-6">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              questions={questionsForCategory(cat.category_key)}
              saving={saving}
              onSaveCategory={(data) =>
                runSave(
                  () =>
                    updateEvaluationDimension(
                      getStoredAuthToken()!,
                      cat.id,
                      data,
                    ),
                  "Categoria atualizada.",
                )
              }
              onCreateDimension={(data) =>
                runSave(
                  () =>
                    createEvaluationDimension(getStoredAuthToken()!, {
                      questionnaire,
                      category_key: cat.category_key,
                      scope: "dimension",
                      ...data,
                    }),
                  "Dimensao criada.",
                )
              }
              onSaveDimension={(dimId, data) =>
                runSave(
                  () =>
                    updateEvaluationDimension(
                      getStoredAuthToken()!,
                      dimId,
                      data,
                    ),
                  "Dimensao atualizada.",
                )
              }
              onDeleteDimension={(dimId) =>
                runSave(
                  () => deleteEvaluationDimension(getStoredAuthToken()!, dimId),
                  "Dimensao eliminada.",
                )
              }
              onCreateThreshold={(dimId, data) =>
                runSave(
                  () =>
                    createEvaluationThreshold(
                      getStoredAuthToken()!,
                      dimId,
                      data,
                    ),
                  "Intervalo criado.",
                )
              }
              onSaveThreshold={(thrId, data) =>
                runSave(
                  () =>
                    updateEvaluationThreshold(
                      getStoredAuthToken()!,
                      thrId,
                      data,
                    ),
                  "Intervalo atualizado.",
                )
              }
              onDeleteThreshold={(thrId) =>
                runSave(
                  () => deleteEvaluationThreshold(getStoredAuthToken()!, thrId),
                  "Intervalo eliminado.",
                )
              }
            />
          ))}
        </div>
        </div>
      </main>
    </div>
  );
}

// ── Category Card ──────────────────────────────────────────────────────

interface CategoryCardProps {
  category: EvaluationDimensionOut & { dimensions: EvaluationDimensionOut[] };
  questions: QuestionOption[];
  saving: boolean;
  onSaveCategory: (data: {
    label?: string;
    formula?: "sum" | "average" | "percentage";
  }) => void;
  onCreateDimension: (data: {
    dimension_key?: string | null;
    label: string;
    question_ids?: number[];
    formula?: "sum" | "average" | "percentage";
  }) => void;
  onSaveDimension: (
    dimId: string,
    data: {
      label?: string;
      formula?: "sum" | "average" | "percentage";
      question_ids?: number[];
    },
  ) => void;
  onDeleteDimension: (dimId: string) => void;
  onCreateThreshold: (dimId: string, data: ThresholdInput) => Promise<boolean>;
  onSaveThreshold: (thrId: string, data: ThresholdInput) => void;
  onDeleteThreshold: (thrId: string) => void;
}

interface ThresholdInput {
  min_value?: number | null;
  max_value?: number | null;
  value_basis: "absolute" | "percentage";
  level: string;
  interpretation?: string;
}

function CategoryCard({
  category,
  questions,
  saving,
  onSaveCategory,
  onCreateDimension,
  onSaveDimension,
  onDeleteDimension,
  onCreateThreshold,
  onSaveThreshold,
  onDeleteThreshold,
}: CategoryCardProps) {
  const [label, setLabel] = useState(category.label);
  const [formula, setFormula] = useState(category.formula);
  const [newDimLabel, setNewDimLabel] = useState("");
  const [addingDim, setAddingDim] = useState(false);
  const [open, setOpen] = useState(false);
  const [showInterp, setShowInterp] = useState(false);
  const [showDims, setShowDims] = useState(false);
  const [draft, setDraft] = useState<ThresholdInput | null>(null);

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="-ml-1 flex items-center gap-2 rounded-lg py-1 pe-1 text-left transition-colors hover:bg-accent"
          >
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ${
                open ? "" : "-rotate-90"
              }`}
            />
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{category.label}</CardTitle>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {category.question_ids.length} perguntas
            </span>
          </button>
          <div className="flex items-center gap-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-9 w-48"
              placeholder="Nome da categoria"
            />
            {/* Formula select removed: categories always use "sum" */}
            {/* <Select value={formula} onValueChange={(v) => setFormula(v as never)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMULA_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            <Button
              size="sm"
              disabled={
                saving ||
                (label === category.label && formula === category.formula)
              }
              onClick={() =>
                onSaveCategory({
                  label: label !== category.label ? label : undefined,
                  formula: formula !== category.formula ? formula : undefined,
                })
              }
            >
              <Save className="mr-1.5 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </CardHeader>

      {open ? (
        <CardContent className="space-y-6 p-5">
          {/* Thresholds */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowInterp((s) => !s)}
                aria-expanded={showInterp}
                className="flex items-center gap-2 rounded-lg py-1 pr-2 text-left transition-colors hover:bg-accent"
              >
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ${
                    showInterp ? "" : "-rotate-90"
                  }`}
                />
                <ListChecks className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">
                  Interpretacao (intervalos)
                </h3>
              </button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setShowInterp(true);
                  setDraft({
                    value_basis: "absolute",
                    level: "",
                    interpretation: "",
                  });
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Adicionar intervalo
              </Button>
            </div>
            {showInterp && (
              <div className="space-y-3">
                {category.thresholds.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Sem intervalos definidos.
                  </p>
                )}
                {category.thresholds.map((thr) => (
                  <ThresholdRow
                    key={thr.id}
                    threshold={thr}
                    saving={saving}
                    onSave={(data) => onSaveThreshold(thr.id, data)}
                    onDelete={() => onDeleteThreshold(thr.id)}
                  />
                ))}
                {draft && (
                  <DraftThresholdRow
                    saving={saving}
                    onSave={async (data) => {
                      const ok = await onCreateThreshold(category.id, data);
                      if (ok) setDraft(null);
                    }}
                    onCancel={() => setDraft(null)}
                  />
                )}
              </div>
            )}
          </section>

          {/* Dimensions */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDims((s) => !s)}
                aria-expanded={showDims}
                className="flex items-center gap-2 rounded-lg py-1 pr-2 text-left transition-colors hover:bg-accent"
              >
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ${
                    showDims ? "" : "-rotate-90"
                  }`}
                />
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Dimensoes</h3>
              </button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setShowDims(true);
                  setAddingDim(!addingDim);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Adicionar dimensao
              </Button>
            </div>

            {showDims && (
              <>
                {addingDim && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-3">
                    <Input
                      value={newDimLabel}
                      onChange={(e) => setNewDimLabel(e.target.value)}
                      className="h-9"
                      placeholder="Nome da nova dimensao (ex: Motivacao)"
                    />
                    <Button
                      size="sm"
                      disabled={saving || !newDimLabel.trim()}
                      onClick={() => {
                        onCreateDimension({
                          label: newDimLabel.trim(),
                          question_ids: questions
                            .filter((q) => q.category === category.category_key)
                            .map((q) => q.id),
                        });
                        setNewDimLabel("");
                        setAddingDim(false);
                      }}
                    >
                      Criar
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {category.dimensions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Sem dimensoes definidas.
                    </p>
                  )}
                  {category.dimensions.map((dim) => (
                    <DimensionCard
                      key={dim.id}
                      dimension={dim}
                      questions={questions}
                      saving={saving}
                      onSave={(data) => onSaveDimension(dim.id, data)}
                      onDelete={() => onDeleteDimension(dim.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </CardContent>
      ) : null}
    </Card>
  );
}

// ── Threshold Row ──────────────────────────────────────────────────────

function ThresholdRow({
  threshold,
  saving,
  onSave,
  onDelete,
}: {
  threshold: EvaluationThresholdOut;
  saving: boolean;
  onSave: (data: ThresholdInput) => void;
  onDelete: () => void;
}) {
  const [min, setMin] = useState(
    threshold.min_value !== null ? String(threshold.min_value) : "",
  );
  const [max, setMax] = useState(
    threshold.max_value !== null ? String(threshold.max_value) : "",
  );
  const [basis, setBasis] = useState(threshold.value_basis);
  const [level, setLevel] = useState(threshold.level);
  const [interpretation, setInterpretation] = useState(
    threshold.interpretation,
  );

  const dirty =
    min !== (threshold.min_value !== null ? String(threshold.min_value) : "") ||
    max !== (threshold.max_value !== null ? String(threshold.max_value) : "") ||
    basis !== threshold.value_basis ||
    level !== threshold.level ||
    interpretation !== threshold.interpretation;

  const submit = () => {
    if (!level.trim()) return;
    onSave({
      min_value: min === "" ? null : Number(min),
      max_value: max === "" ? null : Number(max),
      value_basis: basis,
      level: level.trim(),
      interpretation,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <div>
          <Label className="text-xs text-muted-foreground">Minimo</Label>
          <Input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="mt-1 h-9"
            placeholder="-"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Maximo</Label>
          <Input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="mt-1 h-9"
            placeholder="-"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Base</Label>
          <Select value={basis} onValueChange={(v) => setBasis(v as never)}>
            <SelectTrigger className="mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BASIS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Nivel</Label>
          <Input
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 h-9"
            placeholder="ex: elevado"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            size="sm"
            disabled={saving || !dirty || !level.trim()}
            onClick={submit}
          >
            <Save className="mr-1.5 h-4 w-4" />
            Guardar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={saving}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-2">
        <Label className="text-xs text-muted-foreground">Interpretacao</Label>
        <Textarea
          value={interpretation}
          onChange={(e) => setInterpretation(e.target.value)}
          className="mt-1 min-h-[60px] text-sm"
          placeholder="Texto apresentado ao utilizador para este nivel"
        />
      </div>
    </div>
  );
}

// ── Draft Threshold Row ─────────────────────────────────────────────────

function DraftThresholdRow({
  saving,
  onSave,
  onCancel,
}: {
  saving: boolean;
  onSave: (data: ThresholdInput) => void;
  onCancel: () => void;
}) {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [basis, setBasis] = useState<"absolute" | "percentage">("absolute");
  const [level, setLevel] = useState("");
  const [interpretation, setInterpretation] = useState("");

  const canSave =
    level.trim() !== "" && (min !== "" || max !== "");

  const submit = () => {
    if (!canSave) return;
    onSave({
      min_value: min === "" ? null : Number(min),
      max_value: max === "" ? null : Number(max),
      value_basis: basis,
      level: level.trim(),
      interpretation,
    });
  };

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <div>
          <Label className="text-xs text-muted-foreground">Minimo</Label>
          <Input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="mt-1 h-9"
            placeholder="-"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Maximo</Label>
          <Input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="mt-1 h-9"
            placeholder="-"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Base</Label>
          <Select value={basis} onValueChange={(v) => setBasis(v as never)}>
            <SelectTrigger className="mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BASIS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Nivel</Label>
          <Input
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 h-9"
            placeholder="ex: elevado"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button size="sm" disabled={saving || !canSave} onClick={submit}>
            <Save className="mr-1.5 h-4 w-4" />
            Guardar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      </div>
      <div className="mt-2">
        <Label className="text-xs text-muted-foreground">Interpretacao</Label>
        <Textarea
          value={interpretation}
          onChange={(e) => setInterpretation(e.target.value)}
          className="mt-1 min-h-[60px] text-sm"
          placeholder="Texto apresentado ao utilizador para este nivel"
        />
      </div>
    </div>
  );
}

// ── Dimension Card ─────────────────────────────────────────────────────

function DimensionCard({
  dimension,
  questions,
  saving,
  onSave,
  onDelete,
}: {
  dimension: EvaluationDimensionOut;
  questions: QuestionOption[];
  saving: boolean;
  onSave: (data: {
    label?: string;
    formula?: "sum" | "average" | "percentage";
    question_ids?: number[];
  }) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(dimension.label);
  const [formula, setFormula] = useState(dimension.formula);
  const [selected, setSelected] = useState<Set<number>>(
    new Set(dimension.question_ids),
  );

  const toggle = (qid: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  };

  const dirty =
    label !== dimension.label ||
    formula !== dimension.formula ||
    [...selected].sort().join(",") !==
      [...dimension.question_ids].sort().join(",");

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-9 max-w-xs font-medium"
          />
          {/* Formula select removed: dimensions always use "average" */}
          {/* <Select value={formula} onValueChange={(v) => setFormula(v as never)}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMULA_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selected.size}/{questions.length} perguntas
          </span>
          <Button
            size="sm"
            disabled={saving || !dirty || !label.trim()}
            onClick={() =>
              onSave({
                label: label !== dimension.label ? label : undefined,
                formula: formula !== dimension.formula ? formula : undefined,
                question_ids: [...selected],
              })
            }
          >
            <Save className="mr-1.5 h-4 w-4" />
            Guardar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={saving}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Question picker */}
      <div className="mt-3 grid gap-1.5 md:grid-cols-2">
        {questions.map((q) => (
          <label
            key={q.id}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <Checkbox
              checked={selected.has(q.id)}
              onCheckedChange={() => toggle(q.id)}
              className="mt-0.5"
            />
            <span className="line-clamp-2 text-xs text-foreground">
              #{q.id} — {q.text}
            </span>
          </label>
        ))}
        {questions.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhuma pergunta disponivel nesta categoria.
          </p>
        )}
      </div>
    </div>
  );
}
