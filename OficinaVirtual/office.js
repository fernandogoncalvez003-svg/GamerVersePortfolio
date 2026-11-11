/**
 * GamerVerse Studios | Interactive Virtual Office Engine
 * Handles 1-on-1 agent terminal chats, All-Hands multi-agent meetings,
 * interactive arcade testbench, audio synthesis, and live office logs.
 */

// ==========================================================================
// 1. Web Audio Synthesizer (Native SFX without external assets)
// ==========================================================================
class SoundFX {
    constructor() {
        this.enabled = true;
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playBeep(freq = 600, duration = 0.06, type = 'sine') {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Audio policy fallback
        }
    }

    click() { this.playBeep(850, 0.04, 'triangle'); }
    chat() { this.playBeep(520, 0.08, 'sine'); }
    launch() {
        if (!this.enabled) return;
        this.playBeep(440, 0.05, 'square');
        setTimeout(() => this.playBeep(880, 0.08, 'square'), 60);
    }
}

const sfx = new SoundFX();

// ==========================================================================
// 2. Agent Database & Knowledge Profiles
// ==========================================================================
const AGENTS = {
    antigravity: {
        id: 'antigravity',
        name: 'Antigravity',
        avatar: '🤖',
        role: 'Lead Architect & Chief AI',
        status: 'ORCHESTRATING',
        room: 'room-antigravity',
        skills: ['Multi-Agent Mesh', 'Cloudflare Workers', 'Telegram WebApp SDK', 'Tokenomics $50k/mo', 'Code Synthesis'],
        bio: 'Orquestador central del ecosistema GamerVerse. Coordina código, economía y viralidad para alcanzar la meta de $50k USD/mes.',
        taskBubble: 'Supervisando sprints técnicos y sincronizando a los 9 agentes...',
        quickActions: [
            { label: '🎯 Roadmap $50k/mes', cmd: 'roadmap' },
            { label: '📊 Resumen General', cmd: 'status' },
            { label: '🚀 Siguiente Sprint', cmd: 'sprint' },
            { label: '💼 Balance de la LLC', cmd: 'llc' }
        ],
        welcomeMsg: 'Saludos, Fernando. Tengo a todos los agentes en sus puestos. Estamos atacando los 3 pilares: la adaptación técnica de los 3 juegos, la Landing Page de alta conversión y la Mini App de Telegram. ¿En qué frente deseas que concentre al equipo ahora?',
        responses: {
            roadmap: '🎯 **Ruta hacia los $50,000 USD/mes:**\n1. Fase Alfa: Validar el bucle de tickets y torneos semanales con un bote semilla de $10-$40 USDT.\n2. Fase Beta: Tráfico viral en TikTok ($CAC = $0) y adquisición en LATAM.\n3. Fase Escala: Adquisición Tier 1 (EE.UU./Europa) con eCPMs de $12-$25, integrando IAP y 5 juegos simultáneos.',
            status: '📊 **Estado del Ecosistema:**\n• Juegos en local: AstronautRunner, SaveTheAstronaut y ArrowEscape listos para hooks.\n• Bote Semanal simulado: $42.50 USDT (reparto dominical 60/25/15%).\n• Integridad Anti-Cheat: Protocolo HMAC-SHA256 preparado.',
            sprint: '⚡ **Sprint en Curso:**\n1. Integrar hook de 1 ticket en los 3 juegos.\n2. Conectar la Landing Page con el llamado a la acción hacia el bot de Telegram.\n3. Publicar los primeros clips virales en redes.',
            llc: '💼 **Estructura LLC:** 50% de beneficio neto retenido para la empresa, 35% al bote semanal de premios, 15% a infraestructura/servidores.'
        }
    },
    alex: {
        id: 'alex',
        name: 'Alex',
        avatar: '🚀',
        role: 'Game Dev Arcade (Runner & Survival)',
        status: 'CODING',
        room: 'room-alex',
        skills: ['Canvas 2D Engine', 'Frame Budget <16.6ms', 'AABB Collision Math', 'Touch Drag UX', 'Ticket Hook'],
        bio: 'Especialista en motores Canvas 2D, optimización a 60 FPS y control táctil directo de 1 dedo para AstronautRunner y SaveTheAstronaut.',
        taskBubble: 'Vinculando consumo de 1 Ticket en AstronautRunner...',
        quickActions: [
            { label: '📊 Estado de Tareas', cmd: 'status' },
            { label: '🎟️ Hook de 1 Ticket', cmd: 'hook' },
            { label: '⚡ Test 60 FPS', cmd: 'fps' },
            { label: '🎮 Abrir Runner', cmd: 'play' }
        ],
        welcomeMsg: '¡Qué tal, Fernando! Tengo el código de **AstronautRunner** y **SaveTheAstronaut** abierto en mi banco de trabajo. He calibrado el arrastre con un solo dedo y el autodisparo. ¿Quieres que revise el hook de tickets o el callback de GameOver?',
        responses: {
            status: '🛠️ **Progreso Arcade:**\n• `AstronautRunner`: Bucle de juego optimizado, soporte para reinicio instantáneo con escudo temporal.\n• `SaveTheAstronaut`: Sistema de oleadas y jefes escalados un 35% para partidas de 1.5 a 2 minutos.',
            hook: '🎟️ **Lógica de Tickets Implementada:**\n```javascript\nfunction startGame() {\n  if (GamerVerse.tickets < 1) return showNoTicketsModal();\n  GamerVerse.consumeTicket(1);\n  runGameLoop();\n}\n```\nSi el jugador no tiene tickets, se activa el botón de ver anuncio en Adsgram.',
            fps: '⚡ **Test de Rendimiento:** 60 FPS constantes en iPhone y dispositivos Android de gama media. Peso total de assets comprimidos: 2.8 MB (carga en 1.1s).',
            play: 'ACTION_PLAY_ASTRONAUT'
        }
    },
    elena: {
        id: 'elena',
        name: 'Elena',
        avatar: '🎯',
        role: 'Game Dev Puzzle (ArrowEscape)',
        status: 'DESIGNING',
        room: 'room-elena',
        skills: ['2D Matrix Graphs', 'Puzzle Topology', 'Responsive Canvas', 'Difficulty Curve', 'Touch Gestures'],
        bio: 'Ingeniera de mecánicas tácticas, algoritmos de resolución y layouts responsivos en ArrowEscape.',
        taskBubble: 'Balanceando grilla y touch controls en ArrowEscape...',
        quickActions: [
            { label: '📊 Estado Puzzle', cmd: 'status' },
            { label: '🧩 Grilla de Niveles', cmd: 'grid' },
            { label: '📱 Ajuste Viewport', cmd: 'viewport' },
            { label: '▶️ Probar ArrowEscape', cmd: 'play' }
        ],
        welcomeMsg: 'Hola Fernando. En **ArrowEscape** la clave es la satisfacción de resolver el puzzle sin frustración injusta. Estoy asegurando que cada nivel completado sume puntos acumulativos al ranking semanal de GamerVerse.',
        responses: {
            status: '🧩 **Progreso ArrowEscape:** 50 niveles generados algorítmicamente. El motor táctil detecta gestos con cero lag y el consumo de ticket se realiza por bloque de 5 intentos.',
            grid: '📐 **Curva de Dificultad:** Niveles 1-10 son rápidos y muy satisfactorios (retención inicial); a partir del nivel 25 se introducen flechas rotatorias bloqueadas que aumentan el tiempo de sesión.',
            viewport: '📱 **Ajuste Móvil:** He eliminado cualquier scroll horizontal o vertical. Todo el tablero cabe con margen de seguridad del 10% para la barra nativa de Telegram.',
            play: 'ACTION_PLAY_ARROW'
        }
    },
    cipher: {
        id: 'cipher',
        name: 'Cipher',
        avatar: '🕵️‍♂️',
        role: 'QA & Security Sentinel',
        status: 'SCANNING',
        room: 'room-cipher',
        skills: ['HMAC-SHA256 Auth', 'Memory Heap Profiler', 'Score Rate-Limiting', 'DevTools Anti-Tamper', 'Zero-Trust API'],
        bio: 'Hacker ético y auditor de código. Responsable de garantizar que nadie haga trampas en el Bote de USDT ni inyecte scores falsos.',
        taskBubble: 'Escaneando memoria y validando firmas HMAC Telegram...',
        quickActions: [
            { label: '🛡️ Auditoría Anti-Cheat', cmd: 'audit' },
            { label: '🔐 Firma HMAC Telegram', cmd: 'hmac' },
            { label: '🧹 Detección Memory Leaks', cmd: 'memory' }
        ],
        welcomeMsg: 'Atento, Fernando. Cuando hay dinero real en juego (el Bote en USDT), los usuarios intentan abrir la consola DevTools o usar autoclickers. Mi trabajo es blindar el frontend y el backend.',
        responses: {
            audit: '🛡️ **Auditoría Anti-Cheat Completada:**\n• Las variables `score` y `tickets` ya no están expuestas en `window`.\n• Implementada verificación de consistencia: Si un jugador envía 50,000 pts en 12 segundos, el servidor rechaza el envío automáticamente (ratio imposible).',
            hmac: '🔐 **Firma Telegram WebApp:** Los datos de sesión se validan con HMAC-SHA256 usando el Token del Bot. Nadie puede usurpar la identidad de otro jugador.',
            memory: '🧹 **Inspección de Fugas:** 0 listeners zombies en `requestAnimationFrame`. El recolector de basura de Chrome/Safari limpia correctamente al terminar cada partida.'
        }
    },
    valeria: {
        id: 'valeria',
        name: 'Valeria',
        avatar: '📱',
        role: 'Growth & Viral Hacker',
        status: 'CREATING',
        room: 'room-valeria',
        skills: ['TikTok 3s Hooks', 'Viral K-Factor > 1.2', 'Deep-Link Tracking', 'Telegram Stories', 'FOMO Copywriting'],
        bio: 'Especialista en adquisición orgánica de usuarios. Diseña los bucles virales de TikTok, Instagram Reels y los enlaces de referidos de Telegram.',
        taskBubble: 'Guionando 3 clips de frustración para TikTok (K > 1.2)...',
        quickActions: [
            { label: '🔥 Guiones TikTok', cmd: 'tiktok' },
            { label: '👥 Estrategia Referidos', cmd: 'referrals' },
            { label: '📲 Telegram Stories', cmd: 'stories' }
        ],
        welcomeMsg: '¡Hey! No gastaremos ni un dólar en anuncios costosos. Nuestro secreto es el contenido de frustración y el FOMO del Bote Semanal. Cada usuario que entra debe invitar al menos a 1.2 amigos.',
        responses: {
            tiktok: '🔥 **Guión TikTok Viral #1 (15 seg):**\n• Seg 0-3: Texto en pantalla: *"Mi amigo juró que no pasaba de 500 metros en este juego... el domingo se juega $40 USDT"*.\n• Seg 4-11: Gameplay rápido de AstronautRunner esquivando meteoros por un pelo con música de alta tensión.\n• Seg 12-15: Pierde de forma épica al final. CTA: *"Link en bio para jugar gratis en Telegram y competir por el bote"*.\n• Resultado esperado: 50k-200k reproducciones orgánicas.',
            referrals: '👥 **Bucle Viral:** Cuando invitas a un amigo recibes **3 Tickets**. Pero el truco maestro es: *si tu amigo entra en el Top 10 del domingo, ganas un bono del 10% de su premio*. Esto hace que la gente comparta el bot en todos sus grupos de WhatsApp y Telegram.',
            stories: '📲 **Telegram Stories 1-Click:** Botón al final de la partida: *"Publicar récord en mi Historia"*. Telegram lo comparte con un sticker interactivo que abre directamente el bot.'
        }
    },
    marcus: {
        id: 'marcus',
        name: 'Marcus',
        avatar: '📊',
        role: 'Monetization Economist',
        status: 'CALCULATING',
        room: 'room-marcus',
        skills: ['Dynamic Bote Math', 'Adsgram/Monetag eCPM', '50% Net Margin LLC', '60/25/15 Payout Split', 'USDT Ledger'],
        bio: 'Director financiero del Bote Semanal. Calibra ingresos por anuncios de Adsgram/Monetag y protege el margen de ganancia neta para la LLC.',
        taskBubble: '35% Bote, 15% Servidores, 50% Margen Neto LLC...',
        quickActions: [
            { label: '💰 Matemáticas del Bote', cmd: 'bote' },
            { label: '📈 Proyección $50k/mes', cmd: 'projection' },
            { label: '🏆 Reparto Domingo', cmd: 'payout' }
        ],
        welcomeMsg: 'Hola Fernando. El modelo financiero de GamerVerse es matemáticamente indestructible: el bote nunca supera los ingresos generados por la comunidad. Siempre garantizamos un margen limpio para ti.',
        responses: {
            bote: '💰 **Fórmula del Bote Semanal:**\nDe cada $1.00 USD generado por anuncios (Adsgram/Monetag):\n• 35% va a inflar el Bote visible.\n• 15% a reserva técnica y costos de hosting.\n• **50% es ganancia neta directa para la LLC**.\nEl bote actual se sitúa en $42.50 USDT y crecerá con cada partida jugada.',
            projection: '📈 **Escalado hacia $50,000 USD/mes:**\n• Con 35,000 usuarios activos diarios viendo 4 anuncios al día = 140,000 impresiones/día.\n• Con eCPM promedio de $3.00 (mezcla LATAM y Tier 1) = $420 USD/día.\n• En fase escalada con 150,000 usuarios e IAP (compras de tickets y skins) = **$1,650 USD/día ($49,500/mes)**.',
            payout: '🏆 **Regla de Reparto del Domingo 23:59 UTC:**\n🥇 1.er lugar: 60% del Bote ($25.50 USDT)\n🥈 2.º lugar: 25% del Bote ($10.62 USDT)\n🥉 3.er lugar: 15% del Bote ($6.38 USDT)'
        }
    },
    santi: {
        id: 'santi',
        name: 'Santi',
        avatar: '🏆',
        role: 'Community & Trust Hype',
        status: 'ENGAGING',
        room: 'room-santi',
        skills: ['@GamerVerseNews Ops', 'Hall of Fame Proofs', 'Binance Pay / TON Hashes', 'Flash Tournaments', 'Player Support'],
        bio: 'Líder de comunidad en Telegram. Convierte a jugadores en una legión fiel y combate el escepticismo publicando pruebas reales de pago.',
        taskBubble: 'Preparando recibos USDT verificables para domingo...',
        quickActions: [
            { label: '👑 Hall de la Fama', cmd: 'hall' },
            { label: '📢 Canal de Telegram', cmd: 'channel' },
            { label: '⚡ Torneos Relámpago', cmd: 'flash' }
        ],
        welcomeMsg: '¡Saludos! La comunidad es el corazón de la retención. La gente solo confía cuando ve que el domingo pasado se pagaron premios reales a personas reales. Yo me encargo de hacer ese ruido.',
        responses: {
            hall: '👑 **El Hall de la Fama (Prueba Social Suprema):** Cada lunes a las 00:05 UTC publicamos en `@GamerVerseNews` la tarjeta con los 3 ganadores y los hashes de transferencia de Binance Pay o red TON. La desconfianza desaparece de golpe.',
            channel: '📢 **Canal `@GamerVerseNews`:** Publicaremos 2 alertas al día:\n1. 14:00 UTC: *"🔥 El Bote ha subido a $X USDT. Quedan 2 días para el corte"*\n2. 20:00 UTC: *"⚠️ @crypto_juan acaba de arrebatar el 2.º puesto por solo 40 puntos!"*',
            flash: '⚡ **Viernes Relámpago:** Torneo de 3 horas los viernes con un premio flash de $5 USDT. Esto genera picos masivos de jugadores simultáneos en el Hub.'
        }
    },
    luna: {
        id: 'luna',
        name: 'Luna',
        avatar: '🎨',
        role: 'Landing Page Master & UX',
        status: 'DESIGNING',
        room: 'room-luna',
        skills: ['Cyberpunk CRO', 'Mobile-First Layout', 'SVG/WebP < 1MB', 'AppStore/Play Verification', 'Neón Micro-Interactions'],
        bio: 'Diseñadora de interfaces y webmaster. Responsable de que la página oficial de GamerVerse convierta el 35%+ de visitantes en jugadores del Bot.',
        taskBubble: 'Diseñando CTA directo a @GamerVerseArcadeBot...',
        quickActions: [
            { label: '🌐 Ver Landing Page', cmd: 'view' },
            { label: '🎯 Elementos de Conversión', cmd: 'elements' },
            { label: '📱 Versión Móvil', cmd: 'mobile' }
        ],
        welcomeMsg: '¡Hola! La Landing Page de GamerVerse no puede ser un sitio aburrido. Debe vibrar como un arcade moderno con un botón gigante que lleve directo al Bot de Telegram.',
        responses: {
            view: 'ACTION_VIEW_LANDING',
            elements: '🎯 **Estructura de Alta Conversión en la Web:**\n1. Hero: Título impactante + Botón de Neón *"JUGAR EN TELEGRAM"*.\n2. Widget en Vivo: Contador animado del Bote de la Semana.\n3. Vitrina Interactiva: Tarjetas de AstronautRunner, SaveTheAstronaut y ArrowEscape con botones de prueba rápida.\n4. Footer de Confianza: Datos legales de Fernando Goncalvez y políticas de privacidad para tiendas y pasarelas.',
            mobile: '📱 **Mobile First:** El 85% del tráfico llegará desde celulares vía TikTok o enlaces de Telegram. La web carga en 0.9 segundos y pesa menos de 1 MB.'
        }
    },
    dante: {
        id: 'dante',
        name: 'Dante',
        avatar: '💾',
        role: 'Supabase & Telegram Bot Architect',
        status: 'SERVING',
        room: 'room-dante',
        skills: ['Supabase PostgreSQL', 'Telegram Bot API', 'HMAC-SHA256 Auth', 'Atomic RPC Functions', 'Leaderboard Views'],
        bio: 'Arquitecto de infraestructura cloud y bases de datos. Conecta Telegram con Supabase y gestiona la economía atómica de tickets y botes.',
        taskBubble: 'Gestionando tickets atómicos y @GamerVerseArcadeBot...',
        quickActions: [
            { label: '🗄️ Esquema Supabase', cmd: 'schema' },
            { label: '🤖 Estado del Bot', cmd: 'bot' },
            { label: '🎟️ RPC Consumo Tickets', cmd: 'rpc' },
            { label: '📊 Endpoint Leaderboard', cmd: 'leaderboard' }
        ],
        welcomeMsg: 'Saludos, Fernando. Tengo el esquema de **Supabase PostgreSQL** listo en `supabase/schema.sql` y el servidor del Bot en `backend/bot.js`. Manejamos transacciones atómicas para que jamás se dupliquen tickets ni se alteren balances.',
        responses: {
            schema: '🗄️ **Tablas Supabase Listas:**\n• `users`: ID de Telegram, saldo de tickets, monedas y árbol de referidos.\n• `jackpots`: Bote semanal con base de $10 USD y crecimiento en tiempo real.\n• `game_scores`: Registro de partidas auditadas con firma hash y validación física.\n• `weekly_leaderboard`: Vista SQL que clasifica a los mejores jugadores de la semana.',
            bot: '🤖 **@GamerVerseArcadeBot Configurado:**\n• `/start`: Mensaje de bienvenida con botón nativo de WebApp y teclado con enlace de referidos.\n• `/start ref_{id}`: Acreditación de +3 tickets al invitado y +3 al anfitrión.\n• `/bote`: Información del premio acumulado y distribución dominical 60/25/15%.',
            rpc: '🎟️ **Función RPC Atómica `consume_ticket`:**\n```sql\nUPDATE public.users SET tickets = tickets - 1 WHERE id = p_user_id AND tickets >= 1;\n```\nGarantiza que dos partidas simultáneas no puedan consumir el mismo ticket.',
            leaderboard: '📊 **Endpoint `/api/score/submit`:** Recibe la distancia, monedas y checksum temporal. Si el ratio supera 1m/75ms, el score entra en bandera de fraude y se rechaza.'
        }
    }
};

