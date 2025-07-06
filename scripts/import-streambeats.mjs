#!/usr/bin/env node

/**
 * This script recursively crawls Harris Heller's StreamBeats Google Drive archive,
 * preserving folder structure as metadata, and uploads tracks to Sanity CMS.
 *
 * Features:
 * - Recursive folder traversal
 * - Folder names preserved as metadata (collection/category info)
 * - Enhanced metadata extraction from folder paths
 * - WAV file support with folder-based metadata
 * - Batch processing with progress tracking
 */

import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { createClient } from '@sanity/client'
import { google } from 'googleapis'

// Configuration
const config = {
  googleDriveFolderId: '196AfI6vYiSwKqb7ATKKg4J_4PcwG84jC', // Root StreamBeats folder
  downloadDir: './downloads/streambeats',
  maxDownloads: parseInt(process.env.MAX_DOWNLOADS || '20') || 20,
  maxDepth: 7, // Prevent infinite recursion
  retryAttempts: 3,
  retryDelay: 2000,
}

// Sanity client configuration
const sanityClient = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '9bj3w2vo',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  token: process.env.NUXT_SANITY_TOKEN,
  apiVersion: '2025-02-10',
  useCdn: false,
})

// Google Drive setup
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})

const drive = google.drive({ version: 'v3', auth })

/**
 * Get audio file duration - enhanced for WAV files
 */
async function getAudioDuration (filePath) {
  try {
    // Try ffprobe first for accurate duration
    try {
      const { execSync } = await import('child_process')
      const command = `ffprobe -v quiet -show_entries format=duration -of csv="p=0" "${filePath}"`
      const output = execSync(command, { encoding: 'utf-8', timeout: 10000 }).trim()
      const duration = parseFloat(output)

      if (!isNaN(duration) && duration > 0) {
        console.log(`📏 Accurate duration for ${path.basename(filePath)}: ${Math.round(duration)}s`)
        return Math.round(duration)
      }
    }
    catch {
      // ffprobe not available or failed
    }

    // Fallback: improved estimation for different audio formats
    const stats = fs.statSync(filePath)
    const fileSizeMB = stats.size / (1024 * 1024)
    const ext = path.extname(filePath).toLowerCase()

    let estimatedDuration
    switch (ext) {
      case '.wav':
        // WAV files are uncompressed, roughly 10MB per minute for stereo 44.1kHz
        estimatedDuration = Math.max(30, Math.floor(fileSizeMB * 6))
        break
      case '.mp3':
        // MP3 compressed, roughly 1MB per minute
        estimatedDuration = Math.max(30, Math.floor(fileSizeMB * 60))
        break
      case '.flac':
        // FLAC compressed lossless, roughly 5MB per minute
        estimatedDuration = Math.max(30, Math.floor(fileSizeMB * 12))
        break
      default:
        // Generic estimation
        estimatedDuration = Math.max(30, Math.floor(fileSizeMB * 30))
    }

    console.log(`📏 Estimated duration for ${path.basename(filePath)}: ${estimatedDuration}s (${fileSizeMB.toFixed(1)}MB ${ext})`)
    return estimatedDuration
  }
  catch {
    console.warn(`⚠️  Could not determine duration for ${filePath}, using default`)
    return 180 // 3 minutes default
  }
}

/**
 * Enhanced metadata extraction from folder path and filename
 */
