/**
 * GameVerse 307 Studios | Telegram Bot & Backend API
 * Handles:
 * 1. Telegram Bot (@GameServer307_bot) commands & Viral Referrals
 * 2. HMAC-SHA256 Auth for Telegram.WebApp.initData
 * 3. Supabase integration for Tickets, Scores, Jackpots & Anti-Cheat
 */

const crypto = require('crypto');
const express = require('express');
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://gameverse307.pages.dev';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const PORT = process.env.PORT || 3001;
const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '8855251461', 10);
const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_KEY || '';
const ONLINE_WINDOW_MS = 90000;

const TIER_1_COUNTRIES = new Set(['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'IE', 'NZ', 'JP', 'KR', 'SG', 'AE', 'LU']);
const TIER_2_COUNTRIES = new Set(['ES', 'IT', 'PT', 'BR', 'MX', 'CL', 'PL', 'CZ', 'GR', 'IL', 'SA', 'QA', 'TR', 'MY', 'TH', 'UY', 'CR', 'PA', 'PR']);
const VALID_GAMES = new Set(['hub', 'save_the_astronaut', 'astronaut_runner', 'arrow_escape']);

const adminOtpState = { code: null, expiresAt: 0 };

function normalizeCountry(rawCountry, req) {
    const headerCountry = req && (req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || req.headers['x-country']);
    const candidate = String(rawCountry || headerCountry || 'UN').trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(candidate) && candidate !== 'XX' && candidate !== 'T1') {
        return candidate;
    }
    return 'UN';
}

function classifyTier(countryCode) {
    if (!countryCode || countryCode === 'UN') return 'Unknown';
    if (TIER_1_COUNTRIES.has(countryCode)) return 'Tier 1';
    if (TIER_2_COUNTRIES.has(countryCode)) return 'Tier 2';
    return 'Tier 3';
}

function normalizeGameId(gameId) {
    const clean = String(gameId || 'hub').trim().toLowerCase();
    return VALID_GAMES.has(clean) ? clean : 'hub';
}

function getAdminSigningKey() {
    return BOT_TOKEN || process.env.SUPABASE_SECRET_KEY || 'gameverse307-local-key';
}

function createAdminSessionToken() {
    const exp = Date.now() + 24 * 60 * 60 * 1000;
    const payload = Buffer.from(JSON.stringify({ adminId: ADMIN_TELEGRAM_ID, exp })).toString('base64url');
    const sig = crypto.createHmac('sha256', getAdminSigningKey()).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

function verifyAdminSessionToken(token) {
    if (!token || !token.includes('.')) return false;
    try {
        const [payload, sig] = token.split('.');
        const expectedSig = crypto.createHmac('sha256', getAdminSigningKey()).update(payload).digest('base64url');
        if (sig !== expectedSig) return false;
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return decoded.adminId === ADMIN_TELEGRAM_ID && Number(decoded.exp) > Date.now();
    } catch (_) {
        return false;
    }
}

// Configuración Supabase (soporta claves nuevas sb_secret_/sb_publishable_ y clásicas)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_KEY =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL || (SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` : '');

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-project') && !SUPABASE_KEY.includes('PEGA_AQUI') && !SUPABASE_KEY.includes('your-')) {
    const { createClient } = require('@supabase/supabase-js');
    const sbOptions = typeof WebSocket === 'undefined' ? { realtime: { transport: require('ws') } } : {};
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, sbOptions);
    console.log('✅ Supabase conectado exitosamente.');
} else {
    console.log('⚠️ Credenciales de Supabase no configuradas. Usando emulador en memoria.');
}

// Emulador en memoria para pruebas locales
const memoryDB = {
    users: new Map(),
    scores: [],
    jackpot: { amount: 10.00, week: 'current' }
};

function getJackpotCountdown(endIso) {
    const now = new Date();
    let end = endIso ? new Date(endIso) : null;
    if (!end || isNaN(end.getTime())) {
        const day = now.getUTCDay(); // 0=Dom .. 6=Sab
        const daysUntilSun = (7 - day) % 7;
        end = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + daysUntilSun,
            23, 59, 59
        ));
    }
    let diffMs = Math.max(0, end.getTime() - now.getTime());
    const d = Math.floor(diffMs / 86400000);
    diffMs -= d * 86400000;
    const h = Math.floor(diffMs / 3600000);
    diffMs -= h * 3600000;
    const m = Math.floor(diffMs / 60000);
    return `${d}d ${h}h ${m}m`;
}

async function getActiveJackpot() {
    if (supabase) {
        const { data } = await supabase
            .from('jackpots')
            .select('id, title, game_scope, prize_split, week_identifier, start_date, end_date, seed_amount, dynamic_pool, payout_status')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (data) return data;
    }
    return {
        id: 'memory-active',
        title: 'Torneo Semanal GameVerse 307',
        game_scope: 'all',
        prize_split: { first: 60, second: 25, third: 15 },
        dynamic_pool: memoryDB.jackpot.amount,
        end_date: null
    };
}

async function getActiveJackpotAmount() {
    const active = await getActiveJackpot();
    return active && active.dynamic_pool !== undefined ? parseFloat(active.dynamic_pool) : memoryDB.jackpot.amount;
}

