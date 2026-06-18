"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Heart,
  Mail,
  Lock,
  Shield,
  Check,
  Users,
  HandHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PactoLogo } from "@/components/pacto-logo";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getDashboardRouteForRole,
  getStoredAuthToken,
  getStoredAuthUser,
  getCurrentUserProfile,
  clearAuthSession,
  loginRequest,
  persistAuthSession,
} from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Redirect if already authenticated — verify token with API first
  useEffect(() => {
    const token = getStoredAuthToken();
    const user = getStoredAuthUser();
    if (!token || !user?.role) return;

    let cancelled = false;
    getCurrentUserProfile(token)
      .then((prof) => {
        if (cancelled) return;
        router.replace(getDashboardRouteForRole(prof.role));
      })
      .catch(() => {
        if (cancelled) return;
        clearAuthSession();
      });

    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload = await loginRequest(email, password);
      persistAuthSession(payload, rememberMe);
      router.push(getDashboardRouteForRole(payload.user.role));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Falha ao iniciar sessao.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Left Side - Warm Branding Panel (Hidden on mobile) */}
        <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between">
          {/* Warm gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />

          {/* Subtle decorative shapes */}
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

          {/* Content */}
          <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-16">
            {/* Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Heart className="h-4 w-4" />
                Voluntariado Compassivo e Intergeracional
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground xl:text-5xl">
              Cada ligacao humana pode transformar uma vida.
            </h1>

            {/* Description */}
            <p className="mb-10 max-w-lg text-lg leading-relaxed text-muted-foreground">
              O PACTO aproxima voluntarios e pessoas idosas para combater a
              solidao, fortalecer relacoes humanas e promover o bem-estar
              atraves da comunidade.
            </p>

            {/* Benefits */}
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

          {/* Bottom message */}
          <div className="relative z-10 px-12 pb-10 xl:px-16">
            <div className="flex items-center gap-3 rounded-2xl bg-card/80 p-5 backdrop-blur-sm">
              <Heart className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Juntos construimos uma comunidade mais humana.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-md">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
              <PactoLogo variant="full" orientation="vertical" href="/" size={140} className="lg:items-start lg:text-left" />
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                  <Shield className="h-3 w-3" />
                  Plataforma Segura
                </span>
              </div>
            </div>

            {/* Login Card */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg shadow-primary/5">
              {/* Header */}
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Bem-vindo ao PACTO
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Continue a criar ligacoes que fazem a diferenca na vida das
                  pessoas idosas.
                </p>
              </div>

              {errorMessage ? (
                <Alert
                  variant="destructive"
                  className="mb-6 border-destructive/30"
                >
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <Mail className="h-4 w-4 text-primary" />
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Introduza o seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-13 rounded-xl border-border bg-background px-4 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="flex items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <Lock className="h-4 w-4 text-primary" />
                    Palavra-passe
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Introduza a sua palavra-passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-13 rounded-xl border-border bg-background px-4 pr-12 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword
                          ? "Ocultar palavra-passe"
                          : "Mostrar palavra-passe"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked: boolean | "indeterminate") =>
                        setRememberMe(checked === true)
                      }
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor="remember"
                      className="cursor-pointer text-sm text-muted-foreground"
                    >
                      Lembrar-me
                    </label>
                  </div>
                  <Link
                    href="/recuperar-senha"
                    className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Esqueceu-se da palavra-passe?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
                >
                  {isSubmitting ? "A entrar..." : "Entrar"}
                </Button>
              </form>

              {/* Trust Section */}
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

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Social Login */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-border bg-card text-sm font-medium text-foreground transition-all hover:bg-secondary"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar com Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-border bg-card text-sm font-medium text-foreground transition-all hover:bg-secondary"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23">
                    <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  Continuar com Microsoft
                </Button>
              </div>

              {/* Create Account Link */}
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Ainda nao tem conta?{" "}
                <Link
                  href="/registar"
                  className="font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Criar Conta
                </Link>
              </p>
            </div>

            {/* Bottom Message */}
            <div className="mt-8 rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Obrigado por fazer parte de uma comunidade dedicada ao cuidado,
                a empatia e a inclusao social.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
