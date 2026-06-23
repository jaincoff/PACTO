"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { WelcomeSection } from "@/components/welcome-section";
import { ApprovalCard } from "@/components/approval-card";
import { QuickActions } from "@/components/quick-actions";
import { HelpSection } from "@/components/help-section";
import {
  ArrowLeft,
  ArrowRight,
  UserPlus,
  Heart,
  Search,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Phone,
  MapPin,
  Calendar,
  User,
  Brain,
  Home,
  Smile,
  Leaf,
  CheckCircle2,
  Users,
  Loader2,
} from "lucide-react";
import {
  getDashboardOverview,
  getStoredAuthToken,
  createElder,
  listMyElders,
  getElderAssessmentResults,
  getElderDetail,
  getElderPhotoUrl,
  listMyCases,
  getUserBasicInfo,
  type ElderAssessmentResultsResponse,
  type ElderListItem,
  type ElderDetail,
} from "../../../lib/api";

export default function PainelPage() {
  return (
    <AuthGuard roles={["volunteer", "supervisor", "elder", "admin"]}>
      <Suspense fallback={null}>
        <PainelContent />
      </Suspense>
    </AuthGuard>
  );
}

type View = "dashboard" | "adicionar" | "gerir" | "perfil";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500",
  new: "bg-blue-500",
  attention: "bg-amber-500",
  "no-contact": "bg-red-500",
  in_progress: "bg-amber-500",
  completed: "bg-emerald-500",
};
const statusBg: Record<string, string> = {
  active: "bg-emerald-50",
  new: "bg-blue-50",
  attention: "bg-amber-50",
  "no-contact": "bg-red-50",
  in_progress: "bg-amber-50",
  completed: "bg-emerald-50",
};
const statusLabel: Record<string, string> = {
  active: "Ativo",
  new: "Novo",
  attention: "Necessita acompanhamento",
  "no-contact": "Sem contacto recente",
  in_progress: "Em progresso",
  completed: "Concluido",
};

function PainelContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const action = sp.get("action") || "dashboard";
  const elderId = sp.get("elderId");
  const eldCatParam = sp.get("cat");
  const token = getStoredAuthToken();

  const [dash, setDash] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) {
      setError("Sessao expirada.");
      setLoading(false);
      return;
    }
    getDashboardOverview(token)
      .then(setDash)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Elder form
  const [nome, setNome] = useState("");
  const [ano, setAno] = useState("");
  const [addr, setAddr] = useState("");
  const [eml, setEml] = useState("");
  const [tel, setTel] = useState("");
  const [emerg, setEmerg] = useState("");
  const [gen, setGen] = useState("");
  const [terms, setTerms] = useState(false);
  const [subm, setSubm] = useState(false);
  const [fb, setFb] = useState("");
  const [eldOk, setEldOk] = useState(false);

  // Elder list (from cases)
  const [elders, setElders] = useState<ElderListItem[]>([]);
  const [eldLoad, setEldLoad] = useState(true);
  const [sq, setSq] = useState("");
  const [sf, setSf] = useState("");
  useEffect(() => {
    if (action === "gerir" && token) {
      listMyElders(token)
        .then(setElders)
        .catch(() => {})
        .finally(() => setEldLoad(false));
    }
  }, [action, token]);

  // Profile
  const [elderProfile, setElderProfile] = useState<ElderDetail | null>(null);
  const [eldProfLoad, setEldProfLoad] = useState(false);
  const [eldResults, setEldResults] =
    useState<ElderAssessmentResultsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "avaliacoes">("info");
  const [casePeers, setCasePeers] = useState<{
    volunteer1: { id: string; name: string } | null;
    volunteer2: { id: string; name: string } | null;
    supervisor: { id: string; name: string } | null;
  } | null>(null);
  const [peerDetail, setPeerDetail] = useState<{ name: string; email: string; phone: string | null } | null>(null);
  const [peerDetailLoading, setPeerDetailLoading] = useState(false);

  useEffect(() => {
    if (action === "perfil" && elderId && token) {
      setEldProfLoad(true);
      setCasePeers(null);
      getElderDetail(token, elderId)
        .then((ed) => {
          setElderProfile(ed);
          if (ed.answers) {
            const a: Record<string, string> = {};
            for (const aa of ed.answers)
              a[String(aa.question_id)] = String(aa.chosen_option_index + 1);
            setEldQAnswers(a);
          }
        })
        .catch(() => {})
        .finally(() => setEldProfLoad(false));
      getElderAssessmentResults(token, elderId)
        .then(setEldResults)
        .catch(() => {});
      // Fetch case peers for this elder
      listMyCases(token).then((cases) => {
        const match = cases.find((c) => c.elder_id === elderId);
        if (match) {
          setCasePeers({
            volunteer1: match.volunteer1_name ? { id: match.volunteer1_id, name: match.volunteer1_name } : null,
            volunteer2: match.volunteer2_name ? { id: match.volunteer2_id!, name: match.volunteer2_name } : null,
            supervisor: match.supervisor_name ? { id: match.supervisor_id, name: match.supervisor_name } : null,
          });
        }
      }).catch(() => {});
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"}/elders/questions/grouped`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      )
        .then((r) => r.json())
        .then((d) => {
          setEldQGroups(d.categories || []);
        })
        .catch(() => {});
    }
  }, [action, elderId, token]);

  // Elder questionnaire state
  const [eldQGroups, setEldQGroups] = useState<any[]>([]);
  const [eldQCat, setEldQCat] = useState<string | null>(null);
  const [eldQAnswers, setEldQAnswers] = useState<Record<string, string>>({});
  const [eldQSaving, setEldQSaving] = useState(false);
  const [eldQAllDone, setEldQAllDone] = useState(false);
  const [eldQResults, setEldQResults] =
    useState<ElderAssessmentResultsResponse | null>(null);
  useEffect(() => {
    if (action === "eldertest" && elderId && token) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"}/elders/questions/grouped`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      )
        .then((r) => r.json())
        .then((d) => {
          setEldQGroups(d.categories || []);
          if (eldCatParam) setEldQCat(eldCatParam);
          getElderDetail(token, elderId)
            .then((ed) => {
              if (ed.answers) {
                const a: Record<string, string> = {};
                for (const aa of ed.answers)
                  a[String(aa.question_id)] = String(
                    aa.chosen_option_index + 1,
                  );
                setEldQAnswers(a);
                const totalQs = d.total_questions || 0;
                if (Object.keys(a).length >= totalQs && totalQs > 0) {
                  setEldQAllDone(true);
                  getElderAssessmentResults(token, elderId)
                    .then(setEldQResults)
                    .catch(() => {});
                }
              }
            })
            .catch(() => {});
        })
        .catch(() => {});
    }
  }, [action, elderId, token]);

  const eldQQuestions: any[] =
    eldQGroups.find((c: any) => c.key === eldQCat)?.questions || [];
  const eldQTotal = eldQQuestions.length;
  const eldQAnswered = eldQQuestions.filter(
    (q: any) => !!eldQAnswers[String(q.id)],
  ).length;
  const eldQProg = eldQTotal > 0 ? (eldQAnswered / eldQTotal) * 100 : 0;

  const postElderAnswer = async (qId: string, idx: number) => {
    if (!token || !elderId) return;
    setEldQSaving(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"}/elders/${elderId}/questionnaire/answer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question_id: Number(qId),
          chosen_option_index: idx,
        }),
      },
    )
      .catch(() => {})
      .finally(() => setEldQSaving(false));
  };

  const nav = (a: string, extra?: string) => {
    router.push(`/voluntario/painel?action=${a}${extra || ""}`);
  };

  const catIcons: Record<string, typeof Brain> = {
    "bem-estar-psicologico": Brain,
    loneliness: Heart,
    selfcare: Home,
    depression: Smile,
    quality_of_life: Leaf,
  };
  const eldQScoring: Record<
    string,
    { thresholds: Array<[number, number, string, string]> }
  > = {
    "bem-estar-psicologico": {
      thresholds: [
        [
          27,
          36,
          "elevado",
          "Demonstra ter um elevado nível de bem-estar psicológico. Sente-se satisfeita/o com a sua vida, confiante nas suas decisões, com objetivos claros, boas relações interpessoais e uma atitude positiva face a si própria/o e ao futuro.",
        ],
        [
          17,
          26,
          "moderado",
          "As suas respostas sugerem um nível moderado de bem-estar. Apresenta algumas áreas positivas, mas também enfrenta desafios ou dúvidas em certas dimensões da vida, podendo beneficiar de maior reflexão ou desenvolvimento pessoal.",
        ],
        [
          6,
          16,
          "baixo",
          "As suas respostas indicam um baixo nível de bem-estar psicológico. Podem existir dificuldades significativas na perceção de sentido de vida, autoestima, relações interpessoais ou gestão do quotidiano.",
        ],
      ],
    },
    loneliness: {
      thresholds: [
        [
          16,
          32,
          "baixo",
          "Indica um baixo nível de solidão. A pessoa tende a sentir-se emocionalmente ligada aos outros, com uma rede social satisfatória e um sentimento de pertença adequado.",
        ],
        [
          33,
          40,
          "moderado",
          "Sugere um nível moderado de solidão. A pessoa pode experienciar momentos de isolamento emocional ou social, embora ainda mantenha alguns vínculos significativos.",
        ],
        [
          41,
          64,
          "elevado",
          "Indica um elevado sentimento de solidão, associado a perceções frequentes de isolamento, dificuldade em estabelecer ou manter relações significativas e possível impacto no bem-estar emocional.",
        ],
      ],
    },
    selfcare: {
      thresholds: [
        [
          22,
          28,
          "independencia_total",
          "A pessoa realiza todas ou quase todas as atividades sem ajuda, de forma autónoma. Apresenta elevada capacidade funcional e autonomia nas tarefas do dia a dia.",
        ],
        [
          15,
          21,
          "dependencia_moderada",
          "A pessoa é maioritariamente autónoma, mas necessita de alguma ajuda em tarefas específicas ou mais complexas. Pode existir alguma fragilidade funcional, mas mantém boa capacidade de autocuidado.",
        ],
        [
          8,
          14,
          "dependencia_significativa",
          "A pessoa apresenta limitações importantes na realização das atividades diárias e precisa de apoio frequente de terceiros. Existe perda de autonomia em várias áreas.",
        ],
        [
          0,
          7,
          "dependencia_grave",
          "A pessoa depende de terceiros para a maioria das atividades básicas e instrumentais. Existe comprometimento funcional severo e elevada necessidade de cuidados.",
        ],
      ],
    },
    depression: {
      thresholds: [
        [
          0,
          2,
          "normal",
          "Ausência de sintomatologia depressiva clinicamente significativa.",
        ],
        [
          3,
          4,
          "leve",
          "Sintomatologia depressiva ligeira. Pode beneficiar de acompanhamento.",
        ],
        [
          5,
          6,
          "moderada",
          "Sintomatologia depressiva moderada. Recomenda-se avaliação clínica.",
        ],
        [
          7,
          10,
          "grave",
          "Sintomatologia depressiva grave. Recomenda-se avaliação clínica urgente.",
        ],
      ],
    },
    quality_of_life: {
      thresholds: [
        [25, 32, "elevada", "Perceção elevada de qualidade de vida."],
        [17, 24, "moderada", "Perceção moderada de qualidade de vida."],
        [9, 16, "baixa", "Perceção baixa de qualidade de vida."],
        [0, 8, "muito_baixa", "Perceção muito baixa de qualidade de vida."],
      ],
    },
  };
  const getEldQResult = (catKey: string, qs: any[]) => {
    const scoring = eldQScoring[catKey];
    if (!scoring) return null;
    let score = 0;
    let max = 0;

    for (const q of qs) {
      const options = q.options || [];
      max +=
        options.length > 0
          ? Math.max(...options.map((x: any) => x.points || 0))
          : 0;
      const answer = eldQAnswers[String(q.id)];
      if (answer) {
        const optionIndex = Number(answer) - 1;
        if (optionIndex >= 0 && optionIndex < options.length) {
          score += options[optionIndex].points || 0;
        }
      }
    }

    if (max === 0) return null;
    const threshold = scoring.thresholds.find(
      ([low, high]) => score >= low && score <= high,
    );
    if (!threshold) {
      return {
        score,
        max,
        percentage: Math.round((score / max) * 100),
        level: "desconhecido",
        interpretation: "",
      };
    }

    const [, , level, interpretation] = threshold;
    return {
      score,
      max,
      percentage: Math.round((score / max) * 100),
      level,
      interpretation,
    };
  };

  const openPeerDetail = async (userId: string) => {
    if (!token) return;
    setPeerDetailLoading(true);
    try {
      const user = await getUserBasicInfo(token, userId);
      setPeerDetail({ name: user.name, email: user.email, phone: user.phone });
    } catch {
      setPeerDetail({ name: "—", email: "—", phone: null });
    } finally {
      setPeerDetailLoading(false);
    }
  };

  const filtered = elders.filter(
    (e) =>
      (!sq || (e.name || "").toLowerCase().includes(sq.toLowerCase())) &&
      (!sf || e.status === sf),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setFb("Sessao expirada.");
      return;
    }
    if (!terms) {
      setFb("Aceite os Termos.");
      return;
    }
    setSubm(true);
    try {
      await createElder(token, {
        name: nome.trim(),
        age: ano ? new Date().getFullYear() - parseInt(ano) : null,
        email: eml || undefined,
        phone: tel || undefined,
        address: addr || undefined,
        emergency_contact: emerg || undefined,
      });
      setEldOk(true);
    } catch (err) {
      setFb(err instanceof Error ? err.message : "Falha.");
    } finally {
      setSubm(false);
    }
  };

  // ── ADD ELDER ──
  if (action === "adicionar")
    return (
      <div className="flex min-h-screen">
        <MobileHeader />
        <Sidebar activeItem="painel" />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => nav("")}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Adicionar Idoso</h1>
              <p className="mt-2 text-muted-foreground">
                Registe um novo idoso.
              </p>
            </div>
            {eldOk ? (
              <Card className="border-0 bg-gradient-to-br from-primary/5 to-card">
                <CardContent className="flex flex-col items-center p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <UserPlus className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold">Idoso criado!</h2>
                  <p className="mt-2 text-muted-foreground">
                    O idoso foi registado.
                  </p>
                  <Button
                    className="mt-4 gap-2 rounded-xl"
                    onClick={() => {
                      setEldOk(false);
                      nav("");
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Painel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <form onSubmit={handleCreate} className="space-y-5">
                    {fb && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {fb}
                      </div>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Nome Completo</Label>
                        <Input
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="h-12 rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ano de Nascimento</Label>
                        <Input
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="Ex: 1950"
                          value={ano}
                          onChange={(e) =>
                            setAno(e.target.value.replace(/[^0-9]/g, ""))
                          }
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sexo</Label>
                        <RadioGroup
                          value={gen}
                          onValueChange={setGen}
                          className="flex gap-4"
                        >
                          <label className="flex items-center gap-2">
                            <RadioGroupItem value="masculino" />
                            <span className="text-sm">Masculino</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <RadioGroupItem value="feminino" />
                            <span className="text-sm">Feminino</span>
                          </label>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={eml}
                          onChange={(e) => setEml(e.target.value)}
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telemovel</Label>
                        <Input
                          value={tel}
                          onChange={(e) => setTel(e.target.value)}
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Morada</Label>
                        <Input
                          value={addr}
                          onChange={(e) => setAddr(e.target.value)}
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Contacto de Emergencia</Label>
                        <Input
                          value={emerg}
                          onChange={(e) => setEmerg(e.target.value)}
                          className="h-12 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={terms}
                        onChange={(e) => setTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded"
                      />
                      <Label className="text-sm text-muted-foreground">
                        Confirmo que obtive consentimento do idoso.
                      </Label>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => nav("")}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="rounded-xl"
                        disabled={subm}
                      >
                        {subm ? "A criar..." : "Criar Idoso"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    );

  // ── GERIR ELDERS ──
  if (action === "gerir")
    return (
      <div className="flex min-h-screen">
        <MobileHeader />
        <Sidebar activeItem="" />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 mb-2"
                  onClick={() => nav("")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                  Gerir Idosos
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Acompanhe as pessoas idosas registadas.
                </p>
              </div>
              <Button
                className="h-12 gap-2 rounded-xl"
                onClick={() => nav("adicionar")}
              >
                <UserPlus className="h-5 w-5" />
                Adicionar Idoso
              </Button>
            </div>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome..."
                      value={sq}
                      onChange={(e) => setSq(e.target.value)}
                      className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="relative min-w-[200px]">
                    <select
                      value={sf}
                      onChange={(e) => setSf(e.target.value)}
                      className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Todos os estados</option>
                      <option value="active">Ativo</option>
                      <option value="in_progress">Em progresso</option>
                      <option value="completed">Concluido</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {eldLoad ? (
              <p className="text-sm text-muted-foreground">A carregar...</p>
            ) : filtered.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    Nenhum resultado
                  </h3>
                  <p className="max-w-sm text-muted-foreground">
                    Nao foram encontrados idosos com os filtros selecionados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => {
                  const sc = statusColors[p.status] || "bg-gray-500";
                  const sb = statusBg[p.status] || "bg-gray-50";
                  const sl = statusLabel[p.status] || p.status;
                  return (
                    <Card
                      key={p.id}
                      className="h-full border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                      onClick={() => nav("perfil", `&elderId=${p.id}`)}
                    >
                      <CardContent className="relative flex flex-col items-center p-6 text-center">
                        <div
                          className={`absolute right-4 top-4 h-3 w-3 rounded-full ${sc}`}
                          title={sl}
                        />
                        <UserAvatar photo={getElderPhotoUrl(p.id, p.photo)} name={p.name} gender={undefined} size={96} className="mb-4 shadow-md" />
                        <h3 className="mb-2 text-lg font-semibold">{p.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {p.age ? `${p.age} anos` : ""}
                        </span>
                        <div
                          className={`mt-4 rounded-full px-3 py-1 text-xs font-medium ${sb}`}
                        >
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${sc} mr-1.5`}
                          />
                          {sl}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card className="border-border bg-gradient-to-r from-primary/5 to-transparent shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    Cada ligacao faz a diferenca.
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    O acompanhamento continuo ajuda a combater a solidao.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );

  // ── ELDER PROFILE ──
  if (action === "perfil" && elderId) {
    const catIcons: Record<string, typeof Brain> = {
      "bem-estar-psicologico": Brain,
      loneliness: Heart,
      selfcare: Home,
      depression: Smile,
      quality_of_life: Leaf,
    };
    return (
      <div className="flex min-h-screen">
        <MobileHeader />
        <Sidebar activeItem="" />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => nav("gerir")}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar a Gestao
            </Button>
            {eldProfLoad ? (
              <p className="text-muted-foreground">A carregar...</p>
            ) : elderProfile ? (
              <>
                {/* Profile Header */}
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-start">
                  <UserAvatar photo={getElderPhotoUrl(elderId, elderProfile.photo)} name={elderProfile.name} gender={undefined} size={112} className="shrink-0 shadow-lg" />
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold">{elderProfile.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {elderProfile.age || "—"} anos
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        {statusLabel[elderProfile.status] ||
                          elderProfile.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Case Peers */}
                {casePeers && (
                  <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-5">
                      <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                        <Users className="h-5 w-5 text-primary" />
                        Equipa do Caso
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() => casePeers.volunteer1 && openPeerDetail(casePeers.volunteer1.id)}
                          disabled={!casePeers.volunteer1}
                          className="rounded-lg border border-border bg-secondary/20 p-3 text-center transition-colors hover:bg-secondary/50 disabled:opacity-50"
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Voluntário 1</p>
                          <p className="mt-1 font-medium text-foreground">{casePeers.volunteer1?.name || "—"}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => casePeers.volunteer2 && openPeerDetail(casePeers.volunteer2.id)}
                          disabled={!casePeers.volunteer2}
                          className="rounded-lg border border-border bg-secondary/20 p-3 text-center transition-colors hover:bg-secondary/50 disabled:opacity-50"
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Voluntário 2</p>
                          <p className="mt-1 font-medium text-foreground">{casePeers.volunteer2?.name || "—"}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => casePeers.supervisor && openPeerDetail(casePeers.supervisor.id)}
                          disabled={!casePeers.supervisor}
                          className="rounded-lg border border-border bg-secondary/20 p-3 text-center transition-colors hover:bg-secondary/50 disabled:opacity-50"
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Supervisor</p>
                          <p className="mt-1 font-medium text-foreground">{casePeers.supervisor?.name || "—"}</p>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Peer Detail Dialog */}
                <Dialog open={!!peerDetail} onOpenChange={(o) => { if (!o) setPeerDetail(null) }}>
                  <DialogContent className="rounded-2xl sm:max-w-sm">
                    {peerDetailLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : peerDetail ? (
                      <>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                              {peerDetail.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-lg">{peerDetail.name}</p>
                              <p className="text-sm font-normal text-muted-foreground">Membro da equipa</p>
                            </div>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 text-sm text-muted-foreground">
                          <p><span className="font-medium text-foreground">Email:</span> {peerDetail.email}</p>
                          <p><span className="font-medium text-foreground">Telefone:</span> {peerDetail.phone || "—"}</p>
                        </div>
                        <DialogFooter>
                          <Button className="rounded-xl" onClick={() => setPeerDetail(null)}>
                            Fechar
                          </Button>
                        </DialogFooter>
                      </>
                    ) : null}
                  </DialogContent>
                </Dialog>

                {/* Contact Info Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {elderProfile.phone && (
                    <Card className="border-border bg-card">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Phone className="h-5 w-5 shrink-0 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Telemovel
                          </p>
                          <p className="text-sm font-medium">
                            {elderProfile.phone}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {elderProfile.email && (
                    <Card className="border-border bg-card">
                      <CardContent className="flex items-center gap-3 p-4">
                        <User className="h-5 w-5 shrink-0 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium truncate max-w-[180px]">
                            {elderProfile.email}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {elderProfile.address && (
                    <Card className="border-border bg-card">
                      <CardContent className="flex items-center gap-3 p-4">
                        <MapPin className="h-5 w-5 shrink-0 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Morada
                          </p>
                          <p className="text-sm font-medium truncate max-w-[180px]">
                            {elderProfile.address}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="border-border bg-card">
                    <CardContent className="flex items-center gap-3 p-4">
                      <Calendar className="h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Registado
                        </p>
                        <p className="text-sm font-medium">
                          {elderProfile.created_at
                            ? new Date(
                                elderProfile.created_at,
                              ).toLocaleDateString("pt-PT")
                            : "—"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-border">
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`pb-2 text-sm font-medium ${activeTab === "info" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                  >
                    Informacoes
                  </button>
                  <button
                    onClick={() => setActiveTab("avaliacoes")}
                    className={`pb-2 text-sm font-medium ${activeTab === "avaliacoes" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                  >
                    Avaliacoes
                  </button>
                </div>

                {activeTab === "info" && (
                  <Card className="border-border bg-card">
                    <CardContent className="space-y-3 p-6">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Contacto de Emergencia
                        </Label>
                        <p className="text-sm">
                          {elderProfile.emergency_contact || "—"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === "avaliacoes" && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {eldQGroups.length > 0 ? (
                      eldQGroups.map((cat: any) => {
                        const Icon = catIcons[cat.key] || Brain;
                        const ids = cat.questions.map((q: any) => String(q.id));
                        let answered = 0;
                        for (const i of ids) if (eldQAnswers[i]) answered++;
                        const status =
                          answered === 0
                            ? "not_started"
                            : answered >= cat.questions.length
                              ? "completed"
                              : "in_progress";
                        const isComp = status === "completed";
                        const sc =
                          status === "not_started"
                            ? "bg-secondary text-muted-foreground"
                            : status === "in_progress"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700";
                        const sl =
                          status === "not_started"
                            ? "Nao iniciado"
                            : status === "in_progress"
                              ? "Em progresso"
                              : "Concluido";
                        const interp = isComp
                          ? getEldQResult(cat.key, cat.questions)
                          : null;
                        return (
                          <Card key={cat.key} className="shadow-sm">
                            <CardContent className="flex flex-col p-6">
                              <div className="mb-3 flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                    <Icon className="h-5 w-5 text-primary" />
                                  </div>
                                  <h3 className="font-semibold">{cat.label}</h3>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc}`}
                                >
                                  {sl}
                                </span>
                              </div>
                              {cat.questions.length > 0 && (
                                <div className="mb-3 h-1.5 rounded-full bg-secondary">
                                  <div
                                    className={`h-full rounded-full ${interp ? (interp.percentage >= 75 ? "bg-green-500" : interp.percentage >= 50 ? "bg-amber-500" : "bg-red-500") : "bg-primary"}`}
                                    style={{
                                      width: `${interp ? Math.round(interp.percentage) : Math.round((answered / cat.questions.length) * 100)}%`,
                                    }}
                                  />
                                </div>
                              )}
                              {interp ? (
                                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 space-y-1.5">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    Interpretação
                                  </p>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      Pontuação
                                    </span>
                                    <span className="font-medium">
                                      {interp.score}/{interp.max} ({interp.percentage}%)
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {interp.interpretation}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    {answered}/{cat.questions.length} perguntas
                                  </span>
                                  {isComp ? (
                                    <span className="text-sm font-medium text-green-600">
                                      Completo
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="gap-1 rounded-lg"
                                      onClick={() =>
                                        nav(
                                          "eldertest",
                                          `&elderId=${elderId}&cat=${cat.key}`,
                                        )
                                      }
                                    >
                                      {status === "not_started"
                                        ? "Iniciar"
                                        : "Continuar"}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <Card className="border-border bg-card">
                        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                          <Clock className="h-10 w-10 text-muted-foreground" />
                          <p className="font-medium">
                            Nenhum resultado disponivel
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Complete a avaliacao do idoso para ver os
                            resultados.
                          </p>
                          <Button
                            className="gap-2 rounded-xl"
                            onClick={() =>
                              nav("eldertest", `&elderId=${elderId}`)
                            }
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Fazer Avaliacao
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                  <User className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Idoso nao encontrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── ELDER TEST ──
  if (action === "eldertest" && elderId && eldQAllDone)
    return (
      <div className="flex min-h-screen">
        <MobileHeader />
        <Sidebar activeItem="" />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="mx-auto max-w-5xl space-y-8 p-4 lg:p-8">
            <Card className="border-0 bg-gradient-to-br from-primary/5 to-card shadow-sm">
              <CardContent className="flex flex-col items-center p-8 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="mb-4 text-3xl font-bold">Avaliacao Concluida</h1>
                <p className="mb-8 text-muted-foreground">
                  A avaliacao foi concluida com sucesso.
                </p>
              </CardContent>
            </Card>
            {eldQResults?.results && (
              <div>
                <h2 className="mb-4 text-2xl font-bold">Resultados</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {Object.entries(eldQResults.results).map(([k, r]: any) => {
                    const Icon = catIcons[k] || Brain;
                    const lc =
                      r.level === "elevado" || r.level === "elevada"
                        ? "bg-green-100 text-green-700"
                        : r.level === "moderado" || r.level === "moderada"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700";
                    return (
                      <Card key={k} className="shadow-sm">
                        <CardContent className="flex flex-col p-6">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <h3 className="font-semibold">{r.label || k}</h3>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${lc}`}
                            >
                              {r.level}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Pontuacao
                              </span>
                              <span className="font-medium">
                                {r.score}/{r.max} ({r.percentage || 0}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-secondary">
                              <div
                                className={`h-full rounded-full ${(r.percentage || 0) >= 75 ? "bg-green-500" : (r.percentage || 0) >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: (r.percentage || 0) + "%" }}
                              />
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">
                            {r.interpretation}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
            <Button
              className="gap-2 rounded-xl"
              onClick={() => nav("perfil", `&elderId=${elderId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Perfil
            </Button>
          </div>
        </main>
      </div>
    );
  if (action === "eldertest" && elderId)
    return (
      <div className="flex min-h-screen">
        <MobileHeader />
        <Sidebar activeItem="" />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => nav("perfil", `&elderId=${elderId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Perfil
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Avaliacao do Idoso</h1>
              <p className="mt-2 text-muted-foreground">
                Complete cada seccao da avaliacao.
              </p>
            </div>

            {!eldQCat ? (
              <div className="grid gap-4 md:grid-cols-2">
                {eldQGroups.map((cat: any) => {
                  const Icon = catIcons[cat.key] || Brain;
                  const ids = cat.questions.map((q: any) => String(q.id));
                  let answered = 0;
                  for (const i of ids) if (eldQAnswers[i]) answered++;
                  const status =
                    answered === 0
                      ? "not_started"
                      : answered >= cat.questions.length
                        ? "completed"
                        : "in_progress";
                  const isComp = status === "completed";
                  const sc =
                    status === "not_started"
                      ? "bg-secondary text-muted-foreground"
                      : status === "in_progress"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700";
                  const sl =
                    status === "not_started"
                      ? "Nao iniciado"
                      : status === "in_progress"
                        ? "Em progresso"
                        : "Concluido";
                  const interp = isComp
                    ? getEldQResult(cat.key, cat.questions)
                    : null;
                  return (
                    <Card
                      key={cat.key}
                      className={`shadow-sm ${!isComp ? "cursor-pointer hover:shadow-md" : ""}`}
                      onClick={() => {
                        if (!isComp) setEldQCat(cat.key);
                      }}
                    >
                      <CardContent className="flex flex-col p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc}`}
                          >
                            {sl}
                          </span>
                        </div>
                        <h3 className="font-semibold">{cat.label}</h3>
                        {cat.questions.length > 0 && (
                          <div className="mt-3 mb-3 h-1.5 rounded-full bg-secondary">
                            <div
                              className={`h-full rounded-full ${interp ? (interp.percentage >= 75 ? "bg-green-500" : interp.percentage >= 50 ? "bg-amber-500" : "bg-red-500") : "bg-primary"}`}
                              style={{
                                width: `${interp ? Math.round(interp.percentage) : Math.round((answered / cat.questions.length) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                        {interp ? (
                          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                              Interpretação
                            </p>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Pontuação
                              </span>
                              <span className="font-medium">
                                {interp.score}/{interp.max} ({interp.percentage}%)
                              </span>
                            </div>
                            <p className="text-sm text-emerald-950/80">
                              {interp.interpretation}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {answered}/{cat.questions.length} perguntas
                            </span>
                            {isComp ? (
                              <span className="text-sm font-medium text-green-600">
                                Completo
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                className="gap-1 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEldQCat(cat.key);
                                }}
                              >
                                {status === "not_started"
                                  ? "Iniciar"
                                  : "Continuar"}
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => {
                    setEldQCat(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar as seccoes
                </Button>
                <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-5 py-3">
                  {(() => {
                    const Icon = catIcons[eldQCat] || Brain;
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Seccao
                    </span>
                    <h2 className="font-semibold">
                      {eldQGroups.find((c: any) => c.key === eldQCat)?.label ||
                        eldQCat}
                    </h2>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {eldQAnswered} de {eldQTotal} respondidas
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(eldQProg)}%
                    </span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${eldQProg}%` }}
                    />
                  </div>
                  {eldQSaving && (
                    <p className="mt-1 text-right text-xs text-muted-foreground">
                      A guardar...
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-6">
                  {eldQQuestions.map((q: any, qi: number) => {
                    const qId = String(q.id);
                    const cur = eldQAnswers[qId];
                    const opts = q.options || [];
                    return (
                      <Card
                        key={q.id}
                        className="border-border bg-card shadow-sm"
                      >
                        <CardContent className="p-6">
                          <div className="mb-4 flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {qi + 1}
                            </span>
                            <p className="pt-1 text-lg font-medium leading-relaxed">
                              &ldquo;{q.question_text}&rdquo;
                            </p>
                          </div>
                          <div
                            className="flex flex-wrap gap-3"
                            role="radiogroup"
                          >
                            {opts.map((opt: any, oi: number) => {
                              const v = String(oi + 1);
                              const sel = cur === v;
                              return (
                                <label
                                  key={oi}
                                  className={`flex min-h-14 min-w-16 flex-1 cursor-pointer items-center justify-center rounded-xl border-2 px-5 py-3 text-base font-semibold transition-all ${sel ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary/50 hover:bg-secondary/50"}`}
                                >
                                  <input
                                    type="radio"
                                    name={`eq-${q.id}`}
                                    value={v}
                                    checked={sel}
                                    onChange={() => {
                                      setEldQAnswers((p) => ({
                                        ...p,
                                        [qId]: v,
                                      }));
                                      postElderAnswer(qId, Number(v) - 1);
                                    }}
                                    className="sr-only"
                                  />
                                  {v}
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
                    onClick={() => {
                      setEldQCat(null);
                      if (
                        eldQGroups.every((c: any) =>
                          c.questions.every(
                            (q: any) => !!eldQAnswers[String(q.id)],
                          ),
                        )
                      ) {
                        setEldQAllDone(true);
                        getElderAssessmentResults(token!, elderId)
                          .then(setEldQResults)
                          .catch(() => {});
                      }
                    }}
                    disabled={eldQAnswered < eldQTotal}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir Seccao
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );

  // ── DASHBOARD ──
  return (
    <div className="flex min-h-screen">
      <MobileHeader />
      <Sidebar activeItem="painel" />
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
          {loading && (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              A carregar...
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          <WelcomeSection />
          {dash?.user?.status === "pending_test" && <ApprovalCard />}
          {dash?.user?.status === "active" && <QuickActions />}
          <HelpSection />
        </div>
      </main>
    </div>
  );
}
