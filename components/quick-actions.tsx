import { UserPlus, Users, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function QuickActions() {
  const actions = [
    {
      icon: UserPlus,
      title: "Adicionar Idoso",
      description:
        "Registe um novo idoso na plataforma para começar a prestar apoio.",
      href: "/voluntario/painel?action=adicionar",
    },
    {
      icon: Users,
      title: "Gerir Idosos",
      description:
        "Veja e acompanhe os idosos que estão sob o seu acompanhamento.",
      href: "/voluntario/painel?action=gerir",
    },
    {
      icon: ShieldCheck,
      title: "Guia do Utilizador PACTO",
      description:
        "Descubra como navegar na plataforma PACTO, gerir o seu perfil de voluntário e começar a fazer a diferença na vida dos idosos hoje mesmo.",
      href: "/",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {actions.map((action, index) => {
        const Icon = action.icon;

        const cardContent = (
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              {action.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {action.description}
            </p>
          </CardContent>
        );

        if (action.href) {
          return (
            <Link key={index} href={action.href} className="block">
              <Card className="h-full border-border bg-card shadow-sm transition-shadow hover:shadow-md cursor-pointer">
                {cardContent}
              </Card>
            </Link>
          );
        }

        return (
          <Card
            key={index}
            className="border-border bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            {cardContent}
          </Card>
        );
      })}
    </section>
  );
}
