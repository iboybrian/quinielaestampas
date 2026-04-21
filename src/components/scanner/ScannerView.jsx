import { useRef, useEffect, useState, useCallback } from 'react'
import { useReducedMotion } from 'framer-motion'
import Webcam from 'react-webcam'
import {
  X, CheckCircle, Loader2, ChevronDown, ScanLine,
  AlertCircle, ChevronRight, Upload, ImagePlus, RefreshCw,
} from 'lucide-react'
import { TEAMS, SPECIAL_STICKERS, generateTeamStickers } from '../../lib/stickerData'
import Flag from '../ui/Flag'

// ─── Layout ───────────────────────────────────────────────────────────────────
// Page A (left album page) : Badge + Squad + P01-P06  = 8  stickers → 2×4
// Page B (right album page): P07-P16                  = 10 stickers → 2×5
// Special stickers: 10 stickers → 2×5 (single page)
const HALF_CONFIG = {
  A:    { cols: 2, rows: 4 },
  B:    { cols: 2, rows: 5 },
  SPEC: { cols: 2, rows: 5 },
}
const PAGE_A_COUNT = 8

// Mobile: portrait guide frame overlaid on live camera feed
const FRAME_W_RATIO = 0.82
const FRAME_ASPECT  = 1.35   // height = width × 1.35 (single portrait album page)

const CONFIRM_FRAMES = 15    // consecutive positives to confirm (~1 s at 15 fps)
const TARGET_FPS     = 15

// ─── Helpers ─────────────────────────────────────────────────────────────────
function allTeamStickers(teamCode) {
  const team = TEAMS.find((t) => t.code === teamCode)
  if (!team) return []
  return generateTeamStickers(team).map((s) => s.id)
}

function getHalfStickers(teamCode, half) {
  if (teamCode === 'SPEC') return SPECIAL_STICKERS.map((s) => s.id)
  const all = allTeamStickers(teamCode)
  return half === 'A' ? all.slice(0, PAGE_A_COUNT) : all.slice(PAGE_A_COUNT)
}

function getHalfConfig(teamCode, half) {
  if (teamCode === 'SPEC') return HALF_CONFIG.SPEC
  return HALF_CONFIG[half]
}

