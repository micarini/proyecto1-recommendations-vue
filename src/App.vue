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

  <div id="recommendation" ref="recommendationRef">
    <div v-if="error" class="error">{{ error }}</div>
    <section class="recommendations-section">
      <div class="swiper" ref="recommendationRef">
        <div class="swiper-wrapper">
          <div
            class="swiper-slide"
            v-for="(item, idx) in recommendations"
            :key="idx"
          >
            <RecommendationCard
              :title="item.title"
              :overview="item.overview"
              :img="item.img"
              :reason="item.reason || 'No reason provided'"
              :artist="item.artist || ''"
              :canFlip="idx === activeSlideIndex"
            />
          </div>
        </div>
      </div>
      <div class="swiper-pagination"></div>
    </section>
  </div>
    
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
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
  // Swiper maneja el loop y el centrado, no se necesita lógica manual
  const activeSlideIndex = ref(0) // índice de la slide activa

  const isLoading = ref(false) // estado de carga
  const error = ref(null) // estado de error
  const recommendationRef = ref(null) // referencia al contenedor de recomendaciones para manejar el scroll

    const currentList = computed(() => { //devuelve la lista filtrada según la categoría seleccionada
      if (selectedCategory.value === 'all') {
        return [...fullContent.tv, ...fullContent.movies, ...fullContent.music]
      }
      // Si es una categoría específica
      return fullContent[selectedCategory.value]
    })

    const loadRecommendations = async () => {
      isLoading.value = true
      error.value = null
      recommendations.value = [] //limpio las recomendaciones anteriores antes de cargar nuevas.
      try {
        const shuffledList = [...currentList.value] //clono la lista actual para no modificar el original
        if (selectedCategory.value === 'all') { //si la categoría es "all", mezclo la lista para que no salgan siempre en el mismo orden
          for (let i = shuffledList.length - 1; i > 0; i--) { //algoritmo de Fisher-Yates para mezclar un array
            const j = Math.floor(Math.random() * (i + 1)) //número aleatorio entre 0 e i
            ;[shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]] //intercambio los elementos en las posiciones i y j
          }
        }
        // hacer todas las búsquedas en paralelo para mayor velocidad
        const results = await Promise.all( // Promise.all ejecuta múltiples promesas en paralelo y espera a que todas se resuelvan
          shuffledList.map(item => {
            if (item.type === 'music') {
              return searchSpotifyAlbum(item.title)
            } else {
              return searchTMDB(item.title, item.type, item.year || '')
            }
          })
        )
        // armar recomendaciones solo con resultados válidos y filtrar por artista si corresponde
        recommendations.value = results.map((result, i) => {
          const item = shuffledList[i]
          if (!result) return null
          // Si es música y hay artista, filtrar por artista
          if (item.type === 'music' && item.artist) {
            if (!result.artist || result.artist.toLowerCase() !== item.artist.toLowerCase()) {
              return null
            }
          }
          return {
            title: result.title,
            overview: result.overview,
            img: item.type === 'music'
              ? result.img
              : 'https://image.tmdb.org/t/p/w500' + result.poster_path,
            reason: item.reason || ''
          }
        }).filter(Boolean) // filter(Boolean) elimina los nulls del array
      } catch (e) {
        error.value = 'There\'s been an error loading recommendations.'
        console.error(e) // imprime el error en la consola para depuración
      } finally { // finally siempre se ejecuta al final del try-catch, haya habido error o no
        isLoading.value = false //indica que la carga ha terminado
      }
    }

    watch(selectedCategory, () => {
      loadRecommendations()
    })

    // Swiper maneja el loop y el centrado
    onMounted(async () => {
      const [movies, tv, music] = await Promise.all([
        import('./content/movies.json'),
        import('./content/tv.json'),
        import('./content/music.json')
      ])
      fullContent.movies = movies.default
      fullContent.tv = tv.default
      fullContent.music = music.default
      await loadRecommendations()
    })

    // inicializar Swiper cuando recommendations cambie y tenga datos
    watch(recommendations, async (val) => {
      if (val.length > 0) {
        await nextTick(); //espera a que el DOM se actualice con las nuevas recomendaciones antes de inicializar Swiper
        if (window.Swiper && document.querySelector('.swiper')) {
          const swiper = new window.Swiper('.swiper', {
            initialSlide: 0,
            centeredSlides: true,
            loop: true,
            speed: 900,
            grabCursor: true,
            allowTouchMove: true,
            effect: 'coverflow',
            coverflowEffect: { 
              rotate: -10,
              stretch: -5,
              depth: 90,
              modifier: 1,
              slideShadows: true,
            },
            pagination: {
              el: '.swiper-pagination',
              clickable: true, // Permite hacer clic en los puntos de paginación para navegar a la slide correspondiente
            },
            breakpoints: {
              0: { slidesPerView: 1, spaceBetween: 10 },
              600: { slidesPerView: 3, spaceBetween: 10 },
              900: { slidesPerView: 5, spaceBetween: 10 }
            },
            on: {
              slideChange: function () { //funcion que se ejecuta cada vez que cambia la slide activa para usarla para saber cuál tarjeta puede girar
                activeSlideIndex.value = this.realIndex;
              }
            }
          });
        }
      }
    });

    //el return final sirve para que vue pueda acceder a estas variables y funciones en el template.
    return { 
      recommendations, 
      selectedCategory,
      categories, 
      isLoading,
      error,
      recommendationRef,
      activeSlideIndex
    }
  }
}
</script>