async function updatePresenceAndPeak(userId, activeGame, countryCode, languageCode) {
    const nowIso = new Date().toISOString();
    const tier = classifyTier(countryCode);
    const game = normalizeGameId(activeGame);

    if (supabase) {
        const { data: existing } = await supabase
            .from('users')
            .select('id, country_code')
            .eq('id', userId)
            .maybeSingle();

        const resolvedCountry = (countryCode && countryCode !== 'UN')
            ? countryCode
            : ((existing && existing.country_code) || 'UN');
        const resolvedTier = classifyTier(resolvedCountry);

        if (!existing) {
            await supabase.from('users').insert({
                id: userId,
                tickets: 3,
                country_code: resolvedCountry,
                tier: resolvedTier,
                language_code: languageCode || null,
                active_game: game,
                last_seen_at: nowIso,
                last_daily_claim: nowIso
            });
        } else {
            const patch = {
                active_game: game,
                last_seen_at: nowIso,
                updated_at: nowIso
            };
            if (resolvedCountry !== 'UN') {
                patch.country_code = resolvedCountry;
                patch.tier = resolvedTier;
            }
            if (languageCode) patch.language_code = languageCode;
            await supabase.from('users').update(patch).eq('id', userId);
        }

        const cutoffIso = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
        const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gte('last_seen_at', cutoffIso);

        const onlineNow = count || 0;
        const { data: peakRes } = await supabase.rpc('update_peak_concurrent', { p_current: onlineNow });
        return { onlineNow, peak: peakRes ? peakRes.peak_concurrent : onlineNow };
    }

    const u = memoryDB.users.get(userId) || { id: userId, tickets: 3, coins: 0, referral_count: 0 };
    u.active_game = game;
    if (countryCode !== 'UN') {
        u.country_code = countryCode;
        u.tier = tier;
    }
    if (languageCode) u.language_code = languageCode;
    u.last_seen_at = nowIso;
    memoryDB.users.set(userId, u);
    const cutoff = Date.now() - ONLINE_WINDOW_MS;
    let onlineNow = 0;
    for (const row of memoryDB.users.values()) {
        if (row.last_seen_at && new Date(row.last_seen_at).getTime() >= cutoff) onlineNow++;
    }
    memoryDB.peak = memoryDB.peak || { count: 0, at: nowIso };
    if (onlineNow > memoryDB.peak.count) {
        memoryDB.peak = { count: onlineNow, at: nowIso };
    }
    return { onlineNow, peak: memoryDB.peak.count };
}

