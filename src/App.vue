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
        const shuffledList = [...currentList.value] //creo una copia de la lista actual para mezclarla sin alterar el original.
        if (selectedCategory.value === 'all') { //si la categoría es "all", mezclo la lista para que las recomendaciones sean variadas.
          for (let i = shuffledList.length - 1; i > 0; i--) { //recorro la lista desde el final hasta el principio.
            const j = Math.floor(Math.random() * (i + 1)) //genero un índice aleatorio entre 0 y i.
            ;[shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]] //intercambio los elementos en las posiciones i y j.
          } //entonces, estoy haciendo shuffle usando el algoritmo de Fisher-Yates que se basa en mezclar los elementos de un array de manera aleatoria.
        }
        for (const item of shuffledList) { //recorro cada item de la lista mezclada.
          let result //variable para almacenar el resultado de la búsqueda como un let porque su valor va a cambiar
          if (item.type === 'music') {
            result = await searchSpotifyAlbum(item.title)
          } else {
            result = await searchTMDB(item.title, item.type, item.year || '') //si el item tiene año, lo uso, si no, paso cadena vacía.
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
      } catch (e) { //si hay un error en la carga de recomendaciones, lo capturo y muestro un mensaje.
        error.value = 'There\'s been an error loading recommendations.'
        console.error(e) //tambien imprimo el error en la consola para depuración.
      } finally { //finally se ejecuta siempre, haya habido error o no.
        isLoading.value = false //indico que la carga ha terminado.
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

    // Debounce helpers
    let scrollTimeout = null;
    let isUserScrolling = false;

    // Detecta la tarjeta más centrada al hacer scroll y hace loop infinito visual solo cuando el scroll se detiene
    const onScroll = () => {
      isUserScrolling = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrolling = false;
        const container = recommendationRef.value;
        if (!container) return;
        const cards = container.querySelectorAll('.card');
        if (!cards.length) return;
        const cardWidth = cards[0].offsetWidth;
        const scrollLeft = container.scrollLeft;
        const totalCards = recommendations.value.length;
        // Detectar si el usuario llegó a un extremo visual y reposicionar el scroll SOLO si no está scrolleando
        if (scrollLeft < cardWidth * 0.5) {
          container.scrollLeft += cardWidth * totalCards;
        }
        if (scrollLeft > cardWidth * (totalCards + paddedItems * 2 - 0.5)) {
          container.scrollLeft -= cardWidth * totalCards;
        }
        // Actualizar el índice activo según la tarjeta más centrada
        const containerRect = container.getBoundingClientRect();
        let minDist = Infinity;
        let closest = 0;
        cards.forEach((card, idx) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const containerCenter = containerRect.left + containerRect.width / 2;
          const dist = Math.abs(cardCenter - containerCenter);
          if (dist < minDist) {
            minDist = dist;
            closest = idx;
          }
        });
        // El central siempre es paddedItems
        activeIndex.value = (activeIndex.value + (closest - paddedItems) + totalCards) % totalCards;
        // Snap al centro de la card más cercana
        container.scrollTo({
          left: cardWidth * (closest),
          behavior: 'smooth'
        });
      }, 120); // 120ms debounce
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