function parseFileMetadata (fileName, folderPath = []) {
  const nameWithoutExt = path.parse(fileName).name
  const tags = new Set()
  let collection = 'streambeats'
  let category = ''
  let subCategory = ''

  // Extract metadata from folder structure
  if (folderPath.length > 0) {
    // First folder level often indicates main collection
    const mainFolder = folderPath[0].toLowerCase()

    if (mainFolder.includes('lofi') || mainFolder.includes('lo-fi')) {
      collection = 'streambeats-lofi'
      category = 'Lo-Fi'
      tags.add('lofi').add('chill').add('relaxed')
    }
    else if (mainFolder.includes('chill')) {
      collection = 'streambeats-chill'
      category = 'Chill'
      tags.add('chill').add('relaxed')
    }
    else if (mainFolder.includes('study')) {
      collection = 'streambeats-study'
      category = 'Study'
      tags.add('study').add('focus').add('concentration')
    }
    else if (mainFolder.includes('gaming') || mainFolder.includes('game')) {
      collection = 'streambeats-gaming'
      category = 'Gaming'
      tags.add('gaming').add('energetic')
    }
    else if (mainFolder.includes('hip') && mainFolder.includes('hop')) {
      collection = 'streambeats-hiphop'
      category = 'Hip Hop'
      tags.add('hiphop').add('urban').add('beats')
    }
    else if (mainFolder.includes('electronic')) {
      collection = 'streambeats-electronic'
      category = 'Electronic'
      tags.add('electronic').add('synth').add('digital')
    }
    else if (mainFolder.includes('ambient')) {
      collection = 'streambeats-ambient'
      category = 'Ambient'
      tags.add('ambient').add('atmospheric').add('peaceful')
    }
    else {
      // Use folder name as category
      category = folderPath[0]
      collection = `streambeats-${mainFolder.replace(/\s+/g, '-').toLowerCase()}`
    }

    // Second level folder for subcategory
    if (folderPath.length > 1) {
      subCategory = folderPath[1]
      const subFolder = folderPath[1].toLowerCase()

      // Extract tags from subcategory
      if (subFolder.includes('upbeat') || subFolder.includes('energy')) {
        tags.add('upbeat').add('energetic')
      }
      if (subFolder.includes('dark') || subFolder.includes('moody')) {
        tags.add('dark').add('moody')
      }
      if (subFolder.includes('epic') || subFolder.includes('cinematic')) {
        tags.add('epic').add('cinematic')
      }
      if (subFolder.includes('funk')) {
        tags.add('funk').add('groove')
      }
    }
  }

  // Extract additional metadata from filename
  const lowerName = nameWithoutExt.toLowerCase()

  // Tempo indicators
  if (lowerName.includes('slow') || lowerName.includes('calm')) {
    tags.add('slow').add('calm')
  }
  if (lowerName.includes('fast') || lowerName.includes('quick') || lowerName.includes('rapid')) {
    tags.add('fast').add('energetic')
  }
  if (lowerName.includes('medium') || lowerName.includes('mid')) {
    tags.add('medium-tempo')
  }

  // Mood indicators
  if (lowerName.includes('happy') || lowerName.includes('uplifting')) {
    tags.add('happy').add('positive')
  }
  if (lowerName.includes('sad') || lowerName.includes('melancholy')) {
    tags.add('sad').add('melancholy')
  }
  if (lowerName.includes('intense') || lowerName.includes('dramatic')) {
    tags.add('intense').add('dramatic')
  }

  // Always add these base tags
  tags.add('streambeats').add('harris-heller').add('royalty-free').add('copyright-free')

  // If no specific tags found, add generic ones
  if (tags.size <= 4) { // Only base tags
    tags.add('background').add('instrumental')
  }

  return {
    name: nameWithoutExt,
    collection,
    category,
    subCategory,
    folderPath: folderPath.join(' > '),
    tags: Array.from(tags),
  }
}

/**
 * Recursively list all folders and files in Google Drive
 */
async function listDriveFoldersAndFiles (folderId, folderPath = [], depth = 0) {
  if (depth > config.maxDepth) {
    console.warn(`⚠️  Max depth reached for folder: ${folderPath.join(' > ')}`)
    return { folders: [], files: [] }
  }

  try {
    console.log(`📂 Scanning folder: ${folderPath.join(' > ') || 'Root'} (depth: ${depth})`)

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime)',
      pageSize: 1000,
    })

    const items = response.data.files || []
    const folders = items.filter(item => item.mimeType === 'application/vnd.google-apps.folder')
    const audioFiles = items.filter(item =>
      item.mimeType && (
        item.mimeType.startsWith('audio/')
        || item.name?.toLowerCase().match(/\.(mp3|wav|flac|m4a|aac|ogg)$/i)
      ),
    )

    console.log(`   📁 Found ${folders.length} subfolders, ${audioFiles.length} audio files`)

    // Collect all files from this level
    const allFiles = audioFiles.map(file => ({
      ...file,
      folderPath: [...folderPath],
    }))

    // Recursively process subfolders
    for (const folder of folders) {
      const subResult = await listDriveFoldersAndFiles(
        folder.id,
        [...folderPath, folder.name],
        depth + 1,
      )
      allFiles.push(...subResult.files)
    }

    return {
      folders: folders.map(f => ({ ...f, folderPath })),
      files: allFiles,
    }
  }
  catch (error) {
    console.error(`❌ Error scanning folder ${folderPath.join(' > ')}:`, error.message)
    return { folders: [], files: [] }
  }
}

