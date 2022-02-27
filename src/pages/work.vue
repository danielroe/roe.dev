<template>
  <div :class="$style.work">
    <header>
      <h2>Work</h2>
    </header>

    <main>
      <GithubRepos />
      <section :class="$style.logos">
        <img
          v-for="(image, name) in clients"
          :key="name"
          :alt="name"
          :src="image"
        />
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import Comcast from '~/assets/images/work/comcast.svg'
import DurhamUniversity from '~/assets/images/work/durham-university.svg'
import ParentScheme from '~/assets/images/work/parentscheme.svg'
import Concision from '~/assets/images/work/concision.svg'
import NELEP from '~/assets/images/work/nelep.png'
import Convoke from '~/assets/images/work/convoke.png'
import AcadianSoftware from '~/assets/images/work/acadian-software.svg'
import NuxtLabs from '~/assets/images/work/nuxtlabs.svg'
import Canvas8 from '~/assets/images/work/canvas8.svg'
import ImperialEnterpriseLab from '~/assets/images/work/imperial-enterprise-lab.svg'

const clients = {
  Comcast,
  'Durham University': DurhamUniversity,
  'Parent Scheme': ParentScheme,
  Concision,
  'North East Local Enterprise Partnership': NELEP,
  Convoke,
  'Acadian Software': AcadianSoftware,
  NuxtLabs,
  Canvas8,
  'Imperial Enterprise Lab': ImperialEnterpriseLab,
}

useMeta({
  title: 'Work',
})
</script>

<style module>
.logos {
  @apply flex flex-row flex-wrap justify-center items-center my-12;

  > * {
    @apply mx-4 my-4;
    @apply h-full w-auto flex-grow-0 flex-shrink;

    flex-basis: 3rem;
    max-height: 2rem;
    max-width: 5rem;
  }

  @media (width < 767px) {
    > * {
      flex-basis: 33%;
    }
  }
}

:global(.light-mode) .work img {
  filter: invert(1) opacity(0.8);
}
</style>
