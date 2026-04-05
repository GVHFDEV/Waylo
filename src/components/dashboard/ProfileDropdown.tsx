'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/actions/auth'
import { getLanguageByCountry, getI18n, type LangCode } from '@/lib/i18n'

const COUNTRY_NAMES: Record<string, { flag: string; name: string }> = {
  BR: { flag: '🇧🇷', name: 'Brasil' },
  PT: { flag: '🇵🇹', name: 'Portugal' },
  US: { flag: '🇺🇸', name: 'United States' },
  GB: { flag: '🇬🇧', name: 'United Kingdom' },
  ES: { flag: '🇪🇸', name: 'España' },
  FR: { flag: '🇫🇷', name: 'France' },
  DE: { flag: '🇩🇪', name: 'Deutschland' },
  IT: { flag: '🇮🇹', name: 'Italia' },
  JP: { flag: '🇯🇵', name: '日本' },
  AR: { flag: '🇦🇷', name: 'Argentina' },
}

interface ProfileData {
  full_name: string
  avatar_url: string
  country: string
}

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, country')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
      } else {
        // Fallback: usar metadados do auth
        setProfile({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Explorer',
          avatar_url: user.user_metadata?.avatar_url || '',
          country: ''
        })
      }
      setIsLoading(false)
    }
    fetchProfile()
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  if (isLoading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-20 rounded bg-muted animate-pulse hidden md:block" />
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 group cursor-pointer"
      >
        {/* Avatar */}
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.full_name}
            width={36}
            height={36}
            className="rounded-full border-2 border-[#E8833A]/20 group-hover:border-[#E8833A]/50 transition-colors object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-[#E8833A]/10 border-2 border-[#E8833A]/20 flex items-center justify-center group-hover:bg-[#E8833A]/20 transition-colors">
            <span className="text-xs font-bold text-[#E8833A]">{initials}</span>
          </div>
        )}

        {/* Nome (desktop only) */}
        <span className="text-sm font-medium text-foreground hidden md:inline-block max-w-[120px] truncate">
          {profile?.full_name?.split(' ')[0]}
        </span>
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-muted-foreground transition-transform hidden md:block",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-bold text-foreground truncate">{profile?.full_name}</p>
            {profile?.country && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {(() => {
                  const c = COUNTRY_NAMES[profile.country]
                  return c ? `${c.flag} ${c.name}` : profile.country
                })()}
              </p>
            )}
          </div>

          {/* Actions */}
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {getI18n(getLanguageByCountry(profile?.country || 'BR')).dashboard.profile.logout}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
