/**
 * Web Audio API Synthesizer & SpeechSynthesis Audio System
 * Zero external audio files required. Runs 100% offline and in all modern browsers.
 */
class BingoAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('bingo_muted') === 'true';
    this.voiceEnabled = localStorage.getItem('bingo_voice') !== 'false'; // default true
    this.selectedVoice = null;
    this.initVoices();
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  initVoices() {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a clear English voice
      this.selectedVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('bingo_muted', this.isMuted);
    return this.isMuted;
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    localStorage.setItem('bingo_voice', this.voiceEnabled);
    return this.voiceEnabled;
  }

  // Synthesized tactile daub stamp sound
  playDaub() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playUnDaub() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Pleasant bell chime when a ball is drawn
  playBallDraw() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Chime chord [C5, G5, C6]
    const freqs = [523.25, 783.99, 1046.50];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.18, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.5);
    });
  }

  // Tense chord when 1 away from Bingo
  playNearBingo() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A Major sparkle
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0.2, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.4);
    });
  }

  // Grand celebratory fanfare on BINGO win
  playWinFanfare() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Triumphant fanfare notes: C4, G4, C5, E5, G5, C6 (extended arpeggio)
    const melody = [
      { freq: 261.63, delay: 0.00, dur: 0.15 },
      { freq: 329.63, delay: 0.12, dur: 0.15 },
      { freq: 392.00, delay: 0.24, dur: 0.15 },
      { freq: 523.25, delay: 0.38, dur: 0.25 },
      { freq: 659.25, delay: 0.60, dur: 0.15 },
      { freq: 783.99, delay: 0.75, dur: 0.20 },
      { freq: 1046.50, delay: 0.98, dur: 0.80 }
    ];

    melody.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.delay);

      gain.gain.setValueAtTime(0.3, now + note.delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.delay);
      osc.stop(now + note.delay + note.dur + 0.05);
    });
  }

  // Gentle buzzer if false bingo
  playError() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.15].forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now + t);

      gain.gain.setValueAtTime(0.2, now + t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + 0.12);
    });
  }

  // Reaction pop
  playReaction() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Natural Speech caller: "B 12", "Free Space", "I 24"
  speakBall(label) {
    if (this.isMuted || !this.voiceEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // cancel pending speech

    let textToSpeak = label;
    // Format "B-12" to "B, 12" for clear pronunciation
    if (label && label.includes('-')) {
      const parts = label.split('-');
      textToSpeak = `${parts[0]}... ${parts[1]}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    window.speechSynthesis.speak(utterance);
  }
}

window.bingoAudio = new BingoAudio();
