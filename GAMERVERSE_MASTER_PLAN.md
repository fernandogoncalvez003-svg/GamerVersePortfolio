# GamerVerse: Ecosistema Arcade en Telegram (Master Plan)

## 1. Visión Estratégica
Tener a **GamerVerse** como la meta final y el núcleo central es la decisión estratégica principal por tres razones fundamentales:

1. **Retención real:** Si a un jugador no le gusta correr, juega al puzle; si se cansa del puzle, juega a los disparos. La tasa de abandono de la app se reduce drásticamente porque siempre hay variedad dentro del mismo techo.
2. **El Bote Unificado:** No tienes que inventar un premio para cada juego. Todas las partidas y anuncios vistos en cualquier juego alimentan el mismo gran bote semanal de GamerVerse.
3. **Marca propia:** Creas una plataforma escalable. Mañana programas un cuarto o quinto juego y simplemente lo agregas como una tarjeta nueva a GamerVerse sin tener que rehacer bots ni buscar nuevos usuarios.

---

## 2. Arquitectura de GamerVerse en Telegram

Para que funcione de forma fluida y profesional, la estructura de la Mini App se diseña así:

```
                  ┌────────────────────────────────────────┐
                  │          Bot de Telegram               │
                  │        (@GamerVerseArcadeBot)          │
                  └──────────────────┬─────────────────────┘
                                     │ Abre la Mini App
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │                 GAMERVERSE HUB (Lobby)                 │
        │                                                        │
        │  [👤 Perfil / Récord]       [🎟️ Tickets: 5]             │
        │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
        │  🔥 BOTE GLOBAL DE LA SEMANA: $42.50 USDT              │
        │  ⏳ Finaliza en: 2d 14h 30m                            │
        │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
        │                                                        │
        │  [ 🚀 Astronaut Runner ]  ──> [Jugar: 1 Ticket]        │
        │  [ 👾 Save The Astronaut ]──> [Jugar: 1 Ticket]        │
        │  [ 🧩 Arrow Escape ]      ──> [Jugar: 1 Ticket]        │
        │                                                        │
        │  [ 🎟️ Ver Anuncio (+1) ]   [ 👥 Invitar Amigos (+3) ]   │
        │  [ 🏆 Ranking Global ]     [ ⚙️ Reglas del Bote ]       │
        └────────────────────────────────────────────────────────┘
```

---

## 3. Economía del Ecosistema

### A. La moneda de juego: Los Tickets (🎟️)
* Jugar cualquier partida en cualquiera de los 3 juegos consume **1 Ticket**.
* **Cómo se obtienen:**
  1. **3 Tickets diarios gratis** al abrir GamerVerse cada día (recompensa por lealtad).
  2. **1 Ticket extra** por ver un video publicitario de Adsgram (con tope de 10 al día por persona para proteger la calidad del tráfico).
  3. **3 Tickets** cada vez que un amigo entra con su enlace de referido.

### B. El Bote Dinámico (El gancho del FOMO)
* El torneo dura de **Lunes 00:00 UTC a Domingo 23:59 UTC**.
* Arranca cada lunes con una base atractiva (ej. $10 USD).
* Con cada anuncio visto en el sistema, el backend calcula la fracción correspondiente y la suma al contador en pantalla en tiempo real. Los jugadores ven cómo el bote crece con la actividad de la comunidad.
* **El reparto del domingo:**
  * 🥇 1.er lugar del Ranking General: **60% del Bote**
  * 🥈 2.º lugar: **25% del Bote**
  * 🥉 3.er lugar: **15% del Bote**
* El pago se entrega de forma transparente vía **USDT (Binance Pay o red TON)** a los usuarios ganadores.

### C. El Sistema de Referidos Viral
* Cada usuario tiene su enlace único generado por el bot: `t.me/GamerVerseBot?start=ref_ID_USUARIO`.
* El botón **"Invitar a un amigo"** abre la lista de contactos de Telegram y envía un mensaje atractivo prediseñado con su enlace.
* Para incentivar a que no solo inviten por invitar: el que invita gana **3 tickets**, y si su amigo se coloca en el Top 10 del ranking semanal, ¡el que lo invitó recibe un bono extra del 10%!

---

## 4. Portafolio de Juegos Integrados

| Juego | Género / Estilo | Archivos Base | Estado |
| :--- | :--- | :--- | :--- |
| **Astronaut Runner** | Endless Arcade Runner (Reflejos / Carriles) | `Gamer/AstronautRunner` | Listo (con hooks de ads existentes) |
| **Save The Astronaut** | Action Survivor / Boss Arena (Disparos / Vuelo) | `Gamer/SaveTheAstronaut` | Listo (Canvas / Jetpack / Jefes) |
| **Arrow Escape** | Path Puzzle / Lógica espacial | `Gamer/ArrowEscape` | Listo (Niveles y selector de puzzle) |
| **Island Adventure** | Auto-runner / Plataformas tropical | `Gamer/IslandAdventure` | En fase conceptual |

---

## 5. Prevención de Fraude y Seguridad (Anti-Cheat)
1. **Validación Telegram WebApp (`initData`):** Validación estricta con hash HMAC-SHA256 usando el Token del Bot para evitar cuentas falsas.
2. **Cálculo de puntaje en servidor:** Los clientes envían firmas de tiempo y eventos de partida en lugar de enviar puntajes inflados directamente.
3. **Control de frecuencia de anuncios:** Limitar a un máximo razonable por IP/usuario para evitar baneos de Adsgram/Monetag por tráfico inválido.

---

## 6. Plan de Ejecución Paso a Paso

* **Paso 1: El Lobby / Shell de GamerVerse**  
  Crear la interfaz principal (el Hub) con el diseño que ya tienes en `GamerVersePortfolio` adaptado a pantalla móvil de Telegram (mostrando el contador del bote, el saldo de tickets y los 3 juegos).
* **Paso 2: La Conexión con Telegram (SDK + Backend)**  
  Configurar la autenticación segura (`Telegram.WebApp.initData`) para saber qué usuario está jugando, cuántos tickets tiene y guardar sus puntuaciones.
* **Paso 3: Conectar el primer juego (`AstronautRunner`)**  
  Hacer que al pulsar la tarjeta de Astronaut Runner, se consuma 1 ticket y al terminar la partida envíe la puntuación a la base de datos de GamerVerse.
* **Paso 4: Integrar Adsgram y el contador del Bote**  
  Poner el botón de ver anuncios para recargar tickets y que actualice el bote.
* **Paso 5: Conectar los otros dos juegos (`SaveTheAstronaut` y `ArrowEscape`)**  
  Montarlos sobre el mismo sistema unificado de tickets y ranking.
