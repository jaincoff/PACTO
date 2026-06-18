"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Users,
  Check,
  ChevronDown,
  Globe,
  UserRound,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  elderRegisterRequest,
  registerUserRequest,
  getCurrentUserProfile,
  clearAuthSession,
  getStoredAuthToken,
  getStoredAuthUser,
  getDashboardRouteForRole,
} from "../../lib/api";
import { PactoLogo } from "@/components/pacto-logo";

type Role = "voluntario" | "idoso" | "supervisor";

const roles = [
  { id: "voluntario" as Role, title: "Voluntario", icon: HeartHandshake },
  { id: "idoso" as Role, title: "Idoso", icon: UserRound },
  { id: "supervisor" as Role, title: "Supervisor", icon: ShieldCheck },
];

export default function RegistarPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("voluntario");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [birthYearError, setBirthYearError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const redirectedReg = useRef(false);

  // Redirect if already authenticated — verify token with API first
  useEffect(() => {
    if (redirectedReg.current) return;
    const token = getStoredAuthToken();
    const user = getStoredAuthUser();
    if (!token || !user?.role) return;

    redirectedReg.current = true;

    getCurrentUserProfile(token)
      .then((prof) => {
        router.replace(getDashboardRouteForRole(prof.role));
      })
      .catch(() => {
        clearAuthSession();
        redirectedReg.current = false;
      });
  }, []);

  const currentYear = new Date().getFullYear();

  // Single unified form state
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telemovel: "",
    anoNascimento: "",
    sexo: "",
    morada: "",
    estadoCivil: "",
    password: "",
    confirmPassword: "",
    termos: false,
  });

  const validateBirthYear = (value: string): boolean => {
    const year = parseInt(value);
    if (isNaN(year) || year < 1900 || year > currentYear) {
      setBirthYearError("Introduza um ano de nascimento valido.");
      return false;
    }
    setBirthYearError("");
    return true;
  };

  const handleBirthYearChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    setFormData({ ...formData, anoNascimento: numericValue });

    if (numericValue.length === 4) {
      validateBirthYear(numericValue);
    } else {
      setBirthYearError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateBirthYear(formData.anoNascimento)) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitError("As palavras-passe nao coincidem.");
      return;
    }

    if (!formData.termos) {
      setSubmitError("Tem de aceitar os Termos e Condicoes para continuar.");
      return;
    }

    setIsLoading(true);
    try {
      if (selectedRole === "idoso") {
        await elderRegisterRequest({
          email: formData.email || undefined,
          phone: formData.telemovel || undefined,
          password: formData.password,
        });
      } else {
        await registerUserRequest({
          name: formData.nome,
          email: formData.email,
          password: formData.password,
          role: selectedRole === "voluntario" ? "volunteer" : "supervisor",
          birth_year: formData.anoNascimento ? parseInt(formData.anoNascimento) : null,
          phone: formData.telemovel || null,
          gender: formData.sexo || null,
        });
      }

      setIsSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Falha ao criar conta.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <PactoLogo variant="compact" href="/" size={40} />
          </div>
        </header>

        {/* Success State */}
        <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md border-border bg-card text-center shadow-lg">
            <CardContent className="p-8">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-10 w-10 text-primary" />
              </div>
              <h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
                Bem-vindo ao PACTO
              </h1>
              <p className="mb-8 text-muted-foreground">
                A sua conta foi criada com sucesso.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <PactoLogo variant="compact" href="/" size={40} />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Ja tem uma conta?</span>
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Iniciar Sessao
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Page Title */}
        <div className="mb-10 text-center">
          <PactoLogo variant="full" orientation="vertical" size={140} className="mb-4" />
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Criar Conta
          </h1>
          <p className="text-lg text-muted-foreground">
            Junte-se a comunidade PACTO e faca a diferenca.
          </p>
        </div>

        {/* Registration Form Layout */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left Panel - Info Card */}
          <div className="lg:col-span-2">
            <Card className="h-full border-border bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-sm">
              <CardContent className="flex h-full flex-col justify-center p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
                  Bem-vindo ao PACTO
                </h2>
                <p className="mb-2 text-sm font-medium text-primary">
                  Voluntariado Compassivo e Intergeracional
                </p>
                <p className="mb-8 leading-relaxed text-muted-foreground">
                  Criamos ligacoes humanas entre voluntarios e pessoas idosas
                  para combater a solidao, promover o bem-estar e fortalecer a
                  comunidade.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Ligacoes Humanas
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Conectamos pessoas com proposito
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Bem-Estar
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Promovemos saude emocional
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Impacto Social
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Construimos comunidades mais fortes
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Form */}
          <div className="lg:col-span-3">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">Registo</CardTitle>
                <CardDescription>
                  Preencha os dados abaixo para criar a sua conta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {submitError ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {submitError}
                    </div>
                  ) : null}

                  {/* Account Type Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Conta</Label>
                    <div className="flex flex-col gap-1 rounded-xl border border-border bg-secondary/30 p-1 sm:flex-row">
                      {roles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selectedRole === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => setSelectedRole(role.id)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{role.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Unified Form Fields - Same for all account types */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) =>
                          setFormData({ ...formData, nome: e.target.value })
                        }
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telemovel">Telemovel</Label>
                      <Input
                        id="telemovel"
                        value={formData.telemovel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            telemovel: e.target.value,
                          })
                        }
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="anoNascimento">Ano de Nascimento</Label>
                      <Input
                        id="anoNascimento"
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 1990"
                        maxLength={4}
                        value={formData.anoNascimento}
                        onChange={(e) => handleBirthYearChange(e.target.value)}
                        className={`h-12 rounded-xl ${birthYearError ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        required
                      />
                      {birthYearError && (
                        <p className="text-sm text-red-500">{birthYearError}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sexo">Sexo</Label>
                      <div className="relative">
                        <select
                          id="sexo"
                          value={formData.sexo}
                          onChange={(e) =>
                            setFormData({ ...formData, sexo: e.target.value })
                          }
                          className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                          <option value="prefiro-nao-indicar">
                            Prefiro nao indicar
                          </option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="morada">Morada</Label>
                      <Input
                        id="morada"
                        value={formData.morada}
                        onChange={(e) =>
                          setFormData({ ...formData, morada: e.target.value })
                        }
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="estadoCivil">Estado Civil</Label>
                      <div className="relative">
                        <select
                          id="estadoCivil"
                          value={formData.estadoCivil}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              estadoCivil: e.target.value,
                            })
                          }
                          className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="solteiro">Solteiro(a)</option>
                          <option value="casado">Casado(a)</option>
                          <option value="divorciado">Divorciado(a)</option>
                          <option value="viuvo">Viuvo(a)</option>
                          <option value="uniao-de-facto">Uniao de Facto</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Palavra-passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirmar Palavra-passe
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="termos"
                      checked={formData.termos}
                      onChange={(e) =>
                        setFormData({ ...formData, termos: e.target.checked })
                      }
                      className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      required
                    />
                    <Label
                      htmlFor="termos"
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      Li e aceito os{" "}
                      <Link
                        href="/termos"
                        className="text-primary hover:underline"
                      >
                        Termos e Condicoes
                      </Link>{" "}
                      e a{" "}
                      <Link
                        href="/privacidade"
                        className="text-primary hover:underline"
                      >
                        Politica de Privacidade
                      </Link>
                      .
                    </Label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/")}
                      className="h-12 rounded-xl px-6"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-12 rounded-xl bg-primary px-8 text-primary-foreground hover:bg-primary/90"
                    >
                      {isLoading ? "A criar conta..." : "Criar Conta"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
