"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import { BarChart2, Bot, Newspaper, Tags, Users, Vote, Landmark, Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"

const navItems = [
  { href: "/dashboard", label: "Visão Geral", icon: BarChart2 },
  { href: "/governo", label: "Governo", icon: Landmark },
  { href: "/deputados", label: "Deputados", icon: Users },
  { href: "/temas", label: "Temas", icon: Tags },
  { href: "/eleicao2", label: "Eleicao", icon: Vote },
  { href: "/eleicao", label: "Comparacao", icon: Vote },
  { href: "/noticias", label: "Noticias", icon: Newspaper },
  { href: "/recommendations", label: "Recomendacoes", icon: BarChart2 },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthed, setIsAuthed] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("qp_auth")
      setIsAuthed(!!raw)
    } catch {}
  }, [])

  const handleLogout = React.useCallback(() => {
    try {
      localStorage.removeItem("qp_auth")
    } catch {}
    setIsAuthed(false)
    router.push("/")
  }, [router])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center w-full pl-3 pr-3">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">Quant Politico</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item, pos) => (
              <Link
                key={pos}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname.startsWith(item.href) ? "text-foreground" : "text-foreground/60"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Nav */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            {/* A11y: DialogContent requer um Título para leitores de tela */}
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navegação</SheetTitle>
            </SheetHeader>
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              <span className="font-bold sm:inline-block">Quant Politico</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "transition-colors hover:text-foreground/80",
                      pathname.startsWith(item.href) ? "text-foreground" : "text-foreground/60"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/agente"
                  className={cn(
                    "transition-colors hover:text-foreground/80",
                    pathname.startsWith("/agente") ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  Agente
                </Link>
                {isAuthed ? (
                  <Button variant="outline" onClick={handleLogout} className="mt-2 w-max">Sair</Button>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <Button asChild variant="outline"><Link href="/login">Entrar</Link></Button>
                    <Button asChild><Link href="/register">Registrar</Link></Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center space-x-2 md:hidden">
          <BarChart2 className="h-6 w-6 text-primary" />
          <span className="font-bold">Quant Politico</span>
        </Link>

        <div className="ml-auto flex items-center justify-end space-x-2">
          <nav className="flex items-center">
            <Button asChild>
              <Link href="/agente">
                <Bot className="h-4 w-4 mr-2" />
                Agente
              </Link>
            </Button>
            {isAuthed ? (
              <Button variant="outline" className="ml-2" onClick={handleLogout}>Sair</Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="ml-2"><Link href="/login">Entrar</Link></Button>
                <Button asChild variant="outline" className="ml-1"><Link href="/register">Registrar</Link></Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
