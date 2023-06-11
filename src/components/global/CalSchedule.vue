<script setup lang="ts">
useHead({
  script: [
    {
      key: 'cal',
      innerHTML: `
(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; typeof namespace === "string" ? (cal.ns[namespace] = api) && p(api, ar) : p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", {origin:"https://app.cal.com"});
Cal("ui", {"styles":{"branding":{"brandColor":"#000000"}},"hideEventTypeDetails":false});`,
    },
  ],
})

defineProps({
  meeting: String,
  message: String,
})
</script>

<template>
  <button
    class="flex flex-row link gap-2 mt-4"
    :data-cal-link="`danielroe/${meeting}`"
    type="button"
  >
    <svg class="inline-block h-4 w-4" alt="">
      <use xlink:href="#calendar" />
    </svg>
    {{ message }}
  </button>
</template>
