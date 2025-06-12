const masters = [
    {
        id: 'M1',
        url: './Clave.wav',
        variations: [
            { id: 'A1', url: './AfroPerc1.wav' },
            { id: 'B1', url: './AfroPerc2.wav' },
            { id: 'C1', url: './AfroPerc2.wav' }
        ]
    },
    {
        id: 'M2',
        url: './funk.mp3',
        variations: [
            { id: 'A2', url: './AfroPerc1.wav' },
            { id: 'B2', url: './AfroPerc2.wav' },
            { id: 'C2', url: './AfroPerc2.wav' }
        ]
    },
    {
        id: 'M3',
        url: './Clave.wav',
        variations: [
            { id: 'A3', url: './AfroPerc1.wav' },
            { id: 'B3', url: './AfroPerc2.wav' },
            { id: 'C3', url: './AfroPerc2.wav' }
        ]
    }
];

const killAll = document.getElementById('killAll');
const panel = document.getElementById('panel');
const players = {};
const buttons = {};
const state = { loaded: 0, unlocked: false };
let activeMaster = null;

// Build UI
masters.forEach(master => {
    const group = document.createElement('div');
    group.className = 'group-row';
    panel.appendChild(group);

    group.appendChild(createButton(master.id, master.url));

    // Insert separator after master
    const separator = document.createElement('div');
    separator.className = 'col-separator';
    group.appendChild(separator);

    master.variations.forEach(v => {
        group.appendChild(createButton(v.id, v.url));
    });
});

// Load audio
function setupTrack(id, url) {
    const player = new Tone.Player({
        url, loop: false, autostart: false,
        onload: onFileReady
    }).toDestination();
    player.sync().start(0);
    player.mute = true;
    players[id] = player;
}

// Create pad button
function createButton(id, url) {
    if (!players[id]) setupTrack(id, url);
    const name = url.split('/').pop().replace(/\.[^/.]+$/, '');
    const btn = document.createElement('button');
    btn.className = 'toggle';
    btn.disabled = true;
    btn.innerHTML = `<span>${name}</span><span class="icon">▶</span>`;
    buttons[id] = btn;

    // For variation pads, wrap in .pad-wrapper
    if (/^[ABC]\d+$/.test(id)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pad-wrapper';
        wrapper.appendChild(btn);
        return wrapper;
    }
    return btn;
}

function onFileReady() {
    state.loaded++;
    const total = masters.reduce((sum, m) => sum + 1 + m.variations.length, 0);
    if (state.loaded < total) return;

    enableKillAll();
    enableToggles();
}

function enableToggles() {
    masters.forEach(master => {
        const mBtn = buttons[master.id];
        mBtn.disabled = false;
        mBtn.onclick = async () => {
            await unlock();

            // If this master is already active, toggle it off
            if (activeMaster === master.id) {
                mBtn.classList.remove('selected');
                players[master.id].mute = true;
                master.variations.forEach(v => {
                    buttons[v.id].classList.remove('variation-selected');
                    buttons[v.id].classList.remove('variation-enabled');
                    buttons[v.id].disabled = true;
                    players[v.id].mute = true;
                    // Remove glow-square from this master's variations
                    const glow = buttons[v.id].parentElement.querySelector('.glow-square');
                    if (glow) glow.remove();
                });
                activeMaster = null;
                Tone.Transport.stop();
                return;
            }

            // Deactivate previous master
            if (activeMaster && activeMaster !== master.id) {
                const prev = masters.find(x => x.id === activeMaster);
                buttons[prev.id].classList.remove('selected');
                players[prev.id].mute = true;
                prev.variations.forEach(v => {
                    buttons[v.id].classList.remove('variation-selected');
                    buttons[v.id].classList.remove('variation-enabled');
                    buttons[v.id].disabled = true;
                    players[v.id].mute = true;
                    // Remove glow-square from previous master's variations
                    const glow = buttons[v.id].parentElement.querySelector('.glow-square');
                    if (glow) glow.remove();
                });
                Tone.Transport.position = 0;
            }

            // Activate new master
            activeMaster = master.id;
            mBtn.classList.add('selected');
            players[master.id].mute = false; // !players[master.id].mute;
            
            const loopLength = players[master.id].buffer.duration;
            console.log('setting loop to', loopLength);
            Tone.Transport.loopEnd = Tone.Time(loopLength);
            Tone.Transport.start();

            // Enable its variations
            master.variations.forEach(v => {
                buttons[v.id].disabled = false;
                buttons[v.id].classList.remove('variation-selected');
                buttons[v.id].classList.add('variation-enabled');
            });
        };

        // Handle variations
        master.variations.forEach(v => {
            const vBtn = buttons[v.id];
            vBtn.onclick = async () => {
                if (vBtn.disabled) return;
                await unlock();

                // Mute siblings & clear styling
                master.variations
                    .filter(x => x.id !== v.id)
                    .forEach(x => {
                        players[x.id].mute = true;
                        buttons[x.id].classList.remove('variation-selected');
                        buttons[x.id].classList.add('variation-enabled');
                        // Remove glow-square from siblings
                        const siblingGlow = buttons[x.id].parentElement.querySelector('.glow-square');
                        if (siblingGlow) siblingGlow.remove();
                    });

                // Remove any existing glow-square (always)
                const existingGlow = vBtn.parentElement.querySelector('.glow-square');
                if (existingGlow) existingGlow.remove();

                // Toggle this one + apply style
                const wasMuted = players[v.id].mute;
                players[v.id].mute = !wasMuted;
                vBtn.classList.toggle('variation-selected', wasMuted);
                if (wasMuted) {
                    vBtn.classList.remove('variation-enabled');
                    // Add glow-square behind the button
                    const glow = document.createElement('div');
                    glow.className = 'glow-square';
                    vBtn.parentElement.insertBefore(glow, vBtn);
                } else {
                    vBtn.classList.add('variation-enabled');
                    // (No glow-square added)
                }
            };
        });
    });
}

function enableKillAll() {
    killAll.disabled = false;
    killAll.onclick = () => {
        masters.forEach(m => {
            players[m.id].mute = true;
            buttons[m.id].classList.remove('selected');
            m.variations.forEach(v => {
                players[v.id].mute = true;
                buttons[v.id].classList.remove('variation-selected');
                buttons[v.id].classList.remove('variation-enabled');
                buttons[v.id].disabled = true;
                const glow = buttons[v.id].parentElement.querySelector('.glow-square');
                if (glow) glow.remove();
            });
        });
        if (Tone.Transport.state === 'started')
            Tone.Transport.stop();
        Tone.Transport.position = 0;
        // Re-sync all players so they will play immediately on next start
        Object.values(players).forEach(player => {
            player.sync().start(0);
            player.mute = true;
        });
    };
}

async function unlock() {
    if (!state.unlocked) {
        await Tone.start();
        state.unlocked = true;
        Tone.Transport.loop = true;
    }
}