// All-Hands Multi-Agent Meeting Presets
const ALL_HANDS_PRESETS = [
    {
        keywords: ['lanzamiento', 'torneo', 'domingo', 'lanzar', 'listos', 'como vamos', 'estado'],
        responses: [
            { agent: 'antigravity', text: '¡Atención equipo! Fernando ha convocado la reunión. Estamos afinando el plan maestro para el lanzamiento de GamerVerse y el primer torneo semanal. Revisemos estados por departamento.' },
            { agent: 'alex', text: 'Por parte de los juegos Arcade: AstronautRunner y SaveTheAstronaut están corriendo a 60 FPS limpios. El hook de 1 ticket por partida está preparado para enganchar con la sesión.' },
            { agent: 'elena', text: 'ArrowEscape está listo. Los primeros 20 niveles enganchan de inmediato al jugador con dificultad progresiva y cero lag táctil.' },
            { agent: 'cipher', text: 'Lado de seguridad: Hemos blindado las variables en memoria y el hash HMAC-SHA256 para que nadie envíe puntajes falsos al Bote.' },
            { agent: 'marcus', text: 'Finanzas listas: Bote semilla configurado con proyección de $42.50+ USDT para el primer domingo. Margen de ganancia de la LLC protegido al 50% limpio.' },
            { agent: 'valeria', text: 'El embudo de TikTok está caliente: 3 clips listos con ganchos de frustración dirigidos al enlace de referidos del bot. En cuanto demos luz verde, salimos al aire.' },
            { agent: 'luna', text: 'La Landing Page en GamerVersePortfolio tiene el botón principal apuntando a la Mini App. Los visitantes van directo a jugar.' },
            { agent: 'santi', text: 'Canales de Telegram listos para moderar el hype y publicar el Hall de la Fama el domingo por la noche. ¡Estamos listos para romperla, Jefe!' }
        ]
    },
    {
        keywords: ['tiktok', 'viral', 'usuarios', 'marketing', 'crecimiento', 'visitas'],
        responses: [
            { agent: 'valeria', text: 'El plan de crecimiento es agresivo pero con costo $0: crearemos clips cortos de fallos épicos en el nivel 5 de AstronautRunner. La gente se pica y entra a demostrar que puede superarlo.' },
            { agent: 'santi', text: 'Y en cuanto entren, el incentivo de los 3 tickets gratis por invitar amigos hace que el enlace ruede por todos los grupos de Telegram.' },
            { agent: 'marcus', text: 'A mayor tráfico de referidos, más anuncios se consumen en Adsgram y más rápido sube el Bote. Es un bucle cerrado perfecto.' },
            { agent: 'antigravity', text: 'Exactamente. Viralidad orgánica combinada con retención arcade. Esa es la fórmula para los $50k/mes.' }
        ]
    },
    {
        defaultResponses: [
            { agent: 'antigravity', text: 'Recibido Fernando. Coordinando la orden en todos los módulos de la oficina virtual.' },
            { agent: 'alex', text: 'Entendido. Lo aplico en la lógica del motor de los juegos arcade.' },
            { agent: 'cipher', text: 'Registrado en la auditoría de seguridad para mantener la integridad del sistema.' },
            { agent: 'valeria', text: 'Alineo la campaña de comunicación y redes con este objetivo.' },
            { agent: 'marcus', text: 'Calculando el impacto en la tesorería y el reparto del Bote.' }
        ]
    }
];

