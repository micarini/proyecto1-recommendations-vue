<template>
  <div :class="['card', isActive ? 'card--active' : 'card--small']">
    <img :src="img" :alt="title" />
  </div>
</template>

<script>
export default {
  name: 'RecommendationCard',
  props: {
    title: String,
    overview: String,
    img: String,
    isActive: Boolean
  }
}
</script>


