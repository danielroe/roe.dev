<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">
        Feed
      </h1>
    </header>
    <main
      id="main-content"
      class="text-muted text-lg -mx-4 max-w-[37.50rem]"
      @click="handleNavigationClicks"
    >
      <TheSocialFeed />
    </main>
  </div>
</template>
