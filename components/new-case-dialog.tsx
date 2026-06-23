"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Check,
  ChevronsUpDown,
  ClipboardList,
  User,
  Users,
  UserCog,
  X,
  Loader2,
} from "lucide-react"
import {
  getStoredAuthToken,
  listAllElders,
  listAllVolunteers,
  listUsersAdmin,
  createCase,
} from "@/lib/api"
import type { ElderListItem, AdminUserListItem } from "@/lib/api"

/* ---------------- Shared case types (single source of truth) ---------------- */

export type Urgency = "Baixa" | "Média" | "Alta"
export type CaseStatus = "Ativo" | "Em Progresso" | "Pausado"

export interface Person {
  name: string
  role: string
}

export interface ProgressItem {
  label: string
  value: number
}

export interface SummaryItem {
  label: string
  result: string
}

export interface CaseData {
  id: string
  caseId: string
  title: string
  elder: Person
  volunteer1: Person
  volunteer2: Person
  supervisor: Person
  status: string
  apiStatus: string
  completedTasks: string[]
  progress: ProgressItem[]
  duration: string
  completion: number
  urgency: Urgency
  summary: SummaryItem[]
}

/* ---------------- Selectable people types ---------------- */

interface ElderOption {
  id: string
  name: string
  age: number | null
  status: string
}

interface VolunteerOption {
  id: string
  name: string
  status: string
}

interface SupervisorOption {
  id: string
  name: string
  status: string
}

const ASSESSMENT_LABELS = [
  "Depressão Geriátrica",
  "Qualidade de Vida",
  "Bem-Estar Psicológico",
  "Solidão",
  "Autocuidado",
]

const SUMMARY_LABELS = [
  "Bem-Estar Psicológico",
  "Solidão",
  "Qualidade de Vida",
  "Autocuidado",
]

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {getInitials(name)}
    </div>
  )
}

interface NewCaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextNumber: number
  onCreate: (newCase: CaseData) => void
}

