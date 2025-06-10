/*  Groove‑Lab.js — super‑minimal oscillator demo  */
class GrooveLab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    /* instance vars */
    this.ctx  = null;   // AudioContext, created lazily
    this.osc  = null;   // OscillatorNode
    this.gain = null;   // GainNode so we can set volume
  }

  connectedCallback() {
    console.log('[Groove‑Lab] connected to DOM');

    /* put two buttons inside the shadow DOM */
    this.shadowRoot.innerHTML = `
      <style>
        button{margin:4px;padding:6px 12px;font:14px/1 sans-serif;}
      </style>
      <button id="play">Play Tone</button>
      <button id="stop">Stop Tone</button>
    `;

    /* helper: create the AudioContext on first user gesture */
    const boot = () =>
      (this.ctx ||= new (window.AudioContext || window.webkitAudioContext)());

    /* start / stop handlers */
    const play = () => {
      if (this.osc) { console.debug('[Groove‑Lab] oscillator already running'); return; }

      const ctx = boot();                       // 1 | ensure context exists
      this.gain = ctx.createGain();             // 2 | gain so we can control loudness
      this.gain.gain.value = 0.10;              // ‑6 dB so it’s not too hot

      this.osc = ctx.createOscillator();        // 3 | basic tone generator
      this.osc.type = 'sine';                   // simple sine wave
      this.osc.frequency.value = 440;           // A4

      this.osc.connect(this.gain).connect(ctx.destination);
      this.osc.start();
      console.log('[Groove‑Lab] oscillator started (440 Hz)');
    };

    const stop = () => {
      if (!this.osc) return;
      this.osc.stop();                          // halt the tone
      this.osc.disconnect();
      this.osc = null;
      console.log('[Groove‑Lab] oscillator stopped');
    };

    /* wire buttons */
    this.shadowRoot.getElementById('play').onclick = play;
    this.shadowRoot.getElementById('stop').onclick = stop;
  }
}

/* register the custom element (tag name must contain a dash) */
customElements.define('groove-lab', GrooveLab);
