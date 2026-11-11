/**
 * TROPIC ESCAPE: Primal Run (Edición Visual Arcade HD)
 * IP Original de GamerVerse LLC - Arte Vectorial Canvas Multicapa
 * Optimizado para Telegram Mini Apps (Vertical 1-Mano) y Android/iOS.
 */

'use strict';

// ============================================================================
// 1. MOTOR DE AUDIO CHIPTUNE TROPICAL (Web Audio API 100% Libre de Copyright)
// ============================================================================
let audioCtx = null;
let isMuted = false;
let musicInterval = null;
let musicStep = 0;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (isMuted || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'jump') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
            osc.start(now);
            osc.stop(now + 0.16);
        } else if (type === 'throw') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'fruit') {
            osc.type = 'sine';
            const pitch = 520 + Math.min(400, (game ? game.fruitCombo * 30 : 0));
            osc.frequency.setValueAtTime(pitch, now);
            osc.frequency.setValueAtTime(pitch * 1.25, now + 0.05);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
            osc.start(now);
            osc.stop(now + 0.14);
        } else if (type === 'crack') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'powerup') {
            const notes = [440, 554, 659, 880];
            notes.forEach((f, idx) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'triangle';
                o.frequency.setValueAtTime(f, now + idx * 0.06);
                g.gain.setValueAtTime(0.18, now + idx * 0.06);
                g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.15);
                o.connect(g);
                g.connect(audioCtx.destination);
                o.start(now + idx * 0.06);
                o.stop(now + idx * 0.06 + 0.15);
            });
            return;
        } else if (type === 'stumble') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(190, now);
            osc.frequency.linearRampToValueAtTime(85, now + 0.22);
            gain.gain.setValueAtTime(0.20, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
            osc.start(now);
            osc.stop(now + 0.24);
        } else if (type === 'hit_enemy') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
            osc.start(now);
            osc.stop(now + 0.14);
        } else if (type === 'fever') {
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((f, idx) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'square';
                o.frequency.setValueAtTime(f, now + idx * 0.07);
                g.gain.setValueAtTime(0.14, now + idx * 0.07);
                g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.22);
                o.connect(g);
                g.connect(audioCtx.destination);
                o.start(now + idx * 0.07);
                o.stop(now + idx * 0.07 + 0.22);
            });
            return;
        } else if (type === 'rival_passed') {
            const notes = [1046.5, 1318.5, 1567.98];
            notes.forEach((f, idx) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'sine';
                o.frequency.setValueAtTime(f, now + idx * 0.08);
                g.gain.setValueAtTime(0.16, now + idx * 0.08);
                g.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.08 + 0.25);
                o.connect(g);
                g.connect(audioCtx.destination);
                o.start(now + idx * 0.08);
                o.stop(now + idx * 0.08 + 0.25);
            });
            return;
        } else if (type === 'gameover') {
            const notes = [392, 349, 311, 261];
            notes.forEach((f, idx) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(f, now + idx * 0.14);
                g.gain.setValueAtTime(0.16, now + idx * 0.14);
                g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.14 + 0.28);
                o.connect(g);
                g.connect(audioCtx.destination);
                o.start(now + idx * 0.14);
                o.stop(now + idx * 0.14 + 0.28);
            });
            return;
        }
    } catch (e) {}
}

function startTropicalBeat() {
    stopTropicalBeat();
    const melody = [523.25, 0, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 587.33, 0, 659.25, 783.99, 523.25, 392.00, 440.00, 523.25];
    const bass = [130.81, 130.81, 196.00, 196.00, 174.61, 174.61, 196.00, 196.00];
    musicStep = 0;

    musicInterval = setInterval(() => {
        if (isMuted || !audioCtx || !game || game.state !== 'PLAYING') return;
        const now = audioCtx.currentTime;
        const note = melody[musicStep % melody.length];
        const bNote = bass[Math.floor(musicStep / 2) % bass.length];

        if (note > 0) {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = game.feverTimer > 0 ? 'square' : 'triangle';
            o.frequency.setValueAtTime(game.feverTimer > 0 ? note * 1.25 : note, now);
            g.gain.setValueAtTime(0.035, now);
            g.gain.exponentialRampToValueAtTime(0.002, now + 0.14);
            o.connect(g);
            g.connect(audioCtx.destination);
            o.start(now);
            o.stop(now + 0.14);
        }

        if (musicStep % 2 === 0) {
            const ob = audioCtx.createOscillator();
            const gb = audioCtx.createGain();
            ob.type = 'sine';
            ob.frequency.setValueAtTime(bNote, now);
            gb.gain.setValueAtTime(0.055, now);
            gb.gain.exponentialRampToValueAtTime(0.002, now + 0.18);
            ob.connect(gb);
            gb.connect(audioCtx.destination);
            ob.start(now);
            ob.stop(now + 0.18);
        }

        musicStep++;
    }, 175);
}

function stopTropicalBeat() {
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
}

function triggerHaptic(kind) {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        const hf = window.Telegram.WebApp.HapticFeedback;
        try {
            if (kind === 'light' || kind === 'medium' || kind === 'heavy') {
                hf.impactOccurred(kind);
            } else if (kind === 'success' || kind === 'warning' || kind === 'error') {
                hf.notificationOccurred(kind);
            }
        } catch (e) {}
    }
}

// ============================================================================
// 2. BIOMAS VIBRANTES Y CONFIGURACIÓN DE FRUTAS
// ============================================================================
const BIOMES = [
    {
        name: '🏖️ PLAYA SOLAR',
        skyTop: '#03045e',
        skyMid: '#0077b6',
        skyBottom: '#90e0ef',
        sunColor: '#ffe066',
        sunGlow: 'rgba(255, 224, 102, 0.45)',
        mountainFar: '#184e77',
        mountainMid: '#1e6091',
        oceanTop: '#00b4d8',
        oceanFoam: 'rgba(255, 255, 255, 0.55)',
        palmTrunk: '#6b4226',
        palmLeaf: '#2d6a4f',
        palmLeafLight: '#52b788',
        groundGrass: '#38b000',
        groundGrassLight: '#70e000',
        groundTop: '#e9c46a',
        groundBody: '#c9935b',
        groundAccent: '#b07b47',
        volcanoGlow: false
    },
    {
        name: '🌴 SELVA CREPUSCULAR',
        skyTop: '#10002b',
        skyMid: '#5a189a',
        skyBottom: '#ff7900',
        sunColor: '#ff9e00',
        sunGlow: 'rgba(255, 158, 0, 0.5)',
        mountainFar: '#240046',
        mountainMid: '#3c096c',
        oceanTop: '#7b2cbf',
        oceanFoam: 'rgba(255, 183, 3, 0.45)',
        palmTrunk: '#432818',
        palmLeaf: '#1b4332',
        palmLeafLight: '#40916c',
        groundGrass: '#2d6a4f',
        groundGrassLight: '#52b788',
        groundTop: '#7f4f24',
        groundBody: '#582f0e',
        groundAccent: '#3d210a',
        volcanoGlow: false
    },
    {
        name: '🌋 CRÁTER OBSIDIANA',
        skyTop: '#03071e',
        skyMid: '#370617',
        skyBottom: '#d00000',
        sunColor: '#ffba08',
        sunGlow: 'rgba(255, 186, 8, 0.55)',
        mountainFar: '#160b18',
        mountainMid: '#2b121c',
        oceanTop: '#e85d04',
        oceanFoam: 'rgba(255, 214, 10, 0.75)',
        palmTrunk: '#212529',
        palmLeaf: '#6a040f',
        palmLeafLight: '#dc2f02',
        groundGrass: '#e85d04',
        groundGrassLight: '#faa307',
        groundTop: '#343a40',
        groundBody: '#161a1d',
        groundAccent: '#495057',
        volcanoGlow: true
    }
];

const FRUITS_CONFIG = [
    { type: 'banana', icon: '🍌', stamina: 12, pts: 15, color: '#ffe135' },
    { type: 'pineapple', icon: '🍍', stamina: 18, pts: 25, color: '#ff9f43' },
    { type: 'mango', icon: '🥭', stamina: 24, pts: 40, color: '#ff595e' },
    { type: 'watermelon', icon: '🍉', stamina: 34, pts: 60, color: '#1dd1a1' }
];

