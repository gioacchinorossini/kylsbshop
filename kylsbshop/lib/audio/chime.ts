/**
 * Synthesizes a pleasant modern POS order chime using the Web Audio API.
 * Works natively in all modern browsers without requiring any external mp3/wav files.
 */
export function playOrderChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Dual-tone harmonic chime
    const tones = [
      { freq: 659.25, start: 0.00, duration: 0.35 }, // E5
      { freq: 880.00, start: 0.10, duration: 0.50 }, // A5
      { freq: 1318.51, start: 0.22, duration: 0.65 }, // E6
    ];

    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.debug('POS chime audio prevented:', err);
  }
}
