const sprite =
  /* svg */ `<svg style="display:none" xmlns="http://www.w3.org/2000/svg">
  <symbol id="close" viewBox="0 0 24 24">
    <path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6Z"></path>
  </symbol>
  <symbol viewBox="0 0 24 24" id="menu">
    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
  </symbol>
  <symbol id="loading" viewBox="0 0 24 24">
    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" stroke-opacity=".3" d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="1.3s" values="60;0"/></path><path stroke-dasharray="15" stroke-dashoffset="15" d="M12 3a9 9 0 0 1 9 9"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="15;0"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></g>
  </symbol>
  <symbol id="github" viewBox="0 0 128 128">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M64 5.103c-33.347 0-60.388 27.035-60.388 60.388 0 26.682 17.303 49.317 41.297 57.303 3.017.56 4.125-1.31 4.125-2.905 0-1.44-.056-6.197-.082-11.243-16.8 3.653-20.345-7.125-20.345-7.125-2.747-6.98-6.705-8.836-6.705-8.836-5.48-3.748.413-3.67.413-3.67 6.063.425 9.257 6.223 9.257 6.223 5.386 9.23 14.127 6.562 17.573 5.02.542-3.903 2.107-6.568 3.834-8.076-13.413-1.525-27.514-6.704-27.514-29.843 0-6.593 2.36-11.98 6.223-16.21-.628-1.52-2.695-7.662.584-15.98 0 0 5.07-1.623 16.61 6.19C53.7 35 58.867 34.327 64 34.304c5.13.023 10.3.694 15.127 2.033 11.526-7.813 16.59-6.19 16.59-6.19 3.287 8.317 1.22 14.46.593 15.98 3.872 4.23 6.215 9.617 6.215 16.21 0 23.194-14.127 28.3-27.574 29.796 2.167 1.874 4.097 5.55 4.097 11.183 0 8.08-.07 14.583-.07 16.572 0 1.607 1.088 3.49 4.148 2.897 23.98-7.994 41.263-30.622 41.263-57.294C124.388 32.14 97.35 5.104 64 5.104z"/><path d="M26.484 91.806c-.133.3-.605.39-1.035.185-.44-.196-.685-.605-.543-.906.13-.31.603-.395 1.04-.188.44.197.69.61.537.91zm2.446 2.729c-.287.267-.85.143-1.232-.28-.396-.42-.47-.983-.177-1.254.298-.266.844-.14 1.24.28.394.426.472.984.17 1.255zM31.312 98.012c-.37.258-.976.017-1.35-.52-.37-.538-.37-1.183.01-1.44.373-.258.97-.025 1.35.507.368.545.368 1.19-.01 1.452zm3.261 3.361c-.33.365-1.036.267-1.552-.23-.527-.487-.674-1.18-.343-1.544.336-.366 1.045-.264 1.564.23.527.486.686 1.18.333 1.543zm4.5 1.951c-.147.473-.825.688-1.51.486-.683-.207-1.13-.76-.99-1.238.14-.477.823-.7 1.512-.485.683.206 1.13.756.988 1.237zm4.943.361c.017.498-.563.91-1.28.92-.723.017-1.308-.387-1.315-.877 0-.503.568-.91 1.29-.924.717-.013 1.306.387 1.306.88zm4.598-.782c.086.485-.413.984-1.126 1.117-.7.13-1.35-.172-1.44-.653-.086-.498.422-.997 1.122-1.126.714-.123 1.354.17 1.444.663zm0 0"/>
  </symbol>
  <symbol id="twitter" viewBox="0 0 128 105">
    <path d="M39.7 102.6c47.64 0 73.69-39.47 73.69-73.69 0-1.12 0-2.24-.07-3.35a52.7 52.7 0 0 0 12.92-13.41 51.7 51.7 0 0 1-14.87 4.08A26 26 0 0 0 122.75 1.9a51.9 51.9 0 0 1-16.45 6.29 25.92 25.92 0 0 0-44.13 23.62A73.53 73.53 0 0 1 8.79 4.75a25.92 25.92 0 0 0 8 34.58 25.71 25.71 0 0 1-11.67-3.25v.33A25.91 25.91 0 0 0 25.85 61.8a25.86 25.86 0 0 1-11.7.44 25.93 25.93 0 0 0 24.2 18A52 52 0 0 1 6.18 91.3 52.72 52.72 0 0 1 0 90.94a73.32 73.32 0 0 0 39.7 11.63"/>
  </symbol>
  <symbol id="linkedin" viewBox="0 0 128 128">
    <path d="M116 3H12a8.91 8.91 0 0 0-9 8.8v104.42a8.91 8.91 0 0 0 9 8.78h104a8.93 8.93 0 0 0 9-8.81V11.77A8.93 8.93 0 0 0 116 3ZM39.17 107H21.06V48.73h18.11Zm-9-66.21a10.5 10.5 0 1 1 10.49-10.5 10.5 10.5 0 0 1-10.54 10.48ZM107 107H88.89V78.65c0-6.75-.12-15.44-9.41-15.44s-10.87 7.36-10.87 15V107H50.53V48.73h17.36v8h.24c2.42-4.58 8.32-9.41 17.13-9.41C103.6 47.28 107 59.35 107 75Z"/>
  </symbol>
  <symbol viewbox="0 0 24 24" id="star">
    <path stroke="#111827" stroke-width="2" fill="currentColor" d="m14.43 10l-1.47-4.84c-.29-.95-1.63-.95-1.91 0L9.57 10H5.12c-.97 0-1.37 1.25-.58 1.81l3.64 2.6l-1.43 4.61c-.29.93.79 1.68 1.56 1.09l3.69-2.8l3.69 2.81c.77.59 1.85-.16 1.56-1.09l-1.43-4.61l3.64-2.6c.79-.57.39-1.81-.58-1.81h-4.45z"></path>
  </symbol>
  <symbol viewbox="0 0 24 24" id="mastodon">
    <path fill="currentColor" d="M20.94 14c-.28 1.41-2.44 2.96-4.97 3.26c-1.31.15-2.6.3-3.97.24c-2.25-.11-4-.54-4-.54v.62c.32 2.22 2.22 2.35 4.03 2.42c1.82.05 3.44-.46 3.44-.46l.08 1.65s-1.28.68-3.55.81c-1.25.07-2.81-.03-4.62-.5c-3.92-1.05-4.6-5.24-4.7-9.5l-.01-3.43c0-4.34 2.83-5.61 2.83-5.61C6.95 2.3 9.41 2 11.97 2h.06c2.56 0 5.02.3 6.47.96c0 0 2.83 1.27 2.83 5.61c0 0 .04 3.21-.39 5.43M18 8.91c0-1.08-.3-1.91-.85-2.56c-.56-.63-1.3-.96-2.23-.96c-1.06 0-1.87.41-2.42 1.23l-.5.88l-.5-.88c-.56-.82-1.36-1.23-2.43-1.23c-.92 0-1.66.33-2.23.96C6.29 7 6 7.83 6 8.91v5.26h2.1V9.06c0-1.06.45-1.62 1.36-1.62c1 0 1.5.65 1.5 1.93v2.79h2.07V9.37c0-1.28.5-1.93 1.51-1.93c.9 0 1.35.56 1.35 1.62v5.11H18V8.91Z"></path>
  </symbol>
  <symbol viewBox="0 0 512 512" id="audio">
    <path fill="currentColor" d="m110.763 110.763l-22.7-22.7c-.095.1-.193.186-.288.281a238.483 238.483 0 0 0-.7 336.573l22.7-22.7a206.144 206.144 0 0 1 .988-291.462Zm314.306-22.415c-.4-.4-.817-.793-1.223-1.194l-22.7 22.7a206.142 206.142 0 0 1 1.5 292.8l22.7 22.7a238.492 238.492 0 0 0-.281-337Z"></path><path fill="currentColor" d="M153.523 153.522a145.746 145.746 0 0 0-.989 205.944l22.617-22.617a113.8 113.8 0 0 1 .989-160.71Zm182.25 21.705a113.8 113.8 0 0 1 1.5 162.05L359.9 359.9a145.746 145.746 0 0 0-1.5-207.285Zm-41.007 41.007a55.914 55.914 0 1 0 17.658 40.759a55.783 55.783 0 0 0-17.658-40.759Zm-38.342 64.759a24 24 0 1 1 24-24a24 24 0 0 1-24 24Z"></path>
  </symbol>
  <symbol viewBox="0 0 512 512" id="play">
    <path fill="currentColor" d="M444.4 235.236L132.275 49.449A24 24 0 0 0 96 70.072v364.142a24.017 24.017 0 0 0 35.907 20.839L444.03 276.7a24 24 0 0 0 .367-41.461ZM128 420.429V84.144l288.244 171.574Z"></path>
  </symbol>
  <symbol viewBox="0 0 24 24" id="rss">
    <path fill="currentColor" d="M3 17a4 4 0 0 1 4 4H3v-4zm0-7c6.075 0 11 4.925 11 11h-2a9 9 0 0 0-9-9v-2zm0-7c9.941 0 18 8.059 18 18h-2c0-8.837-7.163-16-16-16V3z"></path>
  </symbol>
  <symbol viewBox="0 0 32 32" id="bluesky">
    <path fill="currentColor" d="M4 1a3 3 0 0 0-3 3v24a3 3 0 0 0 3 3h24a3 3 0 0 0 3-3V4a3 3 0 0 0-3-3H4Z"></path>
  </symbol>
  <symbol viewBox="0 0 24 24" id="calendar">
    <path fill="currentColor" d="M9 1v2h6V1h2v2h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2Zm11 7H4v11h16V8Zm-4.964 2.136l1.414 1.414l-4.95 4.95l-3.536-3.536L9.38 11.55l2.121 2.122l3.536-3.536Z"></path>
  </symbol>
</svg>
`.replace(/\s+/g, ' ')

export default defineNitroPlugin(nitro => {
  nitro.hooks.hook('render:html', htmlContext => {
    htmlContext.bodyPrepend.push(sprite)
  })
})
