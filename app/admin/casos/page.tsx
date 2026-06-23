"use client"

import React from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminMobileHeader } from "@/components/admin-mobile-header"
import { CaseManagementSection } from "@/components/case-management-section"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminCasosPage() {
  return (
    <AuthGuard roles={["admin"]}>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminMobileHeader />
          <main className="flex-1 space-y-6 p-6 pt-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/painel">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestão de Casos</h1>
                <p className="text-sm text-muted-foreground">
                  Visualize, crie, edite e remova casos de acompanhamento.
                </p>
              </div>
            </div>
            <CaseManagementSection showPagination />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
