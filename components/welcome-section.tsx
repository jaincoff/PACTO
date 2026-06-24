import Image from "next/image";

export function WelcomeSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-card to-secondary/50 p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            Bem-vindo ao PACTO!
          </h1>
          <p className="text-lg font-semibold text-primary">
            Voluntariado Compassivo e Intergeracional
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            O PACTO promove o encontro entre voluntários e idosos, criando
            ligações significativas, combatendo a solidão e promovendo o
            bem-estar e a inclusão social.
          </p>
        </div>

        {/* Hero Illustration */}
        {/* <div className="relative h-64 w-full lg:h-80 lg:w-96">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/file_00000000a7a071f492c0dd90825f47bd-GF8AjUntrdSv904yQOmzQmbK8UItwc.png"
            alt="Ilustração de um voluntário jovem e uma pessoa idosa de mãos dadas, representando a conexão intergeracional do PACTO"
            fill
            className="object-contain"
            priority
          />
        </div> */}

        <div className="relative h-64 w-full lg:h-80 lg:w-96">
          <img
            alt="Ilustração de dois voluntários jovens com t-shirts PACTO ao lado de um homem idoso, representando a conexão intergeracional do PACTO"
            decoding="async"
            data-nimg="fill"
            className="object-contain"
            style={{
              position: "absolute",
              height: "100%",
              width: "100%",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              color: "transparent",
            }}
            src="/images/dashboard-illustration.png"
          />
        </div>
      </div>
    </section>
  );
}
