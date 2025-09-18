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
    <div v-if="isLoading" class="loader">
      <div class="spinner spinner--big"></div>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else> 
      <RecommendationCard
        v-for="(item, idx) in renderedRecommendations"
        :key="item._realIndex ?? idx"
        :title="item.title"
        :overview="item.overview"
        :img="item.img"
        :isActive="idx === paddedItems"
      />
    </template>
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
  const paddedItems = 4 // cantidad de items a mostrar a cada lado del activo

  // computed para el slider infinito
  const renderedRecommendations = computed(() => { 
    const arr = recommendations.value
    const output = []
    if (!arr.length) return output
    for (let i = activeIndex.value - paddedItems; i <= activeIndex.value + paddedItems; i++) {
      const realIndex = (i + arr.length) % arr.length
      output.push({ ...arr[realIndex], _realIndex: realIndex })
    }
    return output
  })

  const isLoading = ref(false) // estado de carga
  const error = ref(null) // estado de error
  const recommendationRef = ref(null) // referencia al contenedor de recomendaciones para manejar el scroll

    const currentList = computed(() => { //Devuelve la lista filtrada según la categoría seleccionada
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
        // armar recomendaciones solo con resultados válidos
        recommendations.value = results.map((result, i) => {
          const item = shuffledList[i]
          if (!result) return null
          return {
            title: result.title,
            overview: result.overview,
            img: item.type === 'music'
              ? result.img
              : 'https://image.tmdb.org/t/p/w500' + result.poster_path
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

    // si el usuario llega a un extremo, reposicionamos el scroll al centro
    const checkAndLoopScroll = () => {
      const container = recommendationRef.value
      if (!container) return //si no hay contenedor, salgo de la función
      const cardWidth = container.querySelector('.card')?.offsetWidth || 0 //obtengo el ancho de una tarjeta, si no hay tarjetas, cardWidth es 0
      const totalCards = recommendations.value.length 
      if (totalCards < 2) return //si hay menos de 2 tarjetas, no hago nada
      // si está muy a la izquierda, lo mandamos al centro
      if (container.scrollLeft < cardWidth) {
        container.scrollLeft += cardWidth * totalCards
      }
      // si está muy a la derecha, lo mandamos al centro
      if (container.scrollLeft > cardWidth * (totalCards * 2 - 1)) {
        container.scrollLeft -= cardWidth * totalCards
      }
    }

    // detecta la tarjeta más centrada al hacer scroll y hace loop infinito visual
    const onScroll = () => {
      const container = recommendationRef.value
      if (!container) return; // si no hay contenedor, salgo de la función
      const cards = container.querySelectorAll('.card') // obtengo todas las tarjetas
      if (!cards.length) return; // si no hay tarjetas, salgo de la función
      const cardWidth = cards[0].offsetWidth;
      const scrollLeft = container.scrollLeft;
      const totalCards = recommendations.value.length;
      // Detectar si el usuario llegó a un extremo visual y reposicionar el scroll
      // Si scrollea muy a la izquierda
      if (scrollLeft < cardWidth * 0.5) {
        container.scrollLeft += cardWidth * totalCards;
      }
      // Si scrollea muy a la derecha
      if (scrollLeft > cardWidth * (totalCards + paddedItems * 2 - 0.5)) {
        container.scrollLeft -= cardWidth * totalCards;
      }
      // Actualizar el índice activo según la tarjeta más centrada
      const containerRect = container.getBoundingClientRect(); // obtengo las dimensiones y posición del contenedor
      let minDist = Infinity;
      let closest = 0; // índice de la tarjeta más cercana al centro
      cards.forEach((card, idx) => { // recorro cada tarjeta y su índice
        const cardRect = card.getBoundingClientRect(); // obtengo las dimensiones de la tarjeta
        const cardCenter = cardRect.left + cardRect.width / 2; // calculo el centro de la tarjeta 
        const containerCenter = containerRect.left + containerRect.width / 2; // calculo el centro del contenedor
        const dist = Math.abs(cardCenter - containerCenter); // Math.abs me da la distancia absoluta entre el centro de la tarjeta y el centro del contenedor (absoluto pq ignora si es negativa o positiva)
        if (dist < minDist) {
          minDist = dist;
          closest = idx;
        }
      });
      // El central siempre es paddedItems
      activeIndex.value = (activeIndex.value + (closest - paddedItems) + totalCards) % totalCards;
    }

    // Al cargar recomendaciones, centramos el scroll en la tarjeta central
    const centerScroll = () => {
      const container = recommendationRef.value
      if (!container) return
      const cards = container.querySelectorAll('.card')
      if (!cards.length) return
      const cardWidth = cards[0].offsetWidth
      // Centrar en la tarjeta central
      container.scrollLeft = cardWidth * paddedItems
    }

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
      // Agregar listener de scroll
      if (recommendationRef.value) {
        recommendationRef.value.addEventListener('scroll', onScroll)
        // Centrar el scroll al inicio
        setTimeout(centerScroll, 100)
      }
    })

    //el return final sirve para que vue pueda acceder a estas variables y funciones en el template.
    return { 
      recommendations, 
      selectedCategory,
      categories, 
      activeIndex,
      isLoading,
      error,
      recommendationRef,
      renderedRecommendations,
      paddedItems
    }
  }
}
</script>

