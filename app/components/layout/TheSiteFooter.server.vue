<script lang="ts" setup>
import { links } from '#shared/utils/links'

const year = new Date().getFullYear()
</script>

<template>
  <div>
    <footer
      class="before:content-empty before:block before:mx-auto before:my-4 before:content before:w-4 before:border-t-2 before:border-solid before:border-gray-300 dark:before:border-gray-700 relative text-center mx-auto px-4 py-2 max-w-[50rem]"
    >
      <small>
        &copy; 2019-{{ year }} Daniel Roe.
        <a
          class="underlined-link"
          href="https://creativecommons.org/licenses/by-sa/4.0/"
        >
          CC BY-SA 4.0
        </a>
      </small>
      <ul class="flex flex-row justify-center gap-2 my-4 items-center">
        <li
          v-for="{ link, name, icon } in links"
          :key="name"
        >
          <a
            :href="link"
            rel="me noopener noreferrer"
            target="_blank"
            class="rounded-full f-ring p-1 inline-flex items-center touch-action-manipulation"
            :aria-label="`${name} (opens in new tab)`"
          >
            <span
              class="h-4 w-4 fill-current"
              :class="icon"
              aria-hidden="true"
            />
          </a>
        </li>
      </ul>
    </footer>
  </div>
</template>
