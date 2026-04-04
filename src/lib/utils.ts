import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Função utilitária para mesclar classes Tailwind CSS com suporte a 
 * condicionais (via clsx) e resolução de conflitos (via tailwind-merge).
 * 
 * Essencial para o funcionamento correto dos componentes do shadcn/ui.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
