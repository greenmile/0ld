// ── Web Audio API Drum Synthesizer & Sequencer ──

let audioCtx = null

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioCtx
}

// ═══════════════════════════════════════════
//  Drum sounds
// ═══════════════════════════════════════════

/** Kick drum — tight, punchy MJ-style */
function kick({ volume = 0.7, pitch = 160, decay = 0.25, punch = 0.8 } = {}) {
    const ctx = getCtx()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(pitch, now)
    osc.frequency.exponentialRampToValueAtTime(35, now + decay * 0.7)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + decay + 0.05)

    if (punch > 0) {
        const click = ctx.createOscillator()
        click.type = 'square'
        click.frequency.setValueAtTime(600, now)
        click.frequency.exponentialRampToValueAtTime(40, now + 0.02)

        const clickGain = ctx.createGain()
        clickGain.gain.setValueAtTime(punch * volume * 0.35, now)
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)

        click.connect(clickGain)
        clickGain.connect(ctx.destination)
        click.start(now)
        click.stop(now + 0.04)
    }
}

/** Hi-hat — crisp metallic tick */
function hihat({ volume = 0.25, open = false } = {}) {
    const ctx = getCtx()
    const now = ctx.currentTime
    const decay = open ? 0.18 : 0.04

    const bufferSize = ctx.sampleRate * decay
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 8000

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(now)
}

/** Finger snap — for ghost accents (MJ signature) */
function snap({ volume = 0.2 } = {}) {
    const ctx = getCtx()
    const now = ctx.currentTime

    const bufferSize = ctx.sampleRate * 0.06
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 5000
    filter.Q.value = 2

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(now)
}

// ═══════════════════════════════════════════
//  Sequencer — "Billie Jean" inspired groove
// ═══════════════════════════════════════════

const BPM = 116 // Billie Jean tempo
const STEPS = 16

// Classic MJ four-on-the-floor with funky hi-hat pattern
const pattern = {
    //        1 . . .  2 . . .  3 . . .  4 . . .
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],  // four-on-the-floor
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],  // straight 8ths
    openHH: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],  // off-beat open hats
    snap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],  // finger snaps on 2 & 4
}

let loopTimer = null
let currentStep = 0
let isPlaying = false

function playStep() {
    const vol = 0.4

    if (pattern.kick[currentStep])
        kick({ volume: vol, pitch: 150, decay: 0.22, punch: 0.7 })

    if (pattern.openHH[currentStep])
        hihat({ volume: vol * 0.5, open: true })
    else if (pattern.hihat[currentStep])
        hihat({ volume: vol * 0.4 })

    if (pattern.snap[currentStep])
        snap({ volume: vol * 0.5 })

    currentStep = (currentStep + 1) % STEPS
}

/** Start the background drum loop */
export function startLoop() {
    if (isPlaying) return
    isPlaying = true
    currentStep = 0
    const stepDuration = (60 / BPM / 4) * 1000
    loopTimer = setInterval(playStep, stepDuration)
}

/** Stop the background drum loop */
export function stopLoop() {
    if (!isPlaying) return
    isPlaying = false
    clearInterval(loopTimer)
    loopTimer = null
}

/** Resume AudioContext */
export function ensureAudio() {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
}
