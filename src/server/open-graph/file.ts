import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { promises as fsp } from 'node:fs'

export async function writeTempFile(fileName: string, html: string) {
  const hashedFileName =
    createHash('md5').update(fileName).digest('hex') + '.html'

  const filePath = join(tmpdir(), hashedFileName)

  await fsp.writeFile(filePath, html)

  return filePath
}
