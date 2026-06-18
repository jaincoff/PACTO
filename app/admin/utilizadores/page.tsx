"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin-mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  Eye,
  CheckCircle,
  UserX,
  Trash2,
  Users,
} from "lucide-react";
import {
  getStoredAuthToken,
  listUsersAdmin,
  changeUserStatus,
  deleteUser,
  approveVolunteer,
  getVolunteerTestDetail,
  getVolunteerAssessmentResults,
  type AdminUserListItem,
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

export default function AdminUtilizadoresPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Expand test detail
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [testDetail, setTestDetail] = useState<VolunteerTestDetail | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [viewingResults, setViewingResults] = useState<string | null>(null);
  const [userResults, setUserResults] = useState<AssessmentResultsResponse | null>(null);

  const token = getStoredAuthToken();

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await listUsersAdmin(token, 100, {
        role: filterRole || undefined,
        status: filterStatus || undefined,
        search: searchQuery || undefined,
      });
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar utilizadores.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filterRole, filterStatus]);

  const handleSearch = () => {
    loadUsers();
  };

  const handleExpand = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setTestDetail(null);
      return;
    }
    setExpandedUser(userId);
    if (!token) return;
    setLoadingDetail(true);
    try {
      const detail = await getVolunteerTestDetail(token, userId);
      setTestDetail(detail);
    } catch {
      setTestDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewResults = async (userId: string) => {
    if (viewingResults === userId) { setViewingResults(null); setUserResults(null); return; }
    setViewingResults(userId);
    if (!token) return;
    setLoadingDetail(true);
    try { const r = await getVolunteerAssessmentResults(token, userId); setUserResults(r); }
    catch { setUserResults(null); }
    finally { setLoadingDetail(false); }
  };

  const handleApprove = async (userId: string) => {
    if (!token) return;
    setApproving(userId);
    try {
      await approveVolunteer(token, userId);
      setSuccessMsg("Utilizador aprovado.");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao aprovar.");
    } finally {
      setApproving(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!token) return;
    try {
      await changeUserStatus(token, userId, "inactive");
      setSuccessMsg("Utilizador desativado.");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao desativar.");
    }
  };

  const handleActivate = async (userId: string) => {
    if (!token) return;
    try {
      await changeUserStatus(token, userId, "active");
      setSuccessMsg("Utilizador ativado.");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao ativar.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Eliminar este utilizador?")) return;
    if (!token) return;
    try {
      await deleteUser(token, userId);
      setSuccessMsg("Utilizador eliminado.");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao eliminar.");
    }
  };

  const getTypeLabel = (role: string) => {
    switch (role) {
      case "volunteer":
        return { label: "Voluntario", color: "bg-blue-100 text-blue-700" };
      case "supervisor":
        return { label: "Supervisor", color: "bg-purple-100 text-purple-700" };
      case "elder":
        return { label: "Idoso", color: "bg-amber-100 text-amber-700" };
      default:
        return { label: "Admin", color: "bg-gray-100 text-gray-700" };
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
        return "Pendente Aprovacao";
      case "pending_admin_approval":
        return "Pendente Admin";
      case "pending_test":
        return "Por testar";
      default:
        return status;
    }
  };

  const isPending = (status: string) =>
    status === "pending_approval" ||
    status === "pending_admin_approval" ||
    status === "pending_test";

  return (
    <div className="flex min-h-screen bg-background">
      <AdminMobileHeader />
      <AdminSidebar activeItem="utilizadores" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
          {/* Back */}
          <Link href="/admin/painel">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Painel
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Gestao de Utilizadores
            </h1>
            <p className="mt-2 text-muted-foreground">
              Lista completa de todos os utilizadores registados na plataforma.
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

          {/* Filters */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex flex-wrap items-end gap-4 p-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Tipo
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="volunteer">Voluntario</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="elder">Idoso</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="pending_test">Por testar</option>
                  <option value="pending_approval">Pendente Aprovacao</option>
                  <option value="pending_admin_approval">
                    Pendente Admin
                  </option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Pesquisar
                </label>
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearch()
                    }
                    placeholder="Email ou nome..."
                    className="h-10 rounded-xl"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 rounded-xl"
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users count */}
          <p className="text-sm text-muted-foreground">
            {users.length} utilizador(es) encontrado(s)
          </p>

          {/* Users Table */}
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
                        Email
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
                    {users.map((user) => {
                      const typeMeta = getTypeLabel(user.role);
                      return (
                        <React.Fragment key={user.id}>
                          <tr
                            className="border-b border-border last:border-0 hover:bg-secondary/20"
                          >
                            <td className="px-6 py-4">
                              <span className="font-medium text-foreground">
                                {user.name || user.email}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {user.email}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${typeMeta.color}`}
                              >
                                {typeMeta.label}
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
                              {new Date(
                                user.created_at,
                              ).toLocaleDateString("pt-PT")}
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver Resultados" onClick={() => handleViewResults(user.id)}>
                                <Eye className={`h-4 w-4 ${viewingResults === user.id ? "text-primary" : "text-blue-600"}`} />
                              </Button>
                              {isPending(user.status) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      title="Aprovar"
                                      onClick={() =>
                                        handleApprove(user.id)
                                      }
                                      disabled={
                                        approving === user.id
                                      }
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
                                  onClick={() =>
                                    handleDelete(user.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {expandedUser === user.id && (
                            <tr key={`${user.id}-detail`}>
                              <td
                                colSpan={6}
                                className="bg-secondary/10 px-6 py-4"
                              >
                                {loadingDetail ? (
                                  <p className="text-sm text-muted-foreground">
                                    A carregar respostas...
                                  </p>
                                ) : testDetail ? (
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                                      <span className="font-medium">
                                        Pontuacao: {testDetail.score} /{" "}
                                        {testDetail.max_score} (
                                        {testDetail.max_score > 0
                                          ? Math.round(
                                              (testDetail.score /
                                                testDetail.max_score) *
                                                100,
                                            )
                                          : 0}
                                        %)
                                      </span>
                                    </div>
                                    {testDetail.answers.map((a) => (
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
                            <tr><td colSpan={6} className="bg-secondary/10 px-6 py-4">
                              {loadingDetail ? <p className="text-sm text-muted-foreground">A carregar...</p>
                              : userResults?.results ? <div className="space-y-3">{Object.entries(userResults.results).map(([k,r])=>{const lc=r.level==="elevado"||r.level==="elevada"||r.level==="elevadas"?"bg-green-100 text-green-700":r.level==="moderado"||r.level==="moderada"||r.level==="moderadas"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700";return(<div key={k}><div className="mb-1 flex items-center justify-between"><span className="text-sm font-medium">{r.label}</span><div className="flex items-center gap-2"><span className="text-sm">{r.score}/{r.max} ({r.percentage}%)</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${lc}`}>{r.level}</span></div></div><div className="mb-2 h-1.5 rounded-full bg-secondary"><div className={`h-full rounded-full ${r.percentage>=75?"bg-green-500":r.percentage>=50?"bg-amber-500":"bg-red-500"}`} style={{width:`${r.percentage}%`}}/></div>{r.dimensions&&Object.keys(r.dimensions).length>0&&<div className="rounded-lg bg-white p-2"><ResponsiveContainer width="100%" height={130}><RadarChart data={Object.entries(r.dimensions).map(([dk,dv])=>({dimension:dv.label||dk,value:dv.average,fullMark:5}))}><PolarGrid stroke="#e5e7eb"/><PolarAngleAxis dataKey="dimension" tick={{fontSize:9,fill:"#6b7280"}}/><PolarRadiusAxis domain={[0,5]} tick={{fontSize:8,fill:"#9ca3af"}}/><Radar dataKey="value" stroke="#e6842d" fill="#e6842d" fillOpacity={0.2}/></RadarChart></ResponsiveContainer></div>}</div>)})}</div>
                              : <p className="text-sm text-muted-foreground">Nenhum resultado.</p>}
                            </td></tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && !loading && (
                <div className="flex flex-col items-center gap-3 p-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium text-foreground">
                    Nenhum utilizador encontrado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
