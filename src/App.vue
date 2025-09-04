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

    <div id="recommendations">
      <RecommendationCard
        v-for="(item, index) in recommendations"
        :key="index"
        :title="item.title"
        :overview="item.overview"
        :img="item.img"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue' //ref crea variables reactivas que actualizan la vista automaticamente mientras que onMounted corre una función cuando el componente se monta, o sea, cuando se muestra en la pantalla por primera vez. 
// computed es una función que te permite crear propiedades derivadas a partir de otras reactivas. Es decir, no almacena datos directamente, sino que calcula un valor automáticamente basado en otras variables (como ref o reactive)
//watch() es una función de Vue que sirve para "escuchar" cambios en variables reactivas y ejecutar acciones (como recargar recomendaciones cuando cambia la categoría).
import RecommendationCard from './components/RecommendationCard.vue' // importo el componente de tarjeta de recomendación (con imagen, título, descripción).
import { searchTMDB } from './utils/tmdb.js' //importo la funcion que consulta la API de TMDB.

export default { 
  components: {
    RecommendationCard //registro localmente recommendationcard
  },
  setup() {
    const selectedCategory = ref('tv')

    const categories = {
      tv: 'TV Shows',
      movies: 'Movies',
      music: 'Music',
      all: 'All'
    }

    const fullContent = {
      tv: [
        { title: "Arcane", type: "tv" },
        { title: "Adults", type: "tv" },
        { title: "Derry Girls", type: "tv" },
        { title: "Julie & The Phantoms", type: "tv" },
        { title: "Grace & Frankie", type: "tv" }
      ],
      movies: [
        // vacíos por ahora, pero listos para cuando agregues
      ],
      music: [
        // futura integración
      ]
    }

    const recommendations = ref([]) //array reactivo que va a contener las recomendaciones.

    const currentList = computed(() => { //Devuelve la lista filtrada según la categoría seleccionada
      if (selectedCategory.value === 'all') {
        return [...fullContent.tv, ...fullContent.movies, ...fullContent.music]
      }
      // Si es una categoría específica
      return fullContent[selectedCategory.value]
    })

    const loadRecommendations = async () => {
      recommendations.value = [] //limpio lo anterior

      for (const item of currentList.value) { //recorro la lista de recomendaciones
        const result = await searchTMDB(item.title, item.type) //llamo a la función que consulta la API de TMDB, le paso el título y el tipo (película o serie) y espero su resultado y lo guardo en la constante result
        if (result) {
          recommendations.value.push({
            title: result.name || result.title,
            overview: result.overview,
            img: 'https://image.tmdb.org/t/p/w500' + result.poster_path
          })
        }
      }
    }

    onMounted(loadRecommendations)

    watch(selectedCategory, () => {
      loadRecommendations()
    })

    return { 
      recommendations, //hago que la variable (recommendations) se pueda usar en el <template>. Sin esto, no podria hacer v-for="item in recommendations".
      selectedCategory,
      categories 
      } 
  }
}
</script>

