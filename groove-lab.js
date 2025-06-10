<script>
class GrooveLab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.ctx = null;

    // Will hold our decoded AudioBuffers
    this.buffers = {
      clave: null,
      A: null,
      B: null
    };

    // Will hold our currently-playing AudioBufferSourceNodes
    this.sources = {
      clave: null,
      A: null,
      B: null
    };

    // When the clave loop started (for sync calculations)
    this.claveStartTime = 0;
  }

  async connectedCallback() {
    console.log('[Groove-Lab] connected');
    this.shadowRoot.innerHTML = `
      <style>
        button { margin:4px; padding:6px 12px; font:14px sans-serif; }
      </style>
      <div>
        <button id="play-clave">▶ Play Clave</button>
        <button id="stop-clave">⏹ Stop Clave</button>
      </div>
      <div>
        <button id="play-A">▶ Play Pattern A</button>
        <button id="play-B">▶ Play Pattern B</button>
      </div>
    `;

    // Lazy-create the AudioContext
    const boot = () =>
      (this.ctx ||= new (window.AudioContext || window.webkitAudioContext)());

    // Hard-coded URLs; swap in your own paths
    const urls = {
      clave: 'https://kumbengo.github.io/groove-lab/Clave.wav',
      A:     'https://kumbengo.github.io/groove-lab/AfroPerc1.wav',
      B:     'https://kumbengo.github.io/groove-lab/AfroPerc2.wav'
    };

    // Fetch & decode all three in parallel
    try {
      console.log('[Groove-Lab] fetching audio files…');
      const promises = Object.entries(urls).map(async ([key, url]) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        const ab = await res.arrayBuffer();
        const buffer = await boot().decodeAudioData(ab);
        this.buffers[key] = buffer;
        console.log(`[Groove-Lab] loaded "${key}"`);
      });
      await Promise.all(promises);
      console.log('[Groove-Lab] all audio loaded');
    } catch (err) {
      console.error('[Groove-Lab] failed to load audio:', err);
    }

    // PLAY/STOP CLAVE
    const playClave = () => {
      if (!this.buffers.clave) {
        console.warn('[Groove-Lab] clave buffer not ready');
        return;
      }
      if (this.sources.clave) {
        console.warn('[Groove-Lab] clave already playing');
        return;
      }
      const ctx = boot();
      const src = ctx.createBufferSource();
      src.buffer = this.buffers.clave;
      src.loop = true;
      src.connect(ctx.destination);
      src.start();
      this.sources.clave = src;
      this.claveStartTime = ctx.currentTime;
      console.log('[Groove-Lab] clave playback started');
    };
    const stopClave = () => {
      const src = this.sources.clave;
      if (src) {
        src.stop();
        src.disconnect();
        this.sources.clave = null;
        console.log('[Groove-Lab] clave playback stopped');
      }
      // Also stop any patterns
      this.stopPattern('A');
      this.stopPattern('B');
    };

    // PATTERN PLAYBACK (sync to clave)
    this.playPattern = (name) => {
      const other = name === 'A' ? 'B' : 'A';

      if (!this.sources.clave) {
        console.warn('[Groove-Lab] start the clave first!');
        return;
      }
      if (!this.buffers[name]) {
        console.warn(`[Groove-Lab] buffer "${name}" not ready`);
        return;
      }

      // Stop the other pattern if it's playing
      if (this.sources[other]) {
        this.stopPattern(other);
      }
      // Stop and recreate this pattern if already playing (to reset sync)
      if (this.sources[name]) {
        this.stopPattern(name);
      }

      const ctx = boot();
      const elapsed = (ctx.currentTime - this.claveStartTime) % this.buffers.clave.duration;

      const src = ctx.createBufferSource();
      src.buffer = this.buffers[name];
      src.loop = true;
      src.connect(ctx.destination);
      // Start immediately, but offset into the loop so it's in perfect sync
      src.start(ctx.currentTime, elapsed);
      this.sources[name] = src;
      console.log(`[Groove-Lab] pattern ${name} started (offset ${elapsed.toFixed(3)}s)`);
    };

    this.stopPattern = (name) => {
      const src = this.sources[name];
      if (src) {
        src.stop();
        src.disconnect();
        this.sources[name] = null;
        console.log(`[Groove-Lab] pattern ${name} stopped`);
      }
    };

    // Wire up buttons
    this.shadowRoot.getElementById('play-clave').onclick = playClave;
    this.shadowRoot.getElementById('stop-clave').onclick = stopClave;
    this.shadowRoot.getElementById('play-A').onclick = () => this.playPattern('A');
    this.shadowRoot.getElementById('play-B').onclick = () => this.playPattern('B');
  }
}

customElements.define('groove-lab', GrooveLab);
</script>
