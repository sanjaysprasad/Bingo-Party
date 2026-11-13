/**
 * Monopoly: Kerala Edition - Silent Audio Stub
 * Temporarily disables audio manager and Malayalam speech synthesis
 * as requested ("remove the current audio setup we shall add it later").
 */

class MalluMonopolyAudio {
  constructor() {
    this.sfxEnabled = false;
    this.dialogueEnabled = false;
  }

  playDiceRoll() {}
  playCash() {}
  playBuy() {}
  playJail() {}
  playBankruptcy() {}
  playAuction() {}
  playBuild() {}
  playVictory() {}
  triggerDialogue() {}
  loadSettings() {}
  saveSettings() {}
  setVolume() {}
  toggleMute() { return true; }
}

window.malluMonopolyAudio = new MalluMonopolyAudio();
