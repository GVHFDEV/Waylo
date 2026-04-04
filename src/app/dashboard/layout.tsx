import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Map, Plus, User } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

/**
 * Layout do Dashboard do Waylo (Refatorado - Missão 06).
 * 
 * Estrutura:
 * - Mobile Header: Logo centralizada fixa no topo.
 * - Desktop Header: Navbar superior completa.
 * - BottomNav Mobile: Navegação persistente na parte inferior.
 * - Footer: Minimalista ao final do conteúdo.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      {/* 
        1. MOBILE TOP HEADER (New in Mission 06)
        Exibe a logo centralizada apenas em celulares.
      */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md md:hidden">
        <div className="flex h-16 items-center justify-center px-4">
          <Link href="/dashboard">
            <Image 
              src="/logo.svg" 
              alt="Waylo" 
              width={137} 
              height={45} 
              priority 
              style={{ height: '32px', width: 'auto' }}
            />
          </Link>
        </div>
      </header>

      {/* 
        2. DESKTOP HEADER 
        Fixo no topo em telas médias e grandes.
      */}
      <header className="sticky top-0 z-40 hidden w-full border-b border-border bg-background/80 backdrop-blur-md md:block">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" className="transition-opacity hover:opacity-80">
            <Image 
              src="/logo.svg" 
              alt="Waylo" 
              width={137} 
              height={45} 
              priority 
              style={{ height: '36px', width: 'auto' }}
            />
          </Link>

          <nav className="flex items-center space-x-6">
            <Link href="/dashboard/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground">Explorar</Link>
            <Link href="/dashboard/trips" className="text-sm font-medium text-muted-foreground hover:text-foreground">Minhas Viagens</Link>
            
            <Separator orientation="vertical" className="h-6 mx-2" />

            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <User className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Perfil</span>
            </div>
          </nav>
        </div>
      </header>

      {/* 
        3. CONTEÚDO PRINCIPAL 
      */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 overflow-x-hidden pt-8 md:pt-8 animate-in fade-in duration-500">
        {children}
        
        {/* FOOTER MINIMALISTA (Mission 06) */}
        <footer className="mt-20 mb-8 pt-8 border-t border-border/40 text-center">
          <p className="text-xs font-sans text-muted-foreground">
            © {new Date().getFullYear()} Waylo - Sua jornada começa aqui.
          </p>
        </footer>
      </main>

      {/* 
        4. MOBILE BOTTOM NAVIGATION 
      */}
      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background/95 backdrop-blur-lg md:hidden">
        <div className="grid h-16 grid-cols-4 items-center justify-items-center">
          <Link href="/dashboard" className="flex flex-col items-center justify-center space-y-1 text-primary">
            <Search className="h-6 w-6" />
            <span className="text-[10px] font-medium font-sans">Busca</span>
          </Link>
          <Link href="/dashboard/map" className="flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-foreground">
            <Map className="h-6 w-6" />
            <span className="text-[10px] font-medium font-sans">Mapa</span>
          </Link>
          <Link href="/dashboard/create" className="flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-foreground">
            <Plus className="h-6 w-6" />
            <span className="text-[10px] font-medium font-sans">Criar</span>
          </Link>
          <Link href="/dashboard/profile" className="flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-foreground">
            <User className="h-6 w-6" />
            <span className="text-[10px] font-medium font-sans">Conta</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
