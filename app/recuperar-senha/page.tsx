"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Smartphone,
  ArrowLeft,
  Check,
  Shield,
  Heart,
  Users,
  HandHeart,
  KeyRound,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PactoLogo } from "@/components/pacto-logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  forgotPasswordRequest,
  verifyResetCodeRequest,
  resetPasswordRequest,
} from "../../lib/api";

type Step = "method" | "code" | "reset" | "success";

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("method");

  // Step 1 - Method
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [maskedContact, setMaskedContact] = useState("");

  // Step 2 - Code
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");

  // Step 3 - Reset
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Shared
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload = method === "email"
        ? { email: contact }
        : { phone: contact };

      const result = await forgotPasswordRequest(payload);
      setMaskedContact(result.masked_contact);
      setStep("code");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao solicitar codigo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setErrorMessage("Introduza o codigo de 6 digitos.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = method === "email"
        ? { email: contact, code: fullCode }
        : { phone: contact, code: fullCode };

      const result = await verifyResetCodeRequest(payload);
      setResetToken(result.reset_token);
      setStep("reset");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Codigo invalido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("As palavras-passe nao coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPasswordRequest({
        reset_token: resetToken,
        new_password: newPassword,
      });
      setStep("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao redefinir palavra-passe.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Left Side - Warm Branding Panel */}
        <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-16">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Heart className="h-4 w-4" />
                Voluntariado Compassivo e Intergeracional
              </span>
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground xl:text-5xl">
              Cada ligacao humana pode transformar uma vida.
            </h1>

            <p className="mb-10 max-w-lg text-lg leading-relaxed text-muted-foreground">
              O PACTO aproxima voluntarios e pessoas idosas para combater a
              solidao, fortalecer relacoes humanas e promover o bem-estar
              atraves da comunidade.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-xl bg-card/60 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-medium text-foreground">
                  Combater a solidao
                </span>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-card/60 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <HandHeart className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-medium text-foreground">
                  Apoiar pessoas idosas
                </span>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-card/60 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-medium text-foreground">
                  Construir relacoes significativas
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-12 pb-10 xl:px-16">
            <div className="flex items-center gap-3 rounded-2xl bg-card/80 p-5 backdrop-blur-sm">
              <Heart className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Juntos construimos uma comunidade mais humana.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
              <PactoLogo variant="full" orientation="vertical" href="/" size={140} className="lg:items-start lg:text-left" />
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                  <Shield className="h-3 w-3" />
                  Plataforma Segura
                </span>
              </div>
            </div>

            {step !== "success" && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => {
                    if (step === "code") { setStep("method"); setErrorMessage(""); }
                    else if (step === "reset") { setStep("code"); setErrorMessage(""); }
                    else router.push("/login");
                  }}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {step === "method" ? "Voltar para o inicio de sessao" : "Voltar"}
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg shadow-primary/5">

              {/* Step: Choose Method */}
              {step === "method" && (
                <>
                  <div className="mb-8 text-center lg:text-left">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Recuperar palavra-passe
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Escolha como deseja receber o codigo de recuperacao.
                    </p>
                  </div>

                  {errorMessage ? (
                    <Alert variant="destructive" className="mb-6 border-destructive/30">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  ) : null}

                  <form onSubmit={handleRequestCode} className="space-y-5">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        Metodo de contacto
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => { setMethod("email"); setContact(""); setErrorMessage(""); }}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                            method === "email"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <Mail className="h-6 w-6" />
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => { setMethod("phone"); setContact(""); setErrorMessage(""); }}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                            method === "phone"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <Smartphone className="h-6 w-6" />
                          Telemovel
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contact" className="flex items-center gap-2 text-sm font-medium text-foreground">
                        {method === "email" ? (
                          <Mail className="h-4 w-4 text-primary" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-primary" />
                        )}
                        {method === "email" ? "O seu email" : "O seu numero de telemovel"}
                      </label>
                      <Input
                        id="contact"
                        type={method === "email" ? "email" : "tel"}
                        placeholder={method === "email" ? "exemplo@email.com" : "912345678"}
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="h-13 rounded-xl border-border bg-background px-4 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !contact}
                      className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
                    >
                      {isSubmitting ? "A enviar..." : "Enviar codigo"}
                    </Button>
                  </form>
                </>
              )}

              {/* Step: Enter Code */}
              {step === "code" && (
                <>
                  <div className="mb-8 text-center lg:text-left">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Codigo de verificacao
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Introduza o codigo de 6 digitos enviado para{" "}
                      <span className="font-medium text-foreground">{maskedContact}</span>.
                    </p>
                  </div>

                  {errorMessage ? (
                    <Alert variant="destructive" className="mb-6 border-destructive/30">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  ) : null}

                  <form onSubmit={handleVerifyCode} className="space-y-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <KeyRound className="h-4 w-4 text-primary" />
                        Codigo de 6 digitos
                      </label>
                      <div className="flex justify-center gap-2">
                        {code.map((digit, index) => (
                          <Input
                            key={index}
                            id={`code-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleCodeChange(index, e.target.value)}
                            onKeyDown={(e) => handleCodeKeyDown(index, e)}
                            className="h-14 w-12 rounded-xl border-border bg-background text-center text-xl font-bold transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || code.join("").length !== 6}
                      className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
                    >
                      {isSubmitting ? "A verificar..." : "Verificar codigo"}
                    </Button>
                  </form>
                </>
              )}

              {/* Step: Reset Password */}
              {step === "reset" && (
                <>
                  <div className="mb-8 text-center lg:text-left">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Redefinir palavra-passe
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Escolha uma nova palavra-passe para a sua conta.
                    </p>
                  </div>

                  {errorMessage ? (
                    <Alert variant="destructive" className="mb-6 border-destructive/30">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  ) : null}

                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="new-password" className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Lock className="h-4 w-4 text-primary" />
                        Nova palavra-passe
                      </label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Minimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-13 rounded-xl border-border bg-background px-4 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirm-password" className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Lock className="h-4 w-4 text-primary" />
                        Confirmar nova palavra-passe
                      </label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Repita a nova palavra-passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-13 rounded-xl border-border bg-background px-4 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !newPassword || !confirmPassword}
                      className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
                    >
                      {isSubmitting ? "A redefinir..." : "Redefinir palavra-passe"}
                    </Button>
                  </form>
                </>
              )}

              {/* Step: Success */}
              {step === "success" && (
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>

                  <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
                    Palavra-passe redefinida
                  </h2>
                  <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
                    A sua palavra-passe foi redefinida com sucesso.
                    Pode agora iniciar sessao com a sua nova palavra-passe.
                  </p>

                  <Button
                    onClick={() => router.push("/login")}
                    className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
                  >
                    Iniciar sessao
                  </Button>
                </div>
              )}
            </div>

            {step === "method" && (
              <>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl bg-primary/5 p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span>Plataforma segura</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span>Protecao de dados</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span>Voluntariado responsavel</span>
                  </div>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Lembrou-se da sua palavra-passe?{" "}
                  <Link href="/login" className="font-semibold text-primary transition-colors hover:text-primary/80">
                    Iniciar sessao
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
