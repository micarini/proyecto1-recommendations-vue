<template>
  <div :class="['card', { 'flipped': flipped }]" @click="flipCard">
    <div class="front">
      <div class="img-wrapper">
        <div v-if="loading && !imgError" class="spinner"></div>
        <div v-if="imgError" class="img-error">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="img-error-icon">
            <rect x="6" y="10" width="36" height="28" rx="3" fill="#232323" stroke="#888" stroke-width="2"/>
            <path d="M10 34L18 26L28 36L34 30L38 34" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="15.5" cy="17.5" r="2.5" fill="#888"/>
            <line x1="8" y1="12" x2="40" y2="38" stroke="#c44" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <img
          v-show="!loading && !imgError"
          :src="img"
          :alt="title"
          @load="onLoad"
          @error="onError" 
        />
      </div>
    </div>
    <div class="back">
      <div class="img-wrapper">
        <img v-if="!imgError" :src="img" :alt="title" />
        <div v-else class="img-error">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="img-error-icon">
            <rect x="6" y="10" width="36" height="28" rx="3" fill="#232323" stroke="#888" stroke-width="2"/>
            <path d="M10 34L18 26L28 36L34 30L38 34" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="15.5" cy="17.5" r="2.5" fill="#888"/>
            <line x1="8" y1="12" x2="40" y2="38" stroke="#c44" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>
    <div v-if="flipped" class="reason-overlay">
      <div class="reason-content">
        <p v-if="reason">{{ reason }}</p>
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
    img: String,
    reason: String,
    artist: String
  },
  setup(props) {
    const loading = ref(true)
    const imgError = ref(false)
    const flipped = ref(false)
    const onLoad = () => { loading.value = false; imgError.value = false }
    const onError = () => { loading.value = false; imgError.value = true }
    const flipCard = () => { flipped.value = !flipped.value }
    watch(() => props.img, () => { loading.value = true; imgError.value = false })
    return { loading, imgError, onLoad, onError, flipped, flipCard }
  }
}
</script>