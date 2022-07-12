import path from 'path'
import fs from 'fs'

/**
 * @type {(dir: string, callback: (path: string) => any)} walkDir
 */
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f)
    const isDirectory = fs.statSync(dirPath).isDirectory()
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f))
  })
}

/**
 * @type {(directory: string, callback: (path: string, contents: string) => any)} iterateOnDirectory
 */
export function iterateOnDirectory(directory, callback) {
  walkDir(directory, path =>
    callback(path, fs.existsSync(path) && fs.readFileSync(path, 'utf8'))
  )
}

/**
 * @type {(message: string, filename: string, contents: string) => void} writeFile
 */
export function writeFile(_message, filename, contents) {
  if (fs && fs.writeFileSync) {
    return fs.writeFileSync(filename, contents)
  }
}
