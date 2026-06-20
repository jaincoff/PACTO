"use client"

import { useState } from "react"
import { ArrowLeft, Phone, MapPin, Heart, Calendar, Clock, MessageCircle, AlertTriangle, User, FileText, Plus, Brain, Home, Smile, Leaf, Clipboard } from "lucide-react"
import Link from "next/link"
import { UserAvatar } from "@/components/user-avatar"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const lauraData = {
  id: "laura-alves",
  name: "Laura Alves",
  gender: "Feminino",
  age: 78,
  birthYear: 1948,
  status: "attention",
  avatar: null,
  phone: "+351 912 345 678",
  address: "Rua das Oliveiras, 45, 3000-200 Coimbra",
  civilStatus: "Viúva",
  supportTypes: ["Companhia", "Conversas", "Apoio doméstico"],
  registeredDate: "15 de Janeiro de 2026",
  lastContact: "28 de Maio de 2026",
  notes: "A D. Laura perdeu o marido há 2 anos e vive sozinha. Gosta muito de conversar sobre a sua juventude em Lisboa e de mostrar fotografias da família. Tem mobilidade reduzida e agradece ajuda com pequenas tarefas domésticas. Aprecia visitas regulares e chá com bolinhos.",
  healthNotes: "Dificuldade de mobilidade - usa bengala. Diabetes controlada com medicação.",
  interests: ["Tricô", "Fotografia antiga", "Música fado", "Jardinagem"],
  familyInfo: "Tem uma filha (Ana) que vive no Porto e visita mensalmente. Dois netos adolescentes.",
}

const visitHistory = [
  { date: "28 Mai 2026", type: "Visita presencial", duration: "1h30", notes: "Conversámos sobre os netos. Ajudei a organizar fotografias antigas." },
  { date: "21 Mai 2026", type: "Chamada telefónica", duration: "25min", notes: "Estava um pouco em baixo. Falou da saudade do marido." },
  { date: "14 Mai 2026", type: "Visita presencial", duration: "2h", notes: "Ajudei com limpeza leve. Preparámos chá juntos." },
  { date: "7 Mai 2026", type: "Visita presencial", duration: "1h", notes: "Levei bolinhos. Mostrou-me o jardim." },
]

const statusConfig: Record<string, { label: string; color: string; bgColor: string; textColor: string }> = {
  active: { label: "Ativo", color: "bg-emerald-500", bgColor: "bg-emerald-50", textColor: "text-emerald-700" },
  new: { label: "Novo", color: "bg-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-700" },
  attention: { label: "Necessita acompanhamento", color: "bg-amber-500", bgColor: "bg-amber-50", textColor: "text-amber-700" },
  "no-contact": { label: "Sem contacto recente", color: "bg-red-500", bgColor: "bg-red-50", textColor: "text-red-700" },
}

