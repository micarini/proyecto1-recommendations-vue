<template>
  <div :class="['card', isActive ? 'card--active' : 'card--small']">
    <div class="img-wrapper">
      <div v-if="loading" class="spinner"></div> <!-- este div aparece mientras se cargan las imagenes-->
      <img
        v-show="!loading" 
        :src="img"
        :alt="title"
        @load="onLoad"
        @error="onError"
      /> <!-- la imagen solo se muestra cuando loading es false-->
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
export default {
  name: 'RecommendationCard',
  props: {
    title: String,
    overview: String,
    img: String,
    isActive: Boolean
  },
  setup(props) {
    const loading = ref(true) // estado de carga de la imagen
    const onLoad = () => { loading.value = false } // cuando la imagen carga, loading pasa a false
    const onError = () => { loading.value = false } // si hay un error cargando la imagen, loading pasa a false
    watch(() => props.img, () => { loading.value = true }) // si cambia la imagen, vuelve a mostrar el loader
    return { loading, onLoad, onError }
  }
}
</script>