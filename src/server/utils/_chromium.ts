import chrome from 'chrome-aws-lambda'
import * as puppeteer from 'puppeteer-core'

const localChromePath =
  '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev'

interface Options {
  args: string[]
  executablePath: string
  headless: boolean
}

async function getOptions (isDev: boolean) {
  let options: Options
  if (isDev) {
    options = {
      args: [],
      executablePath: localChromePath,
      headless: true,
    }
  } else {
    options = {
      args: chrome.args,
      executablePath: (await chrome.executablePath) || localChromePath,
      headless: chrome.headless,
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
  // @ts-ignore
  // eslint-disable-next-line import/namespace
  const browser = await (puppeteer.default || puppeteer).launch(options)
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630 })
  await page.goto(url)
  await sleep(1000)
  return page.screenshot({ type: 'jpeg', quality: 100 })
}
