/**
 * Monopoly: Kerala Edition - Audio & Malayalam Dialogue Manager
 * Combines Web Audio sound synthesizer with Malayalam cinema dialogue system,
 * captions, speech synthesis, and audio preferences.
 */

class MalluMonopolyAudio {
  constructor() {
    this.audioCtx = null;
    this.sfxEnabled = true;
    this.dialogueEnabled = true;
    this.sfxVolume = 0.8;
    this.dialogueVolume = 0.9;
    this.recentDialogues = new Set();
    this.captionTimeout = null;

    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('mallu_monopoly_audio_prefs');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.sfxEnabled !== undefined) this.sfxEnabled = p.sfxEnabled;
        if (p.dialogueEnabled !== undefined) this.dialogueEnabled = p.dialogueEnabled;
        if (p.sfxVolume !== undefined) this.sfxVolume = p.sfxVolume;
        if (p.dialogueVolume !== undefined) this.dialogueVolume = p.dialogueVolume;
      }
    } catch (e) {
      // Ignore
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('mallu_monopoly_audio_prefs', JSON.stringify({
        sfxEnabled: this.sfxEnabled,
        dialogueEnabled: this.dialogueEnabled,
        sfxVolume: this.sfxVolume,
        dialogueVolume: this.dialogueVolume
      }));
    } catch (e) {
      // Ignore
    }
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Web Audio Synthesizer for Clean Sound Effects
  playTone(freq, type = 'sine', duration = 0.2, gainVal = 0.2, delay = 0) {
    if (!this.sfxEnabled) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const startTime = this.audioCtx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      const effectiveGain = gainVal * this.sfxVolume;
      gain.gain.setValueAtTime(effectiveGain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      // Fallback silent
    }
  }

  // Sound Effects
  playDiceRoll() {
    if (!this.sfxEnabled) return;
    // Series of quick wooden clicks
    for (let i = 0; i < 6; i++) {
      const freq = 180 + Math.random() * 120;
      this.playTone(freq, 'triangle', 0.04, 0.25, i * 0.05);
    }
    // Landing thud
    this.playTone(110, 'sine', 0.12, 0.4, 0.32);
  }

  playCash() {
    if (!this.sfxEnabled) return;
    // Pleasant coin cash chime
    this.playTone(987.77, 'sine', 0.1, 0.2, 0);     // B5
    this.playTone(1318.51, 'sine', 0.25, 0.3, 0.08); // E6
  }

  playRentPaid() {
    if (!this.sfxEnabled) return;
    // Descending cash deduction
    this.playTone(523.25, 'triangle', 0.12, 0.3, 0);
    this.playTone(392.00, 'triangle', 0.18, 0.35, 0.1);
  }

  playPurchase() {
    if (!this.sfxEnabled) return;
    // Triumphant deed stamp
    this.playTone(440, 'triangle', 0.1, 0.25, 0);
    this.playTone(554.37, 'triangle', 0.12, 0.3, 0.08);
    this.playTone(659.25, 'triangle', 0.25, 0.35, 0.16);
  }

  playJail() {
    if (!this.sfxEnabled) return;
    // Heavy metal door slam
    this.playTone(160, 'sawtooth', 0.2, 0.4, 0);
    this.playTone(90, 'square', 0.35, 0.45, 0.12);
  }

  playCardDraw() {
    if (!this.sfxEnabled) return;
    this.playTone(784, 'sine', 0.08, 0.2, 0);
    this.playTone(1046.5, 'sine', 0.18, 0.25, 0.06);
  }

  playAuctionGavel() {
    if (!this.sfxEnabled) return;
    this.playTone(220, 'square', 0.06, 0.35, 0);
    this.playTone(140, 'sine', 0.15, 0.4, 0.05);
  }

  playVictory() {
    if (!this.sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, idx) => {
      this.playTone(f, 'triangle', 0.25, 0.35, idx * 0.12);
    });
    this.playTone(1046.50, 'sine', 0.6, 0.45, 0.5);
  }

  playBankruptcy() {
    if (!this.sfxEnabled) return;
    this.playTone(392.00, 'sawtooth', 0.25, 0.3, 0);
    this.playTone(369.99, 'sawtooth', 0.25, 0.3, 0.2);
    this.playTone(349.23, 'sawtooth', 0.45, 0.35, 0.4);
  }

  // Trigger Malayalam Cinema Dialogue Reaction
  triggerDialogue(category, customSpeaker = null) {
    if (!this.dialogueEnabled) return null;
    const config = window.MALLU_MONOPOLY_CONFIG;
    if (!config || !config.dialogues || !config.dialogues[category]) return null;

    const list = config.dialogues[category];
    if (list.length === 0) return null;

    // Filter out recently played to avoid instant repetition
    let candidates = list.filter(d => !this.recentDialogues.has(d.text));
    if (candidates.length === 0) {
      this.recentDialogues.clear();
      candidates = list;
    }

    const item = candidates[Math.floor(Math.random() * candidates.length)];
    this.recentDialogues.add(item.text);
    if (this.recentDialogues.size > 8) {
      const first = this.recentDialogues.values().next().value;
      this.recentDialogues.delete(first);
    }

    this.showDialogueCaption(item, customSpeaker);
    this.speakDialogue(item.text);

    return item;
  }

  // Display High-Visibility Comic Speech Banner
  showDialogueCaption(dialogueItem, speaker = null) {
    const banner = document.getElementById('monopoly-dialogue-banner');
    const textEl = document.getElementById('monopoly-dialogue-text');
    const subEl = document.getElementById('monopoly-dialogue-sub');
    const speakerEl = document.getElementById('monopoly-dialogue-speaker');

    if (!banner || !textEl) return;

    if (this.captionTimeout) {
      clearTimeout(this.captionTimeout);
    }

    const movieCredit = dialogueItem.movie ? `🎬 ${dialogueItem.movie}` : '';
    const actorCredit = dialogueItem.actor ? ` (${dialogueItem.actor})` : '';

    if (speakerEl) {
      speakerEl.textContent = speaker ? `${speaker}` : '🌴 Kerala Dialogue';
    }
    textEl.textContent = `"${dialogueItem.text}"`;
    if (subEl) {
      subEl.textContent = `${movieCredit}${actorCredit}`;
    }

    banner.classList.add('active');

    // Auto hide after 4.8 seconds
    this.captionTimeout = setTimeout(() => {
      banner.classList.remove('active');
    }, 4800);
  }

  // Web Speech synthesis voice playback (optional fallback)
  speakDialogue(text) {
    if (!this.dialogueEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.dialogueVolume;
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      // Try to find Malayalam or Indian English voice
      const preferred = voices.find(v => v.lang.includes('ml') || v.lang.includes('IN') || v.lang.includes('en-IN'));
      if (preferred) {
        utterance.voice = preferred;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // SpeechSynthesis silently skipped if unsupported
    }
  }
}

window.malluMonopolyAudio = new MalluMonopolyAudio();
