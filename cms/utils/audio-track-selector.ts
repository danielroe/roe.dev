import type { SanityClient } from 'sanity'

export interface AudioTrack {
  id: string
  name: string
  artist: string
  collection: string
  category?: string
  subCategory?: string
  folderPath?: string
  duration: number
  url: string
  tags: string[]
  volume?: number
}

/**
 * Fetch all active audio tracks from Sanity
 */
export async function fetchAudioTracks (client: SanityClient): Promise<AudioTrack[]> {
  const query = `*[_type == "audioTrack" && isActive == true] {
    _id,
    name,
    artist,
    collection,
    category,
    subCategory,
    folderPath,
    duration,
    "url": audioFile.asset->url,
    tags,
    volume
  }`

  const tracks = await client.fetch(query)

  return tracks.map((track: any) => ({
    id: track._id,
    name: track.name,
    artist: track.artist,
    collection: track.collection,
    category: track.category,
    subCategory: track.subCategory,
    folderPath: track.folderPath,
    duration: track.duration,
    url: track.url,
    tags: track.tags || [],
    volume: track.volume || 0.7,
  })).filter((track: AudioTrack) => track.url) // Only include tracks with valid URLs
}

/**
 * Select a random audio track based on content hash (for consistency)
 * and video duration requirements
 */
export function selectAudioTrack (
  tracks: AudioTrack[],
  videoDuration: number,
  contentHash: string,
): AudioTrack | null {
  if (!tracks.length) return null

  // Filter tracks that are long enough for the video (with 5 second buffer)
  const suitableTracks = tracks.filter(track => track.duration >= videoDuration + 5)

  if (!suitableTracks.length) {
    // Fall back to any available track if none are long enough
    console.warn('No tracks long enough for video duration, using any available track')
    return tracks.length > 0 ? selectRandomTrack(tracks, contentHash) : null
  }

  return selectRandomTrack(suitableTracks, contentHash)
}

/**
 * Select a random track using seeded randomization for consistency
 */
function selectRandomTrack (tracks: AudioTrack[], contentHash: string): AudioTrack {
  // Create a seed from the content hash
  const seed = contentHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000

  // Use the same seeded random function as the typing intervals
  let randomSeed = seed
  const seededRandom = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    return randomSeed / 233280
  }

  const index = Math.floor(seededRandom() * tracks.length)
  return tracks[index]!
}

/**
 * Generate a content hash from question and answer for consistent track selection
 */
export function generateContentHash (question: string, answer: string): string {
  return `${question.trim()}-${answer.trim()}`.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Calculate random start time for audio track to add variety
 */
export function calculateAudioStartTime (track: AudioTrack, videoDuration: number, contentHash: string): number {
  const maxStartTime = Math.max(0, track.duration - videoDuration - 5) // 5 second buffer

  if (maxStartTime <= 0) return 0

  // Use content hash to generate consistent start time
  const seed = contentHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000
  let randomSeed = seed + 42 // Add offset to get different value than track selection
  const seededRandom = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    return randomSeed / 233280
  }

  return Math.floor(seededRandom() * maxStartTime)
}
