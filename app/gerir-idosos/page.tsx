"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, ChevronDown, Heart, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getStoredAuthToken,
  getStoredAuthUser,
  getElderPhotoUrl,
  listMyElders,
  type ElderListItem,
} from "../../lib/api";
import { useRouter } from "next/navigation";

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  active: { label: "Ativo", color: "bg-emerald-500", bgColor: "bg-emerald-50" },
  new: { label: "Novo", color: "bg-blue-500", bgColor: "bg-blue-50" },
  attention: {
    label: "Necessita acompanhamento",
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
  },
  "no-contact": {
    label: "Sem contacto recente",
    color: "bg-red-500",
    bgColor: "bg-red-50",
  },
  in_progress: {
    label: "Em acompanhamento",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
  },
  completed: {
    label: "Concluido",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
  },
};

export default function GerirIdososPage() {
  const router = useRouter();
  const user = getStoredAuthUser();
  const [elders, setElders] = useState<ElderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supportFilter, setSupportFilter] = useState("");

  // Redirect non-approved volunteers — must be in useEffect, not during render
  useEffect(() => {
    if (user?.status !== "active") {
      router.replace("/voluntario/painel");
    }
  }, [user?.status, router]);

  if (user?.status !== "active") return null;

  useEffect(() => {
    async function loadElders() {
      const token = getStoredAuthToken();
      if (!token) {
        setError("Sessao expirada. Inicie sessao novamente.");
        setLoading(false);
        return;
      }

      try {
        const data = await listMyElders(token);
        setElders(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar idosos.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadElders();
  }, []);

  const filteredElderly = elders.filter((person) => {
    const matchesSearch = person.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || person.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen">
      <MobileHeader />
      <Sidebar activeItem="gerir" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Gerir Idosos
              </h1>
              <p className="mt-1 text-base text-muted-foreground">
                Acompanhe as pessoas idosas registadas e mantenha ligações
                significativas.
              </p>
            </div>
            <Button
              asChild
              className="h-12 gap-2 rounded-xl px-6 text-base font-medium shadow-md"
            >
              <Link href="/adicionar-idoso">
                <UserPlus className="h-5 w-5" />
                Adicionar Idoso
              </Link>
            </Button>
          </div>

          {/* Search and Filters */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative min-w-[200px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-base text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Todos os estados</option>
                    <option value="in_progress">Em acompanhamento</option>
                    <option value="completed">Concluido</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                </div>

                {/* Support Type Filter */}
                <div className="relative min-w-[200px]">
                  <select
                    value={supportFilter}
                    onChange={(e) => setSupportFilter(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-base text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Todos os tipos de apoio</option>
                    <option value="companhia">Companhia</option>
                    <option value="conversas">Conversas</option>
                    <option value="apoio-domestico">Apoio doméstico</option>
                    <option value="compras">Compras</option>
                    <option value="transporte">Transporte</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Elderly Cards Grid */}
          {loading ? (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6 text-sm text-muted-foreground">
                A carregar idosos...
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

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredElderly.map((person) => {
              const status =
                statusConfig[person.status] || statusConfig.in_progress;
              return (
                <Link
                  key={person.id}
                  href={`/idoso/${person.id}`}
                  className="group"
                >
                  <Card className="h-full border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="relative flex flex-col items-center p-6 text-center">
                      {/* Status Indicator */}
                      <div
                        className={`absolute right-4 top-4 h-3 w-3 rounded-full ${status.color}`}
                        title={status.label}
                      />

                      {/* Avatar */}
                      <UserAvatar
                        photo={getElderPhotoUrl(person.id, person.photo)}
                        name={person.name}
                        gender={undefined}
                        size={96}
                        className="mb-4 shadow-md transition-all duration-200 group-hover:border-primary/20 group-hover:shadow-lg"
                      />

                      {/* Name */}
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        {person.name}
                      </h3>

                      {/* Gender and Age */}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="h-4 w-4 text-primary"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="7" r="4" />
                            <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
                          </svg>
                          Perfil
                        </span>
                        <span className="text-border">•</span>
                        <span>{person.age ?? "-"} anos</span>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`mt-4 rounded-full px-3 py-1 text-xs font-medium ${status.bgColor}`}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${status.color} mr-1.5`}
                        />
                        {status.label}
                      </div>

                      {/* Assessment button */}
                      <div className="mt-4 w-full">
                        <Button
                          variant={person.status === "completed" ? "outline" : "default"}
                          size="sm"
                          className="w-full gap-1.5 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            router.push(`/voluntario/painel?action=perfil&elderId=${person.id}`);
                          }}
                        >
                          <ClipboardCheck className="h-4 w-4" />
                          {person.status === "completed"
                            ? "Ver Resultados"
                            : "Avaliar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Empty State */}
          {!loading && !error && filteredElderly.length === 0 && (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Nenhum resultado encontrado
                </h3>
                <p className="max-w-sm text-muted-foreground">
                  Não foram encontradas pessoas idosas com os filtros
                  selecionados. Tente ajustar a sua pesquisa.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bottom Message */}
          <Card className="border-border bg-gradient-to-r from-primary/5 to-transparent shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Cada ligação faz a diferença.
                </h3>
                <p className="text-sm text-muted-foreground">
                  O acompanhamento contínuo ajuda a combater a solidão e promove
                  o bem-estar das pessoas idosas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
