const masters = [
    {
        id: 'M1',
        url: './Clave.wav',
        displayName: 'Clave',
        volume: -6, // dB, lower is quieter
        variations: [
            { id: 'A1', url: './Clave_Variation_1.wav', displayName: 'AfroPerc', volume: -3 },
            { id: 'B1', url: './Clave_Variation_2.wav', displayName: 'AfroPerc', volume: -3 },
            { id: 'C1', url: './Clave_Variation_3.wav', displayName: 'AfroPerc', volume: -3 }
        ]
    },
    {
        id: 'M2',
        url: './SF2_Clavinet.wav',
        displayName: 'Keys',
        volume: -10,
        variations: [
            { id: 'A2', url: './SF2_Clavinet_Variation3_Minimal.wav', displayName: 'AfroPerc', volume: 0 },
            { id: 'B2', url: './SF2_Clavinet_Variation1.wav', displayName: 'AfroPerc', volume: 0 },
            { id: 'C2', url: './SF2_Clavinet_Variation2.wav', displayName: 'AfroPerc', volume: 0 }
        ]
    },
    {
        id: 'M3',
        url: './BassLine.wav',
        displayName: 'Bass',
        volume: 0,
        variations: [
            { id: 'A3', url: './BassLine_Variation1.wav', displayName: 'AfroPerc', volume: 0 },
            { id: 'B3', url: './BassLine_Variation2.wav', displayName: 'AfroPerc', volume: 0 },
            { id: 'C3', url: './BassLine_Variation3.wav', displayName: 'AfroPerc', volume: 0 }
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
    // Find the master or variation object to get the volume
    let volume = 0;
    for (const master of masters) {
        if (master.id === id) {
            volume = master.volume || 0;
            break;
        }
        const variation = master.variations.find(v => v.id === id);
        if (variation) {
            volume = variation.volume || 0;
            break;
        }
    }
    const player = new Tone.Player({
        url, loop: false, autostart: false,
        onload: onFileReady
    }).toDestination();
    player.volume.value = volume; // Set the volume in dB
    player.sync().start(0);
    player.mute = true;
    players[id] = player;
}

// Create pad button
function createButton(id, url) {
    // Find the master or variation object to check for displayName
    let displayName = null;
    for (const master of masters) {
        if (master.id === id) {
            displayName = master.displayName;
            break;
        }
        const variation = master.variations.find(v => v.id === id);
        if (variation) {
            displayName = variation.displayName;
            break;
        }
    }
    if (!players[id]) setupTrack(id, url);
    const name = displayName || url.split('/').pop().replace(/\.[^/.]+$/, '');
    const btn = document.createElement('button');
    btn.className = 'toggle';
    btn.disabled = true;

    // In createButton, add a class to the icon span for master or variation
    let iconClass = '';
    if (/^[ABC]\d+$/.test(id)) {
        iconClass = 'variation-icon';
    } else {
        iconClass = 'master-icon';
    }
    btn.innerHTML = `<span class="toggle-content"><span>${name}</span><span class="icon ${iconClass}" aria-label="play"><svg width="2em" height="2em" viewBox="0 0 32 32" style="display:block; margin: 0 auto;"><polygon points="12,9 24,16 12,23" fill="#fff" opacity="0.5"/></svg></span></span>`;

    // After button creation, for master buttons, set icon to white (opacity 1)
    if (iconClass === 'master-icon') {
        const icon = btn.querySelector('polygon');
        if (icon) icon.setAttribute('opacity', '1');
    }

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

                // In the variation button toggle logic (inside enableToggles),
                // when a variation is activated (variation-selected), set icon opacity to 1 (white), otherwise 0.5 (grey)
                // Add after vBtn.classList.toggle('variation-selected', wasMuted);
                const icon = vBtn.querySelector('polygon');
                if (icon) {
                    if (wasMuted) {
                        icon.setAttribute('opacity', '1');
                    } else {
                        icon.setAttribute('opacity', '0.5');
                    }
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