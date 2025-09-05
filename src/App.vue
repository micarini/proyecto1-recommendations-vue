<template>
  <div class="page">
    <header>
      <div class="logo">Logo</div>
      <nav class="category-buttons">
        <button
          v-for="(label, key) in categories"
          :key="key"
          :class="{ active: selectedCategory === key }"
          @click="selectedCategory = key"
        >
          {{ label }}
        </button>
      </nav>
    </header>

    <h1>my personal list of recommendations</h1>

    <div id="recommendation"> 
      <RecommendationCard
        v-for="(item, index) in recommendations" 
        :key="index"
        :title="item.title"
        :overview="item.overview"
        :img="item.img"
        :isActive="activeIndex === index"
      />
    </div>
    
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch } from 'vue'
//ref crea variables reactivas que actualizan la vista automaticamente mientras que onMounted corre una función cuando el componente se monta, o sea, cuando se muestra en la pantalla por primera vez. 
//reactive crea un objeto reactivo que puede contener múltiples propiedades y ser observado por Vue para detectar cambios (para que fullContent sea un objeto modificable dinamicamente).
// computed es una función que te permite crear propiedades derivadas a partir de otras reactivas. Es decir, no almacena datos directamente, sino que calcula un valor automáticamente basado en otras variables (como ref o reactive)
//watch() es una función de Vue que sirve para "escuchar" cambios en variables reactivas y ejecutar acciones (como recargar recomendaciones cuando cambia la categoría).
import RecommendationCard from './components/RecommendationCard.vue' // importo el componente de tarjeta de recomendación (con imagen, título, descripción).
import { searchTMDB } from './utils/tmdb.js' //importo la funcion que consulta la API de TMDB.
import { searchSpotifyAlbum } from './utils/spotify.js' //importo la funcion que consulta la API de Spotify.

export default { 
  components: {
    RecommendationCard //registro localmente recommendationcard
  },
  setup() {
    const selectedCategory = ref('movies')

    const categories = {
      movies: 'Movies',
      tv: 'TV Shows',
      music: 'Music',
      all: 'All'
    }

    const fullContent = reactive({
      movies: [],
      tv: [],
      music: []
    })

    const recommendations = ref([]) //array reactivo que va a contener las recomendaciones.
    const activeIndex = ref(0)

    const currentList = computed(() => { //Devuelve la lista filtrada según la categoría seleccionada
      if (selectedCategory.value === 'all') {
        return [...fullContent.tv, ...fullContent.movies, ...fullContent.music]
      }
      // Si es una categoría específica
      return fullContent[selectedCategory.value]
    })

    const loadRecommendations = async () => {
      recommendations.value = [] //limpio lo anterior

      const shuffledList = [...currentList.value] //hago una copia de la lista actual (currentList) para mezclarla sin alterar el original
      if (selectedCategory.value === 'all') { //si la categoría seleccionada es "all", mezclo la lista con el algoritmo de Fisher-Yates
        for (let i = shuffledList.length - 1; i > 0; i--) { //recorro la lista desde el final hasta el principio
          const j = Math.floor(Math.random() * (i + 1)) //genero un índice aleatorio entre 0 y i
          ;[shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]] //intercambio los elementos en las posiciones i y j
        }
      } //entonces, estoy haciendo un shuffle usando Fisher-Yates que se basa en mezclar elementos de forma que todos los órdenes posibles tengan la misma probabilidad de ocurrir 

      for (const item of shuffledList) { //recorro la lista de recomendaciones mezclada
        let result // declaro la variable result como un let porque su valor va a cambiar
        if (item.type === 'music') {
          result = await searchSpotifyAlbum(item.title)
        } else {
          result = await searchTMDB(item.title, item.type) //llamo a la función que consulta la API de TMDB, le paso el título y el tipo (película o serie) y espero su resultado y lo guardo en la constante result
        }

        if (result) {
          recommendations.value.push({
            title: result.title,
            overview: result.overview,
            img: item.type === 'music'
            ? result.img //para Spotify
            : 'https://image.tmdb.org/t/p/w500' + result.poster_path //para TMDB
          })
        }
      }
      
    }

    onMounted(async () => {
      const [movies, tv, music] = await Promise.all([ //esta promesa espera a que se carguen los tres archivos JSON antes de continuar.
        import('./content/movies.json'),
        import('./content/tv.json'),
        import('./content/music.json')
      ])

      fullContent.movies = movies.default
      fullContent.tv = tv.default
      fullContent.music = music.default

      await loadRecommendations()
    })

    watch(selectedCategory, () => {
      loadRecommendations()
    })

    return { 
      recommendations, //hago que la variable (recommendations) se pueda usar en el <template>. Sin esto, no podria hacer v-for="item in recommendations".
      selectedCategory,
      categories, 
      activeIndex
    } 
  }
}
</script>