async function getAdminStats() {
    const cutoffMs = Date.now() - ONLINE_WINDOW_MS;
    const byGame = { hub: 0, save_the_astronaut: 0, astronaut_runner: 0, arrow_escape: 0 };
    const byTier = { 'Tier 1': 0, 'Tier 2': 0, 'Tier 3': 0, Unknown: 0 };
    const countryCounts = new Map();
    let totalUsers = 0;
    let totalReferrals = 0;
    let onlineNow = 0;
    let peakConcurrent = 0;
    let peakConcurrentAt = null;
    let recentUsers = [];
    let tournaments = [];

    if (supabase) {
        const [{ data: users }, { data: peakRow }, { data: jackpotRows }] = await Promise.all([
            supabase
                .from('users')
                .select('id, username, first_name, tickets, referral_count, country_code, tier, active_game, wallet_address, last_seen_at, created_at')
                .order('last_seen_at', { ascending: false, nullsFirst: false })
                .limit(5000),
            supabase.from('platform_metrics').select('peak_concurrent, peak_concurrent_at').eq('id', 1).maybeSingle(),
            supabase.from('jackpots').select('*').order('created_at', { ascending: false }).limit(12)
        ]);

        const rows = users || [];
        totalUsers = rows.length;
        for (const u of rows) {
            totalReferrals += Number(u.referral_count || 0);
            const tKey = byTier[u.tier] !== undefined ? u.tier : 'Unknown';
            byTier[tKey]++;
            const cCode = u.country_code || 'UN';
            countryCounts.set(cCode, (countryCounts.get(cCode) || 0) + 1);
            if (u.last_seen_at && new Date(u.last_seen_at).getTime() >= cutoffMs) {
                onlineNow++;
                const gKey = normalizeGameId(u.active_game);
                byGame[gKey] = (byGame[gKey] || 0) + 1;
            }
        }
        peakConcurrent = Math.max(onlineNow, Number((peakRow && peakRow.peak_concurrent) || 0));
        peakConcurrentAt = (peakRow && peakRow.peak_concurrent_at) || new Date().toISOString();
        recentUsers = rows.slice(0, 15);
        tournaments = jackpotRows || [];
    } else {
        const rows = Array.from(memoryDB.users.values());
        totalUsers = rows.length;
        for (const u of rows) {
            totalReferrals += Number(u.referral_count || 0);
            const tKey = byTier[u.tier] !== undefined ? u.tier : 'Unknown';
            byTier[tKey]++;
            const cCode = u.country_code || 'UN';
            countryCounts.set(cCode, (countryCounts.get(cCode) || 0) + 1);
            if (u.last_seen_at && new Date(u.last_seen_at).getTime() >= cutoffMs) {
                onlineNow++;
                const gKey = normalizeGameId(u.active_game);
                byGame[gKey]++;
            }
        }
        peakConcurrent = Math.max(onlineNow, (memoryDB.peak && memoryDB.peak.count) || 0);
        peakConcurrentAt = (memoryDB.peak && memoryDB.peak.at) || new Date().toISOString();
        recentUsers = rows.slice(0, 15);
        tournaments = [await getActiveJackpot()];
    }

    const byCountry = Array.from(countryCounts.entries())
        .map(([country, count]) => ({ country, tier: classifyTier(country), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

    const activeJackpot = await getActiveJackpot();
    return {
        totalUsers,
        totalReferrals,
        onlineNow,
        peakConcurrent,
        peakConcurrentAt,
        byGame,
        byTier,
        byCountry,
        activeJackpot,
        tournaments,
        recentUsers
    };
}

async function getWeeklyLeaderboard(limit = 10) {
    if (supabase) {
        const { data, error } = await supabase
            .from('weekly_leaderboard')
            .select('rank, user_id, display_name, high_score, matches_played')
            .order('rank', { ascending: true })
            .limit(limit);
        if (!error && Array.isArray(data)) return data;
    }
    const bestByUser = new Map();
    for (const row of memoryDB.scores) {
        const prev = bestByUser.get(row.userId);
        if (!prev || row.score > prev.high_score) {
            const u = memoryDB.users.get(row.userId);
            bestByUser.set(row.userId, {
                user_id: row.userId,
                display_name: (u && (u.username || u.first_name)) || `Player_${String(row.userId).slice(-4)}`,
                high_score: row.score,
                matches_played: (prev ? prev.matches_played : 0) + 1
            });
        } else {
            prev.matches_played++;
        }
    }
    return Array.from(bestByUser.values())
        .sort((a, b) => b.high_score - a.high_score)
        .slice(0, limit)
        .map((r, i) => ({ rank: i + 1, ...r }));
}

// ----------------------------------------------------------------------------
// 1. SEGURIDAD: Validación Criptográfica de Telegram initData (HMAC-SHA256)
// ----------------------------------------------------------------------------
function verifyTelegramWebAppData(initDataString, botToken) {
    if (!initDataString) return null;

    try {
        const urlParams = new URLSearchParams(initDataString);
        const hash = urlParams.get('hash');
        if (!hash) return null;

        urlParams.delete('hash');
        const sortedParams = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(sortedParams).digest('hex');

        if (calculatedHash === hash) {
            const userStr = urlParams.get('user');
            return userStr ? JSON.parse(userStr) : null;
        }
        return null;
    } catch (e) {
        console.error('Error validando initData:', e.message);
        return null;
    }
}

// ----------------------------------------------------------------------------
// 2. BOT DE TELEGRAM: Comandos y Lógica Viral de Referidos
// ----------------------------------------------------------------------------
const hasRealBotToken = BOT_TOKEN && !BOT_TOKEN.includes('FakeToken') && !BOT_TOKEN.includes('YOUR_TELEGRAM') && !BOT_TOKEN.includes('PEGA_AQUI');
const bot = new Telegraf(BOT_TOKEN || '0000000000:placeholder');

bot.start(async (ctx) => {
    const from = ctx.from;
    const startPayload = (ctx.message && ctx.message.text && ctx.message.text.split(' ')[1]) || '';
    let referredBy = null;

    if (startPayload.startsWith('ref_')) {
        const potentialReferrer = parseInt(startPayload.replace('ref_', ''), 10);
        if (!isNaN(potentialReferrer) && potentialReferrer !== from.id) {
            referredBy = potentialReferrer;
        }
    }

    // Registrar o actualizar usuario
    if (supabase) {
        if (referredBy) {
            await supabase.rpc('register_referral', {
                p_new_id: from.id,
                p_referrer_id: referredBy,
                p_username: from.username || '',
                p_first_name: from.first_name || ''
            });
        } else {
            await supabase.from('users').upsert({
                id: from.id,
                username: from.username || '',
                first_name: from.first_name || '',
                updated_at: new Date()
            });
        }
    } else {
        if (!memoryDB.users.has(from.id)) {
            memoryDB.users.set(from.id, {
                id: from.id,
                username: from.username,
                first_name: from.first_name,
                tickets: referredBy ? 6 : 3,
                coins: 0
            });
            if (referredBy && memoryDB.users.has(referredBy)) {
                memoryDB.users.get(referredBy).tickets += 3;
            }
        }
    }

    const jackpotAmount = await getActiveJackpotAmount();
    const botUser = (ctx.botInfo && ctx.botInfo.username) || 'GameServer307_bot';
    const shareLink = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${botUser}?start=ref_${from.id}`)}&text=${encodeURIComponent('¡Te regalo 3 Tickets para jugar en GameVerse 307! Compite gratis por el Bote Semanal en USDT 🚀🎟️')}`;

    const welcomeText = `🚀 *¡Bienvenido a GameVerse 307, ${from.first_name || 'Piloto'}!* 🎮\n\n` +
        `Tu arcade en Telegram con 3 juegos y un *Bote Semanal en USDT*.\n\n` +
        `🎟️ *Tickets diarios:* 3 gratis cada día + anuncios Monetag\n` +
        `🔥 *Bote de esta semana:* $${jackpotAmount.toFixed(2)} USDT\n` +
        `⏳ *Cierre del Torneo:* ${getJackpotCountdown()}\n\n` +
        `*Elige una opción para empezar:*`;

    const buttons = [
        [Markup.button.webApp('🕹️ ABRIR GAMEVERSE 307', WEBAPP_URL)],
        [
            Markup.button.url('👥 Invitar Amigos (+3 🎟️)', shareLink),
            Markup.button.callback('💰 Ver Bote', 'CHECK_BOTE')
        ],
        [
            Markup.button.callback('🏆 Ranking Top 10', 'CHECK_RANKING'),
            Markup.button.callback('❓ Ayuda / FAQ', 'CHECK_FAQ')
        ]
    ];

    if (from && from.id === ADMIN_TELEGRAM_ID) {
        const adminUrl = `${WEBAPP_URL.replace(/\/$/, '')}/admin.html`;
        buttons.push([Markup.button.webApp('📊 Panel Admin', adminUrl)]);
    }

    return ctx.replyWithMarkdown(welcomeText, Markup.inlineKeyboard(buttons));
});

bot.action('CHECK_BOTE', async (ctx) => {
    const amount = await getActiveJackpotAmount();
    await ctx.answerCbQuery();
    return ctx.replyWithMarkdown(
        `🔥 *BOTE GLOBAL DE LA SEMANA:* \`$${amount.toFixed(2)} USDT\`\n\n` +
        `🥇 *1.er Lugar:* 60% (~$${(amount * 0.6).toFixed(2)} USDT)\n` +
        `🥈 *2.º Lugar:* 25% (~$${(amount * 0.25).toFixed(2)} USDT)\n` +
        `🥉 *3.er Lugar:* 15% (~$${(amount * 0.15).toFixed(2)} USDT)\n\n` +
        `Cada partida y anuncio visto hace crecer el bote en tiempo real.`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Abrir y Competir', WEBAPP_URL)]
        ])
    );
});

bot.action('CHECK_RANKING', async (ctx) => {
    await ctx.answerCbQuery();
    const rows = await getWeeklyLeaderboard(10);
    const medals = ['🥇', '🥈', '🥉'];
    const lines = rows.length
        ? rows.map((r, i) => `${medals[i] || `${i + 1}.`} @${r.display_name} — *${r.high_score}* pts`).join('\n')
        : '_Aún no hay puntuaciones esta semana. ¡Sé el primero en marcar récord!_';
    return ctx.replyWithMarkdown(
        `🏆 *RANKING SEMANAL GAMEVERSE 307*\n\n${lines}`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🕹️ Entrar al Arcade', WEBAPP_URL)]
        ])
    );
});

