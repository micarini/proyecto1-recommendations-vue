<template>
  <div :class="['card', { 'flipped': flipped }]" @click="flipCard">
    <div class="front">
      <div class="img-wrapper">
        <div v-if="loading" class="spinner"></div>
        <img
          v-show="!loading"
          :src="img"
          :alt="title"
          @load="onLoad"
          @error="onError" 
        />
      </div>
    </div>
    <div class="back">
      <div class="img-wrapper">
        <img :src="img" :alt="title" />
      </div>
      <div class="card-overview">
        <p>{{ overview }}</p>
      </div>
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
    img: String
  },
  setup(props) {
    const loading = ref(true)
    const flipped = ref(false)
    const onLoad = () => { loading.value = false }
    const onError = () => { loading.value = false }
    const flipCard = () => { flipped.value = !flipped.value }
    watch(() => props.img, () => { loading.value = true })
    return { loading, onLoad, onError, flipped, flipCard }
  }
}
</script>