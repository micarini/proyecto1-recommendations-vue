const clientId = '0ea764c42a5b4218bf78b8fb2a2aed0c'
const clientSecret = 'ea30caf262004cb581cc4db00860e70f'

export async function getAccessToken() {
  const credentials = btoa(`${clientId}:${clientSecret}`)

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  const data = await res.json()
  return data.access_token
}

export async function searchSpotifyAlbum(albumTitle) {
  const token = await getAccessToken()

  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(albumTitle)}&type=album&limit=1`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  const data = await res.json()

  if (data.albums && data.albums.items.length > 0) {
    const album = data.albums.items[0]
    return {
      title: album.name,
      img: album.images?.[0]?.url || '',
      overview: `Artista: ${album.artists[0].name} · Lanzamiento: ${album.release_date}`,
      artist: album.artists[0]?.name || ''
    }
  } else {
    return null
  }
}