bot.command('admin', async (ctx) => {
    if (!ctx.from || ctx.from.id !== ADMIN_TELEGRAM_ID) {
        return ctx.reply('⛔ Acceso restringido al administrador.');
    }
    try {
        const stats = await getAdminStats();
        const topCountries = stats.byCountry.slice(0, 5)
            .map((c) => `${c.country} (${c.tier}): *${c.count}*`)
            .join(' · ') || 'Sin datos aún';
        const activeTitle = (stats.activeJackpot && stats.activeJackpot.title) || 'Torneo Semanal';
        const pool = Number((stats.activeJackpot && stats.activeJackpot.dynamic_pool) || 10).toFixed(2);
        const text =
            `📊 *PANEL ADMIN — GAMEVERSE 307*\n\n` +
            `👥 *Inscritos totales:* ${stats.totalUsers}\n` +
            `🤝 *Referidos totales:* ${stats.totalReferrals}\n` +
            `🟢 *Conectados ahora:* ${stats.onlineNow}\n` +
            `📈 *Pico histórico:* ${stats.peakConcurrent}\n\n` +
            `🎮 *En vivo por juego:*\n` +
            `• Save The Astronaut: *${stats.byGame.save_the_astronaut || 0}*\n` +
            `• Astronaut Runner: *${stats.byGame.astronaut_runner || 0}*\n` +
            `• Arrow Escape: *${stats.byGame.arrow_escape || 0}*\n` +
            `• Hub / Lobby: *${stats.byGame.hub || 0}*\n\n` +
            `🌍 *Tiers:* T1=${stats.byTier['Tier 1']} | T2=${stats.byTier['Tier 2']} | T3=${stats.byTier['Tier 3']}\n` +
            `📍 *Top países:* ${topCountries}\n\n` +
            `🏆 *Torneo activo:* ${activeTitle} (\`$${pool} USDT\`)`;

        return ctx.replyWithMarkdown(text, Markup.inlineKeyboard([
            [Markup.button.webApp('📊 Abrir Panel Web Completo', `${WEBAPP_URL.replace(/\/$/, '')}/admin.html`)]
        ]));
    } catch (err) {
        return ctx.reply(`⚠️ Error cargando estadísticas: ${err.message}`);
    }
});