// ==========================================================================
// 3. UI State & DOM Elements
// ==========================================================================
let currentAgentId = 'alex';
let simulatedTickets = 5;
let sessionSeconds = 0;
let sessionTimerInterval = null;

// DOM references
const activeAgentTitle = document.getElementById('active-agent-title');
const activeAgentBadge = document.getElementById('active-agent-badge');
const bioAvatar = document.getElementById('bio-avatar');
const bioName = document.getElementById('bio-name');
const bioRole = document.getElementById('bio-role');
const chatHistory = document.getElementById('console-chat-history');
const quickActionsContainer = document.getElementById('quick-actions-container');
const consoleForm = document.getElementById('console-form');
const consoleInput = document.getElementById('console-input');
const activityFeed = document.getElementById('live-activity-feed');
const agentSkillsList = document.getElementById('agent-skills-list');

// Modals
const arcadeModal = document.getElementById('arcade-modal');
const closeArcadeModalBtn = document.getElementById('close-arcade-modal');
const gameFrame = document.getElementById('game-frame');
const hudTickets = document.getElementById('hud-tickets');
const hudTimer = document.getElementById('hud-timer');
const hudRefreshGameBtn = document.getElementById('hud-refresh-game');

const meetingModal = document.getElementById('meeting-modal');
const closeMeetingModalBtn = document.getElementById('close-meeting-modal');
const meetingThread = document.getElementById('meeting-dialogue-thread');
const allHandsForm = document.getElementById('all-hands-form');
const allHandsInput = document.getElementById('all-hands-input');
const meetingFollowupForm = document.getElementById('meeting-followup-form');
const meetingInput = document.getElementById('meeting-input');
const allHandsTopBtn = document.getElementById('all-hands-btn');
const arcadeQuickLaunchBtn = document.getElementById('arcade-quick-launch');
const arcadeCabinetDesk = document.getElementById('arcade-cabinet-desk');
const sfxToggleBtn = document.getElementById('sfx-toggle');

