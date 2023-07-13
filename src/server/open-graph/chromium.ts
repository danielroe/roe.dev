import { chromium, LaunchOptions } from 'playwright-core'

function getOptions(isDev: boolean) {
  let options: LaunchOptions
  if (isDev) {
    options = {
      executablePath:
        '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev',
      headless: true,
    }
  } else {
    options = {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    }
  }
  return options
}

export async function getScreenshot(url: string, isDev?: boolean) {
  const browser = await chromium.launch(getOptions(!!isDev))
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1200, height: 630 })
  await page.goto(url)
  await page.waitForLoadState('domcontentloaded')
  await new Promise(resolve => setTimeout(resolve, 1000))
  return page.screenshot({ type: 'jpeg', quality: 100 })
}