const FAQ_TEXT =
    `❓ *PREGUNTAS FRECUENTES — GAMEVERSE 307*\n\n` +
    `🎟️ *¿Cómo consigo Tickets?*\n` +
    `Recibes *3 Tickets gratis cada 24 horas*, *+1 Ticket* por anuncio visto y *+3 Tickets* por cada amigo que entre con tu enlace.\n\n` +
    `🏆 *¿Cómo y cuándo se paga el Bote Semanal?*\n` +
    `Cada domingo a las *23:59 UTC* cierra la tabla y el bote en USDT se reparte al Top 3 (*60% / 25% / 15%*).\n\n` +
    `💳 *¿Dónde pongo mi billetera para cobrar?*\n` +
    `Dentro del Hub encontrarás la sección *Billetera de Premios*: guarda ahí tu dirección USDT (TON / TRC20 / BEP20) o tu Binance Pay ID.\n\n` +
    `📺 *¿No carga el anuncio?*\n` +
    `Si usas VPN o DNS bloqueador de anuncios, desactívalo temporalmente y completa el anuncio hasta el final para recibir la recompensa.`;

bot.command(['ayuda', 'help', 'faq'], (ctx) => {
    return ctx.replyWithMarkdown(FAQ_TEXT, Markup.inlineKeyboard([
        [Markup.button.webApp('🕹️ Abrir GameVerse 307', WEBAPP_URL)]
    ]));
});

bot.action('CHECK_FAQ', async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.replyWithMarkdown(FAQ_TEXT, Markup.inlineKeyboard([
        [Markup.button.webApp('🕹️ Abrir GameVerse 307', WEBAPP_URL)]
    ]));
});

// ----------------------------------------------------------------------------
// 3. REST API PARA EL FRONTEND (JUEGOS Y LOBBY)
// ----------------------------------------------------------------------------
const app = express();
app.use(express.json());

// Middleware de CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Telegram-Init-Data, X-Admin-Token');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Endpoint: Consumir 1 Ticket al iniciar partida
app.post('/api/ticket/consume', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'Falta userId' });

    if (supabase) {
        const { data, error } = await supabase.rpc('consume_ticket', { p_user_id: userId });
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json(data);
    } else {
        const user = memoryDB.users.get(parseInt(userId, 10)) || { tickets: 3 };
        if (user.tickets < 1) {
            return res.json({ success: false, message: 'Sin tickets disponibles', tickets: 0 });
        }
        user.tickets--;
        memoryDB.users.set(parseInt(userId, 10), user);
        return res.json({ success: true, tickets: user.tickets });
    }
});

// Endpoint: Recompensa por ver anuncio Adsgram (+1 Ticket y +$0.0012 al Bote)
app.post('/api/ticket/ad-reward', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'Falta userId' });

    if (supabase) {
        const { data, error } = await supabase.rpc('reward_ad_watched', { p_user_id: userId });
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json(data);
    } else {
        const user = memoryDB.users.get(parseInt(userId, 10)) || { tickets: 0 };
        user.tickets++;
        memoryDB.jackpot.amount += 0.0012;
        memoryDB.users.set(parseInt(userId, 10), user);
        return res.json({ success: true, tickets: user.tickets, current_jackpot: memoryDB.jackpot.amount });
    }
});

// Endpoint: Enviar Puntuación con Validación Anti-Cheat
app.post('/api/score/submit', async (req, res) => {
    const { userId, gameId, score, coins, durationMs, frames, hash } = req.body;

    // Validación básica de parámetros
    if (!userId || !gameId || score === undefined || !durationMs) {
        return res.status(400).json({ success: false, message: 'Parámetros incompletos' });
    }

    if (supabase) {
        const { data, error } = await supabase.rpc('submit_match_score', {
            p_user_id: userId,
            p_game_id: gameId,
            p_score: score,
            p_coins: coins || 0,
            p_duration_ms: durationMs,
            p_frames: frames || 0,
            p_hash: hash || 'no_hash'
        });
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json(data);
    } else {
        // Validación Anti-Cheat local: en AstronautRunner máximo 1 metro por cada 75ms
        const maxScore = Math.floor(durationMs / 75) + 50;
        const isValid = score <= maxScore && durationMs >= 4000;

        if (isValid) {
            memoryDB.scores.push({ userId, gameId, score, durationMs, date: new Date() });
            return res.json({ success: true, score, flagged: false });
        } else {
            return res.json({ 
                success: false, 
                flagged: true, 
                reason: 'Score rechazado por inconsistencia física de tiempo/distancia' 
            });
        }
    }
});

// Healthcheck raíz (ideal para Render / Koyeb / UptimeRobot)
app.get('/', (req, res) => {
    res.json({ ok: true, brand: 'GameVerse 307', engine: supabase ? 'Supabase PostgreSQL' : 'Memory Emulator' });
});

