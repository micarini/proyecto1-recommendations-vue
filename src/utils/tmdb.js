const API_KEY = '5b6f7b3773f6652670ed983c90ab0d39';
const BASE_URL = 'https://api.themoviedb.org/3';

// year puede ser string vacío o año válido
export async function searchTMDB(title, type = 'tv', year = '') {
  let url = `${BASE_URL}/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(title)}&language=en-US`;
  // Si se pasa un año, agregarlo como parámetro (diferente para tv y movie)
  if (year) {
    if (type === 'movie') {
      url += `&year=${year}`;
    } else if (type === 'tv') {
      url += `&first_air_date_year=${year}`;
    }
  }

  const res = await fetch(url);
  const data = await res.json();
  // agrego un log para depuración para ver que sucedia con Once Upon a Time
  console.log(`[TMDB] title: ${title}, type: ${type}, year: ${year}`, data.results);

  return data.results?.[0] || null;
}

//más adelante, puedo traer mas funciones relacionadas con la API como info detallada, trending, etc., agrego al mismo archivo tmdb.js.