export default class Sound {
  constructor(audioCtx, gainNode, frequency) {
    this.audioCtx = audioCtx;
    this.frequency = Math.max(frequency, 0);
    this.gainNode = gainNode;
    this.gainNode.connect(this.audioCtx.destination);
  }

  play() {
    if (this.frequency > 24000) {
      return;
    }

    var oscillator = this.audioCtx.createOscillator();

    oscillator.type = "square";
    oscillator.frequency.value = this.frequency; // value in hertz
    oscillator.connect(this.gainNode);
    oscillator.start(this.audioCtx.currentTime);
    oscillator.stop(this.audioCtx.currentTime + 0.1);
  }
}
