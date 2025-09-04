<template>
  <div class="card">
    <img :src="img" :alt="title" />
    <div class="info">
      <h2>{{ title }}</h2>
      <p>{{ overview }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecommendationCard',
  props: {
    title: String,
    overview: String,
    img: String
  }
}
</script>
