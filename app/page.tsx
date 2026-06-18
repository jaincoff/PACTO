"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Users,
  Shield,
  UserCheck,
  ArrowRight,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PactoLogo } from "@/components/pacto-logo";
import {
  getLandingMetrics,
  getCurrentUserProfile,
  clearAuthSession,
  getStoredAuthToken,
  getStoredAuthUser,
  getDashboardRouteForRole,
  type LandingMetrics,
} from "../lib/api";

export default function LandingPage() {
  const router = useRouter();
  const redirected = useRef(false);
  const [metrics, setMetrics] = useState<LandingMetrics>({
    active_volunteers: 0,
    active_supervisors: 0,
    elders_supported: 0,
  });

  // Redirect authenticated users to their dashboard — verify token with API first
  useEffect(() => {
    if (redirected.current) return;
    const token = getStoredAuthToken();
    const user = getStoredAuthUser();
    if (!token || !user?.role) return;

    redirected.current = true;

    getCurrentUserProfile(token)
      .then((prof) => {
        router.replace(getDashboardRouteForRole(prof.role));
      })
      .catch(() => {
        clearAuthSession();
        redirected.current = false;
      });
  }, []);

  useEffect(() => {
    getLandingMetrics()
      .then(setMetrics)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <PactoLogo variant="compact" href="/" size={40} />

          {/* Navigation */}
          <nav className="hidden items-center gap-8 lg:flex">
            <Link
              href="/"
              className="relative text-sm font-medium text-primary after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-primary"
            >
              Início
            </Link>
            <Link
              href="#sobre"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sobre Nós
            </Link>
            <Link
              href="#como-funciona"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Como Funciona
            </Link>
            <Link
              href="#impacto"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Impacto
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Perguntas Frequentes
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="hidden border-primary text-primary hover:bg-primary/5 sm:flex"
              asChild
            >
              <Link href="/login">Iniciar Sessão</Link>
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              asChild
            >
              <Link href="/registar">Quero Ser Voluntário</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            {/* Left Content */}
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                <span className="text-balance">Ligamos gerações.</span>
                <br />
                <span className="text-balance">Transformamos vidas.</span>
                <Heart className="ml-2 inline-block h-10 w-10 text-primary md:h-12 md:w-12" />
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground lg:text-xl">
                O PACTO promove o bem-estar e a inclusão social das pessoas
                idosas através de relações humanas, apoio voluntário e
                tecnologia ao serviço da comunidade.
              </p>
              {/* 
              <div className="mt-6 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Voluntarios ativos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {metrics.active_volunteers}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Supervisores ativos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {metrics.active_supervisors}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Idosos apoiados
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {metrics.elders_supported}
                  </p>
                </div>
              </div> */}

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-full bg-primary px-6 text-base text-primary-foreground hover:bg-primary/90"
                  asChild
                >
                  <Link href="/registar">
                    Quero Ser Voluntário
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 gap-2 rounded-full border-border px-6 text-base text-foreground hover:bg-secondary"
                  asChild
                >
                  <Link href="#sobre">
                    Saber Mais
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Content - Hero Illustration */}
            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
                <Image
                  src="/images/hero-illustration.png"
                  alt="Voluntário PACTO a conversar com uma pessoa idosa num ambiente acolhedor"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/30 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Pequenos gestos. Grandes impactos.
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Heart,
                title: "Companhia",
                description:
                  "Combata a solidão com visitas, conversas e momentos que fazem a diferença.",
              },
              {
                icon: UserCheck,
                title: "Apoio Personalizado",
                description:
                  "Cada pessoa é única. Adaptamos o apoio às suas necessidades e preferências.",
              },
              {
                icon: Users,
                title: "Comunidade",
                description:
                  "Voluntários e idosos unidos para criar uma comunidade mais humana e solidária.",
              },
              {
                icon: Shield,
                title: "Confiança e Segurança",
                description:
                  "Plataforma segura, ética e pensada para proteger quem mais importa.",
              },
            ].map((feature, index) => (
              <Card key={index} className="border-border/50 bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Empathy CTA Banner */}
      <section className="bg-card py-6">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <Card className="border-border/50 bg-secondary/20">
            <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Juntos, construímos um futuro com mais empatia.
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    O seu tempo pode ser o melhor presente que alguém pode
                    receber.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="shrink-0 gap-2 border-primary text-primary hover:bg-primary/5"
                asChild
              >
                <Link href="/registar">
                  Saber Como Ajudar
                  <Heart className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              O que é o PACTO?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              O PACTO é uma iniciativa dedicada a aproximar gerações, promover o
              voluntariado e melhorar o bem-estar das pessoas idosas através de
              relações humanas genuínas.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Inclusão Social", icon: Users },
              { title: "Voluntariado", icon: Heart },
              { title: "Bem-Estar", icon: UserCheck },
              { title: "Envelhecimento Ativo", icon: Shield },
            ].map((item, index) => (
              <Card
                key={index}
                className="border-border/50 bg-card text-center shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {item.title}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="bg-secondary/30 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Como Funciona
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Registe-se",
                description:
                  "Crie a sua conta de voluntário na plataforma PACTO.",
              },
              {
                step: "2",
                title: "Realize a Formação",
                description:
                  "Conclua a avaliação inicial e preparação para o voluntariado.",
              },
              {
                step: "3",
                title: "Apoie Pessoas Idosas",
                description:
                  "Construa relações significativas e faça a diferença na vida de alguém.",
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                {index < 2 && (
                  <ChevronRight className="absolute right-0 top-8 hidden h-8 w-8 -translate-y-1/2 text-primary/30 md:block lg:right-[-16px]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer CTA Section */}
      <section
        id="impacto"
        className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 lg:py-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
              Torne-se Voluntário
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              O seu tempo pode transformar a vida de alguém.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Milhares de pessoas idosas enfrentam diariamente a solidão e o
              isolamento social. Com um simples gesto, uma conversa ou uma
              visita, pode fazer a diferença e criar ligações que realmente
              importam.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Ao juntar-se ao PACTO, estará a contribuir para uma comunidade
              mais inclusiva, humana e solidária.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-left">
              {[
                "Ajude a combater a solidão",
                "Crie relações significativas",
                "Desenvolva competências pessoais e sociais",
                "Faça parte de uma comunidade de voluntários",
                "Contribua para o bem-estar das pessoas idosas",
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
                asChild
              >
                <Link href="/registar">
                  Quero Ser Voluntário
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-full border-primary px-8 text-base text-primary hover:bg-primary/5"
                asChild
              >
                <Link href="#sobre">
                  Saber Mais
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              Junte-se ao PACTO e faça parte de uma rede de pessoas
              comprometidas com o cuidado, a empatia e a inclusão social.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            {/* Logo */}
            <PactoLogo variant="compact" href="/" size={40} />

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link
                href="#sobre"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Sobre Nós
              </Link>
              <Link
                href="#contactos"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Contactos
              </Link>
              <Link
                href="/privacidade"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/termos"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Termos e Condições
              </Link>
            </nav>
          </div>

          <div className="mt-8 border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © PACTO — Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
