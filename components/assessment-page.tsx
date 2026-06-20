"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Heart, Brain } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Question {
  id: number
  text: string
}

interface AssessmentPageProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  questions: Question[]
  scaleMin: number
  scaleMax: number
  scaleLabels: string[]
  resultsRoute: string
  backRoute?: string
}

export function AssessmentPage({
  title,
  description,
  icon: Icon,
  questions,
  scaleMin,
  scaleMax,
  scaleLabels,
  resultsRoute,
  backRoute = "/avaliacoes",
}: AssessmentPageProps) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)

  const totalQuestions = questions.length
  const progress = ((Object.keys(answers).length) / totalQuestions) * 100
  const currentAnswer = answers[currentQuestion]

  const handleAnswer = (value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: value,
    }))
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleComplete = () => {
    setIsCompleted(true)
  }

  const handleViewResults = () => {
    // In a real app, we would save the answers to the database here
    router.push(resultsRoute)
  }

  const isLastQuestion = currentQuestion === totalQuestions - 1
  const canProceed = currentAnswer !== undefined

  // Completion Screen
  if (isCompleted) {
    return (
      <div className="flex min-h-screen">
        <MobileHeader />
        <Sidebar activeItem="avaliacoes" />

        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="flex min-h-full items-center justify-center p-4 lg:p-8">
            <Card className="w-full max-w-lg border-border bg-card shadow-lg">
              <CardContent className="flex flex-col items-center p-8 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-foreground">Avaliacao Concluida</h1>
                <p className="mb-8 text-muted-foreground">
                  Obrigado por completar esta avaliacao. As suas respostas foram guardadas com sucesso.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={handleViewResults} className="gap-2 rounded-xl">
                    Ver Resultados
                  </Button>
                  <Link href="/avaliacoes">
                    <Button variant="outline" className="gap-2 rounded-xl">
                      Voltar as Avaliacoes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <MobileHeader />
      <Sidebar activeItem="avaliacoes" />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-6xl p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Link href={backRoute}>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground lg:text-2xl">{title}</h1>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Info */}
          <div className="mb-6 flex flex-wrap gap-4">
            <span className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground">
              {totalQuestions} Perguntas
            </span>
            <span className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground">
              Escala de {scaleMin} a {scaleMax}
            </span>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Question Navigation - Desktop */}
            <div className="hidden w-64 shrink-0 lg:block">
              <Card className="sticky top-8 border-border bg-card shadow-sm">
                <CardContent className="p-4">
                  <p className="mb-4 text-sm font-medium text-muted-foreground">Navegacao</p>
                  <div className="space-y-1">
                    {questions.map((_, index) => {
                      const isAnswered = answers[index] !== undefined
                      const isCurrent = index === currentQuestion
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestion(index)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isCurrent
                              ? "bg-primary text-primary-foreground"
                              : isAnswered
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                            isCurrent
                              ? "bg-primary-foreground text-primary"
                              : isAnswered
                              ? "bg-green-200 text-green-700"
                              : "bg-secondary text-muted-foreground"
                          }`}>
                            {isAnswered ? <Check className="h-3 w-3" /> : index + 1}
                          </span>
                          Pergunta {index + 1}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Mobile Progress */}
              <div className="mb-4 lg:hidden">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    Pergunta {currentQuestion + 1} de {totalQuestions}
                  </span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Desktop Progress */}
              <div className="mb-6 hidden lg:block">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    Pergunta {currentQuestion + 1} de {totalQuestions}
                  </span>
                  <span className="text-muted-foreground">{Math.round(progress)}% concluido</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <Card className="mb-6 border-border bg-card shadow-sm">
                <CardContent className="p-6 lg:p-8">
                  <p className="mb-8 text-center text-lg font-medium leading-relaxed text-foreground lg:text-xl">
                    &ldquo;{questions[currentQuestion].text}&rdquo;
                  </p>

                  {/* Answer Options */}
                  <div className="grid gap-3">
                    {scaleLabels.map((label, index) => {
                      const value = index + scaleMin
                      const isSelected = currentAnswer === value
                      
                      return (
                        <button
                          key={value}
                          onClick={() => handleAnswer(value)}
                          className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-input bg-background hover:border-primary/50 hover:bg-secondary/50"
                          }`}
                        >
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          }`}>
                            {value}
                          </span>
                          <span className={`text-base font-medium ${
                            isSelected ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="gap-2 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                {isLastQuestion ? (
                  <Button
                    onClick={handleComplete}
                    disabled={!canProceed}
                    className="gap-2 rounded-xl"
                  >
                    Concluir Avaliacao
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="gap-2 rounded-xl"
                  >
                    Guardar e Continuar
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
