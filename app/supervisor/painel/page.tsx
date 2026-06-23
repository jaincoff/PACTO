"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import {
  Users,
  Heart,
  ClipboardCheck,
  Bell,
  AlertTriangle,
  UserPlus,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Phone,
  Mail,
  UserRound,
  Calendar,
  Brain,
  Smile,
  Home,
  Leaf,
} from "lucide-react";
import { SupervisorSidebar } from "@/components/supervisor-sidebar";
import { SupervisorMobileHeader } from "@/components/supervisor-mobile-header";
import { CaseManagementSection } from "@/components/case-management-section"
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getStoredAuthToken,
  getSupervisorDashboard,
  listPendingVolunteers,
  approveVolunteer,
  listVolunteersWithElders,
  getVolunteerAssessmentResults,
  listAllElders,
  listAllVolunteers,
  getElderDetail,
  getElderPhotoUrl,
  getElderAssessmentResults,
  changeUserStatus,
  type SupervisorDashboardResponse,
  type PendingVolunteer,
  type VolunteerWithElders,
  type AssessmentResultsResponse,
  type AdminUserListItem,
  type ElderListItem,
  type ElderDetail,
  type ElderAssessmentResultsResponse,
} from "../../../lib/api";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const defaultAvatar = null;

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  active: { label: "Ativo", color: "bg-emerald-500", bgColor: "bg-emerald-50" },
  in_progress: {
    label: "Necessita acompanhamento",
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
  },
  completed: {
    label: "Concluido",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
  },
};

export default function SupervisorDashboardPage() {
  return (
    <AuthGuard roles={["supervisor", "admin"]}>
      <Suspense fallback={null}>
        <SupervisorDashboardContent />
      </Suspense>
    </AuthGuard>
  );
}

function SupervisorDashboardContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const action = sp.get("action") || "dashboard";
  const token = getStoredAuthToken();

  const [dashboard, setDashboard] = useState<SupervisorDashboardResponse | null>(null);
  const [pendingVolunteers, setPendingVolunteers] = useState<
    PendingVolunteer[]
  >([]);
  const [expandedVolunteer, setExpandedVolunteer] = useState<string | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [volunteersWithElders, setVolunteersWithElders] = useState<
    VolunteerWithElders[]
  >([]);
  const [expandedResults, setExpandedResults] = useState<string | null>(null);
  const [volunteerResults, setVolunteerResults] =
    useState<AssessmentResultsResponse | null>(null);

  // Inline elder/volunteer list
  const [allElders, setAllElders] = useState<ElderListItem[]>([]);
  const [eldersLoading, setEldersLoading] = useState(false);
  const [elderSearch, setElderSearch] = useState("");
  const [elderStatusFilter, setElderStatusFilter] = useState("");
  const [volunteerList, setVolunteerList] = useState<AdminUserListItem[]>([]);
  const [volListLoading, setVolListLoading] = useState(false);
  const [volSearch, setVolSearch] = useState("");

  // Elder profile
  const elProfId = sp.get("elderId");
  const [elderProfile, setElderProfile] = useState<ElderDetail | null>(null);
  const [elderProfileLoading, setElderProfileLoading] = useState(false);
  const [elderResults, setElderResults] = useState<ElderAssessmentResultsResponse | null>(null);
  const [elderTab, setElderTab] = useState<"info" | "avaliacoes">("info");

  useEffect(() => {
    if (action === "elderProfile" && elProfId && token) {
      setElderProfileLoading(true);
      getElderDetail(token, elProfId).then(setElderProfile).catch(() => {}).finally(() => setElderProfileLoading(false));
      getElderAssessmentResults(token, elProfId).then(setElderResults).catch(() => {});
    }
  }, [action, elProfId, token]);

  useEffect(() => {
    if (action === "idosos" && token) {
      setEldersLoading(true);
      listAllElders(token).then(setAllElders).catch(() => {}).finally(() => setEldersLoading(false));
    }
    if (action === "voluntarios" && token) {
      setVolListLoading(true);
      listAllVolunteers(token).then(setVolunteerList as any).catch(() => {}).finally(() => setVolListLoading(false));
    }
  }, [action, token]);

  useEffect(() => {
    async function loadDashboard() {
      const token = getStoredAuthToken();
      if (!token) {
        setError("Sessao expirada. Inicie sessao novamente.");
        setLoading(false);
        return;
      }

      try {
        const [dash, pending, volsWithElders] = await Promise.all([
          getSupervisorDashboard(token),
          listPendingVolunteers(token),
          listVolunteersWithElders(token),
        ]);
        setDashboard(dash);
        setPendingVolunteers(pending);
        setVolunteersWithElders(volsWithElders.volunteers);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar painel do supervisor.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const handleExpandVolunteer = async (volunteer: PendingVolunteer) => {
    if (expandedVolunteer === volunteer.id) {
      setExpandedVolunteer(null);
      setVolunteerResults(null);
      return;
    }

    setExpandedVolunteer(volunteer.id);
    const token = getStoredAuthToken();
    if (!token) return;

    setLoadingDetail(true);
    try {
      const results = await getVolunteerAssessmentResults(token, volunteer.id);
      setVolunteerResults(results);
    } catch {
      setVolunteerResults(null);
    } finally {
      setLoadingDetail(false);
    }
  };

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

  const handleApprove = async (userId: string) => {
    const token = getStoredAuthToken();
    if (!token) return;

    setApproving(userId);
    try {
      await approveVolunteer(token, userId);
      setPendingVolunteers((prev) => prev.filter((v) => v.id !== userId));
      setExpandedVolunteer(null);
      setVolunteerResults(null);
      if (dashboard) {
        setDashboard({
          ...dashboard,
          kpis: {
            ...dashboard.kpis,
            pending_volunteers: Math.max(
              0,
              (dashboard.kpis.pending_volunteers || 0) - 1,
            ),
          },
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao aprovar voluntario.",
      );
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (userId: string) => {
    const token = getStoredAuthToken();
    if (!token) return;

    setRejecting(userId);
    try {
      await changeUserStatus(token, userId, "inactive");
      setPendingVolunteers((prev) => prev.filter((v) => v.id !== userId));
      setExpandedVolunteer(null);
      setVolunteerResults(null);
      if (dashboard) {
        setDashboard({
          ...dashboard,
          kpis: {
            ...dashboard.kpis,
            pending_volunteers: Math.max(0, (dashboard.kpis.pending_volunteers || 0) - 1),
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao rejeitar voluntario.");
    } finally {
      setRejecting(null);
    }
  };

  const alerts = useMemo(() => {
    const items: Array<{
      id: number;
      message: string;
      action: string;
      href: string;
    }> = [];

    if (dashboard && dashboard.kpis.pending_volunteers > 0) {
      items.push({
        id: 1,
        message: `${dashboard.kpis.pending_volunteers} voluntario(s) aguardam aprovacao.`,
        action: "Rever",
        href: "#pending-volunteers",
      });
    }

    if (dashboard && dashboard.kpis.elders_in_progress > 0) {
      items.push({
        id: 2,
        message: `${dashboard.kpis.elders_in_progress} idoso(s) em acompanhamento.`,
        action: "Ver Idosos",
        href: "/supervisor/idosos",
      });
    }

    if (items.length === 0) {
      items.push({
        id: 3,
        message: "Sem alertas criticos no momento.",
        action: "Atualizar",
        href: "/supervisor/painel",
      });
    }

    return items;
  }, [dashboard]);

  const recentActivity = useMemo(() => {
    const items: Array<{ id: number; text: string; time: string }> = [];

    if (dashboard?.volunteers?.length) {
      const firstVolunteer = dashboard.volunteers[0];
      items.push({
        id: 1,
        text: `${firstVolunteer.email} está ativo no programa.`,
        time: "Atualizado agora",
      });
    }

    if (dashboard?.elders?.length) {
      const firstElder = dashboard.elders[0];
      items.push({
        id: 2,
        text: `${firstElder.name} está com estado ${firstElder.status}.`,
        time: "Atualizado agora",
      });
    }

    if (items.length === 0) {
      items.push({
        id: 4,
        text: "Sem atividade recente para mostrar.",
        time: "Atualizado agora",
      });
    }

    return items;
  }, [dashboard]);

  // ── INLINE: IDOSOS ──
  if (action === "idosos") {
    const filteredElders = allElders.filter(e =>
      (!elderSearch || (e.name || "").toLowerCase().includes(elderSearch.toLowerCase())) &&
      (!elderStatusFilter || e.status === elderStatusFilter)
    );
    return (
      <div className="flex min-h-screen"><SupervisorMobileHeader /><SupervisorSidebar activeItem="idosos" />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0"><div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
          <div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => router.push("/supervisor/painel")}><ArrowLeft className="h-4 w-4"/>Voltar</Button></div>
          <div><h1 className="text-3xl font-bold">Idosos</h1><p className="mt-2 text-muted-foreground">Todos os idosos registados na plataforma.</p></div>
          <Card className="border-border bg-card shadow-sm"><CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"/><input type="text" placeholder="Pesquisar..." value={elderSearch} onChange={e => setElderSearch(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"/></div>
              <select value={elderStatusFilter} onChange={e => setElderStatusFilter(e.target.value)} className="h-12 rounded-xl border border-input bg-background px-4"><option value="">Todos</option><option value="in_progress">Em progresso</option><option value="completed">Concluido</option></select>
            </div>
          </CardContent></Card>
          {eldersLoading ? <p className="text-sm text-muted-foreground">A carregar...</p> : filteredElders.length === 0 ? <Card><CardContent className="flex flex-col items-center gap-3 p-12 text-center"><Heart className="h-10 w-10 text-muted-foreground"/><p className="font-medium">Nenhum idoso encontrado</p></CardContent></Card> :
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredElders.map(e => {
            const sc: Record<string,string> = { in_progress: "bg-amber-500", completed: "bg-emerald-500" };
            const sb: Record<string,string> = { in_progress: "bg-amber-50", completed: "bg-emerald-50" };
            const sl: Record<string,string> = { in_progress: "Em progresso", completed: "Concluido" };
            return (<Card key={e.id} className="border-border bg-card shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/supervisor/painel?action=elderProfile&elderId=${e.id}`)}><CardContent className="flex flex-col items-center p-6 text-center">
              <div className={`absolute right-4 top-4 h-3 w-3 rounded-full ${sc[e.status]||"bg-gray-500"}`}/>
              <UserAvatar photo={getElderPhotoUrl(e.id, e.photo)} name={e.name} gender={undefined} size={96} className="mb-4 shadow-md" />
              <h3 className="text-lg font-semibold">{e.name}</h3><span className="text-sm text-muted-foreground">{e.age ? `${e.age} anos` : ""}</span>
              <div className={`mt-4 rounded-full px-3 py-1 text-xs font-medium ${sb[e.status]||"bg-gray-50"}`}><span className={`inline-block h-1.5 w-1.5 rounded-full ${sc[e.status]||"bg-gray-500"} mr-1.5`}/>{sl[e.status]||e.status}</div>
              {e.total_score != null && <p className="mt-2 text-xs text-muted-foreground">Pontuacao: {e.total_score}</p>}
            </CardContent></Card>);
          })}</div>}
        </div></main></div>
    );
  }

  // ── INLINE: ELDER PROFILE ──
  if (action === "elderProfile" && elProfId) {
    return (
      <div className="flex min-h-screen"><SupervisorMobileHeader /><SupervisorSidebar activeItem="idosos" />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0"><div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push("/supervisor/painel?action=idosos")}><ArrowLeft className="h-4 w-4"/>Voltar a Idosos</Button>
          {elderProfileLoading ? <p className="text-muted-foreground">A carregar...</p> : elderProfile ? <>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-start">
              <UserAvatar photo={getElderPhotoUrl(elProfId, elderProfile.photo)} name={elderProfile.name} gender={undefined} size={112} className="shrink-0 shadow-lg" />
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{elderProfile.name}</h1>
                <p className="text-sm text-muted-foreground">{elderProfile.age || "—"} anos</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{statusConfig[elderProfile.status]?.label || elderProfile.status}</span>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {elderProfile.phone && <Card className="border-border bg-card"><CardContent className="flex items-center gap-3 p-4"><Phone className="h-5 w-5 shrink-0 text-primary"/><div><p className="text-xs text-muted-foreground">Telemovel</p><p className="text-sm font-medium">{elderProfile.phone}</p></div></CardContent></Card>}
              {elderProfile.email && <Card className="border-border bg-card"><CardContent className="flex items-center gap-3 p-4"><Mail className="h-5 w-5 shrink-0 text-primary"/><div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium truncate max-w-[180px]">{elderProfile.email}</p></div></CardContent></Card>}
              <Card className="border-border bg-card"><CardContent className="flex items-center gap-3 p-4"><Calendar className="h-5 w-5 shrink-0 text-primary"/><div><p className="text-xs text-muted-foreground">Registado</p><p className="text-sm font-medium">{elderProfile.created_at ? new Date(elderProfile.created_at).toLocaleDateString("pt-PT") : "—"}</p></div></CardContent></Card>
            </div>
            <div className="flex gap-4 border-b border-border">
              <button onClick={() => setElderTab("info")} className={`pb-2 text-sm font-medium ${elderTab === "info" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Informacoes</button>
              <button onClick={() => setElderTab("avaliacoes")} className={`pb-2 text-sm font-medium ${elderTab === "avaliacoes" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Avaliacoes</button>
            </div>
            {elderTab === "info" && <Card className="border-border bg-card"><CardContent className="space-y-3 p-6"><div><p className="text-xs text-muted-foreground">Contacto de Emergencia</p><p className="text-sm">{elderProfile.emergency_contact || "—"}</p></div></CardContent></Card>}
            {elderTab === "avaliacoes" && (
              <div className="grid gap-6 md:grid-cols-2">
                {(elderResults?.results ? Object.entries(elderResults.results).map(([k, r]) => {
                  const catIcons: Record<string, typeof Brain> = { "bem-estar-psicologico": Brain, "loneliness": Heart, "selfcare": Home, "depression": Smile, "quality_of_life": Leaf };
                  const Icon = catIcons[k] || Brain;
                  const lc = r.level === "elevado" || r.level === "elevada" ? "bg-green-100 text-green-700" : r.level === "moderado" || r.level === "moderada" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                  return (<Card key={k} className="shadow-sm"><CardContent className="flex flex-col p-6">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary"/></div><h3 className="font-semibold">{r.label || k}</h3></div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${lc}`}>{r.level}</span>
                    </div>
                    <div className="space-y-1.5"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Pontuacao</span><span className="font-medium">{r.score}/{r.max} ({r.percentage || 0}%)</span></div><div className="h-2 rounded-full bg-secondary"><div className={`h-full rounded-full ${(r.percentage || 0) >= 75 ? "bg-green-500" : (r.percentage || 0) >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: (r.percentage || 0) + "%" }}/></div></div>
                    <p className="mt-3 text-sm text-muted-foreground">{r.interpretation}</p>
                  </CardContent></Card>);
                }) : <Card className="border-border bg-card"><CardContent className="flex flex-col items-center gap-4 p-12 text-center"><Clock className="h-10 w-10 text-muted-foreground"/><p className="font-medium">Nenhum resultado disponivel</p></CardContent></Card>)}
              </div>
            )}
          </> : <Card className="border-border bg-card"><CardContent className="flex flex-col items-center gap-4 p-12 text-center"><UserRound className="h-10 w-10 text-muted-foreground"/><p className="font-medium">Idoso nao encontrado</p></CardContent></Card>}
        </div></main></div>
    );
  }

  // ── INLINE: VOLUNTARIOS ──
  if (action === "voluntarios") {
    const filteredVols = volunteerList.filter(v => !volSearch || v.name.toLowerCase().includes(volSearch.toLowerCase()) || v.email.toLowerCase().includes(volSearch.toLowerCase()));
    return (
      <div className="flex min-h-screen"><SupervisorMobileHeader /><SupervisorSidebar activeItem="voluntarios" />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0"><div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
          <div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => router.push("/supervisor/painel")}><ArrowLeft className="h-4 w-4"/>Voltar</Button></div>
          <div><h1 className="text-3xl font-bold">Voluntarios</h1><p className="mt-2 text-muted-foreground">Todos os voluntarios registados na plataforma.</p></div>
          <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"/><input type="text" placeholder="Pesquisar..." value={volSearch} onChange={e => setVolSearch(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"/></div>
          {volListLoading ? <p className="text-sm text-muted-foreground">A carregar...</p> : filteredVols.length === 0 ? <Card><CardContent className="flex flex-col items-center gap-3 p-12 text-center"><Users className="h-10 w-10 text-muted-foreground"/><p className="font-medium">Nenhum voluntario encontrado</p></CardContent></Card> :
          <div className="space-y-4">{filteredVols.map(v => {
            const statusStyles: Record<string, string> = {
              active: "bg-green-100 text-green-700",
              pending_approval: "bg-amber-100 text-amber-700",
              pending_admin_approval: "bg-amber-100 text-amber-700",
              pending_test: "bg-blue-100 text-blue-700",
              inactive: "bg-red-100 text-red-700",
            };
            const statusLabels: Record<string, string> = {
              active: "Ativo",
              pending_approval: "Pendente",
              pending_admin_approval: "Pendente",
              pending_test: "Teste pendente",
              inactive: "Inativo",
            };
            return (
            <Card key={v.id} className="border-border bg-card shadow-sm"><CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100"><Users className="h-5 w-5 text-blue-600"/></div><div><h3 className="font-semibold">{v.name}</h3><p className="text-sm text-muted-foreground">{v.email}</p></div></div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[v.status] || "bg-gray-100 text-gray-700"}`}>{statusLabels[v.status] || v.status}</span>
                  {v.test_score != null && <span className="text-xs text-muted-foreground">Teste: {v.test_score}%{v.test_passed ? " ✅" : " ❌"}</span>}
                </div>
              </div>
            </CardContent></Card>
            );
          })}</div>}
        </div></main></div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SupervisorMobileHeader />
      <SupervisorSidebar activeItem="painel" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Painel do Supervisor
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Acompanhe voluntarios, pessoas idosas e o impacto do programa
              PACTO.
            </p>
            {loading ? (
              <p className="mt-2 text-sm text-muted-foreground">
                A carregar dados...
              </p>
            ) : null}
            {!loading && error ? (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          {/* KPI Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Voluntarios Ativos
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {dashboard?.kpis.active_volunteers ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                  <Heart className="h-7 w-7 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Idosos Acompanhados
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {dashboard?.kpis.elders_total ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <ClipboardCheck className="h-7 w-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Avaliacoes Pendentes
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {pendingVolunteers.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <Bell className="h-7 w-7 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alertas</p>
                  <p className="text-3xl font-bold text-foreground">
                    {alerts.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ── Pending Volunteers Section (inline) ── */}
          <section id="pending-volunteers">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Voluntarios Pendentes de Aprovacao
                </h2>
                <p className="text-sm text-muted-foreground">
                  Reveja as respostas dos testes e aprove os voluntarios.
                </p>
              </div>
            </div>

            {pendingVolunteers.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                  </div>
                  <p className="font-medium text-foreground">
                    Nenhum voluntario pendente
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Todos os voluntarios foram revistos.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingVolunteers.map((volunteer) => {
                  const isExpanded = expandedVolunteer === volunteer.id;
                  return (
                    <Card
                      key={volunteer.id}
                      className="border-border bg-card shadow-sm"
                    >
                      <CardContent className="p-5">
                        {/* Summary row */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                              <Clock className="h-5 w-5 text-amber-600" />
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
                            {volunteer.test_passed ? (
                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                Aprovado no teste
                              </span>
                            ) : (
                              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                                Reprovado
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 rounded-lg"
                              onClick={() =>
                                handleExpandVolunteer(volunteer)
                              }
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  Fechar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4" />
                                  Ver Respostas
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1.5 rounded-lg"
                              onClick={() =>
                                handleApprove(volunteer.id)
                              }
                              disabled={approving === volunteer.id || rejecting === volunteer.id}
                            >
                              <CheckCircle className="h-4 w-4" />
                              {approving === volunteer.id
                                ? "A aprovar..."
                                : "Aprovar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 rounded-lg border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleReject(volunteer.id)}
                              disabled={approving === volunteer.id || rejecting === volunteer.id}
                            >
                              <XCircle className="h-4 w-4" />
                              {rejecting === volunteer.id ? "A rejeitar..." : "Rejeitar"}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded assessment results */}
                        {isExpanded && (
                          <div className="mt-4 border-t border-border pt-4">
                            {loadingDetail ? (
                              <p className="text-sm text-muted-foreground">
                                A carregar resultados...
                              </p>
                            ) : volunteerResults?.results ? (
                              <div className="space-y-6">
                                {Object.entries(
                                  volunteerResults.results,
                                ).map(([key, result]) => {
                                  const levelColor =
                                    result.level === "elevado" ||
                                    result.level === "elevada" ||
                                    result.level === "elevadas"
                                      ? "text-green-700 bg-green-100"
                                      : result.level === "moderado" ||
                                          result.level === "moderada" ||
                                          result.level === "moderadas"
                                        ? "text-amber-700 bg-amber-100"
                                        : "text-red-700 bg-red-100";
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
                                                data={Object.entries(result.dimensions).map(
                                                  ([dk, dv]) => ({
                                                    dimension: dv.label || dk,
                                                    value: dv.average,
                                                    fullMark: 5,
                                                  }),
                                                )}
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
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Nenhum resultado disponivel.
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Active Volunteers with Elders */}
          {dashboard?.user?.status === "active" && volunteersWithElders.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Voluntarios Ativos e Seus Idosos
                </h2>
                <p className="text-sm text-muted-foreground">
                  Acompanhe cada voluntario e os idosos atribuidos.
                </p>
              </div>
              <div className="space-y-4">
                {volunteersWithElders.map((volunteer) => {
                  const isExpanded = expandedResults === volunteer.id;
                  return (
                    <Card
                      key={volunteer.id}
                      className="border-border bg-card shadow-sm"
                    >
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
                              onClick={() =>
                                handleViewResults(volunteer.id)
                              }
                            >
                              {isExpanded ? "Fechar" : "Ver Resultados"}
                            </Button>
                          </div>
                        </div>

                        {/* Elders list */}
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
                                  {elder.age ? ` (${elder.age}a)` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Expanded assessment results */}
                        {isExpanded && (
                          <div className="mt-4 border-t border-border pt-4">
                            {loadingDetail ? (
                              <p className="text-sm text-muted-foreground">
                                A carregar resultados...
                              </p>
                            ) : volunteerResults?.results ? (
                              <div className="space-y-6">
                                {Object.entries(
                                  volunteerResults.results,
                                ).map(([key, result]) => {
                                  const levelColor =
                                    result.level === "elevado" ||
                                    result.level === "elevada" ||
                                    result.level === "elevadas"
                                      ? "text-green-700 bg-green-100"
                                      : result.level === "moderado" ||
                                          result.level === "moderada" ||
                                          result.level === "moderadas"
                                        ? "text-amber-700 bg-amber-100"
                                        : "text-red-700 bg-red-100";
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

                                      {/* Radar chart for dimensions */}
                                      {result.dimensions &&
                                        Object.keys(result.dimensions).length > 0 && (
                                          <div className="rounded-xl border border-border bg-secondary/20 p-3">
                                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                              Dimensoes
                                            </p>
                                            <ResponsiveContainer width="100%" height={220}>
                                              <RadarChart
                                                data={Object.entries(result.dimensions).map(
                                                  ([dk, dv]) => ({
                                                    dimension: dv.label || dk,
                                                    value: dv.average,
                                                    fullMark: 5,
                                                  }),
                                                )}
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
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Nenhum resultado disponivel.
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          <CaseManagementSection limit={5} viewAllHref="/supervisor/casos" />

          {/* Bottom Message */}
          <Card className="border-border bg-gradient-to-r from-primary/5 to-transparent shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <Heart className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">
                  O seu trabalho faz a diferenca.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Obrigado por coordenar e apoiar o programa PACTO. Juntos,
                  construimos uma comunidade mais solidaria.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
