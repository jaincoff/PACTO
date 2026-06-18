import Link from "next/link";
import { Home, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md px-6 text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Error code */}
        <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>

        {/* Title */}
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">
          Pagina nao encontrada
        </h2>

        {/* Message */}
        <p className="mb-8 leading-relaxed text-muted-foreground">
          A pagina que procura nao existe ou foi removida. Se acha que isto e
          um erro, entre em contacto com a equipa de suporte do PACTO.
        </p>

        {/* Action */}
        <Button asChild size="lg" className="gap-2 rounded-xl">
          <Link href="/">
            <Home className="h-5 w-5" />
            Voltar ao Inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
