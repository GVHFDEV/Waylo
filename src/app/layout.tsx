import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

/**
 * Cabinet Grotesk — Tipografia de Headings (h1–h6) do Waylo.
 *
 * Arquivo variable font esperado em: public/fonts/CabinetGrotesk-Variable.woff2
 * O `src` é relativo a este arquivo (src/app/layout.tsx), portanto:
 * src/app → ../../public/fonts/
 *
 * Alternativa: coloque os arquivos em src/app/fonts/ e use './fonts/...'
 */
const cabinetGrotesk = localFont({
  src: '../../public/fonts/CabinetGrotesk-Variable.woff2',
  variable: '--font-cabinet-grotesk',
  weight: '100 900',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

/**
 * Satoshi — Tipografia de Body do Waylo.
 *
 * Arquivo variable font esperado em: public/fonts/Satoshi-Variable.woff2
 */
const satoshi = localFont({
  src: '../../public/fonts/Satoshi-Variable.woff2',
  variable: '--font-satoshi',
  weight: '300 900',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

export const metadata: Metadata = {
  title: {
    default: 'Waylo — Roteiros de Viagem com IA',
    template: '%s | Waylo',
  },
  description:
    'Crie roteiros de viagem personalizados e colaborativos com inteligência artificial. Planeje cada detalhe da sua próxima aventura com o Waylo.',
  keywords: ['roteiro de viagem', 'viagem', 'IA', 'planejamento', 'colaborativo'],
  authors: [{ name: 'Waylo' }],
  creator: 'Waylo',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://waylo.app',
  ),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Waylo',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@waylo_app',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#E8833A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body
        className={`${cabinetGrotesk.variable} ${satoshi.variable} min-h-full flex flex-col bg-background text-foreground font-sans`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
