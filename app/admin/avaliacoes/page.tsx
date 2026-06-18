"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin-mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Brain,
  Heart,
  Home,
  Smile,
  Leaf,
  Clipboard,
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  Layers,
} from "lucide-react";
import {
  getStoredAuthToken,
  listAdminTestQuestions,
  createTestQuestion,
  updateTestQuestion,
  deleteTestQuestion,
  listAdminAssessmentQuestions,
  createAssessmentQuestion,
  updateAssessmentQuestion,
  deleteAssessmentQuestion,
  type AdminTestQuestion,
  type AdminAssessmentQuestion,
} from "../../../lib/api";

type Tab = "test-questions" | "assessment-questions";

const testCategoryMeta: Record<
  string,
  { label: string; icon: typeof Brain; color: string }
> = {
  "bem-estar-psicologico": {
    label: "Bem-Estar Psicologico",
    icon: Brain,
    color: "bg-blue-100 text-blue-700",
  },
  "capacidade-compassiva": {
    label: "Capacidade Compassiva",
    icon: Heart,
    color: "bg-rose-100 text-rose-700",
  },
  "habilidades-sociais": {
    label: "Habilidades Sociais",
    icon: Smile,
    color: "bg-green-100 text-green-700",
  },
  "motivacoes-voluntariado": {
    label: "Motivacoes para o Voluntariado",
    icon: Leaf,
    color: "bg-amber-100 text-amber-700",
  },
  supervisor: {
    label: "Teste de Supervisor",
    icon: Clipboard,
    color: "bg-purple-100 text-purple-700",
  },
};

const assessCategoryMeta: Record<
  string,
  { label: string; icon: typeof Brain; color: string }
> = {
  loneliness: {
    label: "Solidao",
    icon: Heart,
    color: "bg-rose-100 text-rose-700",
  },
  physical: {
    label: "Autocuidado",
    icon: Home,
    color: "bg-blue-100 text-blue-700",
  },
  mental: {
    label: "Depressao Geriatrica",
    icon: Smile,
    color: "bg-amber-100 text-amber-700",
  },
  nutrition: {
    label: "Qualidade de Vida",
    icon: Leaf,
    color: "bg-green-100 text-green-700",
  },
  safety: {
    label: "Avaliacao Multifuncional OARS",
    icon: Clipboard,
    color: "bg-purple-100 text-purple-700",
  },
};

const defaultMeta = {
  label: "",
  icon: Layers,
  color: "bg-gray-100 text-gray-700",
};

