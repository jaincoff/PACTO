"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Plus,
  ChevronDown,
  Users,
  CheckCircle,
  Clock,
  Gauge,
  AlertTriangle,
  ClipboardList,
  Download,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { NewCaseDialog } from "@/components/new-case-dialog"
import type { CaseData, Person, Urgency } from "@/components/new-case-dialog"
import {
  getStoredAuthToken, listCases, updateCase, deleteCase,
  listAllVolunteers, getUserById, getElderDetail,
} from "@/lib/api"
import type { ElderCaseOut, AssessmentProgressInfo, AdminUserListItem } from "@/lib/api"

const ASSESSMENT_LABEL_MAP: Record<string, string> = {
  "bem-estar-psicologico": "Bem-Estar Psicológico",
  loneliness: "Solidão",
  selfcare: "Autocuidado",
  depression: "Depressão Geriátrica",
  quality_of_life: "Qualidade de Vida",
  default: "Geral",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function getUrgencyColor(urgency: Urgency) {
  switch (urgency) {
    case "Baixa":
      return "bg-green-100 text-green-700"
    case "Média":
      return "bg-amber-100 text-amber-700"
    case "Alta":
      return "bg-red-100 text-red-700"
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Ativo":
      return "bg-green-100 text-green-700"
    case "Em Progresso":
      return "bg-blue-100 text-blue-700"
    case "Pausado":
      return "bg-amber-100 text-amber-700"
    default:
      return "bg-secondary text-muted-foreground"
  }
}

function getProgressValue(progress: AssessmentProgressInfo | null): number {
  if (!progress || progress.total_questions === 0) return 0
  return Math.round((progress.answered_questions / progress.total_questions) * 100)
}

function getUrgencyFromScore(score: number | null | undefined): Urgency {
  if (score === null || score === undefined) return "Média"
  if (score >= 80) return "Baixa"
  if (score >= 40) return "Média"
  return "Alta"
}

function getDuration(createdAt: string): string {
  const start = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) return "Hoje"
  if (days < 30) return `${days} dias`
  const months = Math.floor(days / 30)
  const remDays = days % 30
  if (months < 1) return `${remDays} dias`
  return `${months} mês${months > 1 ? "es" : ""} e ${remDays} dias`
}

function buildProgressItems(progress: AssessmentProgressInfo | null) {
  if (!progress?.results) {
    return [
      { label: "Depressão Geriátrica", value: 0 },
      { label: "Qualidade de Vida", value: 0 },
      { label: "Bem-Estar Psicológico", value: 0 },
      { label: "Solidão", value: 0 },
      { label: "Autocuidado", value: 0 },
    ]
  }
  return Object.entries(progress.results).map(([key, val]) => ({
    label: ASSESSMENT_LABEL_MAP[key] || val.label || key,
    value: val.percentage,
  }))
}

function buildSummaryItems(progress: AssessmentProgressInfo | null) {
  if (!progress?.results) {
    return [
      { label: "Bem-Estar Psicológico", result: "Pendente" },
      { label: "Solidão", result: "Pendente" },
      { label: "Qualidade de Vida", result: "Pendente" },
      { label: "Autocuidado", result: "Pendente" },
    ]
  }
  const resultLabels: Record<string, string> = {
    elevado: "Elevado",
    baixo: "Baixo",
    moderado: "Moderado",
    desconhecido: "Pendente",
    independencia_total: "Independência Total",
    dependencia_moderada: "Dependência Moderada",
    dependencia_significativa: "Dependência Significativa",
    dependencia_grave: "Dependência Grave",
  }
  return Object.entries(progress.results).map(([key, val]) => ({
    label: ASSESSMENT_LABEL_MAP[key] || val.label || key,
    result: resultLabels[val.level] || val.level || "Pendente",
  }))
}

