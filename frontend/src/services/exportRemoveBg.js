export async function exportRemoveBg({ resultImage }) {
  if (!resultImage) {
    throw new Error('No remove-bg result to export')
  }

  const res = await fetch(resultImage)
  return await res.blob()
}