export default function AdminAvaliacoesPage() {
  const [tab, setTab] = useState<Tab>("test-questions");
  const [testQuestions, setTestQuestions] = useState<AdminTestQuestion[]>([]);
  const [assessQuestions, setAssessQuestions] = useState<
    AdminAssessmentQuestion[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Expand/collapse state: keyed by category
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // New question form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newText, setNewText] = useState("");
  const [newOptions, setNewOptions] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editOptions, setEditOptions] = useState("");

  const token = getStoredAuthToken();

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [testQs, assessQs] = await Promise.all([
        listAdminTestQuestions(token),
        listAdminAssessmentQuestions(token),
      ]);
      setTestQuestions(testQs);
      setAssessQuestions(assessQs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar questoes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Group questions by category ──

  const groupedTest = groupBy(testQuestions, "category");
  const groupedAssess = groupBy(assessQuestions, "category");

  const currentGroups = tab === "test-questions" ? groupedTest : groupedAssess;
  const currentAll =
    tab === "test-questions" ? testQuestions : assessQuestions;

  // ── Handlers ──

  const handleCreate = async () => {
    if (!newText.trim() || !token) return;
    setLoading(true);
    try {
      let opts: Array<{ text: string; points: number }> = [];
      try {
        opts = JSON.parse(newOptions || '[{"text":"Sim","points":10},{"text":"Nao","points":0}]');
      } catch {
        opts = [{ text: "Sim", points: 10 }, { text: "Nao", points: 0 }];
      }

      if (tab === "test-questions") {
        await createTestQuestion(token, {
          role: "volunteer",
          question_text: newText,
          options: opts,
          order: currentAll.length + 1,
          category: newCategory || undefined,
        });
      } else {
        await createAssessmentQuestion(token, {
          question_text: newText,
          options: opts,
          order: currentAll.length + 1,
          category: newCategory || undefined,
        });
      }

      setNewText("");
      setNewCategory("");
      setNewOptions("");
      setShowNewForm(false);
      setSuccessMsg("Questao criada com sucesso.");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar questao.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (q: AdminTestQuestion | AdminAssessmentQuestion) => {
    setEditingId(q.id);
    setEditText(q.question_text);
    setEditOptions(JSON.stringify(q.options, null, 2));
  };

  const handleSaveEdit = async (id: number) => {
    if (!token) return;
    setLoading(true);
    try {
      let opts: Array<{ text: string; points: number }> | undefined;
      try {
        opts = JSON.parse(editOptions);
      } catch {
        opts = undefined;
      }

      if (tab === "test-questions") {
        await updateTestQuestion(token, id, {
          question_text: editText,
          options: opts,
        });
      } else {
        await updateAssessmentQuestion(token, id, {
          question_text: editText,
          options: opts,
        });
      }

      setEditingId(null);
      setSuccessMsg("Questao atualizada.");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao atualizar questao.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar esta questao?")) return;
    if (!token) return;
    setLoading(true);
    try {
      if (tab === "test-questions") {
        await deleteTestQuestion(token, id);
      } else {
        await deleteAssessmentQuestion(token, id);
      }
      setSuccessMsg("Questao eliminada.");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao eliminar questao.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──

  return (
    <div className="flex min-h-screen bg-background">
      <AdminMobileHeader />
      <AdminSidebar activeItem="avaliacoes" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Gestao de Avaliacoes
            </h1>
            <p className="mt-2 text-muted-foreground">
              Criar, editar e organizar as perguntas dos testes e avaliacoes.
            </p>
            {loading ? (
              <p className="mt-2 text-sm text-muted-foreground">
                A carregar...
              </p>
            ) : null}
            {error ? (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            ) : null}
            {successMsg ? (
              <p className="mt-2 text-sm font-medium text-green-600">
                {successMsg}
              </p>
            ) : null}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {([
              ["test-questions", "Testes de Competencias"],
              ["assessment-questions", "Avaliacoes de Idosos"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  setExpandedCat(null);
                  setEditingId(null);
                }}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  tab === key
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Add button */}
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={() => setShowNewForm(!showNewForm)}
            >
              <Plus className="h-4 w-4" />
              Nova Questao
            </Button>
          </div>

          {/* New question form */}
          {showNewForm && (
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardContent className="space-y-4 p-5">
                <h3 className="font-semibold text-foreground">
                  Nova Questao
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Categoria (chave)</Label>
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Ex: loneliness, safety..."
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pergunta</Label>
                  <Input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Texto da pergunta..."
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Opcoes (JSON: [&#123;"text":"...","points":N&#125;,...])
                  </Label>
                  <Input
                    value={newOptions}
                    onChange={(e) => setNewOptions(e.target.value)}
                    placeholder='[{"text":"Sim","points":10},{"text":"Nao","points":0}]'
                    className="h-10 rounded-xl font-mono text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-xl"
                    onClick={handleCreate}
                    disabled={!newText.trim()}
                  >
                    <Save className="h-4 w-4" />
                    Criar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setShowNewForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories */}
          <div className="space-y-4">
            {Object.entries(currentGroups).map(([catKey, questions]) => {
              const meta =
                (tab === "test-questions"
                  ? testCategoryMeta
                  : assessCategoryMeta)[catKey] || {
                  ...defaultMeta,
                  label: catKey,
                };
              const Icon = meta.icon;
              const isExpanded = expandedCat === catKey;

              return (
                <Card
                  key={catKey}
                  className="border-border bg-card shadow-sm"
                >
                  {/* Category header */}
                  <button
                    className="flex w-full items-center justify-between p-5 text-left"
                    onClick={() =>
                      setExpandedCat(isExpanded ? null : catKey)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {meta.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {questions.length} perguntas
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Questions list */}
                  {isExpanded && (
                    <div className="border-t border-border px-5 pb-5">
                      <div className="divide-y divide-border">
                        {questions.map((q) => (
                          <div
                            key={q.id}
                            className="py-3 first:pt-4 last:pb-0"
                          >
                            {editingId === q.id ? (
                              /* Edit mode */
                              <div className="space-y-3">
                                <Input
                                  value={editText}
                                  onChange={(e) =>
                                    setEditText(e.target.value)
                                  }
                                  className="h-10 rounded-xl"
                                />
                                <Input
                                  value={editOptions}
                                  onChange={(e) =>
                                    setEditOptions(e.target.value)
                                  }
                                  className="h-10 rounded-xl font-mono text-xs"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="gap-1 rounded-lg"
                                    onClick={() =>
                                      handleSaveEdit(q.id)
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Guardar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg"
                                    onClick={() =>
                                      setEditingId(null)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* View mode */
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {q.order}. {q.question_text}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {(q.options || []).length} opcoes
                                  </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleEdit(q)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive"
                                    onClick={() =>
                                      handleDelete(q.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {questions.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          Nenhuma pergunta nesta categoria.
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {Object.keys(currentGroups).length === 0 && !loading && (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
                <Layers className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-foreground">
                  Nenhuma questao encontrada
                </p>
                <p className="text-sm text-muted-foreground">
                  Execute o seed ou crie a primeira questao.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Helper ──

function groupBy<T extends { category?: string | null }>(
  items: T[],
  key: string,
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const cat = (item as Record<string, unknown>)[key] as string | undefined;
    const k = cat || "sem-categoria";
    (groups[k] ||= []).push(item);
  }
  return groups;
}
