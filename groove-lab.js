class GrooveLab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.ctx = null;
    this.buffer = null;
    this.source = null;
  }

  async connectedCallback() {
    console.log('[Groove-Lab] connected');

    this.shadowRoot.innerHTML = `
      <style>
        button { margin:4px; padding:6px 12px; font:14px sans-serif; }
      </style>
      <button id="play">▶ Play Clave</button>
      <button id="stop">⏹ Stop</button>
    `;

    const boot = () =>
      (this.ctx ||= new (window.AudioContext || window.webkitAudioContext)());

    // ✅ Use your actual file name and casing
    const url = 'https://kumbengo.github.io/groove-lab/Clave.wav';

    try {
      console.log('[Groove-Lab] fetching:', url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = await boot().decodeAudioData(arrayBuffer);
      this.buffer = buffer;
      console.log('[Groove-Lab] audio loaded');
    } catch (err) {
      console.error('[Groove-Lab] failed to load audio:', err);
    }

    const play = () => {
      if (!this.buffer) {
        console.warn('[Groove-Lab] buffer not ready');
        return;
      }

      const ctx = boot();
      const source = ctx.createBufferSource();
      source.buffer = this.buffer;
      source.loop = true;
      source.connect(ctx.destination);
      source.start();
      this.source = source;
      console.log('[Groove-Lab] playback started');
    };

    const stop = () => {
      if (this.source) {
        this.source.stop();
        this.source.disconnect();
        this.source = null;
        console.log('[Groove-Lab] playback stopped');
      }
    };

    this.shadowRoot.getElementById('play').onclick = play;
    this.shadowRoot.getElementById('stop').onclick = stop;
  }
}

customElements.define('groove-lab', GrooveLab);
