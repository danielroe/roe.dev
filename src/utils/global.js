const path = require('path')
const fs = require('fs')

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
function iterateOnDirectory(directory, callback) {
  walkDir(directory, path =>
    callback(path, fs.existsSync(path) && fs.readFileSync(path, 'utf8')),
  )
}

/**
 * @type {(haystack: string, needle: string | RegExp, index: number ) => string} getMatchOrReturn
 */
function getMatchOrReturn(haystack, needle, index = 0) {
  const matches = haystack.match(needle)
  if (!matches || !matches.length || matches.length < index + 1) return ''
  return matches[index]
}

/**
 * @type {(message: string, filename: string, contents: string) => void} writeFile
 */
function writeFile(message, filename, contents) {
  if (fs && fs.writeFileSync) {
    return fs.writeFileSync(filename, contents)
  }
}

module.exports = {
  iterateOnDirectory,
  getMatchOrReturn,
  writeFile,
}
