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
      <!-- Clave Controls -->
      <button id="play-clave">▶ Play Clave</button>
      <button id="stop-clave">⏹ Stop Clave</button>
      <!-- Pattern A Controls -->
      <button id="play-A">▶ Play Pattern A</button>
      <button id="stop-A">⏹ Stop Pattern A</button>
    `;

    const boot = () =>
      (this.ctx ||= new (window.AudioContext || window.webkitAudioContext)());

    // File URLs
    const urlClave = 'https://kumbengo.github.io/groove-lab/Clave.wav';
    const urlA     = 'https://kumbengo.github.io/groove-lab/AfroPerc1.wav';

    // Load Clave
    try {
      console.log('[Groove-Lab] fetching Clave:', urlClave);
      const res = await fetch(urlClave);
      const arrayBuffer = await res.arrayBuffer();
      this.bufferClave = await boot().decodeAudioData(arrayBuffer);
      console.log('[Groove-Lab] Clave loaded');
    } catch (err) {
      console.error('[Groove-Lab] failed to load Clave:', err);
    }

    // Load Pattern A
    try {
      console.log('[Groove-Lab] fetching Pattern A:', urlA);
      const resA = await fetch(urlA);
      const abA = await resA.arrayBuffer();
      this.bufferA = await boot().decodeAudioData(abA);
      console.log('[Groove-Lab] Pattern A loaded');
    } catch (err) {
      console.error('[Groove-Lab] failed to load Pattern A:', err);
    }

    // Clave play/stop
    const playClave = () => {
      if (!this.bufferClave) return;
      const ctx = boot();
      const src = ctx.createBufferSource();
      src.buffer = this.bufferClave;
      src.loop = true;
      src.connect(ctx.destination);
      src.start();
      this.sourceClave = src;
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

    // Pattern A play/stop
    const playA = () => {
      if (!this.bufferA) return;
      const ctx = boot();
      const src = ctx.createBufferSource();
      src.buffer = this.bufferA;
      src.loop = true;
      src.connect(ctx.destination);
      src.start();
      this.sourceA = src;
      console.log('[Groove-Lab] Pattern A playing');
    };
    const stopA = () => {
      if (this.sourceA) {
        this.sourceA.stop();
        this.sourceA.disconnect();
        this.sourceA = null;
        console.log('[Groove-Lab] Pattern A stopped');
      }
    };

    // Wire up buttons
    this.shadowRoot.getElementById('play-clave').onclick = playClave;
    this.shadowRoot.getElementById('stop-clave').onclick = stopClave;
    this.shadowRoot.getElementById('play-A').onclick = playA;
    this.shadowRoot.getElementById('stop-A').onclick = stopA;
  }
}

customElements.define('groove-lab', GrooveLab);
</script>