// Cover-fit geometry: returns draw params so bitmap fills canvas, cropping edges
function coverGeometry(bitmapW, bitmapH, canvasW, canvasH) {
  const scale = Math.max(canvasW / bitmapW, canvasH / bitmapH)
  const sw = bitmapW * scale
  const sh = bitmapH * scale
  return { ox: (canvasW - sw) / 2, oy: (canvasH - sh) / 2, sw, sh }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ScannerView({ onBulkSave, collection = {}, onClose }) {
  const prefersReducedMotion = useReducedMotion()

  // Detect desktop (no touch) once — never changes during session
  const isMobile = useRef(
    typeof navigator !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  ).current

  // ── Refs ────────────────────────────────────────────────────────────────────
  const webcamRef        = useRef(null)   // mobile only
  const overlayCanvasRef = useRef(null)   // mobile: transparent overlay over webcam
  const uploadCanvasRef  = useRef(null)   // desktop: image + overlay in one canvas
  const fileInputRef     = useRef(null)
  const workerRef        = useRef(null)
  const rafRef           = useRef(null)
  const lastTickRef      = useRef(0)
  const workerBusyRef    = useRef(false)
  const imageBitmapRef   = useRef(null)   // desktop: current uploaded bitmap

  // Stable refs consumed inside rAF / worker callbacks
  const colsRef     = useRef(2)
  const rowsRef     = useRef(4)
  const stickersRef = useRef([])
  const countersRef = useRef([])
  // Desktop: cache last cell results so overlay can be redrawn without re-analyzing
  const lastCellsRef = useRef([])

  // ── State ───────────────────────────────────────────────────────────────────
  const [activePage,   setActivePage]   = useState(TEAMS[0].code)
  const [pageHalf,     setPageHalf]     = useState('A')
  const [cameraError,  setCameraError]  = useState(null)
  const [workerReady,  setWorkerReady]  = useState(false)
  const [confirmedIds, setConfirmedIds] = useState([])
  const [isSaving,     setIsSaving]     = useState(false)
  const [savedCount,   setSavedCount]   = useState(0)
  const [fps,          setFps]          = useState(0)
  // Desktop-only
  const [hasImage,     setHasImage]     = useState(false)
  const [isAnalyzing,  setIsAnalyzing]  = useState(false)
  const [isDragging,   setIsDragging]   = useState(false)

  // ── Sync refs when team / page half changes ─────────────────────────────────
  useEffect(() => {
    const half     = activePage === 'SPEC' ? 'SPEC' : pageHalf
    const stickers = getHalfStickers(activePage, half)
    const cfg      = getHalfConfig(activePage, pageHalf)
    colsRef.current     = cfg.cols
    rowsRef.current     = cfg.rows
    stickersRef.current = stickers
    countersRef.current = new Array(stickers.length).fill(0)
    lastCellsRef.current = []
    setConfirmedIds([])
    setSavedCount(0)
  }, [activePage, pageHalf])

  // ── Desktop: re-analyze when team/half changes (if image already loaded) ────
  useEffect(() => {
    if (!isMobile && hasImage && workerReady && imageBitmapRef.current) {
      analyzeDesktopImage(imageBitmapRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, pageHalf])

  // ── Worker init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const worker = new Worker(
      new URL('../../workers/stickerScanner.worker.js', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (e) => {
      const { type, cells, processingMs } = e.data
      if (type === 'READY') { setWorkerReady(true); return }
      if (type !== 'FRAME_RESULT') return

      workerBusyRef.current = false
      setIsAnalyzing(false)
      if (processingMs) setFps(Math.round(1000 / (processingMs + 1000 / TARGET_FPS)))

      const stickers = stickersRef.current
      const counters = countersRef.current

      if (!isMobile) {
        // Static image — confirm immediately (no multi-frame accumulation needed)
        cells.forEach((cell, i) => {
          if (i < counters.length) counters[i] = cell.filled ? CONFIRM_FRAMES : 0
        })
      } else {
        // Live camera — incremental confirmation over ~1 s
        cells.forEach((cell, i) => {
          if (i >= counters.length) return
          counters[i] = cell.filled
            ? Math.min(CONFIRM_FRAMES, counters[i] + 1)
            : Math.max(0, counters[i] - 2)
        })
      }

      const confirmed = counters
        .map((c, i) => (c >= CONFIRM_FRAMES ? stickers[i] : null))
        .filter(Boolean)
      setConfirmedIds([...confirmed])

      if (isMobile) {
        drawMobileOverlay(cells)
      } else {
        lastCellsRef.current = cells
        drawDesktopOverlay(cells)
      }
    }

    workerRef.current = worker
    return () => { worker.terminate() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Mobile: canvas overlay drawn over live webcam ───────────────────────────
  const drawMobileOverlay = useCallback((cells) => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return
    const { clientWidth: dW, clientHeight: dH } = canvas
    if (canvas.width !== dW)  canvas.width  = dW
    if (canvas.height !== dH) canvas.height = dH

    const cols = colsRef.current
    const rows = rowsRef.current
    const ctx  = canvas.getContext('2d')
    ctx.clearRect(0, 0, dW, dH)

    const fw = dW * FRAME_W_RATIO
    const fh = fw * FRAME_ASPECT
    const fx = (dW - fw) / 2
    const fy = (dH - fh) / 2

    // Dim outside frame
    ctx.fillStyle = 'rgba(0,0,0,0.50)'
    ctx.fillRect(0, 0, dW, fy)
    ctx.fillRect(0, fy + fh, dW, dH - fy - fh)
    ctx.fillRect(0, fy, fx, fh)
    ctx.fillRect(fx + fw, fy, dW - fx - fw, fh)

    // Corner brackets
    const bs = 20
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 3
    ctx.lineCap = 'square'
    ;[[fx, fy, 1, 1],[fx+fw, fy, -1, 1],[fx, fy+fh, 1, -1],[fx+fw, fy+fh, -1, -1]].forEach(([cx,cy,dx,dy]) => {
      ctx.beginPath(); ctx.moveTo(cx+dx*bs, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy+dy*bs); ctx.stroke()
    })

    // Page label
    if (activePage !== 'SPEC') {
      ctx.fillStyle = 'rgba(245,158,11,0.9)'
      ctx.font = 'bold 11px system-ui'
      ctx.fillText(`PAGE ${pageHalf}`, fx + 6, fy + 14)
    }

    drawCells(ctx, cells, fx, fy, fw, fh, cols, rows)

    // Scan line
    if (!prefersReducedMotion) {
      const scanY = fy + ((performance.now() / 2000) % 1) * fh
      const grad  = ctx.createLinearGradient(0, scanY - 6, 0, scanY + 6)
      grad.addColorStop(0, 'rgba(251,191,36,0)')
      grad.addColorStop(0.5, 'rgba(251,191,36,0.55)')
      grad.addColorStop(1, 'rgba(251,191,36,0)')
      ctx.fillStyle = grad
      ctx.fillRect(fx, scanY - 6, fw, 12)
    }
  }, [prefersReducedMotion, activePage, pageHalf])

  // ── Desktop: image + grid drawn on single canvas ────────────────────────────
  const drawDesktopOverlay = useCallback((cells) => {
    const canvas = uploadCanvasRef.current
    if (!canvas || !imageBitmapRef.current) return

    // Canvas may not be laid out yet — defer one frame
    const dW = canvas.clientWidth
    const dH = canvas.clientHeight
    if (!dW || !dH) {
      requestAnimationFrame(() => drawDesktopOverlay(cells))
      return
    }
    if (canvas.width !== dW)  canvas.width  = dW
    if (canvas.height !== dH) canvas.height = dH

    const cols = colsRef.current
    const rows = rowsRef.current
    const ctx  = canvas.getContext('2d')
    ctx.clearRect(0, 0, dW, dH)

    // Draw image (cover fit — fills canvas, crops edges)
    const bm = imageBitmapRef.current
    const { ox, oy, sw, sh } = coverGeometry(bm.width, bm.height, dW, dH)
    ctx.drawImage(bm, ox, oy, sw, sh)

    // Light tint only — keep image clearly visible
    ctx.fillStyle = 'rgba(0,0,0,0.10)'
    ctx.fillRect(ox, oy, sw, sh)

    // Grid drawn over the full image area
    drawCells(ctx, cells, ox, oy, sw, sh, cols, rows)

    // Page label
    ctx.fillStyle = 'rgba(245,158,11,0.95)'
    ctx.font = 'bold 13px system-ui'
    const half = activePage === 'SPEC' ? 'SPECIAL' : `PAGE ${pageHalf}`
    ctx.fillText(half, ox + 8, oy + 18)
  }, [activePage, pageHalf])

  // ── Shared: draw detection cells ────────────────────────────────────────────
  function drawCells(ctx, cells, fx, fy, fw, fh, cols, rows) {
    const stickers = stickersRef.current
    const counters = countersRef.current
    const cellW = fw / cols
    const cellH = fh / rows

    cells.forEach((cell, i) => {
      if (i >= stickers.length) return
      const col      = i % cols
      const row      = Math.floor(i / cols)
      const x        = fx + col * cellW + 2
      const y        = fy + row * cellH + 2
      const w        = cellW - 4
      const h        = cellH - 4
      const confirmed = (counters[i] ?? 0) >= CONFIRM_FRAMES
      const progress  = Math.min(1, (counters[i] ?? 0) / CONFIRM_FRAMES)

      if (confirmed) {
        ctx.fillStyle   = 'rgba(34,197,94,0.38)'
        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth   = 2
      } else if (cell.filled) {
        ctx.fillStyle   = `rgba(245,158,11,${0.12 + progress * 0.2})`
        ctx.strokeStyle = `rgba(245,158,11,${0.35 + progress * 0.45})`
        ctx.lineWidth   = 1.5
      } else {
        ctx.fillStyle   = 'rgba(239,68,68,0.08)'
        ctx.strokeStyle = 'rgba(239,68,68,0.25)'
        ctx.lineWidth   = 1
      }
      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)

      // Progress arc (confirming cells — mobile path; desktop confirms instantly)
      if (cell.filled && !confirmed && progress > 0) {
        const r = Math.min(w, h) * 0.18
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth   = 2
        ctx.beginPath()
        ctx.arc(x + w/2, y + h/2, r, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * progress)
        ctx.stroke()
      }

      // Check mark for confirmed
      if (confirmed) {
        const s = Math.min(w, h) * 0.18
        const cx2 = x + w/2
        const cy2 = y + h/2
        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth   = 2.5
        ctx.beginPath()
        ctx.moveTo(cx2 - s, cy2)
        ctx.lineTo(cx2 - s*0.2, cy2 + s*0.7)
        ctx.lineTo(cx2 + s, cy2 - s*0.6)
        ctx.stroke()
      }
    })
  }

  // ── Desktop: analyze uploaded image ─────────────────────────────────────────
  const analyzeDesktopImage = useCallback((bitmap) => {
    if (!bitmap || !workerRef.current) return
    // Always reset stuck state before sending a new job
    workerBusyRef.current = false
    setIsAnalyzing(true)

    // Scale to max 1200px wide for analysis; keep aspect ratio
    const MAX = 1200
    const scale = Math.min(1, MAX / bitmap.width)
    const w = Math.floor(bitmap.width * scale)
    const h = Math.floor(bitmap.height * scale)

    const offscreen = new OffscreenCanvas(w, h)
    const ctx2d = offscreen.getContext('2d')
    ctx2d.drawImage(bitmap, 0, 0, w, h)
    const imageData = ctx2d.getImageData(0, 0, w, h)
    const buffer    = imageData.data.buffer

    workerBusyRef.current = true
    // Safety: if worker never responds (e.g. OOM), unfreeze after 8 s
    const safety = setTimeout(() => {
      workerBusyRef.current = false
      setIsAnalyzing(false)
    }, 8000)
    const origOnMessage = workerRef.current.onmessage
    workerRef.current.onmessage = (e) => {
      clearTimeout(safety)
      workerRef.current.onmessage = origOnMessage
      origOnMessage(e)
    }

    workerRef.current.postMessage(
      { type: 'PROCESS_FRAME', pixelBuffer: buffer, width: w, height: h,
        gridCols: colsRef.current, gridRows: rowsRef.current },
      [buffer]
    )
  }, [])

  // ── Desktop: file / drop handlers ───────────────────────────────────────────
  const loadFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const bitmap = await createImageBitmap(file)
    imageBitmapRef.current = bitmap
    // Reset counters so old results don't bleed through
    countersRef.current = new Array(stickersRef.current.length).fill(0)
    setConfirmedIds([])
    setSavedCount(0)
    setHasImage(true)
    analyzeDesktopImage(bitmap)
  }, [analyzeDesktopImage])

  const handleFileInput = (e) => loadFile(e.target.files?.[0])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    loadFile(e.dataTransfer.files?.[0])
  }, [loadFile])

  // ── Mobile: rAF loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMobile || !workerReady) return

    const tick = (timestamp) => {
      rafRef.current = requestAnimationFrame(tick)
      if (timestamp - lastTickRef.current < 1000 / TARGET_FPS) {
        if (!prefersReducedMotion) drawMobileOverlay([])
        return
      }
      if (workerBusyRef.current) return
      const video = webcamRef.current?.video
      if (!video || video.readyState < 2 || !video.videoWidth) return
      lastTickRef.current = timestamp

      const vW = video.videoWidth
      const vH = video.videoHeight
      const fw = Math.floor(vW * FRAME_W_RATIO)
      const fh = Math.floor(fw * FRAME_ASPECT)
      const fx = Math.floor((vW - fw) / 2)
      const fy = Math.max(0, Math.min(Math.floor((vH - fh) / 2), vH - fh))
      const fhc = Math.min(fh, vH - fy)

      const offscreen = new OffscreenCanvas(fw, fhc)
      offscreen.getContext('2d').drawImage(video, fx, fy, fw, fhc, 0, 0, fw, fhc)
      const imageData = offscreen.getContext('2d').getImageData(0, 0, fw, fhc)
      const buffer    = imageData.data.buffer

      workerBusyRef.current = true
      workerRef.current?.postMessage(
        { type: 'PROCESS_FRAME', pixelBuffer: buffer, width: fw, height: fhc,
          gridCols: colsRef.current, gridRows: rowsRef.current },
        [buffer]
      )
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isMobile, workerReady, drawMobileOverlay, prefersReducedMotion])

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!confirmedIds.length) return
    setIsSaving(true)
    const ok = await onBulkSave(confirmedIds)
    setSavedCount(ok !== false ? confirmedIds.length : 0)
    setIsSaving(false)
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isSpec    = activePage === 'SPEC'
  const half      = isSpec ? 'SPEC' : pageHalf
  const stickers  = stickersRef.current.length
    ? stickersRef.current : getHalfStickers(activePage, half)
  const progress  = stickers.length
    ? Math.round((confirmedIds.length / stickers.length) * 100) : 0
  const activeTeam = TEAMS.find((t) => t.code === activePage)
  const teamTotal  = isSpec ? 10 : 18
  const teamSaved  = isSpec ? 0
    : allTeamStickers(activePage).filter((id) => collection[id]?.quantity > 0).length
  const teamPct    = Math.round((teamSaved / teamTotal) * 100)

  // ── Shared header + bottom HUD ───────────────────────────────────────────────
  const header = (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 pt-16 pb-3 bg-gradient-to-b from-black/85 to-transparent pointer-events-none">
      <button onClick={onClose}
        className="pointer-events-auto p-2 rounded-full bg-white/10 text-white flex-shrink-0">
        <X className="w-4 h-4" />
      </button>

      {/* Team selector */}
      <div className="pointer-events-auto relative flex items-center gap-1.5 bg-black/60 border border-white/20 rounded-xl px-2.5 py-1.5 flex-shrink-0">
        {activeTeam && <Flag code={activeTeam.isoCode} size="xs" />}
        <select value={activePage}
          onChange={(e) => { setActivePage(e.target.value); setPageHalf('A') }}
          className="appearance-none bg-transparent text-white text-xs font-bold pr-5 focus:outline-none cursor-pointer max-w-[100px]">
          {TEAMS.map((t) => (
            <option key={t.code} value={t.code} className="bg-slate-900">{t.name}</option>
          ))}
          <option value="SPEC" className="bg-slate-900">Special</option>
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 pointer-events-none" />
      </div>

      {/* Page A / B toggle */}
      {!isSpec && (
        <div className="pointer-events-auto flex rounded-xl overflow-hidden border border-white/15 flex-shrink-0">
          {['A', 'B'].map((h) => (
            <button key={h} onClick={() => setPageHalf(h)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                pageHalf === h ? 'bg-amber-500 text-black' : 'bg-black/60 text-white/50 hover:text-white'
              }`}>
              Pg {h}
            </button>
          ))}
        </div>
      )}

      <div className="ml-auto text-white/70 text-xs font-bold tabular-nums flex-shrink-0">
        {confirmedIds.length}<span className="text-white/35">/{stickers.length}</span>
      </div>
    </div>
  )

  const bottomHud = (
    <div className="absolute bottom-0 left-0 right-0 pb-20 px-4 pt-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
      {/* Team total */}
      {!isSpec && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white/40 text-xs">{activeTeam?.name} total</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400/50 rounded-full transition-all duration-300"
              style={{ width: `${teamPct}%` }} />
          </div>
          <span className="text-white/40 text-xs tabular-nums">{teamSaved}/{teamTotal}</span>
        </div>
      )}

      {/* Page progress */}
      <div className="flex items-center gap-3 mb-3">
        <ScanLine className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/60">{isSpec ? 'Special' : `Page ${pageHalf}`} progress</span>
            <span className="text-white/80 font-bold tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
        {fps > 0 && <span className="text-white/20 text-xs tabular-nums">{fps}fps</span>}
      </div>

      {/* Save + flip */}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={!confirmedIds.length || isSaving}
          className={`pointer-events-auto flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            confirmedIds.length && !isSaving
              ? 'bg-emerald-500 text-white active:scale-95'
              : 'bg-white/10 text-white/30'
          }`}>
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : savedCount > 0 ? (
            <><CheckCircle className="w-4 h-4" /> Saved {savedCount}!</>
          ) : confirmedIds.length > 0 ? (
            <><CheckCircle className="w-4 h-4" /> Save {confirmedIds.length} stickers</>
          ) : (
            <>{isMobile ? 'Align album page in frame' : 'Upload album page photo'}</>
          )}
        </button>

        {!isSpec && (
          <button onClick={() => setPageHalf((h) => h === 'A' ? 'B' : 'A')}
            className="pointer-events-auto px-4 py-3 rounded-2xl bg-white/10 text-white/70 font-bold text-xs flex items-center gap-1 hover:bg-white/15 transition-colors">
            Pg {pageHalf === 'A' ? 'B' : 'A'}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!workerReady && (
        <p className="text-center text-white/40 text-xs mt-2 flex items-center justify-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Initializing scanner…
        </p>
      )}
    </div>
  )

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {header}

      {/* ── Camera view (mobile) ──────────────────────────────────────────── */}
      {isMobile && (
        <div className="relative flex-1 overflow-hidden">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/60 px-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-sm">{cameraError}</p>
              <p className="text-xs text-white/40">Allow camera access in browser settings</p>
            </div>
          ) : (
            <>
              <Webcam ref={webcamRef} audio={false}
                videoConstraints={{ facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }}
                onUserMediaError={(err) => setCameraError(err?.message || 'Camera unavailable')}
                className="absolute inset-0 w-full h-full object-cover" />
              <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full"
                style={{ touchAction: 'none' }} />
            </>
          )}
        </div>
      )}

      {/* ── Upload view (desktop) ────────────────────────────────────────── */}
      {!isMobile && (
        <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-slate-950">
          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={handleFileInput} />

          {hasImage ? (
            /* Image + overlay canvas */
            <div className="relative w-full h-full">
              <canvas ref={uploadCanvasRef} className="w-full h-full"
                style={{ display: 'block' }} />

              {/* Re-upload / re-analyze controls */}
              <div className="absolute top-20 right-4 flex flex-col gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white/70 text-xs font-bold hover:bg-black/80 transition-colors">
                  <ImagePlus className="w-3.5 h-3.5" />
                  Change photo
                </button>
                <button
                  onClick={() => imageBitmapRef.current && analyzeDesktopImage(imageBitmapRef.current)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white/70 text-xs font-bold hover:bg-black/80 transition-colors disabled:opacity-40">
                  {isAnalyzing
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
                    : <><RefreshCw className="w-3.5 h-3.5" /> Re-analyze</>
                  }
                </button>
              </div>
            </div>
          ) : (
            /* Drop zone */
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-4 w-80 h-96 rounded-3xl border-2 border-dashed cursor-pointer transition-all select-none ${
                isDragging
                  ? 'border-amber-400 bg-amber-400/10 scale-105'
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/8'
              }`}
            >
              <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-amber-400/20' : 'bg-white/10'}`}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-amber-400' : 'text-white/50'}`} />
              </div>
              <div className="text-center px-4">
                <p className="text-white font-bold text-sm mb-1">Upload album page photo</p>
                <p className="text-white/40 text-xs">Drag & drop or click to browse</p>
                <p className="text-white/25 text-xs mt-3">
                  Take a portrait photo of ONE album page<br />
                  (not both pages together) then upload
                </p>
              </div>
              {activeTeam && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                  <Flag code={activeTeam.isoCode} size="sm" />
                  <span className="text-white/60 text-xs font-bold">
                    {activeTeam.name} — Page {pageHalf}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {bottomHud}
    </div>
  )
}
