<script>
class GrooveLab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.ctx = null;
    this.bufferClave = null;
    this.bufferA = null;
    this.sourceClave = null;
    this.sourceA = null;
  }

  async connectedCallback() {
    console.log('[Groove-Lab] connected');

    this.shadowRoot.innerHTML = `
      <style>
        button { margin:4px; padding:6px 12px; font:14px sans-serif; }
      </style>
      <button id="play">▶ Play Clave</button>
      <button id="stop">⏹ Stop</button>
      <button id="playA">▶ Play Pattern A</button>
    `;

    const boot = () =>
      (this.ctx ||= new (window.AudioContext || window.webkitAudioContext)());

    // File URLs
    const urlClave = 'https://kumbengo.github.io/groove-lab/Clave.wav';
    const urlA = 'https://kumbengo.github.io/groove-lab/AfroPerc1.wav';

    // Load Clave
    try {
      const resClave = await fetch(urlClave);
      const abClave = await resClave.arrayBuffer();
      this.bufferClave = await boot().decodeAudioData(abClave);
      console.log('[Groove-Lab] Clave loaded');
    } catch (err) {
      console.error('[Groove-Lab] Failed to load Clave:', err);
    }

    // Load Pattern A
    try {
      const resA = await fetch(urlA);
      const abA = await resA.arrayBuffer();
      this.bufferA = await boot().decodeAudioData(abA);
      console.log('[Groove-Lab] Pattern A loaded');
    } catch (err) {
      console.error('[Groove-Lab] Failed to load Pattern A:', err);
    }

    const playClave = () => {
      if (!this.bufferClave) return;
      const ctx = boot();
      const source = ctx.createBufferSource();
      source.buffer = this.bufferClave;
      source.loop = true;
      source.connect(ctx.destination);
      source.start();
      this.sourceClave = source;
      console.log('[Groove-Lab] Clave playing');
    };

    const stopClave = () => {
      if (this.sourceClave) {
        this.sourceClave.stop();
        this.sourceClave.disconnect();
        this.sourceClave = null;
        console.log('[Groove-Lab] Clave stopped');
      }
    };

    const playPatternA = () => {
      if (!this.bufferA) return;
      const ctx = boot();
      const source = ctx.createBufferSource();
      source.buffer = this.bufferA;
      source.loop = true;
      source.connect(ctx.destination);
      source.start();
      this.sourceA = source;
      console.log('[Groove-Lab] Pattern A playing');
    };

    this.shadowRoot.getElementById('play').onclick = playClave;
    this.shadowRoot.getElementById('stop').onclick = stopClave;
    this.shadowRoot.getElementById('playA').onclick = playPatternA;
  }
}

customElements.define('groove-lab', GrooveLab);
</script>
