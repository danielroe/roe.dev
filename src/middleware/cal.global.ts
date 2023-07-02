let registered: boolean
const initConfig = {
  origin: 'https://app.cal.com',
}
const styleConfig = {
  cssVarsPerTheme: {
    light: {
      'cal-bg-muted': '#e5e7eb',
      'cal-bg-emphasis': '#f3f4f6',
    },
    dark: {
      'cal-bg-muted': '#1f2937',
      'cal-bg-emphasis': '#374151',
    },
  },
  hideEventTypeDetails: false,
  layout: 'month_view',
}

export default defineNuxtRouteMiddleware(to => {
  if ((process.server || !registered) && to.path === '/blog/open-invitation') {
    registered = true
    useHead({
      script: [
        {
          key: 'cal',
          innerHTML: /* javascript */ `
(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; typeof namespace === "string" ? (cal.ns[namespace] = api) && p(api, ar) : p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", ${JSON.stringify(initConfig)});
Cal("ui", ${JSON.stringify(styleConfig)});
`,
        },
      ],
    })
  }
})
