<script setup lang="ts">
const config = useRuntimeConfig()
const redirect = process.dev
  ? `&redirect_uri=http://localhost:3000/auth/github`
  : ''
const loginURL = `https://github.com/login/oauth/authorize?client_id=${config.public.githubClientId}${redirect}&scope=read:org`
</script>

<template>
  <nav
    class="p-2 uppercase bg-gray-900 flex flex-row justify-between items-center text-white md:p-4 tracking-[0.15rem]"
  >
    <ul
      v-once
      class="font-semibold flex-grow text-xs md:text-base justify-between flex flex-row items-center md:flex-grow-0"
    >
      <li>
        <NuxtLink
          class="outline-none px-2 py-2 hover:after:border-gray-700 focus:after:border-gray-700"
          to="/"
          title="Daniel Roe"
        >
          DCR
        </NuxtLink>
      </li>
      <li aria-hidden="true" class="font-bold inline-block">•</li>
      <li>
        <NuxtLink
          class="outline-none px-2 py-2 hover:after:border-gray-700 focus:after:border-gray-700"
          exact-active-class="after:border-gray-800"
          to="/work"
        >
          Work
        </NuxtLink>
      </li>
      <li aria-hidden="true" class="font-bold inline-block">•</li>
      <li>
        <NuxtLink
          class="outline-none px-2 py-2 hover:after:border-gray-700 focus:after:border-gray-700"
          exact-active-class="after:border-gray-800"
          to="/talks"
        >
          Talks
        </NuxtLink>
      </li>
      <li aria-hidden="true" class="font-bold inline-block">•</li>
      <li>
        <NuxtLink
          class="outline-none px-2 py-2 hover:after:border-gray-700 focus:after:border-gray-700"
          exact-active-class="after:border-gray-800"
          to="/blog"
        >
          Blog
        </NuxtLink>
      </li>
    </ul>
    <div
      class="ml-2 mr-1 flex md:gap-2 w-16 flex-shrink-0 items-center justify-between"
    >
      <div
        v-if="$auth.status === 'pending'"
        class="flex items-center justify-center w-[2rem] flex-shrink-0"
      >
        <svg class="h-6 w-6" alt="">
          <use xlink:href="#loading" />
        </svg>
        <span class="sr-only"> Loading </span>
      </div>
      <NuxtLink
        v-else-if="$auth.status === 'logged-out'"
        :to="loginURL"
        class="p-1 w-[2rem] flex-shrink-0"
        @click="$auth.status = 'pending'"
      >
        <svg class="h-5 w-5 fill-current" alt="">
          <use xlink:href="#github" />
        </svg>
        <span class="sr-only"> Login </span>
      </NuxtLink>
      <button
        v-else-if="$auth.status === 'logged-in'"
        class="relative flex-shrink-0 w-[2rem]"
        @click="$auth.logout"
      >
        <img
          class="h-6 w-6 rounded-full"
          :class="{ 'border-[1px] border-yellow-400': $auth.user.sponsor }"
          :src="$auth.user.avatar"
        />
        <svg
          v-if="$auth.user.sponsor"
          class="absolute top-[-0.45rem] right-[-0.2rem] h-5 w-5 text-yellow-400 fill-current"
          alt=""
        >
          <use
            xlink:href="#star"
            class="border-solid border-[1px] border-gray-800"
          />
        </svg>
        <span class="sr-only"> Log out {{ $auth.user.name }} </span>
      </button>
      <ToggleColorMode />
    </div>
  </nav>
</template>
