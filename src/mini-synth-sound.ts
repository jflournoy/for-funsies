/**
 * Playable WebAudio Micro-Synth for DARE 005.
 *
 * Emits pleasant, non-blocking pentatonic chime tones when interacting with relay buttons.
 * Pure native Web Audio API, zero dependencies.
 */

export function initMiniSynthSound(): void {
  const container = document.querySelector<HTMLElement>("#mini-synth");
  if (!container) return;

  const playBtn = container.querySelector<HTMLButtonElement>("#synth-play-btn");
  const scaleSelect = container.querySelector<HTMLSelectElement>("#synth-scale");
  const statusEl = container.querySelector<HTMLElement>("#synth-status");

  if (!playBtn || !statusEl) return;

  let audioCtx: AudioContext | null = null;
  const PENTATONIC_FREQS = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C4, D4, E4, G4, A4, C5

  function playTone(freq: number, duration = 0.3): void {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext unavailable or disabled — graceful fallback
    }
  }

  playBtn.addEventListener("click", () => {
    const freq = PENTATONIC_FREQS[Math.floor(Math.random() * PENTATONIC_FREQS.length)] ?? 440.0;
    playTone(freq, 0.4);
    statusEl.textContent = `Emitted chime at ${freq.toFixed(1)} Hz · Pentatonic Resonance`;
  });
}