// ==========================================================================
// 4. Core Agent Interaction Functions
// ==========================================================================

function selectAgent(agentId) {
    const agent = AGENTS[agentId];
    if (!agent) return;
    currentAgentId = agentId;
    sfx.click();

    // Highlight room in floorplan
    document.querySelectorAll('.room').forEach(r => r.classList.remove('active-selected'));
    const roomEl = document.getElementById(agent.room);
    if (roomEl) roomEl.classList.add('active-selected');

    // Update terminal header & bio
    activeAgentTitle.textContent = `Terminal: ${agent.name} (${agent.role.split('(')[0].trim()})`;
    activeAgentBadge.textContent = agent.status;
    bioAvatar.textContent = agent.avatar;
    bioName.textContent = agent.name;
    bioRole.textContent = agent.bio;

    // Render skills pills
    if (agentSkillsList) {
        agentSkillsList.innerHTML = '';
        (agent.skills || []).forEach(skill => {
            const pill = document.createElement('span');
            pill.className = 'skill-pill';
            pill.textContent = skill;
            agentSkillsList.appendChild(pill);
        });
    }

    // Render quick action chips
    quickActionsContainer.innerHTML = '';
    agent.quickActions.forEach(action => {
        const chip = document.createElement('button');
        chip.className = 'action-chip';
        chip.textContent = action.label;
        chip.addEventListener('click', () => handleQuickAction(action.cmd));
        quickActionsContainer.appendChild(chip);
    });

    // Reset / Welcome message
    appendChatMessage('system', `🟢 Conectado con la estación de ${agent.name}.`);
    appendChatMessage('agent', agent.welcomeMsg, agent.name);
}

