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

function getJackpotCountdown() {
    const now = new Date();
    const day = now.getUTCDay(); // 0=Dom .. 6=Sab
    const daysUntilSun = (7 - day) % 7;
    const end = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + daysUntilSun,
        23, 59, 59
    ));
    let diffMs = Math.max(0, end.getTime() - now.getTime());
    const d = Math.floor(diffMs / 86400000);
    diffMs -= d * 86400000;
    const h = Math.floor(diffMs / 3600000);
    diffMs -= h * 3600000;
    const m = Math.floor(diffMs / 60000);
    return `${d}d ${h}h ${m}m`;
}

async function getActiveJackpotAmount() {
    if (supabase) {
        const { data } = await supabase
            .from('jackpots')
            .select('dynamic_pool')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (data && data.dynamic_pool !== undefined) {
            return parseFloat(data.dynamic_pool);
        }
    }
    return memoryDB.jackpot.amount;
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

    return ctx.replyWithMarkdown(welcomeText, Markup.inlineKeyboard([
        [Markup.button.webApp('🕹️ ABRIR GAMEVERSE 307', WEBAPP_URL)],
        [
            Markup.button.url('👥 Invitar Amigos (+3 🎟️)', shareLink),
            Markup.button.callback('💰 Ver Bote', 'CHECK_BOTE')
        ],
        [Markup.button.callback('🏆 Ranking Top 10', 'CHECK_RANKING')]
    ]));
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

// ----------------------------------------------------------------------------
// 3. REST API PARA EL FRONTEND (JUEGOS Y LOBBY)
// ----------------------------------------------------------------------------
const app = express();
app.use(express.json());

// Middleware de CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
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

// Endpoint: Sincronizar usuario + reclamo diario de 3 tickets gratis
app.post('/api/user/sync', async (req, res) => {
    const { userId, username, firstName, initData } = req.body || {};
    let resolvedId = parseInt(userId, 10);
    let resolvedUsername = username || '';
    let resolvedFirst = firstName || 'Jugador';

    if (initData && hasRealBotToken) {
        const verified = verifyTelegramWebAppData(initData, BOT_TOKEN);
        if (!verified) {
            return res.status(401).json({ success: false, message: 'initData inválido' });
        }
        resolvedId = verified.id;
        resolvedUsername = verified.username || resolvedUsername;
        resolvedFirst = verified.first_name || resolvedFirst;
    }

    if (!resolvedId || isNaN(resolvedId)) {
        return res.status(400).json({ success: false, message: 'Falta userId válido' });
    }

    const now = new Date();
    let tickets = 3;
    let coins = 0;
    let dailyClaimed = false;

    if (supabase) {
        const { data: existing } = await supabase
            .from('users')
            .select('id, tickets, total_coins, last_daily_claim')
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
                    last_daily_claim: now.toISOString()
                })
                .select('tickets, total_coins')
                .single();
            tickets = inserted ? inserted.tickets : 3;
            coins = inserted ? inserted.total_coins : 0;
            dailyClaimed = true;
        } else {
            tickets = existing.tickets;
            coins = existing.total_coins;
            const lastClaim = existing.last_daily_claim ? new Date(existing.last_daily_claim).getTime() : 0;
            const hoursSince = (now.getTime() - lastClaim) / 3600000;
            const patch = { username: resolvedUsername, first_name: resolvedFirst, updated_at: now.toISOString() };
            if (hoursSince >= 24) {
                tickets += 3;
                patch.tickets = tickets;
                patch.last_daily_claim = now.toISOString();
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

    const jackpot = await getActiveJackpotAmount();
    return res.json({
        success: true,
        userId: resolvedId,
        tickets,
        coins,
        dailyClaimed,
        jackpot,
        countdown: getJackpotCountdown()
    });
});

// Endpoint: Ranking Semanal en Vivo
app.get('/api/leaderboard', async (req, res) => {
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
    const leaderboard = await getWeeklyLeaderboard(limit);
    res.json({ success: true, leaderboard });
});

// Endpoint: Estado Global (Bote, Ranking, Servidor)
app.get('/api/status', async (req, res) => {
    const jackpot = await getActiveJackpotAmount();
    res.json({
        server: 'online',
        brand: 'GameVerse 307',
        jackpot,
        countdown: getJackpotCountdown(),
        engine: supabase ? 'Supabase PostgreSQL' : 'Memory Emulator'
    });
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
