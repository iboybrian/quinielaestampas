// Web Worker: pure-JS sticker cell analysis.
// Receives raw RGBA pixel data (transferred ArrayBuffer), returns per-cell fill results.
// No external dependencies — works as a Vite module worker.

const VARIANCE_THRESHOLD = 600 // luminance variance; tune up if too many false positives
const INNER_PADDING = 0.08     // fraction of cell to ignore at edges (avoids grid lines)

function analyzeFrame({ pixelBuffer, width, height, gridCols, gridRows }) {
  const pixels = new Uint8ClampedArray(pixelBuffer)
  const cellW = width / gridCols
  const cellH = height / gridRows
  const cells = []

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const padX = Math.ceil(cellW * INNER_PADDING)
      const padY = Math.ceil(cellH * INNER_PADDING)
      const x0 = Math.floor(col * cellW) + padX
      const y0 = Math.floor(row * cellH) + padY
      const x1 = Math.floor((col + 1) * cellW) - padX
      const y1 = Math.floor((row + 1) * cellH) - padY

      // Sample every 3rd pixel for speed while retaining statistical accuracy
      const step = 3
      let sum = 0
      let count = 0
      const values = []

      for (let py = y0; py < y1; py += step) {
        for (let px = x0; px < x1; px += step) {
          const i = (py * width + px) * 4
          // BT.601 luminance
          const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114
          sum += gray
          values.push(gray)
          count++
        }
      }

      if (count === 0) {
        cells.push({ filled: false, variance: 0, confidence: 0 })
        continue
      }

      const mean = sum / count
      let sqSum = 0
      for (let k = 0; k < values.length; k++) {
        const d = values[k] - mean
        sqSum += d * d
      }
      const variance = sqSum / count

      cells.push({
        filled: variance > VARIANCE_THRESHOLD,
        variance,
        confidence: Math.min(1, variance / (VARIANCE_THRESHOLD * 2)),
      })
    }
  }

  return cells
}

self.addEventListener('message', (e) => {
  const { type, pixelBuffer, width, height, gridCols, gridRows } = e.data
  if (type !== 'PROCESS_FRAME') return

  const t0 = performance.now()
  const cells = analyzeFrame({ pixelBuffer, width, height, gridCols, gridRows })
  const processingMs = +(performance.now() - t0).toFixed(2)

  self.postMessage({ type: 'FRAME_RESULT', cells, processingMs })
})

self.postMessage({ type: 'READY' })
