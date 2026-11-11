class ArrowEscapeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.currentLevelIndex = 1;
        this.furthestLevelIndex = 1;
        this.coins = 100;
        this.score = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.hintsAvailable = 3;
        this.currentSkin = 'neon';

        this.hasActiveTicket = false;
        this.levelData = null;
        this.lines = [];
        this.history = [];
        this.animations = [];
        this.gridCacheCanvas = null;
        this.gridCacheKey = '';
        this.lastFrameTime = 0;
        this.hintLineId = null;
        this.hintTimer = null;
        this.particles = [];
        this.floatingTexts = [];
        this.screenShake = 0;
        this.comboCount = 0;
        this.lastEscapeTime = 0;

        this.NEON_PALETTE = ['#00f0ff', '#ff3d7f', '#00e878', '#a855f7', '#ff9f43', '#38bdf8'];

        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.gridOffset = { x: 0, y: 0, cellSize: 40 };

        this.initProgress();

        // Soporte query param para pruebas (?level=2)
        const params = new URLSearchParams(window.location.search);
        const urlLevel = parseInt(params.get('level') || params.get('lvl') || params.get('levelId'), 10);
        if (urlLevel && !isNaN(urlLevel) && urlLevel >= 1) {
            this.currentLevelIndex = urlLevel;
            if (this.currentLevelIndex > this.furthestLevelIndex) {
                this.furthestLevelIndex = this.currentLevelIndex;
            }
        }

        this.initCanvas();
        this.initEvents();
        this.loadLevel(this.currentLevelIndex, false);
        this.startLoop();
    }

    initProgress() {
        const saved = localStorage.getItem('arrow_escape_progress');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.currentLevelIndex = data.levelIndex || 1;
                this.furthestLevelIndex = data.furthestLevelIndex || data.levelIndex || 1;
                this.coins = data.coins !== undefined ? data.coins : 100;
                this.score = data.score || 0;
                this.hintsAvailable = data.hintsAvailable !== undefined ? data.hintsAvailable : 3;
                this.currentSkin = data.skin || 'neon';
            } catch (e) {}
        }
        this.setSkin(this.currentSkin || 'neon');
        this.updateHUD();
    }

    saveProgress() {
        if (this.currentLevelIndex > this.furthestLevelIndex) {
            this.furthestLevelIndex = this.currentLevelIndex;
        }
        localStorage.setItem('arrow_escape_progress', JSON.stringify({
            levelIndex: this.currentLevelIndex,
            furthestLevelIndex: this.furthestLevelIndex,
            coins: this.coins,
            score: this.score,
            hintsAvailable: this.hintsAvailable,
            skin: this.currentSkin
        }));
        this.updateHUD();
    }

    initCanvas() {
        const view = document.getElementById('game-view');
        const rect = view.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.viewport = { width: rect.width, height: rect.height };
    }

    loadLevel(index, autoStart = false) {
        this.currentLevelIndex = index;
        this.maxLives = index >= 30 ? 2 : 3;
        this.lives = this.maxLives;
        this.animations = [];
        this.gridCacheKey = '';
        this.levelData = window.levelManager.getLevel(index);
        this.lines = this.levelData.lines.map(l => ({
            id: l.id,
            dir: l.dir,
            nodes: l.nodes.map(n => ({ x: n.x, y: n.y })),
            cleared: false,
            escaping: false,
            slitherProgress: 0,
            bounceProgress: 0
        }));
        this.history = [];
        this.hintLineId = null;
        this.comboCount = 0;

        // Reset level boosters
        this.boosterShieldActive = false;
        this.boosterCompassActive = false;
        this.compassHighlightIds = [];

        document.getElementById('status-shield-active').innerText = 'NO';
        document.getElementById('status-compass-active').innerText = 'NO';
        document.getElementById('booster-shield').classList.remove('active');
        document.getElementById('booster-compass').classList.remove('active');

        document.getElementById('level-title').innerText = `NIVEL ${index}`;
        document.getElementById('level-subtitle').innerText = this.levelData.name;
        document.getElementById('prep-level-name').innerText = `NIVEL ${index}: ${this.levelData.name}`;

        const startBtn = document.getElementById('btn-start-level');
        if (startBtn) {
            startBtn.innerText = this.hasActiveTicket ? '¡EMPEZAR NIVEL!' : '¡EMPEZAR! (1 🎟️)';
        }

        if (autoStart && this.hasActiveTicket) {
            this.closeModal('modal-prep');
        } else {
            this.openModal('modal-prep');
        }

        this.updateHUD();
        this.saveProgress();
    }

    startPreparedLevel() {
        // Consumir 1 Ticket solo si la sesión arcade aún no tiene ticket activo
        if (!this.hasActiveTicket) {
            if (window.GamerVerse && !window.GamerVerse.canPlay()) {
                window.GamerVerse.showNoTicketsModal(() => this.startPreparedLevel());
                return;
            }
            if (window.GamerVerse) {
                window.GamerVerse.consumeTicket();
            }
            this.hasActiveTicket = true;
        }

        this.closeModal('modal-prep');
        this.applyCompassIfEquipped();
        this.triggerHaptic('light');
    }

    applyCompassIfEquipped() {
        if (this.boosterCompassActive) {
            const seq = window.levelSolver.findHintSequence(
                this.lines,
                this.levelData.grid.cols,
                this.levelData.grid.rows,
                3,
                this.levelData
            );
            this.compassHighlightIds = seq || [];
        } else {
            this.compassHighlightIds = [];
        }
    }

    updateHUD() {
        document.getElementById('coins-count').innerText = this.coins;
        document.getElementById('hints-count').innerText = this.hintsAvailable;

        let hearts = '';
        for (let i = 0; i < this.maxLives; i++) {
            hearts += (i < this.lives) ? '❤️' : '🖤';
        }
        document.getElementById('lives-display').innerText = hearts;

        // Sub-HUD progreso de flechas
        const total = this.lines ? this.lines.length : 0;
        const cleared = this.lines ? this.lines.filter(l => l.cleared || l.escaping).length : 0;
        const remaining = total - cleared;

        const arrowsEl = document.getElementById('arrows-left');
        if (arrowsEl) arrowsEl.innerText = `${remaining}/${total}`;

        const barEl = document.getElementById('level-progress-bar');
        if (barEl) {
            const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;
            barEl.style.width = pct + '%';
        }

        const scoreEl = document.getElementById('tournament-score');
        if (scoreEl) scoreEl.innerText = this.score;
    }

    initEvents() {
        window.addEventListener('resize', () => this.initCanvas());

        const handlePointer = (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touchX = (e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX)) - rect.left;
            const touchY = (e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY)) - rect.top;
            this.handleTap(touchX, touchY);
        };

        this.canvas.addEventListener('pointerdown', handlePointer);

        // HUD Controls
        document.getElementById('btn-hint').addEventListener('click', () => this.useHint());
        document.getElementById('btn-undo').addEventListener('click', () => this.useUndo());
        document.getElementById('btn-restart').addEventListener('click', () => this.loadLevel(this.currentLevelIndex, true));
        document.getElementById('btn-levels').addEventListener('click', () => this.openLevelSelect());
        document.getElementById('btn-shop').addEventListener('click', () => this.openShop());

        const soundBtn = document.getElementById('btn-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                window.audioManager.muted = !window.audioManager.muted;
                soundBtn.innerText = window.audioManager.muted ? '🔇' : '🔊';
            });
        }

        // Victory Modal
        document.getElementById('btn-next-level').addEventListener('click', () => {
            this.closeModal('modal-victory');
            this.loadLevel(this.currentLevelIndex + 1, true);
        });
        const shareVicBtn = document.getElementById('btn-share-victory');
        if (shareVicBtn) {
            shareVicBtn.addEventListener('click', () => {
                if (window.GamerVerse) window.GamerVerse.shareOnTelegram(this.score);
            });
        }

        // Game Over Modals
        document.getElementById('btn-revive-ad').addEventListener('click', () => this.reviveWithAd());
        document.getElementById('btn-revive-coins').addEventListener('click', () => this.reviveWithCoins());
        document.getElementById('btn-restart-fail').addEventListener('click', () => {
            this.closeModal('modal-gameover');
            this.hasActiveTicket = false; // Nueva ficha para nuevo intento tras Game Over
            this.loadLevel(this.currentLevelIndex, false);
        });

        // Booster Prep Modal
        document.getElementById('btn-buy-shield-coins').addEventListener('click', () => this.buyBooster('shield', 'coins'));
        document.getElementById('btn-buy-shield-ad').addEventListener('click', () => this.buyBooster('shield', 'ad'));
        document.getElementById('btn-buy-compass-coins').addEventListener('click', () => this.buyBooster('compass', 'coins'));
        document.getElementById('btn-buy-compass-ad').addEventListener('click', () => this.buyBooster('compass', 'ad'));

        document.getElementById('btn-start-level').addEventListener('click', () => this.startPreparedLevel());
        const closePrepBtn = document.getElementById('btn-close-prep');
        if (closePrepBtn) {
            closePrepBtn.addEventListener('click', () => this.startPreparedLevel());
        }
    }

    buyBooster(type, method) {
        if (type === 'shield') {
            if (this.boosterShieldActive) return;
            if (method === 'coins') {
                if (this.coins >= 30) {
                    this.coins -= 30;
                    this.boosterShieldActive = true;
                    window.audioManager.playVictory();
                } else {
                    this.spawnComboText('¡Necesitas 30 🪙!');
                    return;
                }
            } else {
                const btn = document.getElementById('btn-buy-shield-ad');
                const origText = btn.innerText;
                btn.disabled = true;
                btn.innerText = '⏳...';
                const grantShield = () => {
                    btn.innerText = '✓ LISTO';
                    this.boosterShieldActive = true;
                    document.getElementById('status-shield-active').innerText = 'SÍ';
                    document.getElementById('booster-shield').classList.add('active');
                    window.audioManager.playVictory();
                    this.saveProgress();
                };
                if (window.GamerVerse && typeof window.GamerVerse.showRewardedAd === 'function') {
                    window.GamerVerse.showRewardedAd(grantShield, () => {
                        btn.disabled = false;
                        btn.innerText = origText;
                        this.spawnComboText('⚠️ Anuncio no disponible');
                    }, 'Desbloquear Escudo con Monetag');
                } else {
                    btn.disabled = false;
                    btn.innerText = origText;
                }
                return;
            }
            document.getElementById('status-shield-active').innerText = 'SÍ';
            document.getElementById('booster-shield').classList.add('active');
        } else if (type === 'compass') {
            if (this.boosterCompassActive) return;
            if (method === 'coins') {
                if (this.coins >= 25) {
                    this.coins -= 25;
                    this.boosterCompassActive = true;
                    window.audioManager.playVictory();
                } else {
                    this.spawnComboText('¡Necesitas 25 🪙!');
                    return;
                }
            } else {
                const btn = document.getElementById('btn-buy-compass-ad');
                const origText = btn.innerText;
                btn.disabled = true;
                btn.innerText = '⏳...';
                const grantCompass = () => {
                    btn.innerText = '✓ LISTO';
                    this.boosterCompassActive = true;
                    document.getElementById('status-compass-active').innerText = 'SÍ';
                    document.getElementById('booster-compass').classList.add('active');
                    window.audioManager.playVictory();
                    this.saveProgress();
                };
                if (window.GamerVerse && typeof window.GamerVerse.showRewardedAd === 'function') {
                    window.GamerVerse.showRewardedAd(grantCompass, () => {
                        btn.disabled = false;
                        btn.innerText = origText;
                        this.spawnComboText('⚠️ Anuncio no disponible');
                    }, 'Desbloquear Brújula con Monetag');
                } else {
                    btn.disabled = false;
                    btn.innerText = origText;
                }
                return;
            }
            document.getElementById('status-compass-active').innerText = 'SÍ';
            document.getElementById('booster-compass').classList.add('active');
        }
        this.saveProgress();
    }

    reviveWithAd() {
        const btn = document.getElementById('btn-revive-ad');
        const original = btn.innerHTML;
        btn.innerText = '⏳ CARGANDO ANUNCIO...';
        btn.disabled = true;

        const restoreLives = () => {
            btn.innerHTML = original;
            btn.disabled = false;
            this.lives = this.maxLives;
            this.updateHUD();
            this.closeModal('modal-gameover');
            window.audioManager.playVictory();
            this.spawnComboText('❤️ +3 VIDAS RESTAURADAS');
        };
        const failAd = () => {
            btn.innerHTML = original;
            btn.disabled = false;
            this.spawnComboText('⚠️ Anuncio no disponible');
        };

        if (window.GamerVerse && typeof window.GamerVerse.showRewardedAd === 'function') {
            window.GamerVerse.showRewardedAd(restoreLives, failAd, 'Revivir con Monetag');
        } else {
            failAd();
        }
    }

    reviveWithCoins() {
        if (this.coins >= 50) {
            this.coins -= 50;
            this.lives = this.maxLives;
            this.saveProgress();
            this.closeModal('modal-gameover');
            window.audioManager.playVictory();
        } else {
            this.spawnComboText('¡Necesitas 50 🪙!');
        }
    }

    // Distancia punto a segmento para toques ultra precisos en móvil
    distToSegment(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    }

    handleTap(touchX, touchY) {
        if (!this.hasActiveTicket) return;

        const { x: ox, y: oy, cellSize } = this.gridOffset;
        let bestLine = null;
        let bestDist = Math.max(12, cellSize * 0.65);

        for (const line of this.lines) {
            if (line.cleared || line.escaping) continue;

            // Revisar distancia contra cada nodo y cada segmento de la línea
            for (let i = 0; i < line.nodes.length; i++) {
                const n1 = line.nodes[i];
                const x1 = ox + n1.x * cellSize;
                const y1 = oy + n1.y * cellSize;

                const dNode = Math.hypot(touchX - x1, touchY - y1);
                if (dNode < bestDist) {
                    bestDist = dNode;
                    bestLine = line;
                }

                if (i < line.nodes.length - 1) {
                    const n2 = line.nodes[i + 1];
                    const x2 = ox + n2.x * cellSize;
                    const y2 = oy + n2.y * cellSize;
                    const dSeg = this.distToSegment(touchX, touchY, x1, y1, x2, y2);
                    if (dSeg < bestDist) {
                        bestDist = dSeg;
                        bestLine = line;
                    }
                }
            }
        }

        if (bestLine) {
            this.tryMoveLine(bestLine);
        }
    }

    tryMoveLine(line) {
        if (line.cleared || line.escaping) return;
        const activeLines = this.lines.filter(l => !l.cleared && !l.escaping);
        const gridCols = this.levelData.grid.cols;
        const gridRows = this.levelData.grid.rows;

        const canEscape = window.levelSolver.canLineEscape(line, activeLines, gridCols, gridRows, this.levelData);

        if (canEscape) {
            // Snapshot ligero para Undo instantáneo (<0.05ms en 100 flechas)
            this.history.push(this.lines.map(l => !!(l.cleared || l.escaping)));
            line.escaping = true;
            window.audioManager.playSlide();
            this.triggerHaptic('light');
            this.spawnParticles(line);

            if (this.hintLineId === line.id) this.hintLineId = null;
            if (this.compassHighlightIds) {
                this.compassHighlightIds = this.compassHighlightIds.filter(id => id !== line.id);
            }

            const now = Date.now();
            if (now - this.lastEscapeTime < 1800) {
                this.comboCount++;
                const bonus = this.comboCount * 5;
                const pts = 15 + this.comboCount * 10;
                this.coins += bonus;
                this.score += pts;
                this.spawnComboText(`COMBO x${this.comboCount}! +${pts} pts`);
            } else {
                this.comboCount = 1;
                this.score += 15;
            }
            this.lastEscapeTime = now;
            this.updateHUD();

            this.animations = this.animations.filter(a => a.line.id !== line.id);
            this.animations.push({
                line: line,
                type: 'ESCAPE',
                progress: 0,
                maxProgress: line.nodes.length + Math.max(gridCols, gridRows) + 2
            });
        } else {
            if (this.boosterShieldActive) {
                this.boosterShieldActive = false;
                document.getElementById('status-shield-active').innerText = 'NO';
                document.getElementById('booster-shield').classList.remove('active');
                window.audioManager.playVictory();
                this.triggerHaptic('warning');
                this.spawnComboText('🛡️ ¡ESCUDO ABSORBIÓ EL CHOQUE!');

                const head = line.nodes[line.nodes.length - 1];
                const { x: ox, y: oy, cellSize } = this.gridOffset;
                for (let i = 0; i < 16; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 180 + Math.random() * 240;
                    this.particles.push({
                        x: ox + head.x * cellSize,
                        y: oy + head.y * cellSize,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        alpha: 1,
                        size: 3.5,
                        color: '#ffd700'
                    });
                }

                this.animations = this.animations.filter(a => a.line.id !== line.id);
                this.animations.push({ line, type: 'BOUNCE', progress: 0 });
                return;
            }

            window.audioManager.playBump();
            this.triggerHaptic('error');
            this.lives--;
            this.comboCount = 0;
            this.updateHUD();
            this.screenShake = 10;

            const head = line.nodes[line.nodes.length - 1];
            const { x: ox, y: oy, cellSize } = this.gridOffset;
            for (let i = 0; i < 12; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 150 + Math.random() * 220;
                this.particles.push({
                    x: ox + head.x * cellSize,
                    y: oy + head.y * cellSize,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1,
                    size: 3.2,
                    color: '#ff0055'
                });
            }

            this.animations = this.animations.filter(a => a.line.id !== line.id);
            this.animations.push({ line, type: 'BOUNCE', progress: 0 });

            if (this.lives <= 0) {
                if (window.GamerVerse) {
                    window.GamerVerse.submitScore('arrow_escape', this.score, this.coins);
                }
                setTimeout(() => {
                    this.openModal('modal-gameover');
                }, 350);
            }
        }
    }

    getDirVector(dir) {
        const map = {
            UP: { x: 0, y: -1 },
            DOWN: { x: 0, y: 1 },
            LEFT: { x: -1, y: 0 },
            RIGHT: { x: 1, y: 0 }
        };
        return map[dir] || { x: 0, y: 0 };
    }

    useHint() {
        if (!this.hasActiveTicket) return;
        if (this.hintsAvailable <= 0) {
            if (this.coins >= 20) {
                this.coins -= 20;
                this.hintsAvailable += 2;
                this.saveProgress();
                this.spawnComboText('💡 +2 Pistas (-20 🪙)');
            } else {
                this.spawnComboText('⏳ Viendo anuncio (+2 Pistas)...');
                setTimeout(() => {
                    this.hintsAvailable += 2;
                    this.saveProgress();
                    this.useHint();
                }, 800);
                return;
            }
        }

        const availableForHint = this.lines.filter(l => !l.cleared && !l.escaping);
        const hintId = window.levelSolver.findNextHintLine(
            availableForHint,
            this.levelData.grid.cols,
            this.levelData.grid.rows,
            this.levelData
        );

        if (hintId) {
            this.hintsAvailable--;
            this.hintLineId = hintId;
            window.audioManager.playHint();
            this.triggerHaptic('light');
            this.saveProgress();
            if (this.hintTimer) clearTimeout(this.hintTimer);
            this.hintTimer = setTimeout(() => { this.hintLineId = null; }, 4500);
        }
    }

    useUndo() {
        if (this.history.length > 0) {
            const snapshot = this.history.pop();
            this.animations = [];
            this.lines.forEach((l, idx) => {
                l.cleared = !!snapshot[idx];
                l.escaping = false;
                l.slitherProgress = 0;
                l.bounceProgress = 0;
            });
            window.audioManager.playPop();
            this.triggerHaptic('light');
            this.updateHUD();
        }
    }

    openLevelSelect() {
        const container = document.getElementById('level-grid-container');
        container.innerHTML = '';
        const figEmojis = ['🎄', '❤️', '🏠', '🐟', '⭐', '🚗', '🧍', '🚀'];

        for (let i = 1; i <= 40; i++) {
            const node = document.createElement('div');
            const isCurrent = i === this.currentLevelIndex;
            const isCompleted = i < this.furthestLevelIndex;
            const isLocked = i > this.furthestLevelIndex;

            let classes = ['level-node'];
            if (isCurrent) classes.push('current');
            else if (isCompleted) classes.push('completed');
            else if (isLocked) classes.push('locked');
            else classes.push('unlocked');

            node.className = classes.join(' ');

            if (i <= figEmojis.length) {
                node.innerHTML = `
                    <span style="font-size: 0.65rem; opacity: 0.8; line-height: 1;">${i}</span>
                    <span style="font-size: 1rem; margin-top: 1px;">${isLocked ? '🔒' : figEmojis[i - 1]}</span>
                `;
            } else if (i >= 24 && !isLocked) {
                const badge = i >= 30 ? '💀' : '🔥';
                node.innerHTML = `
                    <span style="font-size: 0.7rem; font-weight: 700; line-height: 1;">${i}</span>
                    <span style="font-size: 0.7rem; margin-top: 2px;">${badge}</span>
                `;
            } else {
                node.innerHTML = isLocked
                    ? `<span style="font-size: 0.65rem; opacity: 0.4; line-height: 1;">${i}</span><span style="font-size: 0.8rem; margin-top: 2px; opacity: 0.4;">🔒</span>`
                    : `<span style="font-size: 0.95rem;">${i}</span>`;
            }

            if (!isLocked) {
                node.addEventListener('click', () => {
                    this.closeModal('modal-levels');
                    this.loadLevel(i, this.hasActiveTicket);
                });
            }

            container.appendChild(node);
        }

        this.openModal('modal-levels');
    }

    setSkin(skinName) {
        this.currentSkin = skinName;
        const app = document.getElementById('app-container');
        if (skinName === 'manga') {
            app.classList.add('theme-manga');
        } else {
            app.classList.remove('theme-manga');
        }

        document.querySelectorAll('.shop-card').forEach(card => {
            if (card.hasAttribute('data-skin')) {
                card.classList.toggle('active', card.getAttribute('data-skin') === skinName);
            }
        });

        this.saveProgress();
    }

    openShop() {
        this.setSkin(this.currentSkin);
        this.openModal('modal-shop');
    }

    openModal(id) {
        document.getElementById(id).classList.add('active');
    }

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    checkVictory() {
        const remaining = this.lines.filter(l => !l.cleared).length;
        if (remaining === 0) {
            window.audioManager.playVictory();
            this.triggerHaptic('success');

            const earnedCoins = 25 + (this.lives * 5);
            const earnedPts = 120 + (this.currentLevelIndex * 30) + (this.lives * 40);
            this.coins += earnedCoins;
            this.score += earnedPts;

            // Desbloquear siguiente nivel de forma persistente
            if (this.currentLevelIndex + 1 > this.furthestLevelIndex) {
                this.furthestLevelIndex = this.currentLevelIndex + 1;
            }
            this.saveProgress();

            if (window.GamerVerse) {
                window.GamerVerse.submitScore('arrow_escape', this.score, this.coins);
            }

            let stars = '⭐⭐⭐';
            let ratingText = '¡PERFECTO!';
            if (this.lives === 2) {
                stars = '⭐⭐';
                ratingText = '¡EXCELENTE!';
            } else if (this.lives === 1) {
                stars = '⭐';
                ratingText = '¡COMPLETADO!';
            }

            document.getElementById('victory-stars').innerText = stars;
            document.getElementById('victory-rating').innerText = ratingText;
            const badge = document.getElementById('victory-coins-badge');
            if (badge) {
                badge.innerHTML = `+${earnedCoins} 🪙 ganadas · 🏆 +${earnedPts} pts`;
            }

            setTimeout(() => {
                this.openModal('modal-victory');
            }, 350);
        }
    }

    triggerHaptic(kind) {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            const hf = window.Telegram.WebApp.HapticFeedback;
            try {
                if (kind === 'light' || kind === 'medium' || kind === 'heavy') hf.impactOccurred(kind);
                else hf.notificationOccurred(kind);
            } catch (e) {}
        }
    }

    startLoop() {
        const loop = (now) => {
            const dt = this.lastFrameTime ? Math.min(0.05, (now - this.lastFrameTime) / 1000) : 0.016;
            this.lastFrameTime = now;
            this.update(dt);
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    update(dt = 0.016) {
        if (this.animations && this.animations.length > 0) {
            const speedCellsPerSec = (this.levelData && this.levelData.grid.cols >= 18) ? 95 : 65;
            const remainingAnims = [];
            let finishedAny = false;

            for (const anim of this.animations) {
                if (anim.type === 'ESCAPE') {
                    anim.progress += speedCellsPerSec * dt;
                    anim.line.slitherProgress = anim.progress;

                    if (anim.progress >= anim.maxProgress) {
                        anim.line.cleared = true;
                        anim.line.escaping = false;
                        anim.line.slitherProgress = 0;
                        window.audioManager.playPop();
                        finishedAny = true;
                    } else {
                        remainingAnims.push(anim);
                    }
                } else if (anim.type === 'BOUNCE') {
                    anim.progress += dt * 5.5;
                    anim.line.bounceProgress = Math.sin(Math.min(1, anim.progress) * Math.PI);

                    if (anim.progress >= 1) {
                        anim.line.bounceProgress = 0;
                    } else {
                        remainingAnims.push(anim);
                    }
                }
            }

            this.animations = remainingAnims;
            if (finishedAny) {
                this.updateHUD();
                this.checkVictory();
            }
        }

        if (this.floatingTexts && this.floatingTexts.length > 0) {
            for (const t of this.floatingTexts) {
                t.y -= 65 * dt;
                t.alpha -= 1.4 * dt;
            }
            this.floatingTexts = this.floatingTexts.filter(t => t.alpha > 0);
        }

        if (this.particles.length > 0) {
            for (const p of this.particles) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.alpha -= 3.8 * dt;
            }
            this.particles = this.particles.filter(p => p.alpha > 0);
        }
    }

    spawnComboText(text) {
        if (!this.floatingTexts) this.floatingTexts = [];
        this.floatingTexts.push({
            text: text,
            x: this.viewport.width / 2,
            y: this.viewport.height * 0.36,
            alpha: 1
        });
    }

    spawnParticles(line) {
        const { x: ox, y: oy, cellSize } = this.gridOffset;
        const head = line.nodes[line.nodes.length - 1];
        const px = ox + head.x * cellSize;
        const py = oy + head.y * cellSize;
        const col = this.getLineColor(line);

        for (let i = 0; i < 14; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 160 + Math.random() * 240;
            this.particles.push({
                x: px,
                y: py,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                size: 3.2,
                color: col
            });
        }
    }

    getLineColor(line) {
        if (this.currentSkin === 'manga') return '#111827';
        if (this.currentSkin === 'gold') return '#ffd700';
        return this.NEON_PALETTE[(line.id - 1) % this.NEON_PALETTE.length];
    }

    ensureGridDotsCache(width, height, ox, oy, cellSize, cols, rows) {
        const key = `${width}x${height}_${cols}x${rows}_${this.currentSkin}_${this.dpr}`;
        if (this.gridCacheCanvas && this.gridCacheKey === key) return;

        if (!this.gridCacheCanvas) {
            this.gridCacheCanvas = document.createElement('canvas');
        }
        this.gridCacheCanvas.width = Math.max(1, Math.floor(width * this.dpr));
        this.gridCacheCanvas.height = Math.max(1, Math.floor(height * this.dpr));
        const gctx = this.gridCacheCanvas.getContext('2d');
        gctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        gctx.clearRect(0, 0, width, height);

        gctx.fillStyle = (this.currentSkin === 'manga') ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
        gctx.beginPath();
        for (let r = 0; r < rows; r++) {
            const py = oy + r * cellSize;
            for (let c = 0; c < cols; c++) {
                const px = ox + c * cellSize;
                gctx.moveTo(px + 2.2, py);
                gctx.arc(px, py, 2.2, 0, Math.PI * 2);
            }
        }
        gctx.fill();
        this.gridCacheKey = key;
    }

    render() {
        const width = this.viewport.width;
        const height = this.viewport.height;
        this.ctx.clearRect(0, 0, width, height);

        if (!this.levelData) return;

        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
            this.screenShake *= 0.85;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        const cols = this.levelData.grid.cols;
        const rows = this.levelData.grid.rows;

        const margin = cols >= 18 ? 14 : 26;
        const maxW = width - margin * 2;
        const maxH = height - margin * 2;
        const cellSize = Math.min(maxW / cols, maxH / rows);

        const gridWidth = cols * cellSize;
        const gridHeight = rows * cellSize;
        const ox = (width - gridWidth) / 2 + cellSize / 2;
        const oy = (height - gridHeight) / 2 + cellSize / 2;

        this.gridOffset = { x: ox, y: oy, cellSize };

        // 1. Puntos de Cuadrícula cacheados en offscreen canvas (1 blit vs 616 draw calls)
        this.ensureGridDotsCache(width, height, ox, oy, cellSize, cols, rows);
        this.ctx.drawImage(this.gridCacheCanvas, 0, 0, width, height);

        // 2. Portales y Candados
        this.renderPortals(ox, oy, cellSize);
        this.renderLocks(ox, oy, cellSize);

        // 3. Flechas / Líneas
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            if (line.cleared) continue;
            this.renderSlitheringLine(line, ox, oy, cellSize, cols, rows);
        }

        // 4. Textos flotantes
        if (this.floatingTexts && this.floatingTexts.length > 0) {
            this.ctx.save();
            this.ctx.font = '900 1.15rem "Orbitron", sans-serif';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.textAlign = 'center';
            for (const t of this.floatingTexts) {
                this.ctx.globalAlpha = Math.max(0, t.alpha);
                this.ctx.fillText(t.text, t.x, t.y);
            }
            this.ctx.restore();
        }

        // 5. Partículas (explosión ágil sin save/restore por partícula)
        if (this.particles.length > 0) {
            this.ctx.save();
            for (const p of this.particles) {
                if (p.alpha <= 0) continue;
                this.ctx.globalAlpha = Math.max(0, p.alpha);
                this.ctx.fillStyle = p.color;
                const r = (p.size || 3.2) * (0.45 + p.alpha * 0.55);
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    renderPortals(ox, oy, cellSize) {
        if (!this.levelData || !this.levelData.portals) return;
        const time = Date.now() * 0.003;

        this.levelData.portals.forEach((p) => {
            const colors = ['#00f0ff', '#ff3d7f'];
            [p.a, p.b].forEach((node, i) => {
                const px = ox + node.x * cellSize;
                const py = oy + node.y * cellSize;

                this.ctx.save();
                this.ctx.translate(px, py);
                this.ctx.rotate(time * (i === 0 ? 1 : -1));

                this.ctx.shadowColor = colors[i];
                this.ctx.shadowBlur = 12;
                this.ctx.strokeStyle = colors[i];
                this.ctx.lineWidth = 2.5;

                this.ctx.beginPath();
                this.ctx.arc(0, 0, cellSize * 0.38, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.lineWidth = 1.5;
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, cellSize * 0.22, a, a + Math.PI / 3);
                    this.ctx.stroke();
                }

                this.ctx.restore();
            });
        });
    }

    renderLocks(ox, oy, cellSize) {
        if (!this.levelData || !this.levelData.locks) return;
        const keyActive = this.levelData.keyLineId && this.lines.some(l => l.id === this.levelData.keyLineId && !l.cleared && !l.escaping);
        if (!keyActive) return;

        this.levelData.locks.forEach(lock => {
            const px = ox + lock.x * cellSize;
            const py = oy + lock.y * cellSize;

            this.ctx.save();
            this.ctx.shadowColor = '#ff4070';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#ff4070';

            this.ctx.beginPath();
            this.ctx.arc(px, py - 4, 6, Math.PI, 0);
            this.ctx.strokeStyle = '#ff4070';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();

            this.ctx.fillRect(px - 9, py - 3, 18, 14);

            this.ctx.fillStyle = '#04060f';
            this.ctx.beginPath();
            this.ctx.arc(px, py + 2, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillRect(px - 1, py + 2, 2, 5);

            this.ctx.restore();
        });
    }

    renderSlitheringLine(line, ox, oy, cellSize, cols, rows) {
        const isHint = (line.id === this.hintLineId);
        const isHighlight = this.compassHighlightIds && this.compassHighlightIds.includes(line.id);
        const slither = line.slitherProgress || 0;
        const bounce = line.bounceProgress || 0;

        let currentPoints;
        if (slither === 0 && bounce === 0) {
            // Fast path sin asignaciones extra para flechas estáticas (60 FPS en tableros de 100 flechas)
            currentPoints = new Array(line.nodes.length);
            for (let i = 0; i < line.nodes.length; i++) {
                const n = line.nodes[i];
                currentPoints[i] = { x: ox + n.x * cellSize, y: oy + n.y * cellSize };
            }
        } else {
            const path = [...line.nodes];
            const head = path[path.length - 1];
            const dirVec = this.getDirVector(line.dir);

            const extensionSteps = Math.max(cols, rows) + 5;
            const portals = this.levelData.portals || [];
            let cx = head.x;
            let cy = head.y;

            for (let s = 1; s <= extensionSteps; s++) {
                cx += dirVec.x;
                cy += dirVec.y;

                if (portals.length > 0) {
                    for (const portal of portals) {
                        if (portal.a.x === cx && portal.a.y === cy) {
                            cx = portal.b.x;
                            cy = portal.b.y;
                            break;
                        } else if (portal.b.x === cx && portal.b.y === cy) {
                            cx = portal.a.x;
                            cy = portal.a.y;
                            break;
                        }
                    }
                }
                path.push({ x: cx, y: cy });
            }

            const bounceDx = dirVec.x * bounce * 0.3;
            const bounceDy = dirVec.y * bounce * 0.3;

            currentPoints = [];
            for (let i = 0; i < line.nodes.length; i++) {
                const pathDist = i + slither;
                const p = this.interpolatePath(path, pathDist);
                if (p) {
                    currentPoints.push({
                        x: ox + (p.x + bounceDx) * cellSize,
                        y: oy + (p.y + bounceDy) * cellSize
                    });
                }
            }
        }

        if (currentPoints.length === 0) return;

        let lineColor = this.getLineColor(line);
        let glowColor = lineColor;

        if (isHint) {
            const pulse = 0.65 + Math.abs(Math.sin(Date.now() * 0.008)) * 0.35;
            lineColor = '#ffffff';
            glowColor = `rgba(255, 215, 0, ${pulse})`;
        } else if (isHighlight) {
            const pulse = 0.5 + Math.abs(Math.sin(Date.now() * 0.005)) * 0.5;
            lineColor = '#ffd700';
            glowColor = `rgba(255, 215, 0, ${pulse})`;
        }

        this.ctx.save();

        const finerLineWidth = Math.min(8, Math.max(3, cellSize * 0.21));
        this.ctx.lineWidth = isHint ? finerLineWidth + 2.5 : finerLineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.strokeStyle = lineColor;
        // Reservar shadowBlur GPU solo para Pista/Highlight o flecha en movimiento (evita 200 blurs/frame)
        if (isHint || isHighlight || slither > 0) {
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = isHint ? 18 : 8;
        } else {
            this.ctx.shadowBlur = 0;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        for (let i = 1; i < currentPoints.length; i++) {
            const p1 = currentPoints[i - 1];
            const p2 = currentPoints[i];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

            if (dist > cellSize * 1.8) {
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(p2.x, p2.y);
            } else {
                this.ctx.lineTo(p2.x, p2.y);
            }
        }
        this.ctx.stroke();

        // Cola circular
        const tailPt = currentPoints[0];
        this.ctx.fillStyle = lineColor;
        this.ctx.beginPath();
        this.ctx.arc(tailPt.x, tailPt.y, finerLineWidth * 0.65, 0, Math.PI * 2);
        this.ctx.fill();

        // Punta de flecha
        const animatedFront = currentPoints[currentPoints.length - 1];
        this.renderElegantChevron(animatedFront.x, animatedFront.y, line.dir, lineColor, finerLineWidth, isHint || isHighlight || slither > 0);

        // Anillo pulsante de Pista
        if (isHint) {
            const ringR = cellSize * (0.45 + Math.abs(Math.sin(Date.now() * 0.008)) * 0.25);
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.arc(animatedFront.x, animatedFront.y, ringR, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Llave flotante
        const keyActive = this.levelData.keyLineId && this.lines.some(l => l.id === this.levelData.keyLineId && !l.cleared && !l.escaping);
        if (line.id === this.levelData.keyLineId && keyActive) {
            this.ctx.save();
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 8;
            this.ctx.fillStyle = '#ffd700';
            const kx = animatedFront.x - 10;
            const ky = animatedFront.y - 16;
            this.ctx.translate(kx, ky);
            this.ctx.beginPath();
            this.ctx.arc(4, 4, 3, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            this.ctx.fillRect(7, 3, 8, 2);
            this.ctx.fillRect(11, 5, 2, 3);
            this.ctx.fillRect(13, 5, 2, 3);
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    interpolatePath(path, dist) {
        if (dist <= 0) return { ...path[0] };
        if (dist >= path.length - 1) return { ...path[path.length - 1] };

        const idx = Math.floor(dist);
        const t = dist - idx;
        const p1 = path[idx];
        const p2 = path[idx + 1];

        return {
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
        };
    }

    renderElegantChevron(x, y, dir, color, strokeWidth, useGlow = false) {
        this.ctx.save();
        this.ctx.translate(x, y);

        const angles = { UP: -Math.PI / 2, DOWN: Math.PI / 2, LEFT: Math.PI, RIGHT: 0 };
        this.ctx.rotate(angles[dir] || 0);

        const s = strokeWidth * 1.65;

        this.ctx.fillStyle = color;
        if (useGlow) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.shadowBlur = 0;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(s * 1.2, 0);
        this.ctx.lineTo(-s * 0.5, -s * 0.9);
        this.ctx.lineTo(-s * 0.05, 0);
        this.ctx.lineTo(-s * 0.5, s * 0.9);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new ArrowEscapeGame();
});