function ProfileCard({ person, onClick }: { person: Person; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-left transition-colors ${onClick ? "cursor-pointer hover:bg-secondary/50" : ""}`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {getInitials(person.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{person.name}</p>
        <p className="text-xs text-muted-foreground">{person.role}</p>
      </div>
    </button>
  )
}

function apiCaseToCaseData(api: ElderCaseOut): CaseData {
  const progress = api.assessment_progress
  const completion = getProgressValue(progress)
  const firstScore =
    progress?.results
      ? Object.values(progress.results)[0]?.percentage
      : null

  return {
    id: api.id,
    caseId: api.case_name,
    title: api.case_name,
    elder: { name: api.elder_name, role: "Idoso" },
    volunteer1: { name: api.volunteer1_name, role: "Voluntário 1" },
    volunteer2: { name: api.volunteer2_name || "—", role: "Voluntário 2" },
    supervisor: { name: api.supervisor_name, role: "Supervisor" },
    status: progress?.status === "completed" ? "Ativo" : "Em Progresso",
    apiStatus: api.status,
    completedTasks: [],
    progress: buildProgressItems(progress),
    duration: getDuration(api.created_at),
    completion,
    urgency: getUrgencyFromScore(firstScore),
    summary: buildSummaryItems(progress),
  }
}

interface CaseManagementSectionProps {
  limit?: number
  viewAllHref?: string
  showPagination?: boolean
}

const PAGE_SIZE = 10

export function CaseManagementSection({ limit, viewAllHref, showPagination }: CaseManagementSectionProps = {}) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "incomplete">("all")
  const [openCases, setOpenCases] = useState<string[]>([])
  const [cases, setCases] = useState<CaseData[]>([])
  const [rawApiCases, setRawApiCases] = useState<Record<string, ElderCaseOut>>({})
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showInterpret, setShowInterpret] = useState<Record<string, boolean>>({})
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<ElderCaseOut | null>(null)
  const [editCaseName, setEditCaseName] = useState("")
  const [editVolunteer1Id, setEditVolunteer1Id] = useState("")
  const [editVolunteer2Id, setEditVolunteer2Id] = useState("")
  const [editVolunteerOptions, setEditVolunteerOptions] = useState<{id:string;name:string;status:string}[]>([])
  const [editFetching, setEditFetching] = useState(false)
  const [editVolunteer1Open, setEditVolunteer1Open] = useState(false)
  const [editVolunteer2Open, setEditVolunteer2Open] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [detailPerson, setDetailPerson] = useState<{
    id: string
    name: string
    role: string
    initial: string
    personType: "user" | "elder"
    email: string | null
    phone: string | null
    age: number | null
    birthYear: number | null
    gender: string | null
    status: string | null
    isAdmin: boolean
  } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const token = getStoredAuthToken()

  const fetchCases = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const apiCases = await listCases(token)
      const raw: Record<string, ElderCaseOut> = {}
      for (const c of apiCases) raw[c.id] = c
      setRawApiCases(raw)
      setCases(apiCases.map(apiCaseToCaseData))
    } catch (e: any) {
      console.error("Failed to fetch cases", e)
      toast.error("Erro ao carregar casos.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const nextNumber = useMemo(() => cases.length + 1, [cases])

  const toggleCase = (id: string) => {
    setOpenCases((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const handleCreateCase = (newCase: CaseData) => {
    setCases((prev) => [...prev, newCase])
    setOpenCases((prev) => [...prev, newCase.id])
    toast.success("Caso criado com sucesso.")
  }

  const handleOpenEdit = async (caseItem: CaseData) => {
    const raw = rawApiCases[caseItem.id]
    if (!raw || !token) return
    setEditingCase(raw)
    setEditCaseName(raw.case_name)
    setEditVolunteer1Id(raw.volunteer1_id)
    setEditVolunteer2Id(raw.volunteer2_id || "")
    setEditFetching(true)
    setEditDialogOpen(true)

    try {
      const [volunteersRes] = await Promise.all([
        listAllVolunteers(token).catch(() => [] as AdminUserListItem[]),
      ])
      setEditVolunteerOptions(
        volunteersRes
          .filter((v) => v.status === "active")
          .map((v) => ({ id: String(v.id), name: v.name, status: v.status })),
      )
    } catch {
      // silenc
    } finally {
      setEditFetching(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingCase || !token) return
    try {
      const updated = await updateCase(token, editingCase.id, {
        case_name: editCaseName,
        volunteer1_id: editVolunteer1Id || undefined,
        volunteer2_id: editVolunteer2Id || undefined,
      })
      const newRaw = { ...rawApiCases, [updated.id]: updated }
      setRawApiCases(newRaw)
      setCases(Object.values(newRaw).map(apiCaseToCaseData))
      toast.success("Caso atualizado com sucesso.")
      setEditDialogOpen(false)
      setEditingCase(null)
    } catch (e: any) {
      toast.error("Erro ao atualizar caso.")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId || !token) return
    try {
      await deleteCase(token, deleteConfirmId)
      const newRaw = { ...rawApiCases }
      delete newRaw[deleteConfirmId]
      setRawApiCases(newRaw)
      setCases(Object.values(newRaw).map(apiCaseToCaseData))
      setOpenCases((prev) => prev.filter((id) => id !== deleteConfirmId))
      toast.success("Caso removido com sucesso.")
    } catch (e: any) {
      toast.error("Erro ao remover caso.")
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const toggleInterpret = (id: string) => {
    setShowInterpret((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const openPersonDetail = async (personId: string, personType: "user" | "elder", name: string, role: string) => {
    const tok = token
    if (!tok) return
    setDetailLoading(true)
    setDetailPerson({
      id: personId,
      name,
      role,
      initial: getInitials(name),
      personType,
      email: null,
      phone: null,
      age: null,
      birthYear: null,
      gender: null,
      status: null,
      isAdmin: false,
    })

    try {
      if (personType === "user") {
        const user = await getUserById(tok, personId)
        setDetailPerson({
          id: personId,
          name: user.name,
          role,
          initial: getInitials(user.name),
          personType: "user",
          email: user.email,
          phone: user.phone,
          age: null,
          birthYear: user.birth_year,
          gender: user.gender,
          status: user.status,
          isAdmin: user.role === "admin",
        })
      } else {
        const elder = await getElderDetail(tok, personId)
        setDetailPerson({
          id: personId,
          name: elder.name,
          role,
          initial: getInitials(elder.name),
          personType: "elder",
          age: elder.age,
          email: elder.email,
          phone: null,
          birthYear: null,
          gender: null,
          status: elder.status,
          isAdmin: false,
        })
      }
    } catch {
      // silenc
    } finally {
      setDetailLoading(false)
    }
  }

  const filteredCases = useMemo(() => {
    let result = cases.filter((c) => {
      const haystack = [
        c.caseId,
        c.title,
        c.elder.name,
        c.volunteer1.name,
        c.volunteer2.name,
        c.supervisor.name,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(search.toLowerCase().trim())
    })

    if (statusFilter === "completed") {
      result = result.filter((c) => c.apiStatus === "completed")
    } else if (statusFilter === "incomplete") {
      result = result.filter((c) => c.apiStatus === "incomplete")
    }

    result.sort((a, b) => {
      if (a.apiStatus === b.apiStatus) return 0
      return a.apiStatus === "incomplete" ? -1 : 1
    })

    return result
  }, [cases, search, statusFilter])

  const displayedCases = useMemo(() => {
    if (limit) {
      return filteredCases.slice(0, limit)
    }
    if (showPagination) {
      const start = (page - 1) * PAGE_SIZE
      return filteredCases.slice(start, start + PAGE_SIZE)
    }
    return filteredCases
  }, [filteredCases, limit, showPagination, page])

  const totalPages = showPagination ? Math.ceil(filteredCases.length / PAGE_SIZE) : 1

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Gestão de Casos</h2>
          {!showPagination && (
            <span className="text-sm text-muted-foreground">({cases.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link href={viewAllHref}>
              <Button variant="outline" size="sm" className="rounded-xl">
                Ver todas
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchCases}
            disabled={loading}
            className="rounded-xl"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Header: search + add button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por ID, idoso, voluntário ou supervisor..."
            className="rounded-xl pl-9"
          />
        </div>
        <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Adicionar Caso
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        {(["all", "incomplete", "completed"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => { setStatusFilter(opt); setPage(1) }}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === opt
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {opt === "all" ? "Todos" : opt === "incomplete" ? "Incompletos" : "Completos"}
          </button>
        ))}
      </div>

      <NewCaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nextNumber={nextNumber}
        onCreate={handleCreateCase}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border p-6">
            <DialogTitle>Editar Caso</DialogTitle>
            <DialogDescription>Altere o nome e os voluntários do caso.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 p-6">
            {/* Nome do Caso */}
            <div className="space-y-2">
              <Label htmlFor="edit-case-name">Nome do Caso</Label>
              <Input
                id="edit-case-name"
                value={editCaseName}
                onChange={(e) => setEditCaseName(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Voluntário 1 */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <Users className="h-4 w-4" /> Voluntário 1
              </h3>
              {editVolunteer1Id && editVolunteerOptions.find(v => v.id === editVolunteer1Id) ? (
                <div className="flex items-center gap-2 rounded-full bg-primary/10 py-1 pl-1 pr-2 text-sm font-medium text-primary w-fit">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold">
                    {getInitials(editVolunteerOptions.find(v => v.id === editVolunteer1Id)!.name)}
                  </div>
                  {editVolunteerOptions.find(v => v.id === editVolunteer1Id)!.name}
                  <button
                    type="button"
                    onClick={() => setEditVolunteer1Id("")}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
              <Popover open={editVolunteer1Open} onOpenChange={setEditVolunteer1Open}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between rounded-xl" disabled={editFetching}>
                    <span className="text-muted-foreground">Pesquisar voluntário...</span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar voluntário..." />
                    <CommandList>
                      <CommandEmpty>Nenhum voluntário encontrado.</CommandEmpty>
                      <CommandGroup>
                        {editVolunteerOptions
                          .filter((v) => v.id !== editVolunteer2Id)
                          .map((v) => (
                            <CommandItem
                              key={v.id}
                              value={v.name}
                              onSelect={() => { setEditVolunteer1Id(v.id); setEditVolunteer1Open(false) }}
                              className="gap-3"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {getInitials(v.name)}
                              </div>
                              <span className="flex flex-1 flex-col">
                                <span className="font-medium">{v.name}</span>
                                <span className="text-xs text-muted-foreground">{v.status}</span>
                              </span>
                              {editVolunteer1Id === v.id && <Check className="h-4 w-4 text-primary" />}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Voluntário 2 (opcional) */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <Users className="h-4 w-4" /> Voluntário 2 <span className="font-normal normal-case text-muted-foreground">(opcional)</span>
              </h3>
              {editVolunteer2Id && editVolunteerOptions.find(v => v.id === editVolunteer2Id) ? (
                <div className="flex items-center gap-2 rounded-full bg-primary/10 py-1 pl-1 pr-2 text-sm font-medium text-primary w-fit">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold">
                    {getInitials(editVolunteerOptions.find(v => v.id === editVolunteer2Id)!.name)}
                  </div>
                  {editVolunteerOptions.find(v => v.id === editVolunteer2Id)!.name}
                  <button
                    type="button"
                    onClick={() => setEditVolunteer2Id("")}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
              <Popover open={editVolunteer2Open} onOpenChange={setEditVolunteer2Open}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between rounded-xl" disabled={editFetching}>
                    <span className="text-muted-foreground">Pesquisar voluntário...</span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar voluntário..." />
                    <CommandList>
                      <CommandEmpty>Nenhum voluntário encontrado.</CommandEmpty>
                      <CommandGroup>
                        {editVolunteerOptions
                          .filter((v) => v.id !== editVolunteer1Id)
                          .map((v) => (
                            <CommandItem
                              key={v.id}
                              value={v.name}
                              onSelect={() => { setEditVolunteer2Id(v.id); setEditVolunteer2Open(false) }}
                              className="gap-3"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {getInitials(v.name)}
                              </div>
                              <span className="flex flex-1 flex-col">
                                <span className="font-medium">{v.name}</span>
                                <span className="text-xs text-muted-foreground">{v.status}</span>
                              </span>
                              {editVolunteer2Id === v.id && <Check className="h-4 w-4 text-primary" />}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="flex-row justify-between gap-3 border-t border-border p-6">
            <Button variant="outline" className="rounded-xl" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={handleSaveEdit} disabled={!editVolunteer1Id}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null) }}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Caso</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja remover este caso? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDeleteConfirm}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Person Detail Dialog */}
      <Dialog open={!!detailPerson} onOpenChange={(o) => { if (!o) setDetailPerson(null) }}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          {detailPerson && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                    {detailPerson.initial}
                  </div>
                  <div>
                    <p className="text-lg">{detailPerson.name}</p>
                    <p className="text-sm font-normal text-muted-foreground">{detailPerson.role}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {detailLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Nome:</span> {detailPerson.name}</p>
                  <p><span className="font-medium text-foreground">Função:</span> {detailPerson.role}</p>

                  {detailPerson.isAdmin ? (
                    <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                      Utilizador com permissões de administrador. A informação de contacto não está disponível.
                    </p>
                  ) : (
                    <>
                      {detailPerson.email && (
                        <p><span className="font-medium text-foreground">Email:</span> {detailPerson.email}</p>
                      )}
                      {detailPerson.phone && (
                        <p><span className="font-medium text-foreground">Telefone:</span> {detailPerson.phone}</p>
                      )}
                      {detailPerson.age !== null && detailPerson.age !== undefined && (
                        <p><span className="font-medium text-foreground">Idade:</span> {detailPerson.age} anos</p>
                      )}
                      {detailPerson.birthYear && (
                        <p><span className="font-medium text-foreground">Ano de Nascimento:</span> {detailPerson.birthYear}</p>
                      )}
                      {detailPerson.gender && (
                        <p><span className="font-medium text-foreground">Género:</span> {detailPerson.gender}</p>
                      )}
                      {detailPerson.status && (
                        <p><span className="font-medium text-foreground">Estado:</span> {detailPerson.status}</p>
                      )}
                      {detailPerson.personType === "elder" && !detailPerson.email && !detailPerson.phone && (
                        <p className="text-xs text-muted-foreground">
                          Membro associado a este caso na plataforma PACTO.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button className="rounded-xl" onClick={() => setDetailPerson(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Case list */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar casos...
            </CardContent>
          </Card>
        ) : displayedCases.length === 0 ? (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {search
                ? "Nenhum caso encontrado para a sua pesquisa."
                : "Nenhum caso ainda. Crie o primeiro caso clicando em \"Adicionar Caso\"."}
            </CardContent>
          </Card>
        ) : (
          displayedCases.map((caseItem) => {
            const isOpen = openCases.includes(caseItem.id)
            return (
              <Card key={caseItem.id} className="border-border bg-card shadow-sm">
                {/* Collapsed header */}
                <button
                  onClick={() => toggleCase(caseItem.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-secondary/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                      {caseItem.title}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {caseItem.caseId}
                      </span>
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {caseItem.elder.name} — {caseItem.volunteer1.name} — {caseItem.volunteer2.name} — {caseItem.supervisor.name}
                    </p>
                  </div>
                  <span className={`hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${getStatusColor(caseItem.status)}`}>
                    <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                    {caseItem.status}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <CardContent className="space-y-5 border-t border-border p-5">
                    {/* Profile cards row */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <ProfileCard
                        person={caseItem.elder}
                        onClick={() => {
                          const raw = rawApiCases[caseItem.id]
                          if (raw) openPersonDetail(raw.elder_id, "elder", caseItem.elder.name, "Idoso")
                        }}
                      />
                      <ProfileCard
                        person={caseItem.volunteer1}
                        onClick={() => {
                          const raw = rawApiCases[caseItem.id]
                          if (raw) openPersonDetail(raw.volunteer1_id, "user", caseItem.volunteer1.name, "Voluntário 1")
                        }}
                      />
                      <ProfileCard
                        person={caseItem.volunteer2}
                        onClick={() => {
                          const raw = rawApiCases[caseItem.id]
                          if (raw && raw.volunteer2_id) openPersonDetail(raw.volunteer2_id, "user", caseItem.volunteer2.name, "Voluntário 2")
                        }}
                      />
                      <ProfileCard
                        person={caseItem.supervisor}
                        onClick={() => {
                          const raw = rawApiCases[caseItem.id]
                          if (raw) openPersonDetail(raw.supervisor_id, "user", caseItem.supervisor.name, "Supervisor")
                        }}
                      />
                    </div>

                    {/* Edit / Delete buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleOpenEdit(caseItem)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-red-600 hover:text-red-700"
                        onClick={() => setDeleteConfirmId(caseItem.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remover
                      </Button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      {/* Interpretação das Categorias */}
                      <div className="rounded-xl border border-border bg-secondary/20 p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <Eye className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Interpretação das Categorias</h3>
                        </div>
                        {rawApiCases[caseItem.id]?.assessment_progress?.results ? (
                          <div className="space-y-3 text-sm">
                            {Object.entries(rawApiCases[caseItem.id].assessment_progress!.results!).map(([key, val]) => {
                              const label = ASSESSMENT_LABEL_MAP[key] || val.label || key
                              const showKey = `${caseItem.id}-${key}`
                              const isShowing = showInterpret[showKey]
                              return (
                                <div key={key} className="rounded-lg border border-border bg-card p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-foreground">{label}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {val.level} — {val.percentage}%
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleInterpret(showKey)}
                                      className="rounded-lg p-1.5 hover:bg-secondary/50"
                                      title="Ver interpretação"
                                    >
                                      {isShowing ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </button>
                                  </div>
                                  {isShowing && val.interpretation && (
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground border-t border-border pt-2">
                                      {val.interpretation}
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhuma avaliação disponível.</p>
                        )}
                      </div>

                      {/* Workshop e Progresso */}
                      <div className="rounded-xl border border-border bg-secondary/20 p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Workshop e Progresso</h3>
                        </div>
                        <div className="space-y-3">
                          {caseItem.progress.map((item, i) => (
                            <div key={i}>
                              <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="text-foreground">{item.label}</span>
                                <span className="font-medium text-foreground">{item.value}%</span>
                              </div>
                              <Progress value={item.value} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tempo e Prioridade */}
                      <div className="rounded-xl border border-border bg-secondary/20 p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Tempo e Prioridade</h3>
                        </div>
                        <div className="space-y-4 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Tempo desde o início
                            </span>
                            <span className="font-medium text-foreground">{caseItem.duration}</span>
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Gauge className="h-4 w-4" />
                                Conclusão
                              </span>
                              <span className="font-medium text-foreground">{caseItem.completion}%</span>
                            </div>
                            <Progress value={caseItem.completion} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <AlertTriangle className="h-4 w-4" />
                              Urgência
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getUrgencyColor(caseItem.urgency)}`}>
                              {caseItem.urgency}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Somatório */}
                      <div className="rounded-xl border border-border bg-secondary/20 p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Somatório</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                          {caseItem.summary.map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className="font-medium text-foreground">{item.result}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Download Data */}
                    <div>
                      <Button className="w-full rounded-xl" size="lg">
                        <Download className="h-5 w-5" />
                        Download Data
                      </Button>
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Exporta dados do idoso, voluntários, supervisor, avaliações, histórico de progresso e somatório.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="min-w-[2.25rem] rounded-xl"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Seguinte
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
