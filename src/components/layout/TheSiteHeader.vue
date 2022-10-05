<template>
  <nav
    class="p-2 uppercase bg-gray-900 flex flex-row justify-between items-center text-white md:p-4 tracking-[0.15rem]"
  >
    <ul
      v-once
      class="font-semibold flex-grow justify-between flex flex-row items-center md:flex-grow-0"
    >
      <li>
        <h1>
          <NuxtLink
            class="outline-none px-2 py-2 hover:after:border-gray-700 focus:after:border-gray-700"
            to="/"
            title="Daniel Roe"
          >
            DCR
          </NuxtLink>
        </h1>
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

    <ToggleColorMode />
  </nav>
</template>