export function NewCaseDialog({
  open,
  onOpenChange,
  nextNumber,
  onCreate,
}: NewCaseDialogProps) {
  const caseId = `CASE-${String(nextNumber).padStart(3, "0")}`

  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [elderOptions, setElderOptions] = useState<ElderOption[]>([])
  const [volunteerOptions, setVolunteerOptions] = useState<VolunteerOption[]>([])
  const [supervisorOptions, setSupervisorOptions] = useState<SupervisorOption[]>([])
  const [fetching, setFetching] = useState(false)

  const [status, setStatus] = useState<CaseStatus>("Ativo")
  const [elderId, setElderId] = useState<string>("")
  const [volunteer1Id, setVolunteer1Id] = useState<string>("")
  const [volunteer2Id, setVolunteer2Id] = useState<string>("")
  const [supervisorId, setSupervisorId] = useState<string>("")

  const [elderOpen, setElderOpen] = useState(false)
  const [volunteer1Open, setVolunteer1Open] = useState(false)
  const [volunteer2Open, setVolunteer2Open] = useState(false)
  const [supervisorOpen, setSupervisorOpen] = useState(false)

  useEffect(() => {
    setToken(getStoredAuthToken() || "")
  }, [open])

  useEffect(() => {
    if (!open || !token) return

    let cancelled = false
    setFetching(true)

    async function load() {
      try {
        const [eldersRes, volunteersRes, supervisorsRes] = await Promise.all([
          listAllElders(token, true).catch(() => []),
          listAllVolunteers(token).catch(() => []),
          listUsersAdmin(token, 200, { role: "supervisor" }).catch(() => []),
        ])

        if (cancelled) return

        setElderOptions(
          eldersRes.map((e: ElderListItem) => ({
            id: String(e.id),
            name: e.name,
            age: e.age,
            status: e.status,
          })),
        )

        setVolunteerOptions(
          volunteersRes
            .filter((v: AdminUserListItem) => v.status === "active")
            .map((v: AdminUserListItem) => ({
              id: String(v.id),
              name: v.name,
              status: v.status,
            })),
        )

        setSupervisorOptions(
          supervisorsRes
            .filter((s: AdminUserListItem) => s.status === "active")
            .map((s: AdminUserListItem) => ({
              id: String(s.id),
              name: s.name,
              status: s.status,
            })),
        )
      } catch {
        // silenc
      } finally {
        if (!cancelled) setFetching(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [open, token])

  const selectedElder = elderOptions.find((e) => e.id === elderId)
  const selectedVolunteer1 = volunteerOptions.find((v) => v.id === volunteer1Id)
  const selectedVolunteer2 = volunteerOptions.find((v) => v.id === volunteer2Id)
  const selectedSupervisor = supervisorOptions.find((s) => s.id === supervisorId)

  const canCreate =
    Boolean(elderId) && Boolean(volunteer1Id) && Boolean(supervisorId)

  function resetForm() {
    setStatus("Ativo")
    setElderId("")
    setVolunteer1Id("")
    setVolunteer2Id("")
    setSupervisorId("")
  }

  function handleClose(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  async function handleSubmit() {
    if (!canCreate || !token || !selectedElder) return

    setLoading(true)
    try {
      const apiRes = await createCase(token, {
        case_name: caseId,
        elder_id: elderId,
        volunteer1_id: volunteer1Id,
        volunteer2_id: volunteer2Id || undefined,
      })

      const newCase: CaseData = {
        id: apiRes.id,
        caseId: apiRes.case_name,
        title: `Caso ${nextNumber}`,
        elder: { name: apiRes.elder_name, role: "Idoso" },
        volunteer1: { name: apiRes.volunteer1_name, role: "Voluntário 1" },
        volunteer2: { name: apiRes.volunteer2_name || "—", role: "Voluntário 2" },
        supervisor: { name: apiRes.supervisor_name, role: "Supervisor" },
        status: "Ativo",
        apiStatus: apiRes.status,
        completedTasks: [],
        progress: ASSESSMENT_LABELS.map((label) => ({ label, value: 0 })),
        duration: "Recém-criado",
        completion: 0,
        urgency: "Baixa",
        summary: SUMMARY_LABELS.map((label) => ({ label, result: "Pendente" })),
      }

      onCreate(newCase)
      resetForm()
      onOpenChange(false)
    } catch (e: any) {
      console.error("Failed to create case", e)
    } finally {
      setLoading(false)
    }
  }

  const isLoading = fetching || loading

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border p-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </span>
            Novo Caso
          </DialogTitle>
          <DialogDescription>
            Preencha as informações para criar um novo caso de acompanhamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* INFORMAÇÕES DO CASO */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Informações do Caso
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Case ID</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-secondary/40 px-3 text-sm font-medium text-foreground">
                  {caseId}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="case-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as CaseStatus)}>
                  <SelectTrigger id="case-status" className="rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                    <SelectItem value="Pausado">Pausado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* SELECIONAR IDOSO */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <User className="h-4 w-4" /> Selecionar Idoso
            </h3>
            <Popover open={elderOpen} onOpenChange={setElderOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="h-auto w-full justify-between rounded-xl py-2.5"
                  disabled={isLoading}
                >
                  {selectedElder ? (
                    <span className="flex items-center gap-3">
                      <Avatar name={selectedElder.name} />
                      <span className="flex flex-col items-start">
                        <span className="font-medium">{selectedElder.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedElder.age} anos · {selectedElder.status}
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Pesquisar idoso...</span>
                  )}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Pesquisar idoso..." />
                  <CommandList>
                    <CommandEmpty>Nenhum idoso encontrado.</CommandEmpty>
                    <CommandGroup>
                      {elderOptions.map((elder) => (
                        <CommandItem
                          key={elder.id}
                          value={elder.name}
                          onSelect={() => {
                            setElderId(elder.id)
                            setElderOpen(false)
                          }}
                          className="gap-3"
                        >
                          <Avatar name={elder.name} />
                          <span className="flex flex-1 flex-col">
                            <span className="font-medium">{elder.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {elder.age} anos · {elder.status}
                            </span>
                          </span>
                          {elderId === elder.id && <Check className="h-4 w-4 text-primary" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </section>

          {/* SELECIONAR VOLUNTÁRIO 1 */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <Users className="h-4 w-4" /> Selecionar Voluntário 1
            </h3>
            {selectedVolunteer1 && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 py-1 pl-1 pr-2 text-sm font-medium text-primary">
                  <Avatar name={selectedVolunteer1.name} />
                  {selectedVolunteer1.name}
                  <button
                    type="button"
                    onClick={() => setVolunteer1Id("")}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                    aria-label={`Remover ${selectedVolunteer1.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            )}
            <Popover open={volunteer1Open} onOpenChange={setVolunteer1Open}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between rounded-xl"
                  disabled={isLoading}
                >
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
                      {volunteerOptions
                        .filter((v) => v.id !== volunteer2Id)
                        .map((v) => (
                          <CommandItem
                            key={v.id}
                            value={v.name}
                            onSelect={() => {
                              setVolunteer1Id(v.id)
                              setVolunteer1Open(false)
                            }}
                            className="gap-3"
                          >
                            <Avatar name={v.name} />
                            <span className="flex flex-1 flex-col">
                              <span className="font-medium">{v.name}</span>
                              <span className="text-xs text-muted-foreground">{v.status}</span>
                            </span>
                            {volunteer1Id === v.id && <Check className="h-4 w-4 text-primary" />}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </section>

          {/* SELECIONAR VOLUNTÁRIO 2 (opcional) */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <Users className="h-4 w-4" /> Selecionar Voluntário 2
              <span className="font-normal normal-case text-muted-foreground">(opcional)</span>
            </h3>
            {selectedVolunteer2 && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 py-1 pl-1 pr-2 text-sm font-medium text-primary">
                  <Avatar name={selectedVolunteer2.name} />
                  {selectedVolunteer2.name}
                  <button
                    type="button"
                    onClick={() => setVolunteer2Id("")}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                    aria-label={`Remover ${selectedVolunteer2.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            )}
            <Popover open={volunteer2Open} onOpenChange={setVolunteer2Open}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between rounded-xl"
                  disabled={isLoading}
                >
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
                      {volunteerOptions
                        .filter((v) => v.id !== volunteer1Id)
                        .map((v) => (
                          <CommandItem
                            key={v.id}
                            value={v.name}
                            onSelect={() => {
                              setVolunteer2Id(v.id)
                              setVolunteer2Open(false)
                            }}
                            className="gap-3"
                          >
                            <Avatar name={v.name} />
                            <span className="flex flex-1 flex-col">
                              <span className="font-medium">{v.name}</span>
                              <span className="text-xs text-muted-foreground">{v.status}</span>
                            </span>
                            {volunteer2Id === v.id && <Check className="h-4 w-4 text-primary" />}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </section>

          {/* SELECIONAR SUPERVISOR */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <UserCog className="h-4 w-4" /> Selecionar Supervisor
            </h3>
            <Popover open={supervisorOpen} onOpenChange={setSupervisorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="h-auto w-full justify-between rounded-xl py-2.5"
                  disabled={isLoading}
                >
                  {selectedSupervisor ? (
                    <span className="flex items-center gap-3">
                      <Avatar name={selectedSupervisor.name} />
                      <span className="flex flex-col items-start">
                        <span className="font-medium">{selectedSupervisor.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedSupervisor.status}
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Pesquisar supervisor...</span>
                  )}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Pesquisar supervisor..." />
                  <CommandList>
                    <CommandEmpty>Nenhum supervisor encontrado.</CommandEmpty>
                    <CommandGroup>
                      {supervisorOptions.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={s.name}
                          onSelect={() => {
                            setSupervisorId(s.id)
                            setSupervisorOpen(false)
                          }}
                          className="gap-3"
                        >
                          <Avatar name={s.name} />
                          <span className="flex flex-1 flex-col">
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-muted-foreground">{s.status}</span>
                          </span>
                          {supervisorId === s.id && <Check className="h-4 w-4 text-primary" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </section>

          {/* CASE SUMMARY */}
          <section>
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <ClipboardList className="h-5 w-5 text-primary" />
                Resumo do Caso
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Idoso</p>
                  <p className="font-medium text-foreground">
                    {selectedElder ? selectedElder.name : "Por selecionar"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Voluntário 1</p>
                  <p className="font-medium text-foreground">
                    {selectedVolunteer1 ? selectedVolunteer1.name : "Por selecionar"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Voluntário 2</p>
                  <p className="font-medium text-foreground">
                    {selectedVolunteer2 ? selectedVolunteer2.name : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Supervisor</p>
                  <p className="font-medium text-foreground">
                    {selectedSupervisor ? selectedSupervisor.name : "Por selecionar"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="flex-row justify-between gap-3 border-t border-border p-6">
          <Button variant="outline" className="rounded-xl" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button className="rounded-xl" onClick={handleSubmit} disabled={!canCreate || isLoading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Caso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
