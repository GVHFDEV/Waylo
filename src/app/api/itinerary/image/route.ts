import { NextResponse } from 'next/server'

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeName = searchParams.get('place') || ''
  const destination = searchParams.get('dest') || ''
  const activityDescription = searchParams.get('desc') || ''

  const fallback = `https://picsum.photos/seed/${encodeURIComponent(placeName + activityDescription)}/800/400`
  const accessKey = process.env.UNSPLASH_ACCESS_KEY

  if (!accessKey || !placeName) {
    return NextResponse.json({ url: fallback })
  }

  try {
    const primaryQuery = `${placeName} ${destination}`
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(primaryQuery)}&per_page=10&orientation=landscape`, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      next: { revalidate: 86400 },
    })

    if (!res.ok) return NextResponse.json({ url: fallback })

    let data = await res.json()
    let results = data?.results

    if (!results?.length && destination) {
      const fallbackQuery = destination
      const res2 = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(fallbackQuery)}&per_page=10&orientation=landscape`, {
        headers: { Authorization: `Client-ID ${accessKey}` },
        next: { revalidate: 86400 },
      })
      if (!res2.ok) return NextResponse.json({ url: fallback })
      data = await res2.json()
      results = data?.results
    }

    if (!results?.length) return NextResponse.json({ url: fallback })

    const uniqueKey = `${placeName}-${activityDescription}-${destination}`
    const idx = simpleHash(uniqueKey) % results.length
    const photo = results[idx]
    const url = photo.urls.small || photo.urls.regular || photo.urls.full || fallback

    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ url: fallback })
  }
}
