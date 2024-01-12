<template>
  <span
    class="flex-shrink-0 self-start text-gray-500 inline-flex items-center flex-row leading-none rounded-full shadow bg-accent"
    :class="$style.tray"
  >
    <slot />
  </span>
</template>

<style module>
.tray > * {
  @apply py-1;
}

.tray > :first-child {
  @apply pl-2;
}

.tray > :last-child {
  @apply pr-2;
}
</style>