const TOURNAMENT_RIVALS = [
    { name: '@pedro_ton', score: 250, prize: '$0.50 USDT' },
    { name: '@maria_crypto', score: 550, prize: '$1.00 USDT' },
    { name: '@lucas_runner', score: 950, prize: '$2.00 USDT' },
    { name: '@elena_arcade', score: 1500, prize: '$4.00 USDT' },
    { name: '@stellar_dan', score: 2300, prize: '🥉 Top 3 ($6.38 USDT)' },
    { name: '@moon_runner', score: 3400, prize: '🥈 Top 2 ($10.62 USDT)' },
    { name: '@crypto_pilot', score: 5000, prize: '🥇 Líder ($25.50 USDT)' }
];

// ============================================================================
// 3. MOTOR DEL JUEGO PRINCIPAL
// ============================================================================
class TropicEscapeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.state = 'MENU';
        this.width = 380;
        this.height = 700;
        this.groundY = 560;

        this.distance = 0;
        this.fruitsEaten = 0;
        this.bonusPoints = 0;
        this.totalScore = 0;
        this.bestScore = parseInt(localStorage.getItem('tropic_escape_best') || '0', 10);
        this.islandNumber = 1;
        this.nextRivalIndex = 0;
        this.stamina = 100;
        this.fever = 0;
        this.feverTimer = 0;
        this.fruitCombo = 0;
        this.comboDecayTimer = 0;

        this.baseSpeed = 5.2;
        this.currentSpeed = 5.2;
        this.groundScroll = 0;
        this.oceanScroll = 0;
        this.biomeIndex = 0;
        this.biomeBannerTimer = 0;
        this.biomeBannerText = '';

        this.hasRevived = false;
        this.shake = 0;

        // Jugador ("Kai")
        this.player = {
            x: 80,
            y: 0,
            vy: 0,
            width: 36,
            height: 52,
            isGrounded: true,
            jumpsUsed: 0,
            jumpHoldTimer: 0,
            isHoldingJump: false,
            runCycle: 0,
            squashX: 1,
            squashY: 1,
            stumbleTimer: 0,
            invulnTimer: 0,
            hasSurfboard: false,
            hasWeapon: false,
            spiritTimer: 0,
            throwCooldown: 0
        };

        this.boss = {
            active: false,
            x: 0,
            y: 0,
            hp: 0,
            maxHp: 0,
            shootTimer: 0,
            nextDistance: 500
        };

        this.fruits = [];
        this.obstacles = [];
        this.weapons = [];
        this.particles = [];
        this.ambientMotes = [];
        this.floatingTexts = [];
        this.clouds = [];
        this.palms = [];
        this.bushes = [];

        this.spawnTimer = 0;
        this.fruitTimer = 0;
        this.podTimer = 3200;
        this.lastTime = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindInputs();
        this.initBackground();
        this.updateMenuTickets();

        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        const container = document.getElementById('game-container');
        const rect = container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        this.groundY = this.height - 125;
        if (this.player.isGrounded) {
            this.player.y = this.groundY - this.player.height;
        }
    }

    initBackground() {
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: 55 + Math.random() * (this.height * 0.28),
                scale: 0.75 + Math.random() * 0.65,
                speed: 0.25 + Math.random() * 0.35
            });
        }
        this.palms = [];
        for (let i = 0; i < 5; i++) {
            this.palms.push({
                x: i * 135 + Math.random() * 25,
                h: 115 + Math.random() * 55,
                lean: (Math.random() - 0.5) * 18,
                scale: 0.85 + Math.random() * 0.30,
                swayPhase: i * 1.4
            });
        }
        this.bushes = [];
        for (let i = 0; i < 8; i++) {
            this.bushes.push({
                x: i * 75 + Math.random() * 30,
                r: 18 + Math.random() * 16
            });
        }
        this.ambientMotes = [];
        for (let i = 0; i < 20; i++) {
            this.ambientMotes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.groundY,
                r: 1.2 + Math.random() * 2,
                vx: -0.4 - Math.random() * 0.5,
                vy: (Math.random() - 0.5) * 0.4,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    updateMenuTickets() {
        const el = document.getElementById('menu-tickets-count');
        if (el && window.GamerVerse) {
            el.innerText = window.GamerVerse.user.tickets;
        }
        const bestEl = document.getElementById('menu-best-score');
        if (bestEl) {
            bestEl.innerText = this.bestScore;
        }
    }

    // ========================================================================
    // 4. CONTROLES (1 MANO + TECLADO)
    // ========================================================================
    bindInputs() {
        document.getElementById('btn-start-game').addEventListener('click', () => this.requestStartGame());
        document.getElementById('btn-restart-gameover').addEventListener('click', () => this.requestStartGame());
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-restart-pause').addEventListener('click', () => this.requestStartGame());
        document.getElementById('btn-quit-pause').addEventListener('click', () => this.returnToMenu());
        document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-revive').addEventListener('click', () => this.watchAdToRevive());
        document.getElementById('btn-share-score').addEventListener('click', () => {
            if (window.GamerVerse) window.GamerVerse.shareOnTelegram(this.totalScore);
        });

        document.getElementById('btn-audio').addEventListener('click', (e) => {
            isMuted = !isMuted;
            e.target.innerText = isMuted ? '🔇' : '🔊';
        });

        const throwBtn = document.getElementById('btn-throw');
        const handleThrow = (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (this.state === 'PLAYING') this.throwWeapon();
        };
        throwBtn.addEventListener('touchstart', handleThrow, { passive: false });
        throwBtn.addEventListener('mousedown', handleThrow);

        const handleJumpStart = (e) => {
            if (this.state !== 'PLAYING') return;
            if (e.target.closest('button')) return;
            e.preventDefault();
            this.triggerJump();
        };
        const handleJumpEnd = () => {
            this.player.isHoldingJump = false;
        };

        this.canvas.addEventListener('touchstart', handleJumpStart, { passive: false });
        this.canvas.addEventListener('touchend', handleJumpEnd);
        this.canvas.addEventListener('mousedown', handleJumpStart);
        window.addEventListener('mouseup', handleJumpEnd);

        window.addEventListener('keydown', (e) => {
            if (this.state !== 'PLAYING') return;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                if (!e.repeat) this.triggerJump();
            } else if (e.code === 'KeyX' || e.code === 'ArrowRight' || e.code === 'Enter') {
                this.throwWeapon();
            } else if (e.code === 'Escape' || e.code === 'KeyP') {
                this.togglePause();
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.player.isHoldingJump = false;
            }
        });
    }

    triggerJump() {
        const maxJumps = this.player.hasSurfboard ? 2 : 1;
        if (this.player.isGrounded || this.player.jumpsUsed < maxJumps) {
            this.player.vy = this.player.jumpsUsed === 0 ? -11.6 : -10.4;
            this.player.isGrounded = false;
            this.player.jumpsUsed++;
            this.player.isHoldingJump = true;
            this.player.jumpHoldTimer = 210;
            this.player.squashX = 0.82;
            this.player.squashY = 1.22;
            playSound('jump');
            triggerHaptic('light');
            this.spawnParticles(this.player.x + 18, this.player.y + this.player.height, '#ffe8b5', 7);
        }
    }

    throwWeapon() {
        if (!this.player.hasWeapon || this.player.throwCooldown > 0) return;
        this.player.throwCooldown = 340;
        this.weapons.push({
            x: this.player.x + 30,
            y: this.player.y + 18,
            vx: 10.8,
            vy: -2.4,
            rot: 0,
            radius: 16,
            trail: []
        });
        playSound('throw');
        triggerHaptic('light');
    }

    // ========================================================================
    // 5. FLUJO DE PARTIDA Y TICKETS GAMERVERSE
    // ========================================================================
    requestStartGame() {
        initAudio();
        if (window.GamerVerse && !window.GamerVerse.canPlay()) {
            window.GamerVerse.showNoTicketsModal(() => this.requestStartGame());
            return;
        }
        if (window.GamerVerse) {
            window.GamerVerse.consumeTicket();
        }
        this.startNewMatch();
    }

    startNewMatch() {
        this.state = 'PLAYING';
        this.distance = 0;
        this.fruitsEaten = 0;
        this.bonusPoints = 0;
        this.totalScore = 0;
        this.islandNumber = 1;
        this.nextRivalIndex = 0;
        this.stamina = 100;
        this.fever = 0;
        this.feverTimer = 0;
        this.fruitCombo = 0;
        this.comboDecayTimer = 0;

        this.baseSpeed = 5.2;
        this.currentSpeed = 5.2;
        this.groundScroll = 0;
        this.oceanScroll = 0;
        this.biomeIndex = 0;
        this.biomeBannerTimer = 2500;
        this.biomeBannerText = BIOMES[0].name;
        this.hasRevived = false;
        this.shake = 0;

        this.player.y = this.groundY - this.player.height;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.player.jumpsUsed = 0;
        this.player.squashX = 1;
        this.player.squashY = 1;
        this.player.stumbleTimer = 0;
        this.player.invulnTimer = 1500;
        this.player.hasSurfboard = false;
        this.player.hasWeapon = false;
        this.player.spiritTimer = 0;
        this.player.throwCooldown = 0;

        this.boss.active = false;
        this.boss.nextDistance = 500;

        this.fruits = [];
        this.obstacles = [];
        this.weapons = [];
        this.particles = [];
        this.floatingTexts = [];
        this.spawnTimer = 1100;
        this.fruitTimer = 350;
        this.podTimer = 3000;

        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('touch-controls').classList.remove('hidden');

        this.updateThrowButtonUI();
        this.updateActiveItemsHUD();
        startTropicalBeat();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.getElementById('pause-screen').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.lastTime = performance.now();
            document.getElementById('pause-screen').classList.add('hidden');
        }
    }

    returnToMenu() {
        this.state = 'MENU';
        stopTropicalBeat();
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('touch-controls').classList.add('hidden');
        document.getElementById('menu-screen').classList.remove('hidden');
        this.updateMenuTickets();
    }

    triggerGameOver(reasonTitle, reasonDesc) {
        this.state = 'GAMEOVER';
        stopTropicalBeat();
        playSound('gameover');
        triggerHaptic('error');

        document.getElementById('hud').classList.add('hidden');
        document.getElementById('touch-controls').classList.add('hidden');
        document.getElementById('gameover-screen').classList.remove('hidden');

        document.getElementById('gameover-title').innerText = reasonTitle;
        document.getElementById('gameover-reason').innerText = reasonDesc;
        document.getElementById('gameover-icon').innerText = this.stamina <= 0 ? '🤤' : '💥';

        document.getElementById('final-dist').innerText = Math.floor(this.distance) + 'm';
        document.getElementById('final-fruits').innerText = this.fruitsEaten;
        document.getElementById('final-score').innerText = this.totalScore;

        const newRecordEl = document.getElementById('new-record-badge');
        if (this.totalScore > this.bestScore) {
            this.bestScore = this.totalScore;
            localStorage.setItem('tropic_escape_best', this.bestScore);
            if (newRecordEl) newRecordEl.classList.remove('hidden');
        } else {
            if (newRecordEl) newRecordEl.classList.add('hidden');
        }
        const finalBestEl = document.getElementById('final-best');
        if (finalBestEl) finalBestEl.innerText = this.bestScore;

        const reviveBtn = document.getElementById('btn-revive');
        reviveBtn.style.display = this.hasRevived ? 'none' : 'block';

        if (window.GamerVerse) {
            window.GamerVerse.submitScore('tropic_escape', this.totalScore, this.fruitsEaten);
        }
        this.updateMenuTickets();
    }

    watchAdToRevive() {
        const btn = document.getElementById('btn-revive');
        btn.innerText = '⏳ CARGANDO ANUNCIO...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerText = '🎬 REVIVIR CON HOVER-SURF (1 AD)';
            btn.disabled = false;

            this.hasRevived = true;
            this.state = 'PLAYING';
            this.stamina = 100;
            this.player.hasSurfboard = true;
            this.player.hasWeapon = true;
            this.player.invulnTimer = 3500;
            this.player.stumbleTimer = 0;
            this.obstacles = [];

            document.getElementById('gameover-screen').classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
            document.getElementById('touch-controls').classList.remove('hidden');

            this.updateThrowButtonUI();
            this.updateActiveItemsHUD();
            this.addFloatingText(this.player.x, this.player.y - 30, '🏄‍♂️ ¡REVIVIDO CON ESCUDO!', '#1dd1a1');
            playSound('powerup');
            startTropicalBeat();
        }, 1200);
    }

    // ========================================================================
    // 6. ACTUALIZACIÓN LÓGICA (60 FPS)
    // ========================================================================
    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min(timestamp - this.lastTime, 50);
        this.lastTime = timestamp;

        if (this.state === 'PLAYING') {
            this.update(dt);
        } else if (this.state === 'MENU') {
            // Animación suave en el fondo incluso en el menú
            this.clouds.forEach(c => {
                c.x -= c.speed * 0.5;
                if (c.x < -80) c.x = this.width + 40;
            });
            this.ambientMotes.forEach(m => {
                m.x += m.vx * 0.5;
                m.phase += 0.03;
                if (m.x < 0) m.x = this.width;
            });
        }
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        const factor = dt / 16.66;

        this.shake *= 0.88;
        if (this.shake < 0.2) this.shake = 0;
        if (this.biomeBannerTimer > 0) this.biomeBannerTimer -= dt;

        if (this.comboDecayTimer > 0) {
            this.comboDecayTimer -= dt;
            if (this.comboDecayTimer <= 0) this.fruitCombo = 0;
        }

        // Squash & stretch recovery
        this.player.squashX += (1 - this.player.squashX) * 0.18 * factor;
        this.player.squashY += (1 - this.player.squashY) * 0.18 * factor;

        let mult = 1.0;
        if (this.player.hasSurfboard) mult *= 1.28;
        if (this.feverTimer > 0) mult *= 1.38;
        if (this.player.stumbleTimer > 0) mult *= 0.55;

        const speedGrowth = Math.min(4.2, this.distance * 0.0025);
        this.currentSpeed = (this.baseSpeed + speedGrowth) * mult;

        const stepDist = this.currentSpeed * 0.08 * factor;
        this.distance += stepDist;
        this.totalScore = Math.floor(this.distance) + this.bonusPoints;

        // Comprobar rebase de Rivales en Torneo (Ghost Rivals)
        if (this.nextRivalIndex < TOURNAMENT_RIVALS.length && this.totalScore >= TOURNAMENT_RIVALS[this.nextRivalIndex].score) {
            const rival = TOURNAMENT_RIVALS[this.nextRivalIndex];
            playSound('rival_passed');
            triggerHaptic('success');
            this.addFloatingText(this.player.x + 25, this.player.y - 36, `🚩 ¡SUPERASTE A ${rival.name}!`, '#1dd1a1');
            this.addFloatingText(this.player.x + 25, this.player.y - 56, `💰 ${rival.prize}`, '#feca57');
            this.nextRivalIndex++;
        }

        if (this.feverTimer <= 0) {
            const drainRate = 0.068 + Math.min(0.035, this.distance * 0.000025);
            this.stamina -= drainRate * factor;
        } else {
            this.feverTimer -= dt;
            if (this.feverTimer <= 0) this.fever = 0;
        }

        if (this.stamina <= 0) {
            this.stamina = 0;
            this.triggerGameOver('¡AGOTADO!', 'Tu medidor de energía llegó a cero. ¡Come más fruta!');
            return;
        }

        if (this.player.throwCooldown > 0) this.player.throwCooldown -= dt;
        if (this.player.stumbleTimer > 0) this.player.stumbleTimer -= dt;
        if (this.player.invulnTimer > 0) this.player.invulnTimer -= dt;
        if (this.player.spiritTimer > 0) {
            this.player.spiritTimer -= dt;
            if (this.player.spiritTimer <= 0) this.updateActiveItemsHUD();
        }

        if (!this.player.isGrounded) {
            let gravity = 0.56;
            if (this.player.isHoldingJump && this.player.jumpHoldTimer > 0 && this.player.vy < 0) {
                gravity = 0.25;
                this.player.jumpHoldTimer -= dt;
            }
            this.player.vy += gravity * factor;
            this.player.y += this.player.vy * factor;

            if (this.player.y >= this.groundY - this.player.height) {
                this.player.y = this.groundY - this.player.height;
                this.player.vy = 0;
                this.player.isGrounded = true;
                this.player.jumpsUsed = 0;
                this.player.squashX = 1.24;
                this.player.squashY = 0.78;
                this.spawnParticles(this.player.x + 18, this.groundY, '#e9c46a', 5);
            }
        } else {
            this.player.runCycle += this.currentSpeed * 0.055 * factor;
            if (this.player.hasSurfboard && Math.random() < 0.45) {
                this.particles.push({
                    x: this.player.x,
                    y: this.groundY - 4,
                    vx: -this.currentSpeed * 0.6,
                    vy: (Math.random() - 0.5) * 1.2,
                    size: 2.5 + Math.random() * 2.5,
                    color: '#00f0ff',
                    life: 0.7
                });
            }
        }

        if (!this.boss.active && this.distance >= this.boss.nextDistance) {
            this.spawnBoss();
        }

        if (this.boss.active) {
            this.updateBoss(dt, factor);
        } else {
            this.updateSpawners(dt);
        }

        // Paralaje suave y estable (sin mareo visual)
        this.groundScroll = (this.groundScroll + this.currentSpeed * factor) % 36;
        this.oceanScroll = (this.oceanScroll + this.currentSpeed * 0.14 * factor) % 40;

        this.clouds.forEach(c => {
            c.x -= c.speed * 0.55 * factor;
            if (c.x < -80) c.x = this.width + 40;
        });
        this.palms.forEach(p => {
            p.x -= this.currentSpeed * 0.18 * factor;
            if (p.x < -70) p.x += 5 * 135;
        });
        this.bushes.forEach(b => {
            b.x -= this.currentSpeed * 0.34 * factor;
            if (b.x < -50) b.x = this.width + 40 + Math.random() * 40;
        });
        this.ambientMotes.forEach(m => {
            m.x += (m.vx - this.currentSpeed * 0.08) * factor;
            m.y += m.vy * 0.5 * factor;
            m.phase += 0.03 * factor;
            if (m.x < -10) {
                m.x = this.width + 10;
                m.y = Math.random() * this.groundY;
            }
        });

        // Frutas
        const hasMagnet = this.feverTimer > 0 || this.player.spiritTimer > 0;
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            let f = this.fruits[i];
            f.x -= this.currentSpeed * factor;
            f.bob += 0.08 * factor;

            if (hasMagnet) {
                const dx = (this.player.x + 18) - f.x;
                const dy = (this.player.y + 24) - f.y;
                const d = Math.hypot(dx, dy);
                if (d < 200) {
                    f.x += dx * 0.18 * factor;
                    f.y += dy * 0.18 * factor;
                }
            }

            if (Math.abs((this.player.x + 18) - f.x) < 28 && Math.abs((this.player.y + 26) - f.y) < 34) {
                this.collectFruit(f);
                this.fruits.splice(i, 1);
                continue;
            }
            if (f.x < -30) this.fruits.splice(i, 1);
        }

        // Armas (Búmeran)
        for (let i = this.weapons.length - 1; i >= 0; i--) {
            let w = this.weapons[i];
            w.trail.push({ x: w.x, y: w.y });
            if (w.trail.length > 6) w.trail.shift();

            w.x += w.vx * factor;
            w.y += w.vy * factor;
            w.vy += 0.22 * factor;
            w.rot += 0.38 * factor;

            let hit = false;
            if (this.boss.active) {
                if (Math.abs(w.x - this.boss.x) < 42 && Math.abs(w.y - this.boss.y) < 45) {
                    hit = true;
                    this.damageBoss(1);
                }
            }

            if (!hit) {
                for (let j = this.obstacles.length - 1; j >= 0; j--) {
                    let o = this.obstacles[j];
                    if (o.type === 'rock' || o.type === 'campfire') continue;

                    if (Math.abs(w.x - (o.x + o.w * 0.5)) < (o.w * 0.5 + w.radius) &&
                        Math.abs(w.y - (o.y + o.h * 0.5)) < (o.h * 0.5 + w.radius)) {
                        hit = true;
                        if (o.type === 'pod') {
                            this.crackMysteryPod(o);
                            this.obstacles.splice(j, 1);
                        } else {
                            playSound('hit_enemy');
                            triggerHaptic('medium');
                            this.bonusPoints += o.pts || 50;
                            this.spawnParticles(o.x + o.w * 0.5, o.y + o.h * 0.5, '#ff9f43', 14);
                            this.addFloatingText(o.x, o.y, `+${o.pts || 50} 💥`, '#feca57');
                            this.obstacles.splice(j, 1);
                        }
                        break;
                    }
                }
            }

            if (hit || w.x > this.width + 40 || w.y > this.groundY + 20) {
                this.weapons.splice(i, 1);
            }
        }

        // Obstáculos y Colisiones
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let o = this.obstacles[i];
            const spd = o.extraSpeed ? (this.currentSpeed + o.extraSpeed) : this.currentSpeed;
            o.x -= spd * factor;
            o.anim = (o.anim || 0) + 0.12 * factor;

            if (o.type === 'bat') {
                o.phase = (o.phase || 0) + 0.08 * factor;
                o.y = o.baseY + Math.sin(o.phase) * 24;
            }

            const px = this.player.x + 7;
            const py = this.player.y + 6;
            const pw = this.player.width - 14;
            const ph = this.player.height - 8;

            if (px < o.x + o.w - 4 && px + pw > o.x + 4 && py < o.y + o.h - 4 && py + ph > o.y + 4) {
                if (o.type === 'pod') {
                    this.crackMysteryPod(o);
                    this.obstacles.splice(i, 1);
                    continue;
                }

                if (this.feverTimer > 0 || this.player.spiritTimer > 0) {
                    playSound('hit_enemy');
                    this.bonusPoints += 40;
                    this.spawnParticles(o.x + o.w * 0.5, o.y + o.h * 0.5, '#feca57', 12);
                    this.addFloatingText(o.x, o.y, '+40 ⚡', '#00d2d3');
                    this.obstacles.splice(i, 1);
                    continue;
                }

                if (this.player.invulnTimer <= 0) {
                    if (o.type === 'rock') {
                        playSound('stumble');
                        triggerHaptic('warning');
                        this.shake = 10;
                        this.stamina = Math.max(1, this.stamina - 22);
                        this.player.stumbleTimer = 650;
                        this.player.invulnTimer = 1100;
                        this.addFloatingText(this.player.x, this.player.y - 15, '🪨 ¡TROPIEZO! -22% ⚡', '#ff6b6b');
                        this.obstacles.splice(i, 1);
                        continue;
                    } else {
                        if (this.player.hasSurfboard) {
                            this.player.hasSurfboard = false;
                            this.player.invulnTimer = 2000;
                            this.shake = 12;
                            playSound('stumble');
                            triggerHaptic('heavy');
                            this.spawnParticles(this.player.x + 18, this.player.y + 35, '#00d2d3', 18);
                            this.addFloatingText(this.player.x, this.player.y - 20, '🏄‍♂️ ¡TABLA ROTA! SALVADO', '#00d2d3');
                            this.updateActiveItemsHUD();
                            this.obstacles.splice(i, 1);
                            continue;
                        } else {
                            this.shake = 16;
                            this.triggerGameOver('¡IMPACTO FATAL!', 'Chocaste contra un peligro de la isla.');
                            return;
                        }
                    }
                }
            }

            if (o.x + o.w < -40) this.obstacles.splice(i, 1);
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx * factor;
            p.y += p.vy * factor;
            p.life -= 0.03 * factor;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            let ft = this.floatingTexts[i];
            ft.y -= 1.1 * factor;
            ft.alpha -= 0.02 * factor;
            if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
        }

        this.updateHUD();
    }

    updateSpawners(dt) {
        this.fruitTimer -= dt;
        if (this.fruitTimer <= 0) {
            this.fruitTimer = 900 + Math.random() * 800;
            const cfg = FRUITS_CONFIG[Math.floor(Math.random() * FRUITS_CONFIG.length)];
            const pattern = Math.random();
            if (pattern < 0.45) {
                for (let k = 0; k < 3; k++) {
                    this.fruits.push({
                        ...cfg,
                        x: this.width + 30 + k * 36,
                        y: this.groundY - 78 - (k === 1 ? 32 : 0),
                        bob: k * 0.8
                    });
                }
            } else {
                for (let k = 0; k < 2; k++) {
                    this.fruits.push({
                        ...cfg,
                        x: this.width + 30 + k * 36,
                        y: this.groundY - 28,
                        bob: k * 0.5
                    });
                }
            }
        }

        this.podTimer -= dt;
        if (this.podTimer <= 0) {
            this.podTimer = 7200 + Math.random() * 4200;
            this.obstacles.push({
                type: 'pod',
                x: this.width + 40,
                y: this.groundY - 46,
                w: 38,
                h: 46,
                anim: 0
            });
        }

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            const minGap = Math.max(850, 1620 - this.distance * 0.45);
            this.spawnTimer = minGap + Math.random() * 750;

            const r = Math.random();
            if (r < 0.30) {
                this.obstacles.push({ type: 'rock', x: this.width + 40, y: this.groundY - 28, w: 36, h: 28, anim: 0 });
            } else if (r < 0.52) {
                this.obstacles.push({ type: 'campfire', x: this.width + 40, y: this.groundY - 34, w: 34, h: 34, anim: 0 });
            } else if (r < 0.72) {
                this.obstacles.push({ type: 'crab', x: this.width + 40, y: this.groundY - 32, w: 38, h: 32, extraSpeed: 1.2, pts: 45, anim: 0 });
            } else if (r < 0.88) {
                this.obstacles.push({ type: 'raptor', x: this.width + 40, y: this.groundY - 42, w: 46, h: 42, extraSpeed: 2.3, pts: 65, anim: 0 });
            } else {
                const baseY = this.groundY - 82;
                this.obstacles.push({ type: 'bat', x: this.width + 40, y: baseY, baseY: baseY, w: 38, h: 28, extraSpeed: 1.6, pts: 55, anim: 0 });
            }
        }
    }

    collectFruit(f) {
        this.fruitsEaten++;
        this.stamina = Math.min(100, this.stamina + f.stamina);
        const mult = this.feverTimer > 0 ? 2 : 1;
        this.bonusPoints += f.pts * mult;

        this.fruitCombo++;
        this.comboDecayTimer = 2800;

        if (this.feverTimer <= 0) {
            this.fever = Math.min(100, this.fever + 10);
            if (this.fever >= 100) {
                this.feverTimer = 7000;
                playSound('fever');
                triggerHaptic('success');
                this.addFloatingText(this.player.x, this.player.y - 35, '🔥 ¡FIEBRE TROPICAL! 🔥', '#ff9f43');
            }
        }

        playSound('fruit');
        triggerHaptic('light');
        this.spawnParticles(f.x, f.y, f.color, 9);
        this.addFloatingText(f.x, f.y - 10, `+${f.pts * mult}`, f.color);
    }

    crackMysteryPod(o) {
        playSound('crack');
        playSound('powerup');
        triggerHaptic('medium');
        this.spawnParticles(o.x + 19, o.y + 23, '#feca57', 20);

        let reward = 'nectar';
        if (!this.player.hasWeapon) {
            reward = 'weapon';
        } else if (!this.player.hasSurfboard && Math.random() < 0.55) {
            reward = 'surfboard';
        } else if (this.player.spiritTimer <= 0 && Math.random() < 0.45) {
            reward = 'spirit';
        }

        if (reward === 'weapon') {
            this.player.hasWeapon = true;
            this.addFloatingText(o.x, o.y - 15, '🪃 ¡BÚMERAN OBSIDIANA!', '#ff9f43');
        } else if (reward === 'surfboard') {
            this.player.hasSurfboard = true;
            this.addFloatingText(o.x, o.y - 15, '🏄‍♂️ ¡HOVER-SURF ACTIVO!', '#00d2d3');
        } else if (reward === 'spirit') {
            this.player.spiritTimer = 8500;
            this.addFloatingText(o.x, o.y - 15, '🦜 ¡COLIBRÍ GUARDIÁN!', '#1dd1a1');
        } else {
            this.stamina = 100;
            this.bonusPoints += 100;
            this.addFloatingText(o.x, o.y - 15, '🍹 ¡NÉCTAR +100% ⚡!', '#feca57');
        }

        this.updateThrowButtonUI();
        this.updateActiveItemsHUD();
    }

    // ========================================================================
    // 7. JEFE TIKI VOLCÁNICO
    // ========================================================================
    spawnBoss() {
        this.boss.active = true;
        this.boss.x = this.width - 70;
        this.boss.y = this.groundY - 120;
        this.boss.maxHp = 8 + (this.biomeIndex * 4);
        this.boss.hp = this.boss.maxHp;
        this.boss.shootTimer = 1000;
        this.obstacles = [];

        if (!this.player.hasWeapon) {
            this.player.hasWeapon = true;
            this.updateThrowButtonUI();
            this.updateActiveItemsHUD();
        }

        this.addFloatingText(this.width * 0.5, this.height * 0.35, '🗿 ¡TIKI GUARDIÁN APARECE!', '#ff6b6b');
        playSound('crack');
        triggerHaptic('heavy');
    }

    updateBoss(dt) {
        this.boss.y = (this.groundY - 120) + Math.sin(performance.now() * 0.004) * 44;
        this.boss.shootTimer -= dt;

        if (this.boss.shootTimer <= 0) {
            this.boss.shootTimer = Math.max(950, 1650 - this.biomeIndex * 200);
            const highShot = Math.random() < 0.45;
            this.obstacles.push({
                type: 'campfire',
                x: this.boss.x - 24,
                y: highShot ? this.groundY - 82 : this.groundY - 34,
                w: 28,
                h: 28,
                extraSpeed: 2.3,
                anim: 0
            });
        }
    }

    damageBoss(dmg) {
        this.boss.hp -= dmg;
        playSound('hit_enemy');
        triggerHaptic('medium');
        this.spawnParticles(this.boss.x, this.boss.y, '#ff6b6b', 10);

        if (this.boss.hp <= 0) {
            this.boss.active = false;
            this.boss.nextDistance = this.distance + 500;
            this.bonusPoints += 350;
            this.stamina = 100;
            this.baseSpeed += 0.55;

            this.biomeIndex = (this.biomeIndex + 1) % BIOMES.length;
            this.islandNumber++;
            this.biomeBannerTimer = 3200;
            this.biomeBannerText = `🏝️ ISLA ${this.islandNumber}: ${BIOMES[this.biomeIndex].name}`;
            this.updateActiveItemsHUD();

            playSound('fever');
            triggerHaptic('success');
            this.shake = 18;
            this.spawnParticles(this.boss.x, this.boss.y, '#feca57', 35);
            this.addFloatingText(this.boss.x - 40, this.boss.y, '🗿 ¡TIKI DERROTADO! +350 pts', '#feca57');
        }
    }

    // ========================================================================
    // 8. RENDERIZADO VECTORIAL HD MULTICAPA
    // ========================================================================
    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const biome = BIOMES[this.biomeIndex];
        const t = performance.now();

        ctx.save();
        if (this.shake > 0) {
            ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // 1. Cielo Degradado 3-Stop + Rayos de Sol
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGrad.addColorStop(0, biome.skyTop);
        skyGrad.addColorStop(0.55, biome.skyMid);
        skyGrad.addColorStop(1, biome.skyBottom);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, this.groundY);

        // Sol Tropical con Halo y Rayos suaves
        const sunX = w * 0.76;
        const sunY = h * 0.22;
        ctx.save();
        ctx.translate(sunX, sunY);
        ctx.rotate(t * 0.00015);
        for (let r = 0; r < 8; r++) {
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = biome.sunGlow;
            ctx.globalAlpha = 0.14;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-14, -140);
            ctx.lineTo(14, -140);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        const sunHalo = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 75);
        sunHalo.addColorStop(0, biome.sunColor);
        sunHalo.addColorStop(0.5, biome.sunGlow);
        sunHalo.addColorStop(1, 'transparent');
        ctx.fillStyle = sunHalo;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = biome.sunColor;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
        ctx.fill();

        // 2. Nubes Esponjosas Multicapa
        this.clouds.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.scale(c.scale, c.scale);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.arc(16, -6, 20, 0, Math.PI * 2);
            ctx.arc(34, -2, 17, 0, Math.PI * 2);
            ctx.arc(46, 4, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 3. Montañas y Volcán Lejano
        ctx.fillStyle = biome.mountainFar;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(w * 0.18, this.groundY - 115);
        ctx.lineTo(w * 0.42, this.groundY - 60);
        ctx.lineTo(w * 0.72, this.groundY - 165); // Volcán
        ctx.lineTo(w * 0.78, this.groundY - 165);
        ctx.lineTo(w, this.groundY - 85);
        ctx.lineTo(w, this.groundY);
        ctx.closePath();
        ctx.fill();

        // Brillo de lava en la cima del volcán si está en bioma volcánico
        if (biome.volcanoGlow) {
            ctx.fillStyle = '#ff5400';
            ctx.beginPath();
            ctx.arc(w * 0.75, this.groundY - 165, 10 + Math.sin(t * 0.01) * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cadena de colinas medias
        ctx.fillStyle = biome.mountainMid;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.quadraticCurveTo(w * 0.25, this.groundY - 95, w * 0.52, this.groundY - 40);
        ctx.quadraticCurveTo(w * 0.78, this.groundY - 105, w, this.groundY - 45);
        ctx.lineTo(w, this.groundY);
        ctx.closePath();
        ctx.fill();

        // 4. Océano / Lago Tropical Brillante con Olas
        const oceanY = this.groundY - 26;
        ctx.fillStyle = biome.oceanTop;
        ctx.fillRect(0, oceanY, w, 26);
        ctx.fillStyle = biome.oceanFoam;
        for (let wx = -this.oceanScroll; wx < w + 40; wx += 40) {
            ctx.beginPath();
            ctx.ellipse(wx + 10, oceanY + 4, 14, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 5. Palmeras Detalladas (Brisa suave, cero vibración)
        this.palms.forEach(p => {
            ctx.save();
            const topX = p.x + p.lean * 1.4;
            const topY = this.groundY - p.h;
            const sway = Math.sin(t * 0.0012 + (p.swayPhase || 0)) * 2.5;

            // Tronco segmentado curvo
            ctx.strokeStyle = biome.palmTrunk;
            ctx.lineWidth = 10 * p.scale;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p.x, this.groundY);
            ctx.quadraticCurveTo(p.x + p.lean * 0.7, this.groundY - p.h * 0.55, topX + sway, topY);
            ctx.stroke();

            // Frondas de palmera
            for (let a = 0; a < 6; a++) {
                const ang = (a - 2.5) * 0.52;
                ctx.save();
                ctx.translate(topX + sway, topY);
                ctx.rotate(ang + Math.sin(t * 0.0014 + a) * 0.03);
                ctx.fillStyle = a % 2 === 0 ? biome.palmLeaf : biome.palmLeafLight;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(20 * p.scale, -12 * p.scale, 42 * p.scale, 4 * p.scale);
                ctx.quadraticCurveTo(18 * p.scale, 6 * p.scale, 0, 0);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
        });

        // Arbustos tropicales medios
        ctx.fillStyle = biome.palmLeaf;
        this.bushes.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, this.groundY, b.r, Math.PI, 0);
            ctx.fill();
        });

        // 6. Suelo con Capas de Tierra, Arena y Césped (Bloqueado 1:1 a la pista)
        ctx.fillStyle = biome.groundBody;
        ctx.fillRect(0, this.groundY, w, h - this.groundY);
        ctx.fillStyle = biome.groundTop;
        ctx.fillRect(0, this.groundY, w, 24);

        // Franja de césped ondulado superior
        ctx.fillStyle = biome.groundGrass;
        ctx.fillRect(0, this.groundY, w, 10);
        ctx.fillStyle = biome.groundGrassLight;
        for (let gx = -this.groundScroll; gx < w + 36; gx += 36) {
            ctx.beginPath();
            ctx.moveTo(gx, this.groundY + 10);
            ctx.lineTo(gx + 10, this.groundY + 16);
            ctx.lineTo(gx + 20, this.groundY + 10);
            ctx.fill();

            // Piedritas en el suelo
            ctx.fillStyle = biome.groundAccent;
            ctx.beginPath();
            ctx.ellipse(gx + 14, this.groundY + 38, 9, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = biome.groundGrassLight;
        }

        // 7. Motas de luz tropical (Ambiente mágico)
        this.ambientMotes.forEach(m => {
            ctx.fillStyle = `rgba(255, 240, 150, ${0.35 + Math.sin(m.phase) * 0.25})`;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // 8. Frutas Vectoriales Jugosas con Halo Brillante
        this.fruits.forEach(f => {
            const fy = f.y + Math.sin(f.bob) * 5;
            this.drawVectorFruit(ctx, f, f.x, fy);
        });

        // 9. Obstáculos Vectoriales e Ilustrados
        this.obstacles.forEach(o => {
            this.drawVectorObstacle(ctx, o, t);
        });

        // 10. Jefe Tiki Volcánico Ilustrado
        if (this.boss.active) {
            this.drawVectorBoss(ctx, t);
        }

        // 11. Búmerans de Obsidiana girando con estela
        this.weapons.forEach(wp => {
            this.drawVectorBoomerang(ctx, wp);
        });

        // 12. Sombra en el suelo y Protagonista ("Kai")
        this.drawPlayerShadow(ctx);
        this.drawPlayer(ctx, t);

        // 13. Partículas y Textos Flotantes
        this.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        this.floatingTexts.forEach(ft => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.fillStyle = ft.color;
            ctx.font = '900 13px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        });

        // 14. Banner de Bioma Cinemático
        if (this.biomeBannerTimer > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, this.biomeBannerTimer / 600);
            ctx.fillStyle = 'rgba(12, 24, 33, 0.88)';
            ctx.strokeStyle = '#feca57';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#feca57';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.roundRect(w * 0.14, h * 0.24, w * 0.72, 46, 14);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#feca57';
            ctx.font = '900 14px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.biomeBannerText, w * 0.5, h * 0.24 + 28);
            ctx.restore();
        }

        // 15. Cápsula Discreta de Rival Fantasma (Ghost Rival Tracker)
        if (this.state === 'PLAYING' && this.nextRivalIndex < TOURNAMENT_RIVALS.length) {
            const target = TOURNAMENT_RIVALS[this.nextRivalIndex];
            const ptsLeft = Math.max(0, target.score - this.totalScore);
            const isNear = ptsLeft <= 80;
            const pillW = Math.min(230, w * 0.68);
            const pillH = 24;
            const pillX = (w - pillW) * 0.5;
            const pillY = 136;

            ctx.save();
            ctx.fillStyle = isNear ? 'rgba(238, 82, 83, 0.88)' : 'rgba(12, 24, 33, 0.72)';
            ctx.strokeStyle = isNear ? '#feca57' : 'rgba(0, 210, 211, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, pillH, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '800 10px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🎯 ${target.name} (${ptsLeft} pts)`, w * 0.5, pillY + 15);
            ctx.restore();
        }

        ctx.restore();
    }

    // --- DIBUJO DE FRUTAS VECTORIALES ---
    drawVectorFruit(ctx, f, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Halo luminoso de ítem
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
        grad.addColorStop(0, f.color);
        grad.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (f.type === 'banana') {
            ctx.rotate(-0.3);
            ctx.fillStyle = '#ffe135';
            ctx.strokeStyle = '#d4a017';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-10, -8);
            ctx.quadraticCurveTo(6, -12, 11, 8);
            ctx.quadraticCurveTo(0, 0, -10, -8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(-12, -10, 4, 3);
        } else if (f.type === 'pineapple') {
            // Hojas corona
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.moveTo(0, -16);
            ctx.lineTo(-7, -6);
            ctx.lineTo(7, -6);
            ctx.closePath();
            ctx.fill();
            // Cuerpo ovalado
            ctx.fillStyle = '#ff9f43';
            ctx.strokeStyle = '#e67e22';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, 2, 9, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (f.type === 'mango') {
            const mg = ctx.createLinearGradient(-8, -10, 8, 10);
            mg.addColorStop(0, '#ff595e');
            mg.addColorStop(1, '#ffca3a');
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.ellipse(0, 1, 9, 11, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.ellipse(3, -10, 5, 2.5, -0.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Sandía
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(0, -2, 12, 0, Math.PI);
            ctx.fill();
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.arc(0, -2, 9.5, 0, Math.PI);
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.fillRect(-4, 1, 2, 2);
            ctx.fillRect(2, 2, 2, 2);
        }

        // Brillo especular
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(-3, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // --- DIBUJO DE OBSTÁCULOS Y ENEMIGOS ILUSTRADOS ---
    drawVectorObstacle(ctx, o, t) {
        const cx = o.x + o.w * 0.5;
        const cy = o.y + o.h * 0.5;
        ctx.save();
        ctx.translate(cx, cy);

        if (o.type === 'pod') {
            // Huevo / Coco Ancestral con Runas Brillantes
            const bob = Math.sin(t * 0.008) * 3;
            ctx.translate(0, bob);
            ctx.shadowColor = '#feca57';
            ctx.shadowBlur = 14;
            const g = ctx.createRadialGradient(-4, -6, 3, 0, 0, 24);
            g.addColorStop(0, '#b07b47');
            g.addColorStop(1, '#5c3a21');
            ctx.fillStyle = g;
            ctx.strokeStyle = '#feca57';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, 17, 22, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Franja tribal dorada
            ctx.strokeStyle = '#ffe066';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-14, 0);
            ctx.lineTo(-7, -5);
            ctx.lineTo(0, 3);
            ctx.lineTo(7, -5);
            ctx.lineTo(14, 0);
            ctx.stroke();
        } else if (o.type === 'rock') {
            // Roca Musgosa Facetada
            ctx.fillStyle = '#636e72';
            ctx.strokeStyle = '#2d3436';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-16, 12);
            ctx.lineTo(-14, -4);
            ctx.lineTo(-4, -13);
            ctx.lineTo(11, -10);
            ctx.lineTo(17, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Parche de musgo verde
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.ellipse(-3, -9, 8, 4, -0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (o.type === 'campfire') {
            // Fogata Tribal Ardiente Animada
            ctx.fillStyle = '#5c3a21';
            ctx.fillRect(-14, 8, 28, 6);
            ctx.fillRect(-10, 4, 20, 6);

            const flicker = Math.sin(t * 0.015 + (o.anim || 0)) * 3;
            ctx.shadowColor = '#ff5400';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ff3838';
            ctx.beginPath();
            ctx.moveTo(-12, 8);
            ctx.quadraticCurveTo(-14, -8, 0 + flicker * 0.5, -18 - flicker);
            ctx.quadraticCurveTo(14, -8, 12, 8);
            ctx.fill();

            ctx.fillStyle = '#ff9f43';
            ctx.beginPath();
            ctx.moveTo(-7, 8);
            ctx.quadraticCurveTo(0, -12 - flicker * 0.5, 7, 8);
            ctx.fill();

            ctx.fillStyle = '#fff200';
            ctx.beginPath();
            ctx.arc(0, 4, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (o.type === 'crab') {
            // Cangrejo Pinza Roja animado
            const pinch = Math.sin(t * 0.015) * 4;
            ctx.fillStyle = '#e84118';
            // Patitas
            ctx.strokeStyle = '#c23616';
            ctx.lineWidth = 3;
            for (let l = -1; l <= 1; l += 2) {
                ctx.beginPath();
                ctx.moveTo(l * 10, 4);
                ctx.lineTo(l * 17, 14);
                ctx.stroke();
            }
            // Caparazón
            ctx.beginPath();
            ctx.ellipse(0, 4, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            // Tenazas arriba
            ctx.beginPath();
            ctx.arc(-14, -6 - pinch, 5, 0, Math.PI * 2);
            ctx.arc(14, -6 + pinch, 5, 0, Math.PI * 2);
            ctx.fill();
            // Ojos
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-5, -6, 3.5, 0, Math.PI * 2);
            ctx.arc(5, -6, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.fillRect(-6, -7, 2, 2);
            ctx.fillRect(4, -7, 2, 2);
        } else if (o.type === 'raptor') {
            // Mini-Raptor Neón Selvático
            ctx.fillStyle = '#10ac84';
            ctx.beginPath();
            ctx.ellipse(2, 4, 14, 10, 0, 0, Math.PI * 2); // Cuerpo
            ctx.fill();
            // Cola
            ctx.beginPath();
            ctx.moveTo(12, 2);
            ctx.lineTo(24, -4);
            ctx.lineTo(14, 8);
            ctx.fill();
            // Cabeza feroz apuntando izquierda
            ctx.beginPath();
            ctx.roundRect(-20, -14, 18, 12, 4);
            ctx.fill();
            // Cresta dorsal amarilla
            ctx.fillStyle = '#feca57';
            ctx.beginPath();
            ctx.moveTo(-6, -14);
            ctx.lineTo(-2, -20);
            ctx.lineTo(2, -14);
            ctx.fill();
            // Ojo
            ctx.fillStyle = '#ff3f34';
            ctx.beginPath();
            ctx.arc(-13, -9, 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (o.type === 'bat') {
            // Murciélago cavernícola con alas aleteando
            const flap = Math.sin(t * 0.025) * 10;
            ctx.fillStyle = '#5f27cd';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-18, -8 + flap);
            ctx.lineTo(-12, 6);
            ctx.moveTo(0, 0);
            ctx.lineTo(18, -8 + flap);
            ctx.lineTo(12, 6);
            ctx.fill();

            ctx.fillStyle = '#341f97';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff9f43';
            ctx.fillRect(-4, -2, 2.5, 2.5);
            ctx.fillRect(1.5, -2, 2.5, 2.5);
        }

        ctx.restore();
    }

    // --- JEFE TIKI VOLCÁNICO ---
    drawVectorBoss(ctx, t) {
        ctx.save();
        ctx.translate(this.boss.x, this.boss.y);

        // Halo de calor volcánico
        ctx.shadowColor = '#ff3838';
        ctx.shadowBlur = 24;

        // Máscara Tiki tallada en piedra oscura
        ctx.fillStyle = '#3d2c2e';
        ctx.strokeStyle = '#ff9f43';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-28, -36, 56, 72, 12);
        ctx.fill();
        ctx.stroke();

        // Penacho de plumas de fuego
        ctx.fillStyle = '#ff3838';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.ellipse(i * 10, -44, 5, 12, i * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ojos llameantes
        const eyeGlow = 0.7 + Math.sin(t * 0.015) * 0.3;
        ctx.fillStyle = `rgba(255, 211, 42, ${eyeGlow})`;
        ctx.beginPath();
        ctx.moveTo(-18, -14);
        ctx.lineTo(-4, -8);
        ctx.lineTo(-16, -2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(18, -14);
        ctx.lineTo(4, -8);
        ctx.lineTo(16, -2);
        ctx.closePath();
        ctx.fill();

        // Boca dentada amenazante
        ctx.fillStyle = '#111';
        ctx.fillRect(-18, 10, 36, 16);
        ctx.fillStyle = '#fff';
        for (let tx = -14; tx <= 10; tx += 8) {
            ctx.fillRect(tx, 10, 4, 6);
            ctx.fillRect(tx + 2, 20, 4, 6);
        }

        // Barra de vida
        ctx.shadowBlur = 0;
        const bw = 68;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(-bw * 0.5, -62, bw, 8);
        ctx.fillStyle = '#ff3838';
        ctx.fillRect(-bw * 0.5, -62, bw * (this.boss.hp / this.boss.maxHp), 8);

        ctx.restore();
    }

    // --- BÚMERAN DE OBSIDIANA CON ESTELA ---
    drawVectorBoomerang(ctx, wp) {
        // Estela luminosa
        if (wp.trail.length > 1) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 159, 67, 0.45)';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            wp.trail.forEach((pt, idx) => {
                if (idx === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.translate(wp.x, wp.y);
        ctx.rotate(wp.rot);
        ctx.shadowColor = '#00d2d3';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#222f3e';
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -10);
        ctx.quadraticCurveTo(8, -14, 12, 10);
        ctx.quadraticCurveTo(2, -2, -12, -10);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // --- SOMBRA Y PROTAGONISTA ("KAI") ---
    drawPlayerShadow(ctx) {
        const heightFromGround = Math.max(0, (this.groundY - this.player.height) - this.player.y);
        const shadowScale = Math.max(0.35, 1 - heightFromGround / 180);
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(this.player.x + this.player.width * 0.5, this.groundY + 3, 18 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawPlayer(ctx, t) {
        const p = this.player;
        ctx.save();
        ctx.translate(p.x + p.width * 0.5, p.y + p.height * 0.5);
        ctx.scale(p.squashX, p.squashY);

        if (p.invulnTimer > 0 && Math.floor(t / 80) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        if (p.stumbleTimer > 0) {
            ctx.rotate(Math.sin(t * 0.04) * 0.35);
        }

        // Aura de Fiebre Tropical
        if (this.feverTimer > 0) {
            ctx.strokeStyle = `hsl(${(t * 0.45) % 360}, 100%, 60%)`;
            ctx.lineWidth = 4;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(0, 0, 34, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Hover-Surf Isleño
        if (p.hasSurfboard) {
            ctx.save();
            ctx.shadowColor = '#00d2d3';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#00d2d3';
            ctx.strokeStyle = '#feca57';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-24, 18, 50, 9, 5);
            ctx.fill();
            ctx.stroke();
            // Ruedas de piedra
            ctx.fillStyle = '#222f3e';
            ctx.beginPath();
            ctx.arc(-14, 27, 4.5, 0, Math.PI * 2);
            ctx.arc(14, 27, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const legOffset = p.isGrounded && !p.hasSurfboard ? Math.sin(p.runCycle) * 7 : 2;
        const armOffset = p.isGrounded ? Math.cos(p.runCycle) * 6 : -5;

        // Brazo trasero
        ctx.strokeStyle = '#d49a6a';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2, -6);
        ctx.lineTo(-10 - armOffset, 6);
        ctx.stroke();

        // Piernas + Zapatillas Arcade
        ctx.strokeStyle = '#e0ac69';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-4, 10);
        ctx.lineTo(-6 + legOffset, 22);
        ctx.moveTo(4, 10);
        ctx.lineTo(6 - legOffset, 22);
        ctx.stroke();

        // Zapatillas rojo/blanco
        ctx.fillStyle = '#ee5253';
        ctx.fillRect(-10 + legOffset, 20, 9, 5);
        ctx.fillRect(2 - legOffset, 20, 9, 5);

        // Pantalones Cargo Azules + Chaleco Naranja Vibrante
        ctx.fillStyle = '#2e86de';
        ctx.fillRect(-10, 4, 20, 10);
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath();
        ctx.roundRect(-11, -11, 22, 17, 6);
        ctx.fill();
        // Detalle correa chaleco
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(-11, 2, 22, 3);

        // Cabeza
        ctx.fillStyle = '#f1c27d';
        ctx.beginPath();
        ctx.arc(0, -19, 11.5, 0, Math.PI * 2);
        ctx.fill();

        // Pelo oscuro puntiagudo arriba
        ctx.fillStyle = '#222f3e';
        ctx.beginPath();
        ctx.moveTo(-9, -24);
        ctx.lineTo(-4, -33);
        ctx.lineTo(1, -29);
        ctx.lineTo(7, -33);
        ctx.lineTo(10, -23);
        ctx.fill();

        // Bandana Roja Tribal flotando al viento
        ctx.fillStyle = '#ee5253';
        ctx.fillRect(-11.5, -25, 23, 6);
        ctx.beginPath();
        ctx.moveTo(-11, -22);
        ctx.lineTo(-26, -26 + Math.sin(t * 0.02) * 3.5);
        ctx.lineTo(-23, -17);
        ctx.closePath();
        ctx.fill();

        // Ojo expresivo con brillo
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(5, -19, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(6, -19, 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Brazo delantero
        ctx.strokeStyle = '#f1c27d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(2, -6);
        ctx.lineTo(10 + armOffset, 5);
        ctx.stroke();

        // Espíritu Colibrí Guardián Vectorial
        if (p.spiritTimer > 0) {
            const ang = t * 0.007;
            const hx = Math.cos(ang) * 34;
            const hy = Math.sin(ang) * 24 - 12;
            ctx.save();
            ctx.translate(hx, hy);
            ctx.shadowColor = '#1dd1a1';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#1dd1a1';
            ctx.beginPath();
            ctx.ellipse(0, 0, 7, 4.5, -0.2, 0, Math.PI * 2);
            ctx.fill();
            // Alas rápidas
            const wFlap = Math.sin(t * 0.05) * 7;
            ctx.fillStyle = '#feca57';
            ctx.beginPath();
            ctx.ellipse(-2, -5 + wFlap * 0.4, 3, 6, -0.4, 0, Math.PI * 2);
            ctx.fill();
            // Pico
            ctx.strokeStyle = '#ff9f43';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(6, -1);
            ctx.lineTo(13, -3);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }

    // ========================================================================
    // 9. UTILIDADES UI Y EFECTOS
    // ========================================================================
    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 1.5,
                size: 2.5 + Math.random() * 3.5,
                color: color,
                life: 1.0
            });
        }
    }

    addFloatingText(x, y, text, color) {
        this.floatingTexts.push({ x, y, text, color, alpha: 1.0 });
    }

    updateHUD() {
        document.getElementById('distVal').innerText = Math.floor(this.distance);
        document.getElementById('fruitVal').innerText = this.fruitsEaten;
        document.getElementById('scoreVal').innerText = this.totalScore;

        const stamEl = document.getElementById('stamina-fill');
        stamEl.style.width = Math.max(0, this.stamina) + '%';
        if (this.stamina < 28) stamEl.classList.add('low');
        else stamEl.classList.remove('low');

        const feverPct = this.feverTimer > 0 ? (this.feverTimer / 7000) * 100 : this.fever;
        document.getElementById('fever-fill').style.width = feverPct + '%';
    }

    updateThrowButtonUI() {
        const btn = document.getElementById('btn-throw');
        const icon = document.getElementById('throw-icon');
        const txt = document.getElementById('ammo-count');
        if (this.player.hasWeapon) {
            btn.classList.remove('disabled');
            if (icon) icon.innerText = '🪃';
            if (txt) txt.innerText = 'LANZAR';
        } else {
            btn.classList.add('disabled');
            if (icon) icon.innerText = '🥥';
            if (txt) txt.innerText = 'ROMPE COCO';
        }
    }

    updateActiveItemsHUD() {
        const hud = document.getElementById('active-items-hud');
        let html = `<div class="active-badge" style="border-color: #1dd1a1; color: #1dd1a1;">🏝️ Isla ${this.islandNumber}</div>`;
        if (this.player.hasWeapon) html += '<div class="active-badge">🪃 Búmeran Activo</div>';
        if (this.player.hasSurfboard) html += '<div class="active-badge">🏄‍♂️ Hover-Surf (Escudo)</div>';
        if (this.player.spiritTimer > 0) html += '<div class="active-badge">🦜 Colibrí Guardián</div>';
        hud.innerHTML = html;
    }
}

let game = null;
window.addEventListener('DOMContentLoaded', () => {
    game = new TropicEscapeGame();
});
