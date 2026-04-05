/**
 * Dicionário de Internacionalização da Waylo (i18n)
 * Suporte Inicial: PT-BR e EN-US
 */

export const i18n = {
  pt: {
    header: {
      explore: 'Explorar',
      trips: 'Minhas Viagens',
      profile: 'Perfil'
    },
    hub: {
      back: 'Voltar para Meus Roteiros',
      not_found: 'Viagem não encontrada',
      generating: 'Analisando seu perfil...',
      ready: 'Roteiro Pronto',
      itinerary: 'Itinerário',
      tabs: {
        itinerary: 'Itinerário',
        logistics: 'Logística',
        costs: 'Custos',
        social: 'Social',
        settings: 'Ajustes'
      },
      status: {
        analyzing: 'Analisando Perfil',
        mapping: 'Mapeando Logística',
        generating: 'IA Construindo',
        finishing: 'Finalizando'
      }
    },
    onboarding: {
      title: 'Seja bem-vindo ao Waylo!',
      subtitle: 'Para personalizar sua experiência, selecione seu país de origem.',
      placeholders: {
        country: 'Selecione seu país'
      },
      button: 'Começar minha jornada'
    }
  },
  en: {
    header: {
      explore: 'Explore',
      trips: 'My Trips',
      profile: 'Profile'
    },
    hub: {
      back: 'Back to My Trips',
      not_found: 'Trip not found',
      generating: 'Analyzing your profile...',
      ready: 'Itinerary Ready',
      itinerary: 'Itinerary',
      tabs: {
        itinerary: 'Itinerary',
        logistics: 'Logistics',
        costs: 'Costs',
        social: 'Social',
        settings: 'Settings'
      },
      status: {
        analyzing: 'Analyzing Profile',
        mapping: 'Mapping Logistics',
        generating: 'AI Building',
        finishing: 'Finishing'
      }
    },
    onboarding: {
      title: 'Welcome to Waylo!',
      subtitle: 'To personalize your experience, please select your country of origin.',
      placeholders: {
        country: 'Select your country'
      },
      button: 'Start my journey'
    }
  }
}

/**
 * Mapeia o código do país para um idioma suportado (pt ou en).
 */
export function getLanguageByCountry(countryCode: string): 'pt' | 'en' {
  const ptCountries = ['BR', 'PT', 'AO', 'MZ', 'CV', 'ST', 'GW']
  return ptCountries.includes(countryCode?.toUpperCase()) ? 'pt' : 'en'
}

/**
 * Retorna o dicionário baseado no idioma.
 */
export function getI18n(lang: 'pt' | 'en') {
  return i18n[lang] || i18n.en
}
