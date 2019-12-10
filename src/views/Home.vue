<template>
  <div :class="$style.home">
    Welcome home
  </div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

export default createComponent({
  head: {
    title: 'Home'
  }
})
</script>

<style lang="postcss" module>
.home {
}
</style>
