import { HelpCircle } from "lucide-react"

export function HelpSection() {
  return (
    <section className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <HelpCircle className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Dúvidas ou precisa de ajuda?
        </h3>
        <p className="text-sm text-muted-foreground">
          Contacte a equipa PACTO através do email{" "}
          <a 
            href="mailto:apoio@pacto.pt" 
            className="font-medium text-primary hover:underline"
          >
            apoio@pacto.pt
          </a>
        </p>
      </div>
    </section>
  )
}