function appendChatMessage(type, text, authorName = '') {
    const msg = document.createElement('div');
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (type === 'system') {
        msg.className = 'chat-msg system-msg';
        msg.innerHTML = `<span class="timestamp">[${time}]</span> ${text}`;
    } else if (type === 'agent') {
        msg.className = 'chat-msg agent-msg';
        msg.innerHTML = `<span class="author">${authorName || 'Agente'}:</span> ${formatMarkdown(text)}`;
        sfx.chat();
    } else if (type === 'user') {
        msg.className = 'chat-msg user-msg';
        msg.innerHTML = `<span class="author">Fernando (CEO):</span> ${formatMarkdown(text)}`;
    }

    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function handleQuickAction(cmd) {
    sfx.click();
    const agent = AGENTS[currentAgentId];
    if (!agent) return;

    if (cmd === 'play' || agent.responses[cmd] === 'ACTION_PLAY_ASTRONAUT') {
        openArcadeModal('astronaut');
        return;
    }
    if (agent.responses[cmd] === 'ACTION_PLAY_ARROW') {
        openArcadeModal('arrow');
        return;
    }
    if (cmd === 'view' || agent.responses[cmd] === 'ACTION_VIEW_LANDING') {
        openArcadeModal('landing');
        return;
    }

    const reply = agent.responses[cmd] || `Comando '${cmd}' procesado. Todo conforme a la especificación técnica.`;
    appendChatMessage('user', `Ejecutar: ${cmd}`);
    setTimeout(() => {
        appendChatMessage('agent', reply, agent.name);
    }, 250);
}

function handleConsoleSubmit(e) {
    e.preventDefault();
    const text = consoleInput.value.trim();
    if (!text) return;
    consoleInput.value = '';

    appendChatMessage('user', text);
    sfx.click();

    const agent = AGENTS[currentAgentId];
    setTimeout(() => {
        const reply = generateAgentReply(agent, text);
        appendChatMessage('agent', reply, agent.name);
    }, 450);
}

function generateAgentReply(agent, userPrompt) {
    const lower = userPrompt.toLowerCase();
    
    // Check keyword matches in agent responses
    for (const [key, val] of Object.entries(agent.responses)) {
        if (typeof val === 'string' && !val.startsWith('ACTION_')) {
            if (lower.includes(key)) return val;
        }
    }

    // Role-specific deep responses based on technical skills and persona
    if (agent.id === 'alex') {
        if (lower.includes('colision') || lower.includes('fisica') || lower.includes('hitbox')) {
            return `🚀 **Alex:** En *AstronautRunner* utilizo colisiones AABB para meteoros rectangulares y radios euclidianos circulares para el astronauta (\`Math.hypot(dx, dy) < r1 + r2\`). Esto consume menos de 0.4ms de CPU por frame, asegurando los 60 FPS estables.`;
        }
        if (lower.includes('pausa') || lower.includes('controles') || lower.includes('tactil') || lower.includes('touch')) {
            return `🚀 **Alex:** El control táctil está calibrado con \`e.preventDefault()\` en los listeners de \`touchmove\` para evitar que el gesto de arrastre dispare el pull-to-refresh de Telegram. El botón de pausa flotante tiene un área de toque aumentada (48x48px) para que nunca falle el pulgar.`;
        }
        return `🚀 **Alex:** Entendido, Fernando. Tengo el frame budget bajo control (<16.6ms). Mi prioridad ahora es que cada partida de *AstronautRunner* y *SaveTheAstronaut* empiece descontando 1 Ticket de forma limpia y lance el callback al morir sin colgar la memoria.`;
    } 
    
    else if (agent.id === 'elena') {
        if (lower.includes('nivel') || lower.includes('dificultad') || lower.includes('curva')) {
            return `🎯 **Elena:** En *ArrowEscape* calculo la densidad de flechas bloqueadas mediante grafos dirigidos. En los niveles 1 al 10 el jugador tiene al menos 2 movimientos libres inmediatos para generar dopamina rápida. A partir del nivel 20 introduzco flechas entrelazadas que exigen pensar 3 pasos por adelantado.`;
        }
        return `🎯 **Elena:** Anotado, Fernando. Toda la grilla de *ArrowEscape* se recalcula dinámicamente con \`getBoundingClientRect()\` para que encaje perfectamente tanto en un iPhone 15 como en un Android con barra de navegación flotante.`;
    } 
    
    else if (agent.id === 'cipher') {
        if (lower.includes('hack') || lower.includes('trampa') || lower.includes('cheat') || lower.includes('bot')) {
            return `🕵️‍♂️ **Cipher:** Mi regla de oro: *Nunca confíes en el cliente*. Si un usuario intenta enviar un score alterando el DOM o usando un script en Telegram Web, el backend valida la firma criptográfica HMAC-SHA256 con la secret key del bot. Si el hash no coincide, el score se descarta y el usuario entra en lista negra silenciosa.`;
        }
        if (lower.includes('memoria') || lower.includes('fuga') || lower.includes('leak') || lower.includes('fps')) {
            return `🕵️‍♂️ **Cipher:** Realicé un heap snapshot de 15 minutos en bucle continuo: los objetos de partículas se reciclan en un pool fijo (\`Object Pool Pattern\`) en lugar de crearse con \`new\` en cada frame. Fugas de memoria: 0%.`;
        }
        return `🕵️‍♂️ **Cipher:** Registrado en el log de seguridad. Mantengo monitoreo de consistencia: ratio de puntos por segundo dentro de los rangos matemáticamente posibles.`;
    } 
    
    else if (agent.id === 'valeria') {
        if (lower.includes('video') || lower.includes('tiktok') || lower.includes('hook') || lower.includes('guion')) {
            return `📱 **Valeria:** Para TikTok el secreto es el *Visual Hook*: mostramos el dedo del jugador a 1 milímetro de chocar contra el meteoro en el segundo 1. La música debe entrar en sincronía con el Game Over. El texto: *"Dime que pasas de 800m y te creo..."*. Envíame el siguiente clip de gameplay y lo transformo en oro viral.`;
        }
        if (lower.includes('referido') || lower.includes('amigo') || lower.includes('viral')) {
            return `📱 **Valeria:** Con el sistema de +3 Tickets y el 10% de bono si el amigo gana el Bote del domingo, logramos un factor $K = 1.34$. Es decir, cada 1,000 jugadores atraen a 1,340 más por boca a boca puro en chats de Telegram.`;
        }
        return `📱 **Valeria:** ¡Perfecto, Fernando! Mi meta es mantener el Costo de Adquisición en $0 USD absoluto. La frustración y el FOMO del Bote son los motores más potentes de internet.`;
    } 
    
    else if (agent.id === 'marcus') {
        if (lower.includes('ecpm') || lower.includes('adsgram') || lower.includes('anuncio') || lower.includes('monet')) {
            return `📊 **Marcus:** El eCPM de Adsgram para Rewarded Video en Telegram ronda los $2.20-$4.50 en LATAM y escala hasta $14-$22 en Tier 1 (EE.UU., Alemania). Con una tasa de 4 videos diarios por usuario activo, el margen neto para la LLC es del 50% limpio después de alimentar el Bote Semanal.`;
        }
        if (lower.includes('bote') || lower.includes('usdt') || lower.includes('premio') || lower.includes('domingo')) {
            return `📊 **Marcus:** El Bote es una variable autolimitada: arranca con $10-$40 USDT de fondo semilla y se incrementa en $0.0012 USDT por cada anuncio visto. Si la actividad baja, el bote no compromete capital propio; si la actividad sube, el premio crece exponencialmente atrayendo más masa crítica.`;
        }
        return `📊 **Marcus:** Anotado en el libro contable. Cuidamos cada céntimo para que la LLC crezca con liquidez sólida rumbo a la meta de $50,000 USD/mes.`;
    } 
    
    else if (agent.id === 'santi') {
        if (lower.includes('pago') || lower.includes('prueba') || lower.includes('comprobante') || lower.includes('confianza')) {
            return `🏆 **Santi:** La transparencia es nuestra mayor arma de retención. Cada domingo a medianoche capturamos la transacción de Binance Pay / red TON, pixelamos datos sensibles del ganador pero dejamos el TXID verificable en blockchain, y lo fijamos en el canal @GamerVerseNews. La tasa de conversión de escépticos se multiplica por 3x.`;
        }
        return `🏆 **Santi:** ¡A la orden! Canal y grupo de chat listos. La comunidad está esperando con ansias el anuncio del primer torneo oficial.`;
    } 
    
    else if (agent.id === 'luna') {
        if (lower.includes('landing') || lower.includes('web') || lower.includes('cta') || lower.includes('boton')) {
            return `🎨 **Luna:** He colocado el botón principal de *"Jugar Gratis en Telegram"* en el primer tercio de la pantalla (above the fold) con efecto de respiración de neón cyan. Las tarjetas de los juegos ahora cuentan con badges de '1 🎟️' y el selector de idiomas soporta EN/ES/PT para tráfico global.`;
        }
        return `🎨 **Luna:** Entendido. Mantendré la paleta cyberpunk oscura con acentos cyan y fucsia para que la marca GamerVerse se sienta premium y memorable.`;
    } 
    
    else if (agent.id === 'dante') {
        if (lower.includes('supabase') || lower.includes('sql') || lower.includes('base') || lower.includes('db')) {
            return `💾 **Dante:** El script \`supabase/schema.sql\` está listo para ejecutarse en el SQL Editor de Supabase. Incluye RLS, tipos atómicos y el stored procedure \`submit_match_score\` con validación de ratio tiempo/distancia.`;
        }
        if (lower.includes('bot') || lower.includes('telegram') || lower.includes('token') || lower.includes('api')) {
            return `💾 **Dante:** El servidor \`backend/bot.js\` ya cuenta con verificación HMAC-SHA256 para \`Telegram.WebApp.initData\`, el comando \`/start ref_{id}\` para referidos automáticos y los endpoints REST para consumo de tickets.`;
        }
        return `💾 **Dante:** Servidor de datos operativo, Fernando. Garantizo que las lecturas y escrituras de tickets y premios en Supabase se procesen en menos de 45ms.`;
    } 
    
    else {
        return `🤖 **Antigravity:** Instrucción estratégica recibida, Fernando. Coordino los sprints de código, seguridad y growth para mantener al equipo 100% enfocado en los entregables prioritarios.`;
    }
}

// Markdown-lite formatter
function formatMarkdown(str) {
    return str
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

// ==========================================================================
// 5. Multi-Agent All-Hands Meeting Engine
// ==========================================================================

function openAllHandsMeeting(initialPrompt = '') {
    sfx.launch();
    meetingThread.innerHTML = '';
    meetingModal.classList.add('open');

    const promptText = initialPrompt.trim() || '¿Cómo estamos para el lanzamiento de GamerVerse y el torneo de este domingo?';
    
    // Add CEO prompt
    appendMeetingMessage({
        avatar: '👑',
        name: 'Fernando Goncalvez (CEO)',
        role: 'Dirección General',
        text: promptText,
        isCEO: true
    });

    triggerMultiAgentResponse(promptText);
}

function triggerMultiAgentResponse(promptText) {
    const lower = promptText.toLowerCase();
    let selectedPreset = ALL_HANDS_PRESETS[0]; // Default launch preset

    for (const preset of ALL_HANDS_PRESETS) {
        if (preset.keywords && preset.keywords.some(k => lower.includes(k))) {
            selectedPreset = preset;
            break;
        }
    }

    const responses = selectedPreset.responses || selectedPreset.defaultResponses;

    responses.forEach((item, index) => {
        setTimeout(() => {
            const agent = AGENTS[item.agent];
            if (agent) {
                appendMeetingMessage({
                    avatar: agent.avatar,
                    name: agent.name,
                    role: agent.role,
                    text: item.text,
                    isCEO: false
                });
                sfx.chat();
            }
        }, (index + 1) * 700);
    });
}

function appendMeetingMessage({ avatar, name, role, text, isCEO }) {
    const msg = document.createElement('div');
    msg.className = 'meeting-msg' + (isCEO ? ' ceo-msg' : '');
    msg.innerHTML = `
        <div class="meeting-avatar">${avatar}</div>
        <div class="meeting-content">
            <div class="meeting-author-row">
                <span class="meeting-author" style="color: ${isCEO ? '#ffb700' : '#00f0ff'}">${name}</span>
                <span class="meeting-role">${role}</span>
            </div>
            <div class="meeting-text">${formatMarkdown(text)}</div>
        </div>
    `;
    meetingThread.appendChild(msg);
    meetingThread.scrollTop = meetingThread.scrollHeight;
}

// ==========================================================================
// 6. Interactive Arcade Cabinet Playroom (Plays the real games!)
// ==========================================================================

const GAME_URLS = {
    astronaut: '../AstronautRunner/index.html',
    tropic: '../IslandAdventure/index.html',
    save: '../SaveTheAstronaut/index.html',
    arrow: '../ArrowEscape/index.html',
    landing: '../GamerVersePortfolio/index.html'
};

function openArcadeModal(gameKey = 'astronaut') {
    sfx.launch();
    arcadeModal.classList.add('open');
    switchGameTab(gameKey);
    startSessionTimer();
}

function switchGameTab(gameKey) {
    sfx.click();
    document.querySelectorAll('.game-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-game') === gameKey);
    });

    const targetUrl = GAME_URLS[gameKey] || GAME_URLS.astronaut;
    gameFrame.src = targetUrl;

    // Simulate ticket deduction on session start
    if (gameKey !== 'landing') {
        if (simulatedTickets > 0) {
            simulatedTickets--;
            hudTickets.textContent = simulatedTickets;
            addStudioLog('dev', 'Alex', `Partida iniciada en ${gameKey}. Consumido 1 ticket. Saldo restante: ${simulatedTickets}`);
        } else {
            addStudioLog('viral', 'Valeria', `Usuario sin tickets en ${gameKey}. Activado hook de Adsgram (+1 Ticket).`);
        }
    }
}

