const soundPreferenceKey = "rrims.settings.sounds";
const soundPreferenceEvent = "rrims:sound-preference-changed";

export type ToneKind = "ring" | "success" | "error" | "notification";

export function isSoundEnabled() {
  return window.localStorage.getItem(soundPreferenceKey) !== "false";
}

export function setSoundEnabled(enabled: boolean) {
  window.localStorage.setItem(soundPreferenceKey, String(enabled));
  window.dispatchEvent(new CustomEvent(soundPreferenceEvent, { detail: enabled }));
}

export function onSoundPreferenceChanged(callback: (enabled: boolean) => void) {
  function onChanged(event: Event) {
    callback(Boolean((event as CustomEvent<boolean>).detail));
  }

  window.addEventListener(soundPreferenceEvent, onChanged);
  return () => window.removeEventListener(soundPreferenceEvent, onChanged);
}

export function playTone(kind: ToneKind = "success") {
  if (!isSoundEnabled()) return;

  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(kind === "notification" ? 0.055 : 0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (kind === "ring" ? 0.72 : 0.55));
  gain.connect(context.destination);

  const frequencies =
    kind === "ring"
      ? [660, 880, 660, 880]
      : kind === "error"
        ? [220, 180]
        : kind === "notification"
          ? [784, 1047]
          : [523, 659, 784];

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = kind === "ring" || kind === "notification" ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    const start = context.currentTime + index * (kind === "notification" ? 0.12 : 0.16);
    oscillator.start(start);
    oscillator.stop(start + (kind === "notification" ? 0.1 : 0.14));
  });

  window.setTimeout(() => void context.close(), kind === "ring" ? 1100 : 900);
}
