/**
 * Return the intrinsic pixel dimensions of an image `File`, in the shape
 * used by `app.bsky.embed.defs#aspectRatio`, or `undefined` if the file
 * cannot be decoded.
 */
export async function probeImageAspectRatio (file: File): Promise<{ width: number, height: number } | undefined> {
  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    bitmap.close()
    if (!width || !height) return undefined
    return { width, height }
  }
  catch {
    return undefined
  }
}
