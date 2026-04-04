import { NextResponse } from 'next/server'

interface FoursquareData {
  photoUrl: string | null; address: string | null; rating: number | null;
  category: string | null; tip: string | null; mapsUrl: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeName = searchParams.get('place') || ''
  const destination = searchParams.get('dest') || ''

  const fallback: FoursquareData = {
    photoUrl: null, address: null, rating: null, category: null, tip: null,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + ' ' + destination)}`,
  }

  const fsqKey = process.env.FOURSQUARE_API_KEY || process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY
  
  if (!fsqKey || !placeName) {
    return NextResponse.json(fallback)
  }

  try {
    const searchRes = await fetch(`https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(placeName)}&near=${encodeURIComponent(destination)}&limit=1&fields=fsq_id,name,location,rating,categories`, {
      headers: { Authorization: fsqKey, Accept: 'application/json' },
      next: { revalidate: 86400 },
    })

    if (!searchRes.ok) return NextResponse.json(fallback)
    const place = (await searchRes.json())?.results?.[0]
    if (!place) return NextResponse.json(fallback)

    const fsqId = place.fsq_id
    const formattedAddress = place.location?.formatted_address || place.location?.address || null

    const [photoRes, tipRes] = await Promise.all([
      fetch(`https://api.foursquare.com/v3/places/${fsqId}/photos?limit=1&sort=POPULAR`, { 
        headers: { Authorization: fsqKey, Accept: 'application/json' }, 
        next: { revalidate: 86400 } 
      }),
      fetch(`https://api.foursquare.com/v3/places/${fsqId}/tips?limit=1&sort=POPULAR`, { 
        headers: { Authorization: fsqKey, Accept: 'application/json' }, 
        next: { revalidate: 86400 } 
      })
    ])

    let photoUrl = null
    try {
      const photos = await photoRes.json()
      if (photos?.[0]) photoUrl = `${photos[0].prefix}800x600${photos[0].suffix}`
    } catch {}

    let tip = null
    try {
      const tips = await tipRes.json()
      if (tips?.[0]) tip = tips[0].text
    } catch {}

    const data: FoursquareData = { 
      photoUrl, 
      address: formattedAddress, 
      rating: place.rating ?? null, 
      category: place.categories?.[0]?.name || null, 
      tip, 
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + destination)}` 
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(fallback)
  }
}
