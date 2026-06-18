import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PactoLogoProps {
  variant?: "full" | "compact" | "icon"
  orientation?: "horizontal" | "vertical"
  href?: string
  size?: number
  className?: string
}

export function PactoLogo({
  variant = "full",
  orientation = "horizontal",
  href,
  size = 44,
  className,
}: PactoLogoProps) {
  const isVertical = orientation === "vertical"

  const badge = (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Image
        src="/pacto-logo.png"
        alt="Logotipo PACTO"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  )

  const content = (
    <div
      className={cn(
        "flex",
        isVertical ? "flex-col items-center gap-2 text-center" : "flex-row items-center gap-3",
        className,
      )}
    >
      {badge}
      {variant !== "icon" && (
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-none tracking-tight text-foreground">PACTO</h1>
          {variant === "full" && (
            <p className="mt-1 text-xs leading-tight text-primary">
              Voluntariado Compassivo
              <br />e Intergeracional
            </p>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-opacity hover:opacity-90">
        {content}
      </Link>
    )
  }

  return content
}
