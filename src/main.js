import './style.css'
import gsap from 'gsap'
import SplitType from 'split-type'
import { ensureAudio, startLoop, stopLoop } from './audio.js'

// ═══════════════════════════════════════════
//  fitText — measure, don't guess
// ═══════════════════════════════════════════

function fitText(el, targetWidth, { min = 16, max = 500 } = {}) {
  let lo = min
  let hi = max
  const prevVis = el.style.visibility
  el.style.visibility = 'hidden'
  el.style.position = 'absolute'
  el.style.whiteSpace = 'nowrap'

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    el.style.fontSize = mid + 'px'
    if (el.scrollWidth > targetWidth) hi = mid
    else lo = mid
  }

  el.style.fontSize = lo + 'px'
  el.style.visibility = prevVis
  el.style.position = ''
}

function fitAllText() {
  const stage = document.querySelector('.stage')
  if (!stage) return
  const available = stage.clientWidth - 48

  // Brand "ØLD"
  const brand = document.getElementById('brand')
  if (brand) fitText(brand, available * 0.8)

  // Mnemonic letters
  document.querySelectorAll('.mnemonic-letter').forEach((el) => {
    fitText(el, available * 0.5)
  })

  // Mnemonic words
  document.querySelectorAll('.mnemonic-word').forEach((el) => {
    fitText(el, available * 0.85)
  })

  // Hero lines
  // We need to ensure they fit BOTH width (almost full) AND height (all 3 lines must fit)
  const availableH = stage.clientHeight - 80 // extra padding for vertical
  // 3 lines * 0.88 line-height = ~2.64 unit height. 
  // We limit max font size so total height < availableH.
  const maxFontSizeH = availableH / 2.7

  document.querySelectorAll('.hero-line').forEach((line) => {
    // Use 1.0 (full available width minus padding) to align them "block-style"
    fitText(line, available * 1.0, { max: maxFontSizeH })
  })

  // Keywords — 85% of available space
  document.querySelectorAll('.keyword').forEach((kw) => {
    fitText(kw, available * 0.85)
  })
}

// ═══════════════════════════════════════════
//  Audio
// ═══════════════════════════════════════════

let musicStarted = false
let musicPlaying = false
const toggleBtn = document.getElementById('music-toggle')

function toggleMusic() {
  if (!musicStarted) {
    ensureAudio()
    startLoop()
    musicStarted = true
    musicPlaying = true
    toggleBtn.classList.remove('muted')
    // Remove the other listeners since we've started via button
    document.removeEventListener('click', firstInteraction)
    document.removeEventListener('keydown', firstInteraction)
    document.removeEventListener('touchstart', firstInteraction)
  } else if (musicPlaying) {
    stopLoop()
    musicPlaying = false
    toggleBtn.classList.add('muted')
  } else {
    startLoop()
    musicPlaying = true
    toggleBtn.classList.remove('muted')
  }
}

toggleBtn.addEventListener('click', toggleMusic)

// Also allow starting via any click (existing behavior)
const firstInteraction = () => {
  if (!musicStarted) {
    ensureAudio()
    startLoop()
    musicStarted = true
    musicPlaying = true
    toggleBtn.classList.remove('muted')
  }
  document.removeEventListener('click', firstInteraction)
  document.removeEventListener('keydown', firstInteraction)
  document.removeEventListener('touchstart', firstInteraction)
}
document.addEventListener('click', firstInteraction)
document.addEventListener('keydown', firstInteraction)
document.addEventListener('touchstart', firstInteraction)

// ═══════════════════════════════════════════
//  Animation
// ═══════════════════════════════════════════

