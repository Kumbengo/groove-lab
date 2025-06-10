// groove-lab.js - Custom Element for GrooveLab Widget
import * as Tone from 'https://cdn.skypack.dev/tone@14.7.77';

class GrooveLab extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        :host {
          display: block;
          text-align: center;
          font-family: system-ui, sans-serif;
        }
        button {
          padding: 12px 24px;
          font-size: 1rem;
          border: none;
          border-radius: 8px;
          background-color: #ff5722;
          color: white;
          cursor: pointer;
          transition: background 0.3s;
        }
        button:hover {
          background-color: #e64a19;
        }
      </style>
      <button id="action">Start Groove</button>
    `;

    this.button = this.querySelector('#action');

    // Use your actual media URLs
    this.baseLoopUrl = 'https://static.wixstatic.com/media/gtr.mp3';
    this.patterns = [
      'https://static.wixstatic.com/media/perc-1.mp3',
      'https://static.wixstatic.com/media/perc-2.mp3',
      'https://static.wixstatic.com/media/perc-3.mp3',
    ];

    this.button.addEventListener('click', async () => {
      await this.initGroove();
    });
  }

  async initGroove() {
    try {
      await Tone.start(); // Required on mobile
      
      this.button.textContent = 'New Pattern';

      this.gtr = new Tone.Player(this.baseLoopUrl).toDestination();
      this.perc = new Tone.Player(this.pickPattern()).toDestination();

      // Load both before starting transport
      await Promise.all([
        this.gtr.load(),
        this.perc.load()
      ]);

      // Sync loop start – 8 bars assumed
      Tone.Transport.scheduleRepeat(() => {
        this.gtr.start('+0');
        this.perc.start('+0');
      }, '8m');

      Tone.Transport.start();

      this.button.onclick = () => this.swapPattern();
    } catch (err) {
      console.error('Tone.js init failed:', err);
      this.button.textContent = 'Error loading audio';
    }
  }

  pickPattern() {
    const index = Math.floor(Math.random() * this.patterns.length);
    return this.patterns[index];
  }

  swapPattern() {
    const newUrl = this.pickPattern();
    this.perc.load(newUrl);
    this.flashButton();
  }

  flashButton() {
    this.button.animate(
      [{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }],
      { duration: 300 }
    );
  }
}

customElements.define('groove-lab', GrooveLab);