function startSessionTimer() {
    clearInterval(sessionTimerInterval);
    sessionSeconds = 0;
    hudTimer.textContent = '00:00';
    sessionTimerInterval = setInterval(() => {
        sessionSeconds++;
        const m = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
        const s = String(sessionSeconds % 60).padStart(2, '0');
        hudTimer.textContent = `${m}:${s}`;
    }, 1000);
}

// ==========================================================================
// 7. Live Studio Activity Feed
// ==========================================================================

const ACTIVITY_TEMPLATES = [
    { type: 'dev', agent: 'Alex', msg: 'Verificado loop de colisiones en AstronautRunner a 60 FPS.' },
    { type: 'security', agent: 'Cipher', msg: 'Escaneo de inyecciones de memoria en navegador: CERO anomalías.' },
    { type: 'viral', agent: 'Valeria', msg: 'Calibrado generador de enlaces de referidos t.me/GamerVerseBot?start=ref_...' },
    { type: 'finance', agent: 'Marcus', msg: 'Bote actualizado a $42.50 USDT. Reparto dominical proyectado OK.' },
    { type: 'hype', agent: 'Santi', msg: 'Canal @GamerVerseNews programado para recordatorio de fin de torneo.' },
    { type: 'design', agent: 'Luna', msg: 'Optimizando viewport móvil para navegación dentro de Telegram WebApp.' },
    { type: 'ai', agent: 'Antigravity', msg: 'Sincronización de agentes completada. Todos los servicios en línea.' }
];

