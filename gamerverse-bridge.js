/**
 * GamerVerse Unified Bridge & Anti-Cheat SDK
 * Diseñado para AstronautRunner, SaveTheAstronaut y ArrowEscape.
 * 
 * Funcionalidades:
 * 1. Anclaje de Telegram WebApp y bloqueo de gestos pull-down (cierre accidental).
 * 2. Control estricto de Tickets (1 partida = 1 Ticket).
 * 3. Motor unificado de anuncios Monetag (Rewarded Interstitial + In-App Interstitial).
 * 4. Cifrado y validación de consistencia temporal Anti-Cheat.
 * 5. Botón de compartir nativo en Telegram con enlace de referido viral.
 */

(function (window) {
    'use strict';

    const GamerVerse = {
        version: '1.4.0',
        brandName: 'GameVerse 307',
        apiBase: '', // Resuelto dinámicamente en resolveApiBase()
        botUsername: (typeof window !== 'undefined' && window.GAMEVERSE_BOT_USERNAME) || 'GameServer307_bot',

        // Configuración centralizada de Monetag (Telegram Mini App / Web SDK)
        // Pega aquí tu Zone ID numérico de Monetag cuando lo crees, o define window.MONETAG_ZONE_ID
        monetag: {
            zoneId: '12242572',
            interstitialZoneId: '12242572',
            inAppStarted: false,
            loadingPromise: null
        },

        // Estado del jugador
        user: {
            id: null,
            username: 'Astronauta',
            firstName: 'Jugador',
            tickets: 5, // Saldo inicial por defecto
            coins: 0,
            initData: ''
        },

        jackpot: {
            amount: 10.00,
            countdown: '--'
        },

        // Métricas de la partida activa
        session: {
            startTime: 0,
            endTime: 0,
            framesRendered: 0,
            active: false
        },

        resolveApiBase: function () {
            const metaApi = document.querySelector('meta[name="gameverse-api"]');
            const configured = window.GAMEVERSE_API_BASE || (metaApi && metaApi.content) || localStorage.getItem('gv_api_base') || '';
            if (configured) {
                this.apiBase = String(configured).replace(/\/$/, '');
            } else if (this.isLocalDevEnv()) {
                this.apiBase = 'http://localhost:3001/api';
            } else {
                this.apiBase = 'https://gameverse307-api.onrender.com/api';
            }
            return this.apiBase;
        },

        // Inicialización
        init: function () {
            this.resolveApiBase();
            this.initTelegram();
            this.loadLocalState();
            this.injectStylesAndModals();
            this.initMonetag();
            this.activeGame = this.detectActiveGame();
            this.resolveCountryCode().then(() => {
                this.syncUser();
                this.startHeartbeat();
            });
            console.log('🚀 GameVerse 307 SDK initialized. User:', this.user);
        },

        detectActiveGame: function () {
            const p = ((window.location && window.location.pathname) || '').toLowerCase();
            if (p.includes('savetheastronaut')) return 'save_the_astronaut';
            if (p.includes('astronautrunner')) return 'astronaut_runner';
            if (p.includes('arrowescape')) return 'arrow_escape';
            if (p.includes('cosmicblocks')) return 'cosmic_blocks';
            if (p.includes('cosmichexagon')) return 'cosmic_hexagon';
            if (p.includes('planethit')) return 'planet_hit';
            if (p.includes('neonbreaker')) return 'neon_breaker';
            return 'hub';
        },

        setActiveGame: function (gameId) {
            this.activeGame = gameId || 'hub';
            this.sendHeartbeat();
        },

        resolveCountryCode: function () {
            if (this.countryCode && this.countryCode !== 'UN') {
                return Promise.resolve(this.countryCode);
            }
            const cached = sessionStorage.getItem('gv_country_code');
            if (cached && /^[A-Z]{2}$/.test(cached)) {
                this.countryCode = cached;
                return Promise.resolve(cached);
            }
            if (this.isLocalDevEnv()) {
                this.countryCode = 'UN';
                return Promise.resolve('UN');
            }
            return fetch('/api/geo')
                .then(r => (r.ok ? r.json() : null))
                .then(d => {
                    const code = (d && d.country && /^[A-Z]{2}$/.test(d.country)) ? d.country : 'UN';
                    this.countryCode = code;
                    if (code !== 'UN') sessionStorage.setItem('gv_country_code', code);
                    return code;
                })
                .catch(() => {
                    this.countryCode = 'UN';
                    return 'UN';
                });
        },

        sendHeartbeat: function () {
            if (!this.apiBase || !this.user.id || !this.user.initData) return Promise.resolve(null);
            return fetch(`${this.apiBase}/presence/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.user.id,
                    activeGame: this.activeGame || this.detectActiveGame(),
                    countryCode: this.countryCode || 'UN',
                    languageCode: this.languageCode || navigator.language || '',
                    initData: this.user.initData || ''
                })
            }).catch(() => null);
        },

        startHeartbeat: function () {
            if (this._heartbeatTimer) return;
            let isTop = true;
            try { isTop = (window.top === window); } catch (_) {}
            if (!isTop) return; // El Hub padre reporta por la sesión completa
            this._heartbeatTimer = setInterval(() => {
                if (!document.hidden) this.sendHeartbeat();
            }, 30000);
        },

        // 1. Configuración de Telegram WebApp
        initTelegram: function () {
            this.languageCode = (navigator && navigator.language) || '';
            if (window.Telegram && window.Telegram.WebApp) {
                const tg = window.Telegram.WebApp;
                tg.ready();
                tg.expand();

                // Bloquear pull-down para que no se cierre el juego en iOS/Android
                if (typeof tg.disableVerticalSwipes === 'function') {
                    tg.disableVerticalSwipes();
                }

                // Capturar datos del usuario si existen
                this.user.initData = tg.initData || '';
                if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                    this.user.id = tg.initDataUnsafe.user.id;
                    this.user.username = tg.initDataUnsafe.user.username || 'Astro';
                    this.user.firstName = tg.initDataUnsafe.user.first_name || 'Piloto';
                    if (tg.initDataUnsafe.user.language_code) {
                        this.languageCode = tg.initDataUnsafe.user.language_code;
                    }
                }
            }

            if (!this.user.id) {
                // ID numérico estable local para navegador de escritorio / pruebas
                let localId = localStorage.getItem('gv_guest_id');
                if (!localId || !/^\d+$/.test(localId)) {
                    localId = String(Math.floor(100000000 + Math.random() * 899999999));
                    localStorage.setItem('gv_guest_id', localId);
                }
                this.user.id = parseInt(localId, 10);
            }
        },

        loadLocalState: function () {
            const savedTickets = localStorage.getItem('gv_tickets');
            if (savedTickets !== null) {
                this.user.tickets = parseInt(savedTickets, 10);
            } else {
                this.user.tickets = 5; // Saldo de cortesía inicial
                this.saveLocalState();
            }
            const lastDaily = parseInt(localStorage.getItem('gv_last_daily') || '0', 10);
            if (!lastDaily || Date.now() - lastDaily >= 86400000) {
                if (lastDaily > 0) {
                    this.user.tickets += 3;
                    this.saveLocalState();
                }
                localStorage.setItem('gv_last_daily', String(Date.now()));
            }
        },

        notifyStateUpdated: function () {
            try {
                window.dispatchEvent(new CustomEvent('gv-state-updated', {
                    detail: { user: this.user, jackpot: this.jackpot }
                }));
            } catch (_) {}
        },

        syncUser: function (callback) {
            if (!this.apiBase) {
                this.notifyStateUpdated();
                if (typeof callback === 'function') callback(null);
                return Promise.resolve(null);
            }
            return fetch(`${this.apiBase}/user/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.user.id,
                    username: this.user.username,
                    firstName: this.user.firstName,
                    initData: this.user.initData,
                    countryCode: this.countryCode || 'UN',
                    languageCode: this.languageCode || '',
                    activeGame: this.activeGame || this.detectActiveGame()
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data && data.success) {
                    if (!data.guest && typeof data.tickets === 'number') {
                        this.user.tickets = data.tickets;
                        this.saveLocalState();
                    }
                    if (typeof data.coins === 'number') this.user.coins = data.coins;
                    if (typeof data.walletAddress === 'string') {
                        this.user.walletAddress = data.walletAddress;
                        if (data.walletAddress) localStorage.setItem('gv_wallet_address', data.walletAddress);
                    }
                    if (typeof data.jackpot === 'number') this.jackpot.amount = data.jackpot;
                    if (data.countdown) this.jackpot.countdown = data.countdown;
                    if (data.tournament) this.jackpot.tournament = data.tournament;
                    this.notifyStateUpdated();
                }
                if (typeof callback === 'function') callback(data);
                return data;
            })
            .catch(() => {
                this.notifyStateUpdated();
                if (typeof callback === 'function') callback(null);
                return null;
            });
        },

        saveLocalState: function () {
            localStorage.setItem('gv_tickets', this.user.tickets);
        },

        // 2. Control de Tickets
        canPlay: function () {
            return this.user.tickets >= 1;
        },

        consumeTicket: function () {
            if (this.user.tickets >= 1) {
                this.user.tickets--;
                this.saveLocalState();
                this.session.startTime = Date.now();
                this.session.framesRendered = 0;
                this.session.active = true;

                // Notificar al Hub padre si estamos en iframe
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        type: 'GV_TICKET_CONSUMED',
                        tickets: this.user.tickets
                    }, '*');
                }

                // Sincronizar en segundo plano con el backend (solo usuarios autenticados de Telegram)
                if (this.apiBase && this.user.initData) {
                    fetch(`${this.apiBase}/ticket/consume`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: this.user.id, initData: this.user.initData })
                    }).catch(() => { /* offline fallback */ });
                }
                this.notifyStateUpdated();

                return true;
            }
            return false;
        },

        addTicketFromAd: function (onSuccess) {
            this.user.tickets++;
            this.saveLocalState();
            this.notifyStateUpdated();

            // Notificar al Hub
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'GV_TICKET_ADDED',
                    tickets: this.user.tickets
                }, '*');
            }

            // Sincronizar con el backend y alimentar el Bote (solo usuarios autenticados de Telegram)
            if (this.apiBase && this.user.initData) {
                fetch(`${this.apiBase}/ticket/ad-reward`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.user.id, initData: this.user.initData })
                }).then(r => r.json()).then(d => {
                    if (d && typeof d.current_jackpot === 'number') {
                        this.jackpot.amount = d.current_jackpot;
                        this.notifyStateUpdated();
                    }
                }).catch(() => {});
            }

            if (typeof onSuccess === 'function') onSuccess(this.user.tickets);
        },

        // 3. Blindaje Anti-Cheat al terminar partida
        recordFrame: function () {
            if (this.session.active) {
                this.session.framesRendered++;
            }
        },

        submitScore: function (gameId, distance, coins) {
            this.session.endTime = Date.now();
            this.session.active = false;
            const durationMs = Math.max(1000, this.session.endTime - this.session.startTime);

            // Verificación matemática de consistencia temporal:
            // En AstronautRunner el avance estándar es ~1m por cada 100ms.
            // Con turbos máximos nunca puede superar 1m por cada 70ms.
            const maxPermittedDistance = Math.floor(durationMs / 70) + 60;
            const isSuspicious = distance > maxPermittedDistance && durationMs > 5000;

            const payload = {
                userId: this.user.id,
                initData: this.user.initData || '',
                gameId: gameId || 'astronaut_runner',
                score: distance,
                coins: coins || 0,
                durationMs: durationMs,
                frames: this.session.framesRendered,
                hash: btoa(`${this.user.id}:${distance}:${durationMs}:${coins}:${this.session.framesRendered}`),
                isFlagged: isSuspicious
            };

            // Notificar al Hub en tiempo real
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'GV_SCORE_SUBMITTED',
                    data: payload
                }, '*');
            }

            // Enviar a la base de datos (solo usuarios autenticados de Telegram)
            if (this.apiBase && this.user.initData) {
                fetch(`${this.apiBase}/score/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(r => r.json()).then(data => {
                    if (data.flagged) {
                        console.warn('⚠️ Anti-Cheat Alerta: Puntuación marcada para auditoría:', data.reason);
                    } else {
                        console.log('✅ Puntuación validada y registrada en el Leaderboard.');
                    }
                }).catch(() => {});
            }

            return payload;
        },

        // 4. Compartir Récord Viral en Telegram con enlace de referido
        shareOnTelegram: function (score) {
            return this.shareRecordToTelegram(score);
        },

        shareRecordToTelegram: function (distance) {
            const botUser = this.botUsername;
            const refLink = `https://t.me/${botUser}?start=ref_${this.user.id}`;
            const text = `¡Hice ${distance}m en Astronaut Runner! 🚀 ¿Crees que puedes superarme y ganar parte del Bote Semanal en USDT? Juega gratis aquí 🎟️`;
            const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;

            if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.openTelegramLink === 'function') {
                window.Telegram.WebApp.openTelegramLink(telegramUrl);
            } else if (navigator.share) {
                navigator.share({
                    title: 'GamerVerse | Astronaut Runner',
                    text: text,
                    url: refLink
                }).catch(() => { window.open(telegramUrl, '_blank'); });
            } else {
                window.open(telegramUrl, '_blank');
            }
        },

        // 4B. Motor Unificado de Anuncios Monetag (Reemplaza AdMob en todo GamerVerse)
        isLocalDevEnv: function () {
            const host = (window.location && window.location.hostname) || '';
            const proto = (window.location && window.location.protocol) || '';
            return host === 'localhost' || host === '127.0.0.1' || host === '' || proto === 'file:';
        },

        resolveMonetagZones: function () {
            const metaReward = document.querySelector('meta[name="monetag-zone"]');
            const metaInter = document.querySelector('meta[name="monetag-interstitial-zone"]');
            const zReward = window.MONETAG_ZONE_ID || (metaReward && metaReward.content) || localStorage.getItem('gv_monetag_zone_id') || this.monetag.zoneId || '';
            const zInter = window.MONETAG_INTERSTITIAL_ZONE_ID || (metaInter && metaInter.content) || localStorage.getItem('gv_monetag_interstitial_zone_id') || this.monetag.interstitialZoneId || zReward;
            this.monetag.zoneId = String(zReward).trim();
            this.monetag.interstitialZoneId = String(zInter).trim();
        },

        setMonetagZone: function (zoneId, interstitialZoneId) {
            this.monetag.zoneId = String(zoneId || '').trim();
            this.monetag.interstitialZoneId = String(interstitialZoneId || zoneId || '').trim();
            if (this.monetag.zoneId) {
                localStorage.setItem('gv_monetag_zone_id', this.monetag.zoneId);
            }
            if (this.monetag.interstitialZoneId) {
                localStorage.setItem('gv_monetag_interstitial_zone_id', this.monetag.interstitialZoneId);
            }
            this.monetag.loadingPromise = null;
            return this.initMonetag();
        },

        initMonetag: function () {
            this.resolveMonetagZones();
            const zoneId = this.monetag.zoneId;
            if (!zoneId) {
                if (this.isLocalDevEnv()) {
                    console.log('📺 Monetag: sin Zone ID todavía — vista previa local activa.');
                } else {
                    console.warn('📺 Monetag: falta configurar MONETAG_ZONE_ID en producción.');
                }
                return Promise.resolve(false);
            }
            return this.loadMonetagSdk(zoneId).then((ready) => ready);
        },

        loadMonetagSdk: function (zoneId) {
            if (!zoneId) return Promise.resolve(false);
            if (typeof window['show_' + zoneId] === 'function') {
                return Promise.resolve(true);
            }
            if (this.monetag.loadingPromise) return this.monetag.loadingPromise;

            this.monetag.loadingPromise = new Promise((resolve) => {
                const existing = document.querySelector(`script[data-zone="${zoneId}"]`);
                if (!existing) {
                    const script = document.createElement('script');
                    script.src = 'https://libtl.com/sdk.js';
                    script.async = true;
                    script.setAttribute('data-zone', zoneId);
                    script.setAttribute('data-sdk', 'show_' + zoneId);
                    script.onerror = () => resolve(false);
                    document.head.appendChild(script);
                }

                const started = Date.now();
                const timer = setInterval(() => {
                    if (typeof window['show_' + zoneId] === 'function') {
                        clearInterval(timer);
                        resolve(true);
                    } else if (Date.now() - started >= 5000) {
                        clearInterval(timer);
                        resolve(false);
                    }
                }, 120);
            });
            return this.monetag.loadingPromise;
        },

        showDevPreviewAd: function (seconds, label, onDone) {
            const overlay = document.getElementById('gv-monetag-dev-overlay');
            const timerEl = document.getElementById('gv-monetag-dev-timer');
            const labelEl = document.getElementById('gv-monetag-dev-label');
            if (!overlay || !timerEl) {
                setTimeout(() => { if (typeof onDone === 'function') onDone(); }, seconds * 1000);
                return;
            }
            if (labelEl) labelEl.innerText = label || 'Vista previa Monetag (modo local)';
            let left = seconds;
            timerEl.innerText = left;
            overlay.style.display = 'flex';
            const iv = setInterval(() => {
                left--;
                timerEl.innerText = Math.max(0, left);
                if (left <= 0) {
                    clearInterval(iv);
                    overlay.style.display = 'none';
                    if (typeof onDone === 'function') onDone();
                }
            }, 1000);
        },

        showRewardedAd: function (onRewardSuccess, onRewardFail, label) {
            try {
                if (window.top && window.top !== window && window.top.GamerVerse && typeof window.top.GamerVerse.showRewardedAd === 'function') {
                    window.top.GamerVerse.showRewardedAd(onRewardSuccess, onRewardFail, label);
                    return;
                }
            } catch (_) {}

            this.resolveMonetagZones();
            const zoneId = this.monetag.zoneId;

            const handleSuccess = (res) => {
                try {
                    if (typeof onRewardSuccess === 'function') onRewardSuccess(res);
                } catch (e) {
                    console.error('Error en callback onRewardSuccess:', e);
                }
            };

            const handleFail = (err) => {
                try {
                    if (typeof onRewardFail === 'function') {
                        onRewardFail(err);
                    } else if (typeof onRewardSuccess === 'function') {
                        // Seguridad UX: si el juego no definió callback de error,
                        // nunca dejar al jugador congelado o atrapado en Game Over
                        onRewardSuccess(err);
                    }
                } catch (e) {
                    console.error('Error en callback onRewardFail:', e);
                }
            };

            if (!zoneId) {
                if (this.isLocalDevEnv()) {
                    this.showDevPreviewAd(3, label || 'Anuncio Recompensado Monetag (Preview)', handleSuccess);
                } else {
                    console.warn('Monetag Rewarded bloqueado: falta Zone ID en producción.');
                    handleFail('missing_zone');
                }
                return;
            }

            this.loadMonetagSdk(zoneId).then((ready) => {
                const showFn = window['show_' + zoneId];
                if (!ready || typeof showFn !== 'function') {
                    console.warn('Monetag SDK no disponible o bloqueado por adblock.');
                    handleFail('sdk_unavailable');
                    return;
                }
                const adOpenedAt = Date.now();
                try {
                    Promise.resolve(showFn()).then((result) => {
                        console.log('✅ Monetag rewarded completado y cerrado por el usuario:', result);
                        handleSuccess(result);
                    }).catch((err) => {
                        const elapsed = Date.now() - adOpenedAt;
                        console.warn(`Monetag ad sesión cerrada (${elapsed}ms):`, err);
                        // Al pulsar la 'X' para cerrar el anuncio tras visualizarlo, Monetag puede
                        // emitir un rechazo con el evento de cierre o string del usuario.
                        // Si pasaron >= 800ms, el anuncio se mostró y cerró: conceder recompensa siempre.
                        if (elapsed >= 800) {
                            handleSuccess(err);
                        } else {
                            handleFail(err);
                        }
                    });
                } catch (err) {
                    console.warn('Monetag invocation error:', err);
                    handleFail(err);
                }
            });
        },

        showInterstitialAd: function (onCloseCallback) {
            try {
                if (window.top && window.top !== window && window.top.GamerVerse && typeof window.top.GamerVerse.showInterstitialAd === 'function') {
                    window.top.GamerVerse.showInterstitialAd(onCloseCallback);
                    return;
                }
            } catch (_) {}

            this.resolveMonetagZones();
            const zoneId = this.monetag.interstitialZoneId || this.monetag.zoneId;
            const done = () => { if (typeof onCloseCallback === 'function') onCloseCallback(); };

            if (!zoneId) {
                if (this.isLocalDevEnv()) {
                    this.showDevPreviewAd(1, 'Intersticial Monetag (Preview)', done);
                } else {
                    done();
                }
                return;
            }

            this.loadMonetagSdk(zoneId).then((ready) => {
                const showFn = window['show_' + zoneId];
                if (!ready || typeof showFn !== 'function') {
                    done();
                    return;
                }
                try {
                    Promise.resolve(showFn()).catch(() => {}).finally(done);
                } catch (_) {
                    done();
                }
            });
        },

        // 5. Inyección de Modal de Tickets Insuficientes
        showNoTicketsModal: function (onRewardSuccess) {
            let modal = document.getElementById('gv-no-tickets-modal');
            if (!modal) return;
            modal.style.display = 'flex';

            const btnAd = document.getElementById('gv-btn-watch-ad');
            const btnShare = document.getElementById('gv-btn-invite-friends');
            const btnClose = document.getElementById('gv-btn-close-modal');

            btnAd.disabled = false;
            btnAd.innerText = '📺 Ver Anuncio (+1 🎟️)';

            btnAd.onclick = () => {
                btnAd.disabled = true;
                btnAd.innerText = 'Cargando Anuncio Monetag...';
                this.showRewardedAd(
                    () => {
                        this.addTicketFromAd(() => {
                            modal.style.display = 'none';
                            btnAd.disabled = false;
                            btnAd.innerText = '📺 Ver Anuncio (+1 🎟️)';
                            if (typeof onRewardSuccess === 'function') onRewardSuccess();
                        });
                    },
                    () => {
                        btnAd.disabled = false;
                        btnAd.innerText = '⚠️ Anuncio no disponible (Reintentar)';
                    },
                    'Recargando +1 Ticket con Monetag'
                );
            };

            btnShare.onclick = () => {
                this.shareRecordToTelegram(0);
            };

            btnClose.onclick = () => {
                modal.style.display = 'none';
            };
        },

        injectStylesAndModals: function () {
            if (document.getElementById('gv-styles')) return;

            const style = document.createElement('style');
            style.id = 'gv-styles';
            style.innerHTML = `
                #gv-no-tickets-modal {
                    display: none;
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(5, 3, 10, 0.92);
                    backdrop-filter: blur(10px);
                    z-index: 99999;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    font-family: 'Outfit', sans-serif;
                }
                .gv-modal-card {
                    background: linear-gradient(135deg, rgba(25, 15, 45, 0.95), rgba(10, 5, 20, 0.95));
                    border: 2px solid #ff5e57;
                    border-radius: 20px;
                    padding: 28px 22px;
                    width: 100%;
                    max-width: 360px;
                    text-align: center;
                    box-shadow: 0 0 35px rgba(255, 94, 87, 0.4);
                    color: #fff;
                }
                .gv-modal-title {
                    font-family: 'Orbitron', sans-serif;
                    font-size: 18px;
                    color: #ff5e57;
                    margin-bottom: 8px;
                    font-weight: 800;
                }
                .gv-modal-desc {
                    font-size: 13px;
                    color: #b0aabf;
                    margin-bottom: 20px;
                    line-height: 1.4;
                }
                .gv-btn-primary {
                    width: 100%;
                    padding: 12px;
                    border: none;
                    border-radius: 12px;
                    font-family: 'Orbitron', sans-serif;
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: transform 0.15s;
                }
                .gv-btn-primary:active { transform: scale(0.97); }
                .gv-btn-ad {
                    background: linear-gradient(135deg, #ffd32a 0%, #ff5e57 100%);
                    color: #05030a;
                    box-shadow: 0 0 15px rgba(255, 211, 42, 0.35);
                }
                .gv-btn-share {
                    background: linear-gradient(135deg, #00f0ff 0%, #0072ff 100%);
                    color: #fff;
                    box-shadow: 0 0 15px rgba(0, 240, 255, 0.35);
                }
                .gv-btn-close {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #8b9bb4;
                    margin-top: 6px;
                }
            `;
            document.head.appendChild(style);

            const modalHtml = `
                <div id="gv-no-tickets-modal">
                    <div class="gv-modal-card">
                        <div style="font-size: 42px; margin-bottom: 8px;">🎟️</div>
                        <div class="gv-modal-title">¡SIN TICKETS PARA JUGAR!</div>
                        <div class="gv-modal-desc">
                            Cada intento cuesta <strong>1 Ticket</strong>. Recarga gratis para seguir compitiendo por el <strong>Bote Semanal en USDT</strong>:
                        </div>
                        <button class="gv-btn-primary gv-btn-ad" id="gv-btn-watch-ad">
                            📺 Ver Anuncio (+1 🎟️)
                        </button>
                        <button class="gv-btn-primary gv-btn-share" id="gv-btn-invite-friends">
                            👥 Invitar Amigos (+3 🎟️)
                        </button>
                        <button class="gv-btn-primary gv-btn-close" id="gv-btn-close-modal">
                            Volver al Menú
                        </button>
                    </div>
                </div>
                <div id="gv-monetag-dev-overlay" style="display:none; position:fixed; inset:0; background:rgba(5,3,12,0.94); backdrop-filter:blur(10px); z-index:100000; align-items:center; justify-content:center; padding:20px; font-family:'Orbitron',sans-serif; color:#fff; text-align:center;">
                    <div style="background:rgba(20,16,40,0.95); border:2px solid #ffd32a; border-radius:20px; padding:26px 22px; max-width:340px; width:100%; box-shadow:0 0 30px rgba(255,211,42,0.3);">
                        <div style="font-size:11px; color:#ffd32a; letter-spacing:1.5px; margin-bottom:8px;">MONETAG AD ENGINE</div>
                        <div id="gv-monetag-dev-label" style="font-size:13px; color:#dfe4ea; margin-bottom:16px; font-family:'Outfit',sans-serif;">Vista previa Monetag</div>
                        <div id="gv-monetag-dev-timer" style="font-size:34px; font-weight:900; color:#00f0ff;">3</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    };

    window.GamerVerse = GamerVerse;

    // Auto-arranque al cargar el DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => GamerVerse.init());
    } else {
        GamerVerse.init();
    }
})(window);
