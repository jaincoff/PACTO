"use client";

import { useEffect, useState } from "react";
import { ElderSidebar } from "@/components/elder-sidebar";
import { ElderMobileHeader } from "@/components/elder-mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Brain,
  Smile,
  Leaf,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  HelpCircle,
  User,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import {
  getMyElderProfile,
  getStoredAuthToken,
  type MyElderProfile,
} from "../../../lib/api";

export default function ElderDashboardPage() {
  const [profile, setProfile] = useState<MyElderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = getStoredAuthToken();
      if (!token) {
        setError("Sessao expirada. Inicie sessao novamente.");
        setLoading(false);
        return;
      }

      try {
        const data = await getMyElderProfile(token);
        setProfile(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar perfil do idoso.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const wellbeingCards = [
    {
      id: "bem-estar-psicologico",
      icon: Brain,
      title: "Bem-Estar Psicológico",
      status: "Última avaliação realizada há 15 dias",
      route: "/idoso/laura-alves/avaliacoes/bem-estar-psicologico",
    },
    {
      id: "solidao",
      icon: Heart,
      title: "Solidão",
      status: "Última avaliação realizada há 20 dias",
      route: "/idoso/laura-alves/avaliacoes/solidao",
    },
    {
      id: "qualidade-de-vida",
      icon: Leaf,
      title: "Qualidade de Vida",
      status: "Última avaliação realizada há 10 dias",
      route: "/idoso/laura-alves/avaliacoes/qualidade-de-vida",
    },
  ];

  const activities = [
    {
      icon: Phone,
      title: "Chamada com João Silva",
      date: "12 Junho",
      time: "15:00",
    },
    {
      icon: User,
      title: "Visita de acompanhamento",
      date: "18 Junho",
      time: "14:00",
    },
    {
      icon: Smile,
      title: "Encontro comunitário",
      date: "25 Junho",
      time: "10:30",
    },
  ];

  const contacts = [
    {
      name: "João Silva",
      role: "Voluntário",
      gender: "masculino",
      avatar: null,
    },
    {
      name: "Equipa PACTO",
      role: "Apoio",
      gender: null,
      avatar: null,
    },
    {
      name: "Maria Costa",
      role: "Familiar Responsável",
      gender: "feminino",
      avatar: null,
    },
  ];

  const recentActivity = [
    "João Silva entrou em contacto consigo.",
    "Avaliação de Solidão concluída.",
    "Perfil atualizado.",
    "Nova atividade agendada.",
  ];

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <ElderMobileHeader />

      {/* Sidebar (Desktop only) */}
      <ElderSidebar activeItem="painel" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-4xl space-y-8 p-4 lg:p-8">
          {/* Welcome Section */}
          <Card className="border-border bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-sm">
            <CardContent className="p-8 lg:p-10">
              <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:text-left">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 lg:mb-0 lg:mr-6">
                  <Heart className="h-10 w-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                    Bem-vinda ao PACTO{profile?.name ? `, ${profile.name}` : ""}
                  </h1>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    O PACTO ajuda a criar ligações humanas, combater a solidão e
                    promover o bem-estar através do apoio de voluntários e da
                    comunidade.
                  </p>
                  {loading ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      A carregar dados...
                    </p>
                  ) : null}
                  {!loading && error ? (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                  ) : null}
                  {!loading && profile?.wellbeing_summary ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Resumo: {profile.wellbeing_summary}
                    </p>
                  ) : null}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                    <Link href="/idoso/voluntario">
                      <Button
                        size="lg"
                        className="w-full gap-2 rounded-xl text-base sm:w-auto"
                      >
                        <Heart className="h-5 w-5" />
                        Ver o Meu Voluntário
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full gap-2 rounded-xl text-base sm:w-auto"
                    >
                      <Phone className="h-5 w-5" />
                      Contactar Apoio
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Volunteer Section */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
              <Heart className="h-6 w-6 text-primary" />O Meu Voluntário
            </h2>
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                  <UserAvatar
                    photo={null}
                    name="João Silva"
                    gender="masculino"
                    size={96}
                    className="mb-4 shrink-0 sm:mb-0 sm:mr-6"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground">
                      João Silva
                    </h3>
                    <p className="mt-1 text-base text-primary">
                      Voluntário PACTO
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-green-700">
                        Disponível
                      </span>
                    </div>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                      O seu voluntário está disponível para o acompanhar e
                      apoiar.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Link href="/idoso/voluntario">
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full gap-2 rounded-xl sm:w-auto"
                        >
                          <User className="h-5 w-5" />
                          Ver Perfil
                        </Button>
                      </Link>
                      <Button
                        size="lg"
                        className="w-full gap-2 rounded-xl sm:w-auto"
                      >
                        <Phone className="h-5 w-5" />
                        Contactar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Wellbeing Section */}
          <section>
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                <Smile className="h-6 w-6 text-primary" />O Meu Bem-Estar
              </h2>
              <p className="mt-1 text-base text-muted-foreground">
                Acompanhe as suas avaliações e o seu bem-estar.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wellbeingCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.id}
                    className="border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CardContent className="flex flex-col p-6">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {card.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground">
                        {card.status}
                      </p>
                      <Link href={card.route} className="mt-4">
                        <Button variant="outline" className="w-full rounded-xl">
                          Ver Avaliação
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Activities Section */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
              <Calendar className="h-6 w-6 text-primary" />
              Próximas Atividades
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <Card key={index} className="border-border bg-card shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {activity.title}
                          </h3>
                          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {activity.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {activity.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Contacts Section */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
              <Phone className="h-6 w-6 text-primary" />
              Contactos Importantes
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map((contact, index) => (
                <Card key={index} className="border-border bg-card shadow-sm">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <UserAvatar
                      photo={null}
                      name={contact.name}
                      gender={contact.gender}
                      size={64}
                    />
                    <h3 className="mt-4 font-semibold text-foreground">
                      {contact.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {contact.role}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full gap-2 rounded-xl"
                    >
                      <Phone className="h-4 w-4" />
                      Contactar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Help Section */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                Precisa de ajuda?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                Se necessitar de apoio ou tiver alguma dúvida, contacte a equipa
                PACTO. Estamos disponíveis para ajudar.
              </p>
              <Button size="lg" className="mt-6 gap-2 rounded-xl text-base">
                <Phone className="h-5 w-5" />
                Pedir Ajuda
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity Section */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
              <Clock className="h-6 w-6 text-primary" />
              Atividade Recente
            </h2>
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <ul className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-base text-foreground">
                        {activity}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Bottom Message */}
          <div className="rounded-2xl bg-primary/5 p-6 text-center">
            <Heart className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 text-lg font-medium text-foreground">
              Obrigado por fazer parte do PACTO.
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              Estamos sempre aqui para si.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
