import { launch } from 'puppeteer'

const localChromePath =
  '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev'

function getOptions (isDev: boolean) {
  let options: Parameters<typeof launch>[0]
  if (isDev) {
    options = {
      executablePath: localChromePath,
      headless: true,
    }
  } else {
    options = {
      headless: true,
    }
  }
  return options
}

function sleep (ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export async function getScreenshot (url: string, isDev: boolean) {
  const options = await getOptions(isDev)
  const browser = await launch(options)
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630 })
  await page.goto(url)
  await sleep(1000)
  return page.screenshot({ type: 'jpeg', quality: 100 })
}
