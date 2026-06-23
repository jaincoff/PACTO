import { ClipboardCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function ApprovalCard() {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <ClipboardCheck className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Antes de contactar um idoso
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Para garantir a segurança e o bem-estar de todos, é necessário
                concluir e ser aprovado nas avaliações de voluntariado do PACTO.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Estado das avaliações:
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Por concluir
                </span>
              </div>
            </div>
          </div>

          <Link href="/voluntario/avaliacoes">
            <Button className="h-12 shrink-0 gap-2 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90">
              Iniciar Avaliação
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