/**
 * Check if track already exists in Sanity
 */
async function trackExists (name, folderPath) {
  try {
    const query = `*[_type == "audioTrack" && name == $name && folderPath == $folderPath][0]`
    const existing = await sanityClient.fetch(query, { name, folderPath })
    return !!existing
  }
  catch {
    return false
  }
}

/**
 * Download file from Google Drive
 */
async function downloadFile (fileId, fileName, folderPath, downloadPath) {
  // Create folder structure locally
  const localFolderPath = path.join(downloadPath, ...folderPath)
  if (!fs.existsSync(localFolderPath)) {
    fs.mkdirSync(localFolderPath, { recursive: true })
  }

  const filePath = path.join(localFolderPath, fileName)

  // Skip if already exists
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  File already exists: ${path.join(...folderPath, fileName)}`)
    return filePath
  }

  console.log(`⬇️  Downloading: ${path.join(...folderPath, fileName)}`)

  const response = await drive.files.get({
    fileId,
    alt: 'media',
  }, { responseType: 'stream' })

  const writeStream = fs.createWriteStream(filePath)
  await pipeline(response.data, writeStream)

  console.log(`✅ Downloaded: ${fileName}`)
  return filePath
}

/**
 * Upload file to Sanity with enhanced metadata
 */
async function uploadToSanity (filePath, metadata) {
  console.log(`📤 Uploading to Sanity: ${metadata.name}`)

  // Check if already exists
  if (await trackExists(metadata.name, metadata.folderPath)) {
    console.log(`⏭️  Track already exists: ${metadata.name} (${metadata.folderPath})`)
    return null
  }

  // Upload the audio file
  const fileStream = fs.createReadStream(filePath)
  const asset = await sanityClient.assets.upload('file', fileStream, {
    filename: path.basename(filePath),
  })

  // Create the audioTrack document with enhanced metadata
  const audioTrack = {
    _type: 'audioTrack',
    name: metadata.name,
    artist: 'Harris Heller',
    collection: metadata.collection,
    category: metadata.category,
    subCategory: metadata.subCategory,
    folderPath: metadata.folderPath,
    audioFile: {
      _type: 'file',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
    },
    duration: metadata.duration,
    tags: metadata.tags,
    volume: 0.7,
    isActive: true,
    notes: `Imported from StreamBeats collection on ${new Date().toISOString().split('T')[0]}. Original path: ${metadata.folderPath}`,
    importedAt: new Date().toISOString(),
  }

  const doc = await sanityClient.create(audioTrack)
  console.log(`✅ Created Sanity document: ${doc._id}`)
  return doc
}

/**
 * Main import function with recursive crawling
 */
async function importStreamBeats () {
  try {
    console.log('🎵 Enhanced StreamBeats Import Script with Recursive Crawling...')
    console.log('='.repeat(70))

    if (!process.env.NUXT_SANITY_TOKEN) {
      throw new Error('SANITY_TOKEN environment variable is required')
    }

    // Create download directory
    if (!fs.existsSync(config.downloadDir)) {
      fs.mkdirSync(config.downloadDir, { recursive: true })
      console.log(`📁 Created download directory: ${config.downloadDir}`)
    }

    // Recursively scan all folders and files
    console.log('🔍 Recursively scanning StreamBeats archive...')
    const { files } = await listDriveFoldersAndFiles(config.googleDriveFolderId)

    if (files.length === 0) {
      console.log('📭 No audio files found in the archive')
      return
    }

    console.log(`\n🎯 Found ${files.length} total audio files across all folders`)
    console.log(`📊 Processing up to ${config.maxDownloads} files...\n`)

    // Group files by folder for better organization
    const filesByFolder = new Map()
    files.forEach(file => {
      const folderKey = file.folderPath.join(' > ') || 'Root'
      if (!filesByFolder.has(folderKey)) {
        filesByFolder.set(folderKey, [])
      }
      filesByFolder.get(folderKey).push(file)
    })

    console.log('📋 Files by folder:')
    for (const [folder, folderFiles] of filesByFolder.entries()) {
      console.log(`   📁 ${folder}: ${folderFiles.length} files`)
    }
    console.log('')

    // Distribute maxDownloads across folders more evenly
    const filesToProcess = []
    const folderEntries = Array.from(filesByFolder.entries())

    if (folderEntries.length > 0) {
      // Calculate base files per folder
      const filesPerFolder = Math.floor(config.maxDownloads / folderEntries.length)
      const remainder = config.maxDownloads % folderEntries.length

      console.log(`📊 Strategy: ${filesPerFolder} files per folder + ${remainder} extra files (${folderEntries.length} folders)`)

      // Track how many files we've taken from each folder
      const folderFileCounts = new Map()

      // First pass: take base amount from each folder
      folderEntries.forEach(([folder, folderFiles]) => {
        const filesToTake = Math.min(filesPerFolder, folderFiles.length)
        filesToProcess.push(...folderFiles.slice(0, filesToTake))
        folderFileCounts.set(folder, filesToTake)
        console.log(`   📁 ${folder}: taking ${filesToTake}/${folderFiles.length} files`)
      })

      // Second pass: distribute remainder files to folders that still have files
      let extraFilesAdded = 0
      let folderIndex = 0

      while (extraFilesAdded < remainder && folderEntries.length > 0) {
        const [folder, folderFiles] = folderEntries[folderIndex]
        const alreadyTaken = folderFileCounts.get(folder) || 0

        // If this folder still has files available
        if (alreadyTaken < folderFiles.length) {
          filesToProcess.push(folderFiles[alreadyTaken])
          folderFileCounts.set(folder, alreadyTaken + 1)
          extraFilesAdded++
          console.log(`   📁 ${folder}: adding 1 extra file (${alreadyTaken + 1}/${folderFiles.length})`)
        }

        folderIndex = (folderIndex + 1) % folderEntries.length

        // Safety check: if all folders are exhausted, break
        const hasAvailableFiles = folderEntries.some(([folder, folderFiles]) => {
          const taken = folderFileCounts.get(folder) || 0
          return taken < folderFiles.length
        })

        if (!hasAvailableFiles) break
      }
    }

    console.log(`\n🎯 Selected ${filesToProcess.length} files for processing`)
    console.log('')

    // Initialize counters
    let successCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const [index, file] of filesToProcess.entries()) {
      try {
        console.log(`\n[${index + 1}/${filesToProcess.length}] Processing: ${file.name}`)
        console.log(`   📁 Path: ${file.folderPath.join(' > ') || 'Root'}`)

        // Download file
        const filePath = await downloadFile(
          file.id,
          file.name,
          file.folderPath,
          config.downloadDir,
        )

        // Get metadata with folder information
        const fileMetadata = parseFileMetadata(file.name, file.folderPath)
        const duration = await getAudioDuration(filePath)

        const metadata = {
          ...fileMetadata,
          duration,
        }

        console.log(`📋 Metadata:`)
        console.log(`   🏷️  Collection: ${metadata.collection}`)
        console.log(`   📂 Category: ${metadata.category}`)
        console.log(`   📂 Sub-category: ${metadata.subCategory}`)
        console.log(`   🎯 Tags: ${metadata.tags.join(', ')}`)
        console.log(`   ⏱️  Duration: ${metadata.duration}s`)

        // Upload to Sanity
        const result = await uploadToSanity(filePath, metadata)

        if (result) {
          successCount++
        }
        else {
          skippedCount++
        }

        // Clean up if requested
        if (process.env.CLEANUP_DOWNLOADS === 'true') {
          fs.unlinkSync(filePath)
          console.log(`🗑️  Cleaned up: ${file.name}`)
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      catch (error) {
        console.error(`❌ Failed to process ${file.name}:`, error.message)
        errorCount++
        continue
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('🏁 Import completed!')
    console.log(`✅ Successfully imported: ${successCount} tracks`)
    console.log(`⏭️  Skipped (already exist): ${skippedCount} tracks`)
    console.log(`❌ Failed: ${errorCount} tracks`)
    console.log(`📊 Total files in archive: ${files.length}`)
    console.log(`📁 Downloads saved to: ${config.downloadDir}`)

    if (successCount > 0) {
      console.log('\n🎉 StreamBeats tracks imported successfully!')
      console.log('💡 Folder structure preserved as metadata for better organization')
      console.log('🔄 Refresh your Sanity studio to see the new tracks')
    }
  }
  catch (error) {
    console.error('💥 Script failed:', error.message)
    process.exit(1)
  }
}

/**
 * Enhanced dry run with folder structure analysis
 */
async function dryRun () {
  try {
    console.log('🔍 DRY RUN: Analyzing StreamBeats folder structure...\n')

    const { files } = await listDriveFoldersAndFiles(config.googleDriveFolderId)

    if (files.length === 0) {
      console.log('📭 No audio files found')
      return
    }

    // Analyze folder structure
    const folderStats = new Map()
    const collectionStats = new Map()
    let totalSize = 0

    files.forEach(file => {
      const folderPath = file.folderPath.join(' > ') || 'Root'
      folderStats.set(folderPath, (folderStats.get(folderPath) || 0) + 1)

      const metadata = parseFileMetadata(file.name, file.folderPath)
      collectionStats.set(metadata.collection, (collectionStats.get(metadata.collection) || 0) + 1)

      totalSize += parseInt(file.size || '0') || 0
    })

    console.log('📊 ARCHIVE ANALYSIS:')
    console.log('='.repeat(50))
    console.log(`📁 Total files: ${files.length}`)
    console.log(`💾 Total size: ${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`)

    console.log('\n📂 FOLDER STRUCTURE:')
    console.log('-'.repeat(30))
    for (const [folder, count] of [...folderStats.entries()].sort()) {
      console.log(`   ${folder}: ${count} files`)
    }

    console.log('\n🏷️  DETECTED COLLECTIONS:')
    console.log('-'.repeat(30))
    for (const [collection, count] of collectionStats.entries()) {
      console.log(`   ${collection}: ${count} tracks`)
    }

    console.log('\n💡 To import these files, run: pnpm import-streambeats:recursive')
  }
  catch (error) {
    console.error('❌ Dry run failed:', error.message)
  }
}

// CLI handling
const command = process.argv[2]

if (command === '--dry-run' || command === '-d') {
  dryRun()
}
else if (command === '--help' || command === '-h') {
  console.log(`
🎵 Enhanced StreamBeats Import Script with Recursive Crawling

Usage:
  node scripts/import-streambeats-recursive.mjs [command]

Commands:
  --dry-run, -d    Analyze folder structure without downloading
  --help, -h       Show this help message
  (no command)     Run the recursive import process

Environment Variables:
  SANITY_TOKEN                      Sanity write token (required)
  SANITY_STUDIO_PROJECT_ID          Sanity project ID
  SANITY_STUDIO_DATASET            Sanity dataset (default: production)
  GOOGLE_SERVICE_ACCOUNT_KEY_FILE   Path to Google service account key
  CLEANUP_DOWNLOADS                 Set to 'true' to delete files after upload
  MAX_DOWNLOADS                     Maximum files to process (default: 20)

Features:
  ✅ Recursive folder crawling
  ✅ Folder structure preserved as metadata
  ✅ Enhanced metadata extraction from paths
  ✅ WAV file support with accurate duration detection
  ✅ Collection detection from folder names
  ✅ Category and subcategory organization
  ✅ Duplicate prevention with folder context

Examples:
  SANITY_TOKEN=your_token node scripts/import-streambeats-recursive.mjs --dry-run
  SANITY_TOKEN=your_token MAX_DOWNLOADS=50 node scripts/import-streambeats-recursive.mjs
`)
}
else {
  importStreamBeats()
}