export default function LauraAlvesProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "history" | "avaliacoes" | "notes">("info")
  const status = statusConfig[lauraData.status]

  const assessments = [
    {
      id: "bem-estar-psicologico",
      icon: Brain,
      title: "Bem-Estar Psicológico",
      description: "Avalia o bem-estar emocional, energia, estabilidade emocional e satisfação geral.",
      status: "Não realizado",
      lastCompletion: "Por realizar",
      route: "/idoso/laura-alves/avaliacoes/bem-estar-psicologico",
    },
    {
      id: "solidao",
      icon: Heart,
      title: "Solidão",
      description: "Avalia sentimentos de isolamento social, companhia e ligação aos outros.",
      status: "Não realizado",
      lastCompletion: "Por realizar",
      route: "/idoso/laura-alves/avaliacoes/solidao",
    },
    {
      id: "autocuidado",
      icon: Home,
      title: "Autocuidado",
      description: "Avalia a autonomia da pessoa idosa nas atividades do dia a dia.",
      status: "Não realizado",
      lastCompletion: "Por realizar",
      route: "/idoso/laura-alves/avaliacoes/autocuidado",
    },
    {
      id: "depressao-geriatrica",
      icon: Smile,
      title: "Depressão Geriátrica",
      description: "Avalia indicadores emocionais associados ao humor e ao bem-estar psicológico.",
      status: "Não realizado",
      lastCompletion: "Por realizar",
      route: "/idoso/laura-alves/avaliacoes/depressao-geriatrica",
    },
    {
      id: "qualidade-de-vida",
      icon: Leaf,
      title: "Qualidade de Vida",
      description: "Avalia satisfação com a vida, atividades, relações e bem-estar geral.",
      status: "Não realizado",
      lastCompletion: "Por realizar",
      route: "/idoso/laura-alves/avaliacoes/qualidade-de-vida",
    },
    {
      id: "oars",
      icon: Clipboard,
      title: "Avaliação Multifuncional OARS",
      description: "Avalia autonomia funcional, recursos sociais, saúde física e saúde mental.",
      status: "Não realizado",
      lastCompletion: "Por realizar",
      route: "/idoso/laura-alves/avaliacoes/oars",
    },
  ]

  return (
    <div className="flex min-h-screen">
      <MobileHeader />
      <Sidebar activeItem="gerir" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
          {/* Back Button and Header */}
          <div className="flex items-center gap-4">
            <Link
              href="/gerir-idosos"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                Perfil do Idoso
              </h1>
            </div>
          </div>

          {/* Profile Header Card */}
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 lg:p-8">
              <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
                {/* Avatar */}
                <div className="relative">
                  <UserAvatar
                    photo={null}
                    name={lauraData.name}
                    gender={lauraData.gender}
                    size={160}
                    className="shadow-lg"
                  />
                  <div
                    className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-3 border-white ${status.color}`}
                    title={status.label}
                  />
                </div>

                {/* Basic Info */}
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
                    {lauraData.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-muted-foreground lg:justify-start">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="5" />
                        <line x1="12" y1="13" x2="12" y2="21" />
                        <line x1="9" y1="18" x2="15" y2="18" />
                      </svg>
                      {lauraData.gender}
                    </span>
                    <span className="text-border">•</span>
                    <span>{lauraData.age} anos</span>
                    <span className="text-border">•</span>
                    <span>{lauraData.civilStatus}</span>
                  </div>

                  {/* Status Badge */}
                  <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 ${status.bgColor}`}>
                    <span className={`h-2 w-2 rounded-full ${status.color}`} />
                    <span className={`text-sm font-medium ${status.textColor}`}>{status.label}</span>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm lg:justify-start">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      {lauraData.phone}
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {lauraData.address}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-3">
                  <Button className="h-12 gap-2 rounded-xl px-6 shadow-md">
                    <Phone className="h-5 w-5" />
                    Ligar
                  </Button>
                  <Button variant="outline" className="h-12 gap-2 rounded-xl px-6">
                    <MessageCircle className="h-5 w-5" />
                    Registar Contacto
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Alert Card */}
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">Atenção necessária</h3>
                <p className="mt-1 text-sm text-amber-700">
                  A D. Laura mostrou sinais de tristeza na última chamada. Recomenda-se uma visita presencial em breve para avaliar o seu bem-estar emocional.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {[
              { id: "info", label: "Informações", icon: User },
              { id: "history", label: "Histórico", icon: Clock },
              { id: "avaliacoes", label: "Avaliações", icon: Clipboard },
              { id: "notes", label: "Notas", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "info" | "history" | "avaliacoes" | "notes")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          {activeTab === "info" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Support Types */}
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <Heart className="h-5 w-5 text-primary" />
                    Tipos de Apoio
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lauraData.supportTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Interests */}
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <Heart className="h-5 w-5 text-primary" />
                    Interesses
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lauraData.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Health Notes */}
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Notas de Saúde
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {lauraData.healthNotes}
                  </p>
                </CardContent>
              </Card>

              {/* Family Info */}
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <User className="h-5 w-5 text-primary" />
                    Informação Familiar
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {lauraData.familyInfo}
                  </p>
                </CardContent>
              </Card>

              {/* Personal Notes - Full Width */}
              <Card className="border-border bg-card shadow-sm lg:col-span-2">
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <FileText className="h-5 w-5 text-primary" />
                    Notas Pessoais
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {lauraData.notes}
                  </p>
                </CardContent>
              </Card>

              {/* Registration Info */}
              <Card className="border-border bg-card shadow-sm lg:col-span-2">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Registado em</p>
                      <p className="font-medium text-foreground">{lauraData.registeredDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Último contacto</p>
                      <p className="font-medium text-foreground">{lauraData.lastContact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Histórico de Contactos</h3>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" />
                  Adicionar Registo
                </Button>
              </div>
              
              <div className="space-y-4">
                {visitHistory.map((visit, index) => (
                  <Card key={index} className="border-border bg-card shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            {visit.type.includes("Chamada") ? (
                              <Phone className="h-5 w-5 text-primary" />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">{visit.type}</span>
                              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                                {visit.duration}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{visit.date}</p>
                            <p className="mt-3 leading-relaxed text-foreground">{visit.notes}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "avaliacoes" && (
            <div className="space-y-6">
              {/* Tab Header */}
              <div>
                <h3 className="text-xl font-semibold text-foreground">Avaliações</h3>
                <p className="mt-1 text-muted-foreground">
                  Acompanhe o bem-estar e a evolução da pessoa idosa através de avaliações periódicas.
                </p>
              </div>

              {/* Assessment Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assessments.map((assessment) => {
                  const Icon = assessment.icon
                  return (
                    <Card key={assessment.id} className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                      <CardContent className="flex flex-col p-6">
                        {/* Icon and Title */}
                        <div className="mb-4 flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{assessment.title}</h4>
                            <span className="mt-1 inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                              {assessment.status}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                          {assessment.description}
                        </p>

                        {/* Last Completion */}
                        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Última realização: {assessment.lastCompletion}</span>
                        </div>

                        {/* Action Button */}
                        <Link href={assessment.route}>
                          <Button className="w-full gap-2 rounded-xl">
                            Preencher Avaliação
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Notas do Voluntário</h3>
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                    <Plus className="h-4 w-4" />
                    Adicionar Nota
                  </Button>
                </div>
                <div className="rounded-xl border border-input bg-background p-4">
                  <p className="leading-relaxed text-foreground">
                    {lauraData.notes}
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Última atualização: 28 de Maio de 2026
                  </p>
                </div>
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
                  A sua presença faz a diferença.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cada visita e cada conversa ajudam a combater a solidão e trazem alegria à vida da D. Laura.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
