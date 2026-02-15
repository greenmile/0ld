import './style.css'
import gsap from 'gsap'
import SplitType from 'split-type'
import { ensureAudio, startLoop } from './audio.js'

// Start background beat on first user interaction
const startAudio = () => {
  ensureAudio()
  startLoop()
  document.removeEventListener('click', startAudio)
  document.removeEventListener('keydown', startAudio)
  document.removeEventListener('touchstart', startAudio)
}
document.addEventListener('click', startAudio)
document.addEventListener('keydown', startAudio)
document.addEventListener('touchstart', startAudio)

document.fonts.ready.then(() => {
  const brandEl = document.getElementById('brand')
  const brandChars = brandEl.querySelectorAll('.brand-char')
  const heroEl = document.getElementById('hero')
  const heroLines = heroEl.querySelectorAll('.hero-line')
  const keywordEls = document.querySelectorAll('.keyword')

  if (!brandEl || !heroEl || !keywordEls.length) return

  // Split hero lines into chars
  const splits = Array.from(heroLines).map(
    (line) => new SplitType(line, { types: 'chars' })
  )
  const allHeroChars = splits.flatMap((s) => s.chars)

  // ── Initial state ──
  gsap.set(brandEl, { opacity: 1 })
  gsap.set(brandChars, { opacity: 0, scale: 0.8 })
  gsap.set(heroEl, { opacity: 1 })
  gsap.set(allHeroChars, { opacity: 0, y: 50 })
  gsap.set(keywordEls, { opacity: 0, scale: 0.85, filter: 'blur(14px)' })

  // ── Master timeline ──
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power3.out' } })

  // ▸ Phase 1: Reveal "ØLD"
  tl.to(brandChars, {
    opacity: 1,
    scale: 1,
    duration: 0.8,
    stagger: 0.12,
    ease: 'back.out(1.5)',
  })

  // Hold
  tl.to({}, { duration: 2 })

  // ▸ Phase 2: ØLD → ZERO / LIMIT / DESIGN
  tl.to(brandEl, {
    opacity: 0,
    scale: 0.7,
    filter: 'blur(8px)',
    duration: 0.5,
    ease: 'power2.in',
  })

  splits.forEach((split, i) => {
    tl.to(
      split.chars,
      {
        opacity: 1,
        y: 0,
        stagger: 0.04,
        duration: 0.7,
        ease: 'power3.out',
      },
      i === 0 ? '-=0.15' : '-=0.4',
    )
  })

  // Hold
  tl.to({}, { duration: 2.5 })

  // ▸ Phase 3: Exit
  tl.to(allHeroChars, {
    opacity: 0,
    y: -40,
    stagger: 0.012,
    duration: 0.5,
    ease: 'power2.in',
  })

  // ▸ Phase 4: Keywords
  keywordEls.forEach((kw) => {
    tl.fromTo(
      kw,
      { opacity: 0, scale: 0.85, filter: 'blur(14px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'expo.out' },
    )
    tl.to({}, { duration: 1.6 })
    tl.to(kw, {
      opacity: 0,
      scale: 1.05,
      filter: 'blur(18px)',
      duration: 0.5,
      ease: 'power2.in',
    })
  })

  // ▸ Phase 5: Reset
  tl.to({}, { duration: 0.6 })
  tl.set(brandEl, { opacity: 1, scale: 1, filter: 'blur(0px)' })
  tl.set(brandChars, { opacity: 0, scale: 0.8 })
  tl.set(allHeroChars, { y: 50, opacity: 0 })
})