// Endpoint: Sincronizar usuario + reclamo diario de 3 tickets gratis + presencia/país
app.post('/api/user/sync', async (req, res) => {
    const { userId, username, firstName, initData, countryCode, languageCode, activeGame } = req.body || {};
    let resolvedId = parseInt(userId, 10);
    let resolvedUsername = username || '';
    let resolvedFirst = firstName || 'Jugador';
    let resolvedLang = languageCode || '';

    if (initData && hasRealBotToken) {
        const verified = verifyTelegramWebAppData(initData, BOT_TOKEN);
        if (!verified) {
            return res.status(401).json({ success: false, message: 'initData inválido' });
        }
        resolvedId = verified.id;
        resolvedUsername = verified.username || resolvedUsername;
        resolvedFirst = verified.first_name || resolvedFirst;
        resolvedLang = verified.language_code || resolvedLang;
    }

    if (!resolvedId || isNaN(resolvedId)) {
        return res.status(400).json({ success: false, message: 'Falta userId válido' });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const resolvedCountry = normalizeCountry(countryCode, req);
    const resolvedTier = classifyTier(resolvedCountry);
    const resolvedGame = normalizeGameId(activeGame);
    let tickets = 3;
    let coins = 0;
    let walletAddress = '';
    let dailyClaimed = false;

    if (supabase) {
        const { data: existing } = await supabase
            .from('users')
            .select('id, tickets, total_coins, last_daily_claim, country_code, wallet_address')
            .eq('id', resolvedId)
            .maybeSingle();

        if (!existing) {
            const { data: inserted } = await supabase
                .from('users')
                .insert({
                    id: resolvedId,
                    username: resolvedUsername,
                    first_name: resolvedFirst,
                    tickets: 3,
                    country_code: resolvedCountry,
                    tier: resolvedTier,
                    language_code: resolvedLang || null,
                    active_game: resolvedGame,
                    last_seen_at: nowIso,
                    last_daily_claim: nowIso
                })
                .select('tickets, total_coins, wallet_address')
                .single();
            tickets = inserted ? inserted.tickets : 3;
            coins = inserted ? inserted.total_coins : 0;
            walletAddress = (inserted && inserted.wallet_address) || '';
            dailyClaimed = true;
        } else {
            tickets = existing.tickets;
            coins = existing.total_coins;
            walletAddress = existing.wallet_address || '';
            const lastClaim = existing.last_daily_claim ? new Date(existing.last_daily_claim).getTime() : 0;
            const hoursSince = (now.getTime() - lastClaim) / 3600000;
            const patch = {
                username: resolvedUsername,
                first_name: resolvedFirst,
                active_game: resolvedGame,
                last_seen_at: nowIso,
                updated_at: nowIso
            };
            if (resolvedCountry !== 'UN') {
                patch.country_code = resolvedCountry;
                patch.tier = resolvedTier;
            }
            if (resolvedLang) patch.language_code = resolvedLang;
            if (hoursSince >= 24) {
                tickets += 3;
                patch.tickets = tickets;
                patch.last_daily_claim = nowIso;
                dailyClaimed = true;
            }
            await supabase.from('users').update(patch).eq('id', resolvedId);
        }
    } else {
        let user = memoryDB.users.get(resolvedId);
        if (!user) {
            user = { id: resolvedId, username: resolvedUsername, first_name: resolvedFirst, tickets: 3, coins: 0, lastDaily: now.getTime() };
            memoryDB.users.set(resolvedId, user);
            dailyClaimed = true;
        } else if (now.getTime() - (user.lastDaily || 0) >= 86400000) {
            user.tickets += 3;
            user.lastDaily = now.getTime();
            dailyClaimed = true;
        }
        tickets = user.tickets;
        coins = user.coins;
    }

    await updatePresenceAndPeak(resolvedId, resolvedGame, resolvedCountry, resolvedLang);
    const activeTournament = await getActiveJackpot();
    const jackpot = parseFloat((activeTournament && activeTournament.dynamic_pool) || 10);
    return res.json({
        success: true,
        userId: resolvedId,
        tickets,
        coins,
        walletAddress,
        dailyClaimed,
        jackpot,
        countdown: getJackpotCountdown(activeTournament && activeTournament.end_date),
        tournament: activeTournament
    });
});

// Endpoint: Guardar Wallet USDT / Binance Pay ID del jugador
app.post('/api/user/wallet', async (req, res) => {
    const { userId, walletAddress, initData } = req.body || {};
    let resolvedId = parseInt(userId, 10);
    if (initData && hasRealBotToken) {
        const verified = verifyTelegramWebAppData(initData, BOT_TOKEN);
        if (!verified) return res.status(401).json({ success: false, message: 'initData inválido' });
        resolvedId = verified.id;
    }
    const cleanWallet = String(walletAddress || '').trim().slice(0, 120);
    if (!resolvedId || isNaN(resolvedId) || cleanWallet.length < 4) {
        return res.status(400).json({ success: false, message: 'Ingresa una dirección o Binance Pay ID válido.' });
    }
    if (supabase) {
        const { error } = await supabase
            .from('users')
            .update({ wallet_address: cleanWallet, updated_at: new Date().toISOString() })
            .eq('id', resolvedId);
        if (error) return res.status(500).json({ success: false, message: error.message });
    } else {
        const u = memoryDB.users.get(resolvedId) || { id: resolvedId, tickets: 3, coins: 0 };
        u.wallet_address = cleanWallet;
        memoryDB.users.set(resolvedId, u);
    }
    return res.json({ success: true, walletAddress: cleanWallet });
});

// Endpoint: Últimos ganadores registrados
app.get('/api/winners/recent', async (req, res) => {
    if (!supabase) return res.json({ success: true, tournament: null, winners: [] });
    const { data: closed } = await supabase
        .from('jackpots')
        .select('title, week_identifier, dynamic_pool, winner_1_id, winner_2_id, winner_3_id, end_date')
        .eq('is_active', false)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (!closed) return res.json({ success: true, tournament: null, winners: [] });
    const ids = [closed.winner_1_id, closed.winner_2_id, closed.winner_3_id].filter(Boolean);
    let winners = [];
    if (ids.length) {
        const { data: users } = await supabase.from('users').select('id, username, first_name').in('id', ids);
        const byId = new Map((users || []).map((u) => [u.id, u.username || u.first_name || `Piloto_${String(u.id).slice(-4)}`]));
        winners = [closed.winner_1_id, closed.winner_2_id, closed.winner_3_id]
            .map((id, idx) => id ? { place: idx + 1, name: byId.get(id) || `Piloto_${String(id).slice(-4)}` } : null)
            .filter(Boolean);
    }
    return res.json({ success: true, tournament: closed, winners });
});

// Endpoint: Latido de presencia en vivo (conectados actuales, juego activo y pico histórico)
app.post('/api/presence/heartbeat', async (req, res) => {
    const { userId, activeGame, countryCode, languageCode, initData } = req.body || {};
    let resolvedId = parseInt(userId, 10);
    let resolvedLang = languageCode || '';

    if (initData && hasRealBotToken) {
        const verified = verifyTelegramWebAppData(initData, BOT_TOKEN);
        if (verified && verified.id) {
            resolvedId = verified.id;
            resolvedLang = verified.language_code || resolvedLang;
        }
    }
    if (!resolvedId || isNaN(resolvedId)) {
        return res.status(400).json({ success: false, message: 'Falta userId válido' });
    }

    const resolvedCountry = normalizeCountry(countryCode, req);
    const presence = await updatePresenceAndPeak(resolvedId, activeGame, resolvedCountry, resolvedLang);
    return res.json({ success: true, ...presence });
});

// Endpoint: Ranking Semanal en Vivo
app.get('/api/leaderboard', async (req, res) => {
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
    const leaderboard = await getWeeklyLeaderboard(limit);
    res.json({ success: true, leaderboard });
});

// Endpoint: Estado Global (Bote, Ranking, Servidor)
app.get('/api/status', async (req, res) => {
    const activeTournament = await getActiveJackpot();
    const jackpot = parseFloat((activeTournament && activeTournament.dynamic_pool) || 10);
    res.json({
        server: 'online',
        brand: 'GameVerse 307',
        jackpot,
        countdown: getJackpotCountdown(activeTournament && activeTournament.end_date),
        tournament: activeTournament,
        engine: supabase ? 'Supabase PostgreSQL' : 'Memory Emulator'
    });
});

// ----------------------------------------------------------------------------
// 4. RUTAS PRIVADAS DE ADMINISTRACIÓN (SOLO ADMIN_TELEGRAM_ID / OTP / ADMIN_SECRET)
// ----------------------------------------------------------------------------
function requireAdmin(req, res, next) {
    const initData = req.headers['x-telegram-init-data'] || (req.query && req.query.initData) || '';
    if (initData && hasRealBotToken) {
        const verified = verifyTelegramWebAppData(String(initData), BOT_TOKEN);
        if (verified && verified.id === ADMIN_TELEGRAM_ID) {
            req.adminAuth = { method: 'telegram_init_data', id: verified.id };
            return next();
        }
    }
    const adminToken = req.headers['x-admin-token'] || '';
    if (ADMIN_SECRET && adminToken === ADMIN_SECRET) {
        req.adminAuth = { method: 'admin_secret', id: ADMIN_TELEGRAM_ID };
        return next();
    }
    if (verifyAdminSessionToken(String(adminToken))) {
        req.adminAuth = { method: 'otp_session', id: ADMIN_TELEGRAM_ID };
        return next();
    }
    return res.status(401).json({ success: false, message: 'Acceso denegado: solo administrador autorizado.' });
}

app.post('/api/admin/request-code', async (req, res) => {
    if (!hasRealBotToken) {
        return res.status(503).json({ success: false, message: 'Bot token no configurado en el servidor.' });
    }
    const code = String(crypto.randomInt(100000, 999999));
    adminOtpState.code = code;
    adminOtpState.expiresAt = Date.now() + 5 * 60 * 1000;
    try {
        await bot.telegram.sendMessage(
            ADMIN_TELEGRAM_ID,
            `🔐 Tu código para entrar al Panel Admin de GameVerse 307 es:\n\n<code>${code}</code>\n\nExpira en 5 minutos.`,
            { parse_mode: 'HTML' }
        );
        return res.json({ success: true, message: 'Código enviado por Telegram a tu cuenta admin.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: `No se pudo enviar por Telegram: ${err.message}` });
    }
});

app.post('/api/admin/verify-code', (req, res) => {
    const { code, secret } = req.body || {};
    if (ADMIN_SECRET && secret && secret === ADMIN_SECRET) {
        return res.json({ success: true, token: createAdminSessionToken() });
    }
    if (!adminOtpState.code || Date.now() > adminOtpState.expiresAt) {
        return res.status(401).json({ success: false, message: 'Código expirado. Solicita uno nuevo.' });
    }
    if (String(code || '').trim() !== adminOtpState.code) {
        return res.status(401).json({ success: false, message: 'Código incorrecto.' });
    }
    adminOtpState.code = null;
    adminOtpState.expiresAt = 0;
    return res.json({ success: true, token: createAdminSessionToken() });
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const stats = await getAdminStats();
        return res.json({ success: true, stats });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/tournaments', requireAdmin, async (req, res) => {
    const { title, gameScope, seedAmount, startDate, endDate, prizeSplit, activateNow } = req.body || {};
    const cleanTitle = String(title || 'Torneo Semanal GameVerse 307').trim().slice(0, 90);
    const cleanScope = ['all', 'save_the_astronaut', 'astronaut_runner', 'arrow_escape'].includes(gameScope) ? gameScope : 'all';
    const cleanSeed = Math.max(0, Number(seedAmount || 10));
    const startIso = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const defaultEnd = new Date(Date.now() + 7 * 86400000).toISOString();
    const endIso = endDate ? new Date(endDate).toISOString() : defaultEnd;
    const isActive = activateNow !== false;

    const split = {
        first: Number((prizeSplit && prizeSplit.first) || 60),
        second: Number((prizeSplit && prizeSplit.second) || 25),
        third: Number((prizeSplit && prizeSplit.third) || 15)
    };

    if (!supabase) {
        memoryDB.jackpot.amount = cleanSeed;
        return res.json({ success: true, tournament: { id: 'memory-' + Date.now(), title: cleanTitle, game_scope: cleanScope, dynamic_pool: cleanSeed, is_active: isActive } });
    }

    try {
        if (isActive) {
            await supabase.from('jackpots').update({ is_active: false }).eq('is_active', true);
        }
        const weekId = `T-${new Date().toISOString().slice(0, 10)}-${crypto.randomBytes(2).toString('hex')}`;
        const { data, error } = await supabase
            .from('jackpots')
            .insert({
                week_identifier: weekId,
                title: cleanTitle,
                game_scope: cleanScope,
                prize_split: split,
                start_date: startIso,
                end_date: endIso,
                seed_amount: cleanSeed,
                dynamic_pool: cleanSeed,
                is_active: isActive,
                payout_status: isActive ? 'active' : 'calculating'
            })
            .select('*')
            .single();

        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, tournament: data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/tournaments/:id/close', requireAdmin, async (req, res) => {
    const id = req.params.id;
    if (!supabase) return res.json({ success: true });
    const { data, error } = await supabase
        .from('jackpots')
        .update({ is_active: false, payout_status: 'paid' })
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.json({ success: true, tournament: data });
});

// Webhook opcional si se configura WEBHOOK_URL
if (hasRealBotToken && WEBHOOK_URL) {
    app.use('/telegraf', bot.webhookCallback('/telegraf'));
}

// Iniciar servidor HTTP y Bot de Telegram
app.listen(PORT, async () => {
    console.log(`🌐 GameVerse 307 API escuchando en puerto ${PORT}`);
    if (!hasRealBotToken) {
        console.log('ℹ️ TELEGRAM_BOT_TOKEN no configurado: bot en espera (API activa).');
        return;
    }
    try {
        await bot.telegram.setMyCommands([
            { command: 'start', description: '🚀 Abrir menú principal y juegos' },
            { command: 'ayuda', description: '❓ Preguntas frecuentes y soporte' }
        ]);
        if (ADMIN_TELEGRAM_ID) {
            await bot.telegram.setMyCommands([
                { command: 'start', description: '🚀 Abrir menú principal y juegos' },
                { command: 'ayuda', description: '❓ Preguntas frecuentes y soporte' },
                { command: 'admin', description: '📊 Abrir Panel Admin' }
            ], { scope: { type: 'chat', chat_id: ADMIN_TELEGRAM_ID } }).catch(() => {});
        }
        if (WEBHOOK_URL) {
            const cleanBase = WEBHOOK_URL.replace(/\/$/, '');
            await bot.telegram.setWebhook(`${cleanBase}/telegraf`);
            console.log(`🤖 Bot conectado por Webhook: ${cleanBase}/telegraf`);
        } else {
            await bot.launch();
            console.log('🤖 Bot conectado por Polling (listo para /start).');
        }
    } catch (err) {
        console.error('⚠️ Error iniciando bot de Telegram:', err.message);
    }
});

process.once('SIGINT', () => { try { bot.stop('SIGINT'); } catch (_) {} });
process.once('SIGTERM', () => { try { bot.stop('SIGTERM'); } catch (_) {} });

module.exports = { bot, app, verifyTelegramWebAppData };