function addStudioLog(type, agentName, text) {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-agent">${agentName}:</span> ${text}`;
    activityFeed.appendChild(entry);
    activityFeed.scrollTop = activityFeed.scrollHeight;

    // Keep feed trimmed to 30 items
    if (activityFeed.children.length > 30) {
        activityFeed.removeChild(activityFeed.firstElementChild);
    }
}

function startLiveActivityFeed() {
    // Initial logs
    ACTIVITY_TEMPLATES.forEach((item, i) => {
        setTimeout(() => addStudioLog(item.type, item.agent, item.msg), i * 300);
    });

    // Periodic dynamic events
    setInterval(() => {
        const rand = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
        addStudioLog(rand.type, rand.agent, rand.msg);
    }, 6000);
}

// ==========================================================================
// 8. Event Listeners & Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Room clicks
    document.querySelectorAll('.agent-desk').forEach(desk => {
        desk.parentElement.addEventListener('click', () => {
            const agentId = desk.getAttribute('data-agent-id');
            if (agentId) selectAgent(agentId);
        });
    });

    // Arcade Cabinet desk click
    if (arcadeCabinetDesk) {
        arcadeCabinetDesk.addEventListener('click', () => openArcadeModal('astronaut'));
    }

    // Header buttons
    if (arcadeQuickLaunchBtn) {
        arcadeQuickLaunchBtn.addEventListener('click', () => openArcadeModal('astronaut'));
    }
    if (allHandsTopBtn) {
        allHandsTopBtn.addEventListener('click', () => openAllHandsMeeting());
    }
    if (sfxToggleBtn) {
        sfxToggleBtn.addEventListener('click', () => {
            const on = sfx.toggle();
            sfxToggleBtn.innerHTML = `🔊 <span class="btn-text">SFX: ${on ? 'ON' : 'OFF'}</span>`;
        });
    }

    // Console form
    consoleForm.addEventListener('submit', handleConsoleSubmit);

    // All-Hands bottom bar form
    allHandsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = allHandsInput.value.trim();
        allHandsInput.value = '';
        openAllHandsMeeting(text);
    });

    // Meeting follow-up form inside modal
    meetingFollowupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = meetingInput.value.trim();
        if (!text) return;
        meetingInput.value = '';

        appendMeetingMessage({
            avatar: '👑',
            name: 'Fernando Goncalvez (CEO)',
            role: 'Dirección General',
            text: text,
            isCEO: true
        });

        triggerMultiAgentResponse(text);
    });

    // Arcade tabs
    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const gameKey = tab.getAttribute('data-game');
            switchGameTab(gameKey);
        });
    });

    // Arcade controls
    if (hudRefreshGameBtn) {
        hudRefreshGameBtn.addEventListener('click', () => {
            sfx.click();
            gameFrame.src = gameFrame.src;
            startSessionTimer();
        });
    }

    // Modal close buttons
    closeArcadeModalBtn.addEventListener('click', () => {
        arcadeModal.classList.remove('open');
        clearInterval(sessionTimerInterval);
        gameFrame.src = 'about:blank'; // Stop audio/loops in background
    });

    closeMeetingModalBtn.addEventListener('click', () => {
        meetingModal.classList.remove('open');
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === arcadeModal) {
            arcadeModal.classList.remove('open');
            clearInterval(sessionTimerInterval);
            gameFrame.src = 'about:blank';
        }
        if (e.target === meetingModal) {
            meetingModal.classList.remove('open');
        }
    });

    // Start systems
    selectAgent('alex');
    startLiveActivityFeed();
});
