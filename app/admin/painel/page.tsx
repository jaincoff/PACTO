"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin-mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Heart,
  User,
  UserCog,
  Brain,
  Home,
  Smile,
  Leaf,
  Clipboard,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Eye,
  UserX,
  Trash2,
  Shield,
  Lock,
  FlaskConical,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import {
  getDashboardOverview,
  getStoredAuthToken,
  listUsersAdmin,
  listPendingVolunteers,
  listPendingSupervisors,
  getVolunteerTestDetail,
  approveVolunteer,
  changeUserStatus,
  deleteUser,
  getVolunteerAssessmentResults,
  type AdminUserListItem,
  type DashboardOverview,
  type PendingVolunteer,
  type VolunteerTestDetail,
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

export default function AdminDashboardPage() {
  return (
    <AuthGuard roles={["admin"]}>
      <AdminDashboardContent />
    </AuthGuard>
  );
}

function AdminDashboardContent() {
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  // const [pendingSupervisors, setPendingSupervisors] = useState<
  //   PendingVolunteer[]
  // >([]);
  const [expandedSupervisor, setExpandedSupervisor] = useState<string | null>(
    null,
  );
  const [testDetail, setTestDetail] = useState<VolunteerTestDetail | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [approving, setApproving] = useState<string | null>(null);
  const [viewingResults, setViewingResults] = useState<string | null>(null);
  const [userResults, setUserResults] =
    useState<AssessmentResultsResponse | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userTestDetail, setUserTestDetail] =
    useState<VolunteerTestDetail | null>(null);

  const handleExpandUser = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setUserTestDetail(null);
      return;
    }
    setExpandedUser(userId);
    const token = getStoredAuthToken();
    if (!token) return;
    setLoadingDetail(true);
    try {
      const detail = await getVolunteerTestDetail(token, userId);
      setUserTestDetail(detail);
    } catch {
      setUserTestDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      const token = getStoredAuthToken();
      if (!token) {
        setError("Sessao expirada. Inicie sessao novamente.");
        setLoading(false);
        return;
      }

      try {
        const [overview, userList, supervisors] = await Promise.all([
          getDashboardOverview(token),
          listUsersAdmin(token, 10),
          listPendingSupervisors(token),
        ]);
        setDashboard(overview);
        setUsers(userList);
        // setPendingSupervisors(supervisors);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar dados do admin.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleExpandSupervisor = async (supervisor: PendingVolunteer) => {
    if (expandedSupervisor === supervisor.id) {
      setExpandedSupervisor(null);
      setTestDetail(null);
      return;
    }
    setExpandedSupervisor(supervisor.id);
    const token = getStoredAuthToken();
    if (!token) return;
    setLoadingDetail(true);
    try {
      const detail = await getVolunteerTestDetail(token, supervisor.id);
      setTestDetail(detail);
    } catch {
      setTestDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewResults = async (userId: string) => {
    if (viewingResults === userId) {
      setViewingResults(null);
      setUserResults(null);
      return;
    }
    setViewingResults(userId);
    const token = getStoredAuthToken();
    if (!token) return;
    setLoadingDetail(true);
    try {
      const results = await getVolunteerAssessmentResults(token, userId);
      setUserResults(results);
    } catch {
      setUserResults(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    const token = getStoredAuthToken();
    if (!token) return;
    setApproving(userId);
    try {
      await approveVolunteer(token, userId);
      setSuccessMsg("Utilizador aprovado com sucesso.");
      setTimeout(() => setSuccessMsg(""), 4000);
      // Refresh user list
      const userList = await listUsersAdmin(token, 10);
      setUsers(userList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao aprovar.");
    } finally {
      setApproving(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    const token = getStoredAuthToken();
    if (!token) return;
    try {
      await changeUserStatus(token, userId, "inactive");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: "inactive" } : u,
        ),
      );
      setSuccessMsg("Utilizador desativado.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao desativar.",
      );
    }
  };

  const handleActivate = async (userId: string) => {
    const token = getStoredAuthToken();
    if (!token) return;
    try {
      await changeUserStatus(token, userId, "active");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: "active" } : u,
        ),
      );
      setSuccessMsg("Utilizador ativado.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao ativar.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este utilizador?")) return;
    const token = getStoredAuthToken();
    if (!token) return;
    try {
      await deleteUser(token, userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccessMsg("Utilizador eliminado.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao eliminar.",
      );
    }
  };

  const stats = useMemo(
    () => ({
      pendingVolunteers: Number(dashboard?.stats.pending_volunteers ?? 0),
      pendingSupervisors: Number(dashboard?.stats.pending_supervisors ?? 0),
      eldersTotal: Number(dashboard?.stats.elders_total ?? 0),
      totalUsers: users.length,
    }),
    [dashboard, users],
  );

  const isPending = (status: string) =>
    status === "pending_approval" ||
    status === "pending_admin_approval" ||
    status === "pending_test";

  const recentUsers = useMemo(
    () =>
      users.map((user) => ({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        type:
          user.role === "volunteer"
            ? "Voluntario"
            : user.role === "supervisor"
              ? "Supervisor"
              : user.role === "elder"
                ? "Idoso"
                : "Administrador",
        status: user.status,
        role: user.role,
        created: new Date(user.created_at).toLocaleDateString("pt-PT"),
      })),
    [users],
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Voluntario":
        return "bg-blue-100 text-blue-700";
      case "Idoso":
        return "bg-amber-100 text-amber-700";
      case "Supervisor":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-red-100 text-red-700";
      case "pending_approval":
      case "pending_admin_approval":
        return "bg-amber-100 text-amber-700";
      case "pending_test":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "inactive":
        return "Inativo";
      case "pending_approval":
        return "Pendente";
      case "pending_admin_approval":
        return "Pendente Admin";
      case "pending_test":
        return "Por testar";
      default:
        return status;
    }
  };

  const assessments = [
    { id: "bem-estar", title: "Bem-Estar Psicologico", icon: Brain },
    { id: "solidao", title: "Solidao", icon: Heart },
    { id: "autocuidado", title: "Autocuidado", icon: Home },
    { id: "depressao", title: "Depressao Geriatrica", icon: Smile },
    { id: "qualidade", title: "Qualidade de Vida", icon: Leaf },
    { id: "oars", title: "Avaliacao Multifuncional OARS", icon: Clipboard },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminMobileHeader />
      <AdminSidebar activeItem="painel" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-6xl space-y-8 p-4 lg:p-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Painel de Administracao
            </h1>
            <p className="mt-2 text-muted-foreground">
              Gerir utilizadores, avaliacoes, permissoes e configuracoes da
              plataforma PACTO.
            </p>
            {loading ? (
              <p className="mt-2 text-sm text-muted-foreground">
                A carregar dados...
              </p>
            ) : null}
            {!loading && error ? (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            ) : null}
            {successMsg ? (
              <p className="mt-2 text-sm font-medium text-green-600">
                {successMsg}
              </p>
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
                    Total Utilizadores
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {users.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <AlertTriangle className="h-7 w-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Voluntarios Pendentes
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.pendingVolunteers}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                  <UserCog className="h-7 w-7 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Supervisores Pendentes
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.pendingSupervisors}
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
                    Idosos Registados
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.eldersTotal}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Recent Users Table */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Utilizadores Recentes
                </h2>
                <p className="text-sm text-muted-foreground">
                  Gestao rapida de contas de utilizadores.
                </p>
              </div>
              <Link href="/admin/utilizadores">
                <Button variant="outline" size="sm" className="gap-1.5">
                  Ver Todos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Nome
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Tipo
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Estado
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                          Registado
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                          Acoes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <React.Fragment key={user.id}>
                        <tr
                          className="border-b border-border last:border-0 hover:bg-secondary/20"
                        >
                          <td className="px-6 py-4">
                            <span className="font-medium text-foreground">
                              {user.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getTypeColor(user.type)}`}
                            >
                              {user.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(user.status)}`}
                            >
                              {getStatusLabel(user.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {user.created}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Ver Resultados"
                                onClick={() =>
                                  handleViewResults(user.id)
                                }
                              >
                                <Eye className={`h-4 w-4 ${viewingResults === user.id ? "text-primary" : "text-blue-600"}`} />
                              </Button>
                              {isPending(user.status) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Aprovar"
                                  onClick={() =>
                                    handleApproveUser(user.id)
                                  }
                                  disabled={approving === user.id}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {user.status === "inactive" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Ativar"
                                  onClick={() =>
                                    handleActivate(user.id)
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              ) : (
                                !isPending(user.status) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Desativar"
                                    onClick={() =>
                                      handleDeactivate(user.id)
                                    }
                                  >
                                    <UserX className="h-4 w-4 text-amber-600" />
                                  </Button>
                                )
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Eliminar"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {expandedUser === user.id && (
                          <tr key={`${user.id}-detail`}>
                            <td colSpan={5} className="bg-secondary/10 px-6 py-4">
                              {loadingDetail ? (
                                <p className="text-sm text-muted-foreground">
                                  A carregar respostas...
                                </p>
                              ) : userTestDetail ? (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                                    <span className="font-medium">
                                      Pontuacao: {userTestDetail.score} /{" "}
                                      {userTestDetail.max_score} (
                                      {userTestDetail.max_score > 0
                                        ? Math.round(
                                            (userTestDetail.score /
                                              userTestDetail.max_score) *
                                              100,
                                          )
                                        : 0}
                                      %)
                                    </span>
                                    <span className="text-muted-foreground">
                                      Min: {userTestDetail.passing_score}%
                                    </span>
                                  </div>
                                  {userTestDetail.answers.map((a) => (
                                    <div
                                      key={a.question_id}
                                      className="rounded border border-border bg-white px-3 py-1.5 text-sm"
                                    >
                                      <span className="text-muted-foreground">
                                        {a.question_text}
                                      </span>
                                      <span className="ml-2 font-medium">
                                        → {a.chosen_text}
                                      </span>
                                      <span className="ml-2 text-muted-foreground">
                                        ({a.points}/{a.max_points})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-destructive">
                                  Falha ao carregar.
                                </p>
                              )}
                            </td>
                        </tr>
                        )}
                        {viewingResults === user.id && (
                          <tr key={`${user.id}-results`}>
                            <td colSpan={5} className="bg-secondary/10 px-6 py-4">
                              {loadingDetail ? (
                                <p className="text-sm text-muted-foreground">A carregar...</p>
                              ) : userResults?.results ? (
                                <div className="space-y-4">
                                  {Object.entries(userResults.results).map(([key, result]) => {
                                    const levelColor =
                                      result.level === "elevado" || result.level === "elevada" || result.level === "elevadas"
                                        ? "bg-green-100 text-green-700"
                                        : result.level === "moderado" || result.level === "moderada" || result.level === "moderadas"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-red-100 text-red-700";
                                    return (
                                      <div key={key}>
                                        <div className="mb-1 flex items-center justify-between">
                                          <span className="text-sm font-medium">{result.label}</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm">{result.score}/{result.max} ({result.percentage}%)</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColor}`}>{result.level}</span>
                                          </div>
                                        </div>
                                        <div className="mb-2 h-1.5 rounded-full bg-secondary">
                                          <div className={`h-full rounded-full ${result.percentage >= 75 ? "bg-green-500" : result.percentage >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${result.percentage}%` }} />
                                        </div>
                                        {result.dimensions && Object.keys(result.dimensions).length > 0 && (
                                          <div className="rounded-lg bg-white p-2">
                                            <ResponsiveContainer width="100%" height={140}>
                                              <RadarChart data={Object.entries(result.dimensions).map(([dk, dv]) => ({ dimension: dv.label || dk, value: dv.average, fullMark: 5 }))}>
                                                <PolarGrid stroke="#e5e7eb" />
                                                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: "#6b7280" }} />
                                                <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 8, fill: "#9ca3af" }} />
                                                <Radar dataKey="value" stroke="#e6842d" fill="#e6842d" fillOpacity={0.2} />
                                              </RadarChart>
                                            </ResponsiveContainer>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Nenhum resultado de avaliacao.</p>
                              )}
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Data Export */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Exportacao de Dados
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Exportar dados da plataforma para relatorios e analise.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  id: "utilizadores",
                  title: "Utilizadores",
                  label: "Exportar CSV",
                },
                {
                  id: "voluntarios",
                  title: "Voluntarios",
                  label: "Exportar CSV",
                },
                {
                  id: "idosos",
                  title: "Idosos",
                  label: "Exportar CSV",
                },
                {
                  id: "avaliacoes",
                  title: "Avaliacoes",
                  label: "Exportar CSV",
                },
                {
                  id: "completos",
                  title: "Dados Completos",
                  label: "Exportar Excel",
                },
                {
                  id: "anonimizados",
                  title: "Dados Anonimizados",
                  label: "Exportar",
                },
              ].map((option) => (
                <Card
                  key={option.id}
                  className="border-border bg-card shadow-sm"
                >
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        {option.id === "completos" ? (
                          <FileSpreadsheet className="h-5 w-5 text-primary" />
                        ) : (
                          <Download className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <span className="font-medium text-foreground">
                        {option.title}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      {option.label}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Bottom */}
          <Card className="border-border bg-gradient-to-r from-primary/5 to-primary/10 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Gerir com responsabilidade e cuidado.
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  A sua funcao e fundamental para garantir que o PACTO continua
                  a promover ligacoes humanas significativas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
