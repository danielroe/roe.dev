<template>
  <router-view />
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api'

export default createComponent({
  head: {
    meta: [
      {
        vmid: 'description',
        name: 'description',
        content: 'The personal website of Daniel Roe.',
      },
    ],
  },
})
</script>
