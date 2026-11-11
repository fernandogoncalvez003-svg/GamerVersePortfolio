# Memoria de Desarrollo y Ruta del Proyecto (AGENTS.md)

Este archivo actúa como la memoria a largo plazo del asistente Antigravity y el Desarrollador. Describe las metas globales del negocio, la visión de la LLC y el estado técnico del juego actual.

---

## 1. Visión de Negocio y Metas del Desarrollador
* **Meta Global:** Fundar una **LLC de desarrollo de videojuegos móviles** y alcanzar una facturación de **$50,000 USD mensuales** a través de un portafolio de múltiples juegos casuales/arcade optimizados.
* **Estrategia Financiera:**
  - Iniciar de forma progresiva con bajo capital enfocándose en mecánicas probadas y adictivas (Arcade / Endless Runners).
  - Tráfico y optimización de eCPMs mediante adquisición de usuarios (UA) económica en LATAM (pruebas) y escalado posterior a países Tier 1 (EE. UU., Europa).
  - Modelo de monetización híbrida: 70% Anuncios (Rewarded Ads, Interstitials breves) y 30% Compras In-App (IAP).

---

## 2. Proyecto Actual: Save the Astronaut
* **Género:** Casual / Space Arcade.
* **Tecnología:** HTML, Javascript y Vanilla CSS compilado de forma nativa a Android e iOS mediante **Capacitor**.
* **Mecánicas e Implementación:**
  * **Control:** Optimizado para jugarse con un solo dedo (arrastre directo) y disparo 100% automático.
  * **Pausa:** Botón dedicado de pausa en pantalla y menú con opciones de continuar, reiniciar, ajustes y salir al mapa.
  * **Monetización ("Efecto Ficha"):** Botón de revivir viendo 1 anuncio en la pantalla de Game Over con protección de escudo temporal.
  * **Potenciadores Recompensados (Rewarded Boosters):**
    - Pantalla de preparación de nivel antes de iniciar.
    - **Furia de Plasma 🔥**: Inicia con el Láser de Plasma por 30s.
    - **Súper Imán 🧲**: Rango infinito de atracción de monedas durante todo el nivel.
  * **Balance de Niveles:** Objetivos y vida de Jefes Finales escalados un ~35% para partidas más duraderas y satisfactorias (1-2 min).

---

## 3. Pilar Estratégico Telegram Mini Apps: GamerVerse Hub
* **Meta del Ecosistema:** Convertir `GamerVerse` en un Hub central de Mini Apps en Telegram que unifica todo el portafolio (`AstronautRunner`, `SaveTheAstronaut`, `ArrowEscape`).
* **Economía Unificada:**
  - **Tickets (🎟️):** Moneda de entrada para jugar partidas. Se obtienen 3 gratis diarios, viendo anuncios recompensados (Adsgram) o invitando amigos (referidos).
  - **Bote Dinámico:** Un premio semanal en USDT que crece en tiempo real con la actividad publicitaria y compras en Telegram Stars.
  - **Torneos Semanales:** Reparto domingos a los mejores del ranking (60% 1.er lugar, 25% 2.º lugar, 15% 3.er lugar).
  - Ver especificación completa en [GAMERVERSE_MASTER_PLAN.md](file:///Volumes/2%20TB%20Fer/Fer24102026/FerServ/Gamer/GAMERVERSE_MASTER_PLAN.md).

---

## 3. Guía del Entorno de Compilación
* **SDK Android:** Ubicado en `C:/Users/FerServ/AppData/Local/Android/Sdk` (configurado en `local.properties`).
* **JVM/Java:** Usa el JetBrains Runtime (`jbr`) de Android Studio en `C:\Program Files\Android\Android Studio\jbr`.
* **Comandos de compilación:**
  - Compilación Web: `npm run build` en el directorio `/SaveTheAstronaut`.
  - Compilación APK: `gradlew.bat assembleDebug` en el directorio `/SaveTheAstronaut/android`.
  - El APK final se copia a la carpeta del juego como [SaveTheAstronaut-debug.apk](file:///c:/Users/FerServ/Gamer/SaveTheAstronaut/SaveTheAstronaut-debug.apk).

---

## 4. Instrucciones para el Asistente Antigravity
> [!IMPORTANT]
> Lee siempre este archivo al iniciar cualquier nueva tarea en este espacio de trabajo. Nunca olvides el objetivo de la LLC de $50k/mes ni el enfoque de monetización arcade híbrida de este portafolio. Prioriza respuestas directas y pragmáticas sin perder tiempo en redundancias o explicaciones repetitivas.
