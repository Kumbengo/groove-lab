class GrooveLab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.ctx = null;
    this.buffers = {};
    this.sources = {};
  }

  async connectedCallback() {
    console.log('[Groove-Lab] connected');

    this.shadowRoot.innerHTML = `
      <style>
        button { margin:4px; padding:6px 12px; font:14px sans-serif; }
      </style>
      <button id="playClave">▶ Clave</button>
      <button id="stopClave">⏹ Clave</button>
      <button id="playPerc1">▶ AfroPerc1</button>
      <button id="stopPerc1">⏹ AfroPerc1</button>
      <button id="playPerc2">▶ AfroPerc2</button>
      <button id="stopPerc2">⏹ AfroPerc2</button>
    `;

    const boot = () =>
      (this.ctx ||= new (window.AudioContext || window.webkitAudioContext)());

    const loadBuffer = async (key, url) => {
      try {
        console.log(`[Groove-Lab] loading ${key} from ${url}`);
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await boot().decodeAudioData(arrayBuffer);
        this.buffers[key] = buffer;
        console.info(`[Groove-Lab] ${key} loaded`);
      } catch (err) {
        console.error(`[Groove-Lab] Failed to load ${key}`, err);
      }
    };

    // 🔒 HARD CODED AUDIO FILE URLs (edit here)
    const base = 'https://kumbengo.github.io/Groove-Lab/';
    await Promise.all([
      loadBuffer('clave',   base + 'Clave.mp3'),
      loadBuffer('perc1',   base + 'AfroPerc1.mp3'),
      loadBuffer('perc2',   base + 'AfroPerc2.mp3'),
    ]);

    const play = (key) => {
      const buffer = this.buffers[key];
      if (!buffer) return console.warn(`[Groove-Lab] ${key} buffer not loaded`);

      const source = boot().createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.loop = true;
      source.start();
      this.sources[key] = source;
      console.log(`[Groove-Lab] ${key} started`);
    };

    const stop = (key) => {
      const source = this.sources[key];
      if (source) {
        source.stop();
        source.disconnect();
        delete this.sources[key];
        console.log(`[Groove-Lab] ${key} stopped`);
      }
    };

    // button hookups
    this.shadowRoot.getElementById('playClave').onclick  = () => play('clave');
    this.shadowRoot.getElementById('stopClave').onclick  = () => stop('clave');
    this.shadowRoot.getElementById('playPerc1').onclick  = () => play('perc1');
    this.shadowRoot.getElementById('stopPerc1').onclick  = () => stop('perc1');
    this.shadowRoot.getElementById('playPerc2').onclick  = () => play('perc2');
    this.shadowRoot.getElementById('stopPerc2').onclick  = () => stop('perc2');
  }
}

customElements.define('groove-lab', GrooveLab);
