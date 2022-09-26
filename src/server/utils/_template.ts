import { ParsedReqs } from './_parser'

function getCss() {
  return `
/* http://meyerweb.com/eric/tools/css/reset/
  v2.0 | 20110126
  License: none (public domain)
*/
html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed,
figure, figcaption, footer, header, hgroup,
menu, nav, output, ruby, section, summary,
time, mark, audio, video {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline;
}
/* HTML5 display-role reset for older browsers */
article, aside, details, figcaption, figure,
footer, header, hgroup, menu, nav, section {
  display: block;
}
body {
  line-height: 1;
}
ol, ul {
  list-style: none;
}
blockquote, q {
  quotes: none;
}
blockquote:before, blockquote:after,
q:before, q:after {
  content: '';
  content: none;
}
table {
  border-collapse: collapse;
  border-spacing: 0;
}
* {
  box-sizing: border-box;
}
html {
  font-size: 60px;
}
body {
  height: 100vh;
  font-family: 'Barlow', sans-serif;
}
article {
  padding: 1rem;
  position: relative;
  font-size: 1.25rem;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  background-color: #1a202c;

  height: 100vh;
}
header {
  color: #fff;
  line-height: 1;
}
dl {
  margin-top: 0.5rem;
  line-height: 1.3;
  color: #e2e8f0;
  text-transform: uppercase;
  display: block;
  flex-direction: row;
  font-size: 0.75rem;
}
dd {
  font-weight: bold;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
dt {
  float: left;
  margin-right: 0.5rem;
}
dd > span + span::before {
  margin-left: 0.25rem;
  margin-right: 0.25rem;
  display: inline-block;
  font-weight: bold;
  content: '•';
}
`
}

export function getHtml(parsedReqs: ParsedReqs) {
  const { title, date, tags } = parsedReqs
  const dateEntry = date
    ? `
    <dt>Published</dt>
    <dd>
      ${date}
    </dd>`
    : ''

  const tagEntry = tags.length
    ? `
          <dt>Tags</dt>
          <dd>
            ` +
      tags.map(tag => `<span>${tag}</span>`).join('') +
      `
          </dd>`
    : ''

  return `
<!DOCTYPE html>
<html>
  <meta charset="utf-8">
  <title>Generated Image</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Barlow&display=swap" rel="stylesheet">
  <style>
    ${getCss()}
  </style>
  <body>
    <article>
      <header>
        ${title}
        <dl>
          ${dateEntry}
          ${tagEntry}
        </dl>
      </header>
    </article>
  </body>
</html>
`
}
