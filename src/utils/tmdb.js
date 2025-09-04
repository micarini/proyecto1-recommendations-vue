const API_KEY = '5b6f7b3773f6652670ed983c90ab0d39';
const BASE_URL = 'https://api.themoviedb.org/3';

export async function searchTMDB(title, type = 'tv') {
  const url = `${BASE_URL}/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(title)}&language=en-US`;

  const res = await fetch(url);
  const data = await res.json();

  return data.results?.[0] || null;
}

//más adelante, puedo traer mas funciones relacionadas con la API como info detallada, trending, etc., agrego al mismo archivo tmdb.js.