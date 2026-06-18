"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import {
  ArrowLeft,
  User,
  Calendar,
  Users,
  MapPin,
  Heart,
  Shield,
  HelpCircle,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createElder, getStoredAuthToken, getStoredAuthUser } from "../../lib/api";

export default function AdicionarIdosoPage() {
  const router = useRouter();
  const user = getStoredAuthUser();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i - 18);
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [gender, setGender] = useState("");
  const [supportType, setSupportType] = useState("");
  const [mobility, setMobility] = useState("");
  const [healthIssues, setHealthIssues] = useState("");
  const [medications, setMedications] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [civilStatus, setCivilStatus] = useState("");

  useEffect(() => {
    if (user?.status !== "active") {
      router.replace("/voluntario/painel");
    }
  }, [user?.status, router]);

  if (user?.status !== "active") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback("");

    const token = getStoredAuthToken();
    if (!token) {
      setFeedback("Sessao expirada. Inicie sessao novamente.");
      return;
    }

    setIsSubmitting(true);
    try {
      const age = birthYear
        ? Math.max(0, currentYear - Number(birthYear))
        : undefined;
      const payload = await createElder(token, {
        name,
        age,
        address: address || undefined,
        email: email || undefined,
        phone: phone || undefined,
        emergency_contact: emergencyContact || civilStatus || undefined,
      });
      setFeedback(`Idoso guardado com sucesso. ID: ${payload.elder_id}`);
      setName("");
      setBirthYear("");
      setAddress("");
      setEmail("");
      setPhone("");
      setEmergencyContact("");
      setCivilStatus("");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Falha ao guardar idoso.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Sidebar (Desktop only) */}
      <Sidebar activeItem="adicionar" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-3xl space-y-8 p-4 lg:p-10">
          {/* Page Header */}
          <header className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card text-primary shadow-sm transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Voltar ao painel</span>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    Adicionar Idoso
                  </h1>
                  <p className="mt-1 text-base text-muted-foreground">
                    Registe um novo idoso na plataforma para começar a prestar
                    apoio.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="hidden gap-2 text-primary hover:bg-primary/5 hover:text-primary lg:flex"
              >
                <HelpCircle className="h-4 w-4" />
                Precisa de ajuda?
              </Button>
            </div>
          </header>

          {/* Main Form Card */}
          <Card className="border-0 bg-card shadow-xl shadow-primary/5">
            <CardContent className="p-6 lg:p-10">
              {/* Section Header */}
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Informações do Idoso
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Por favor, preencha os dados abaixo para registar o idoso na
                    plataforma.
                  </p>
                </div>
              </div>

              {feedback ? (
                <div className="mb-6 rounded-xl border border-border bg-background p-3 text-sm text-foreground">
                  {feedback}
                </div>
              ) : null}

              {/* Form Fields */}
              <form className="space-y-7" onSubmit={handleSubmit}>
                {/* Nome Completo */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 text-primary/60" />
                    <Label
                      htmlFor="nome"
                      className="text-sm font-medium text-foreground"
                    >
                      Nome Completo <span className="text-primary">*</span>
                    </Label>
                  </div>
                  <Input
                    id="nome"
                    placeholder="Ex.: António da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-13 rounded-xl border-border/60 bg-background px-4 text-base shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-primary/60" />
                    <Label
                      htmlFor="ano"
                      className="text-sm font-medium text-foreground"
                    >
                      Data de Nascimento (ano){" "}
                      <span className="text-primary">*</span>
                    </Label>
                  </div>
                  <Select value={birthYear} onValueChange={setBirthYear}>
                    <SelectTrigger
                      id="ano"
                      className="h-13 rounded-xl border-border/60 bg-background px-4 text-base shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <SelectValue placeholder="Ex.: 1948" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Indique o ano de nascimento (apenas anos).
                  </p>
                </div>

                {/* Género */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-primary/60" />
                    <Label className="text-sm font-medium text-foreground">
                      Género <span className="text-primary">*</span>
                    </Label>
                  </div>
                  <Select>
                    <SelectTrigger className="h-13 rounded-xl border-border/60 bg-background px-4 text-base shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Selecione o género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Morada */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-primary/60" />
                    <Label
                      htmlFor="morada"
                      className="text-sm font-medium text-foreground"
                    >
                      Morada <span className="text-primary">*</span>
                    </Label>
                  </div>
                  <Input
                    id="morada"
                    placeholder="Ex.: Rua das Flores, nº 123, 3000-123 Coimbra"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-13 rounded-xl border-border/60 bg-background px-4 text-base shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Contactos */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-13 rounded-xl border-border/60 bg-background px-4 text-base shadow-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium text-foreground"
                    >
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      placeholder="912 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-13 rounded-xl border-border/60 bg-background px-4 text-base shadow-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="emergency"
                    className="text-sm font-medium text-foreground"
                  >
                    Contacto de Emergencia
                  </Label>
                  <Input
                    id="emergency"
                    placeholder="Nome e contacto"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="h-13 rounded-xl border-border/60 bg-background px-4 text-base shadow-sm transition-all"
                  />
                </div>

                {/* Estado Civil */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Heart className="h-4 w-4 text-primary/60" />
                    <Label className="text-sm font-medium text-foreground">
                      Estado Civil <span className="text-primary">*</span>
                    </Label>
                  </div>
                  <RadioGroup
                    value={civilStatus}
                    onValueChange={setCivilStatus}
                    className="flex flex-wrap gap-3"
                  >
                    {[
                      "Solteiro(a)",
                      "Casado(a)",
                      "Viúvo(a)",
                      "Divorciado(a)",
                    ].map((estado) => (
                      <div key={estado} className="flex items-center">
                        <RadioGroupItem
                          value={estado.toLowerCase()}
                          id={estado.toLowerCase()}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={estado.toLowerCase()}
                          className="cursor-pointer rounded-xl border border-border/60 bg-background px-5 py-3 text-sm font-medium shadow-sm transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary peer-data-[state=checked]:shadow-md hover:border-primary/40 hover:bg-secondary"
                        >
                          {estado}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Privacy Section */}
                <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Privacidade e Segurança
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Todas as informações são confidenciais e usadas apenas
                        para proporcionar o melhor apoio possível.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl border-border/60 px-8 text-base font-medium shadow-sm transition-all hover:bg-secondary hover:shadow-md"
                    asChild
                  >
                    <Link href="/">Cancelar</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 gap-2.5 rounded-xl bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                  >
                    <UserPlus className="h-5 w-5" />
                    {isSubmitting ? "A guardar..." : "Guardar Idoso"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Bottom Message Card */}
          <Card className="border-0 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent shadow-lg shadow-primary/5">
            <CardContent className="flex items-center gap-5 p-6 lg:p-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Heart className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Cada registo é um passo para uma ligação que faz a diferença.
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Ao adicionar um idoso, está a abrir portas para amizade, apoio
                  e bem-estar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
