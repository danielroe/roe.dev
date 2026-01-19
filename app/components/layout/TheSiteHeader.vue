<script setup lang="ts">
const config = useRuntimeConfig()
const redirect = import.meta.dev
  ? `&redirect_uri=http://localhost:3000/auth/github`
  : ''
const loginURL = `https://github.com/login/oauth/authorize?client_id=${config.public.githubClientId}${redirect}&scope=read:org`

const mobileMenuRef = ref<HTMLElement | null>(null)
const showMenu = ref(false)

const { data: currentLocation } = await useFetch('/api/current-location', {
  transform: location => ({
    area: location!.area,
    flagEmoji: location!.flagEmoji,
  }),
})

const menu = [
  {
    name: 'Home',
    path: '/',
  },
  {
    name: 'Talks',
    path: '/talks',
  },
  {
    name: 'Uses',
    path: '/uses',
  },
  {
    name: 'Blog',
    path: '/blog',
  },
]

useRouter().afterEach(() => {
  mobileMenuRef.value?.hidePopover()
})

function onPopoverToggle (event: ToggleEvent) {
  const isOpen = event.newState === 'open'
  showMenu.value = isOpen
  document.body.classList.toggle('overflow-hidden', isOpen)
}
</script>

<template>
  <nav
    aria-label="Main navigation"
    class="py-4 px-4 md:px-12 md:py-8 uppercase flex flex-row justify-between items-center text-primary md:p-4 tracking-[0.15rem]"
  >
    <ul
      class="flex-grow text-sm md:text-base justify-between flex flex-row items-center md:flex-grow-0"
    >
      <li>
        <NuxtLink
          class="underlined-link mr-6 py-2"
          :class="{
            'not-[:hover,:focus,:active]:after:border-transparent':
              $route.path !== '/',
          }"
          to="/"
        >
          Daniel Roe
          <span
            v-if="currentLocation?.flagEmoji"
            class="ml-1"
          >
            <span class="sr-only">
              is currently in {{ currentLocation.area }}
            </span>
            {{ currentLocation.flagEmoji }}
          </span>
        </NuxtLink>
      </li>
      <template
        v-for="link in menu.slice(1)"
        :key="link.name"
      >
        <li>
          <NuxtLink
            class="underlined-link hidden md:inline-block px-2 py-2 hover:text-primary active:text-primary focus:text-primary transition-colors"
            :class="{
              'not-[:hover,:focus,:active]:after:border-transparent text-muted':
                $route.path !== link.path,
            }"
            :to="link.path"
          >
            {{ link.name }}
          </NuxtLink>
        </li>
      </template>
    </ul>
    <div
      class="ml-2 mr-1 flex md:gap-2 flex-shrink-0 items-center justify-between"
    >
      <div
        v-if="$auth.status === 'pending'"
        class="flex items-center justify-center w-[2rem] flex-shrink-0"
      >
        <span
          class="h-6 w-6 i-svg-spinners:90-ring-with-bg"
          aria-hidden="true"
        />
        <span class="sr-only"> Loading </span>
      </div>
      <NuxtLink
        v-else-if="$auth.status === 'logged-out'"
        :to="loginURL"
        class="p-1 w-[2rem] flex-shrink-0 border-transparent border-2 border-solid hover:border-primary active:border-primary rounded-full leading-none f-ring"
        @click="$auth.status = 'pending'"
      >
        <span
          class="h-5 w-5 i-ri:login-circle-line"
          aria-hidden="true"
        />
        <span class="sr-only"> Login </span>
      </NuxtLink>
      <button
        v-else-if="$auth.status === 'logged-in'"
        type="button"
        class="relative flex-shrink-0 w-[2rem] rounded-full f-ring"
        @click="$auth.logout"
      >
        <img
          class="h-8 w-8 md:h-6 md:w-6 rounded-full"
          :class="{ 'border-[1px] border-amber-500 dark:border-yellow-400': $auth.user.sponsor }"
          :src="$auth.user.avatar"
          :alt="`${$auth.user.name}'s avatar`"
        >
        <span
          v-if="$auth.user.sponsor"
          class="absolute top-[-0.65rem] md:top-[-0.45rem] right-[-0.4rem] md:right-[-0.2rem] h-5 w-5 text-amber-500 dark:text-yellow-400"
          aria-hidden="true"
        >
          <span class="i-ri:star-fill border border-solid border-gray-200 dark:border-gray-800" />
        </span>
        <span class="sr-only"> Log out {{ $auth.user.name }} </span>
      </button>
      <div class="md:hidden">
        <button
          type="button"
          class="ml-4 rounded f-ring"
          popovertarget="mobile-menu"
        >
          <span
            class="menu-icon h-8 w-8 md:h-6 md:w-6 i-ri:add-line"
            aria-hidden="true"
          />
          <span class="sr-only"> Open mobile navigation menu </span>
        </button>
        <div
          id="mobile-menu"
          ref="mobileMenuRef"
          popover
          class="m-0 inset-0 h-full w-full max-h-full max-w-full border-none bg-accent text-muted"
          @toggle="onPopoverToggle"
        >
          <div class="h-full flex flex-col justify-center items-center">
            <button
              type="button"
              class="top-0 right-0 fixed p-8 rounded f-ring-accent"
              popovertarget="mobile-menu"
              popovertargetaction="hide"
            >
              <span
                class="menu-icon h-8 w-8 i-ri:close-fill"
                aria-hidden="true"
              />
              <span class="sr-only"> Close mobile navigation menu </span>
            </button>
            <nav aria-label="Mobile navigation">
              <ul
                class="uppercase tracking-[0.15rem] max-w-xl text-2xl flex flex-col items-center gap-6"
              >
                <li
                  v-for="link in menu"
                  :key="link.name"
                >
                  <NuxtLink
                    class="underlined-link px-2 py-2"
                    :class="{
                      'not-[:hover,:focus,:active]:after:border-transparent':
                        $route.path !== link.path,
                    }"
                    :to="link.path"
                  >
                    {{ link.name }}
                  </NuxtLink>
                </li>
                <li><ToggleColorMode class="flex" /></li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
      <ToggleColorMode class="hidden md:flex" />
    </div>
  </nav>
</template>

<style>
@media (prefers-reduced-motion: no-preference) {
  #mobile-menu {
    transition:
      opacity 0.2s ease,
      overlay 0.2s ease allow-discrete,
      display 0.2s ease allow-discrete;
    opacity: 0;
  }

  #mobile-menu:popover-open {
    opacity: 1;
  }

  @starting-style {
    #mobile-menu:popover-open {
      opacity: 0;
    }
  }

  #mobile-menu .menu-icon {
    transition: transform 0.2s ease;
    transform: rotate(-45deg);
  }

  #mobile-menu:popover-open .menu-icon {
    transform: rotate(0deg);
  }

  @starting-style {
    #mobile-menu:popover-open .menu-icon {
      transform: rotate(-45deg);
    }
  }
}
</style>
