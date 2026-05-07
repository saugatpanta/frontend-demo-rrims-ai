export function playTone(kind: "ring" | "success" | "error" = "success") {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.55);
  gain.connect(context.destination);

  const frequencies =
    kind === "ring" ? [660, 880, 660] : kind === "error" ? [220, 180] : [523, 659, 784];

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = kind === "ring" ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    const start = context.currentTime + index * 0.16;
    oscillator.start(start);
    oscillator.stop(start + 0.14);
  });

  window.setTimeout(() => void context.close(), 900);
}