document.fonts.ready.then(() => {
  const heroEl = document.getElementById('hero')
  const heroLines = heroEl.querySelectorAll('.hero-line')
  const keywordEls = document.querySelectorAll('.keyword')

  // Mnemonic elements
  const mnemonics = [
    document.getElementById('mnemonic-0'),
    document.getElementById('mnemonic-l'),
    document.getElementById('mnemonic-d'),
  ]
  const letters = mnemonics.map((m) => m.querySelector('.mnemonic-letter'))
  const words = mnemonics.map((m) => m.querySelector('.mnemonic-word'))

  if (!heroEl) return

  // Fit text to viewport
  fitAllText()
  window.addEventListener('resize', fitAllText)

  // Split hero lines into chars
  const splits = Array.from(heroLines).map(
    (line) => new SplitType(line, { types: 'chars' })
  )
  const allHeroChars = splits.flatMap((s) => s.chars)

  // ── Initial state ──
  mnemonics.forEach((m) => gsap.set(m, { opacity: 1 }))
  letters.forEach((l) => gsap.set(l, { opacity: 0, scale: 0.6 }))
  words.forEach((w) => gsap.set(w, { opacity: 0, scale: 0.9, filter: 'blur(10px)' }))
  gsap.set(heroEl, { opacity: 1 })
  gsap.set(allHeroChars, { opacity: 0, y: 50 })
  gsap.set(keywordEls, { opacity: 0, scale: 0.85, filter: 'blur(14px)' })

  // ── Master timeline ──
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power3.out' } })

  // ▸ PHASE 1: Mnemonic drill — 0 → ZERO, L → LIMIT, D → DESIGN
  const wordLabels = ['ZERO', 'LIMIT', 'DESIGN']
  mnemonics.forEach((m, i) => {
    const letter = letters[i]
    const word = words[i]

    // Show the single letter, big and bold
    tl.to(letter, {
      opacity: 1, scale: 1,
      duration: 0.6, ease: 'back.out(2)',
    })

    // Hold the letter
    tl.to({}, { duration: 0.8 })

    // Cross-fade: letter shrinks out, word reveals
    tl.to(letter, {
      opacity: 0, scale: 1.3, filter: 'blur(6px)',
      duration: 0.4, ease: 'power2.in',
    })
    tl.to(word, {
      opacity: 1, scale: 1, filter: 'blur(0px)',
      duration: 0.6, ease: 'expo.out',
    }, '-=0.2')

    // Hold the word
    tl.to({}, { duration: 1 })

    // Fade out the word
    tl.to(word, {
      opacity: 0, scale: 0.95, filter: 'blur(8px)',
      duration: 0.4, ease: 'power2.in',
    })

    // Reset this mnemonic for next loop
    if (i < mnemonics.length - 1) {
      tl.to({}, { duration: 0.3 })
    }
  })

  tl.to({}, { duration: 0.5 })

  // ▸ PHASE 2: Keywords — WEB DESIGN, AI, BRANDING
  keywordEls.forEach((kw) => {
    tl.fromTo(
      kw,
      { opacity: 0, scale: 0.85, filter: 'blur(14px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'expo.out' },
    )
    tl.to({}, { duration: 1.6 })
    tl.to(kw, {
      opacity: 0, scale: 1.05, filter: 'blur(18px)',
      duration: 0.5, ease: 'power2.in',
    })
  })

  tl.to({}, { duration: 0.4 })

  // ▸ PHASE 3: Grand finale — stacked ZERO / LIMIT / DESIGN
  splits.forEach((split, i) => {
    tl.to(split.chars, {
      opacity: 1, y: 0,
      stagger: 0.04, duration: 0.7, ease: 'power3.out',
    }, i === 0 ? undefined : '-=0.4')
  })

  tl.to({}, { duration: 3 })

  // Exit
  tl.to(allHeroChars, {
    opacity: 0, y: -40,
    stagger: 0.012, duration: 0.5, ease: 'power2.in',
  })

  // ▸ RESET for loop
  tl.to({}, { duration: 0.8 })
  letters.forEach((l) => tl.set(l, { opacity: 0, scale: 0.6, filter: 'none' }))
  words.forEach((w) => tl.set(w, { opacity: 0, scale: 0.9, filter: 'blur(10px)' }))
  tl.set(allHeroChars, { y: 50, opacity: 0 })
})
