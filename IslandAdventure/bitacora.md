# Bitácora de Diseño: Proyecto Island Adventure 🌴

* **Fecha de inicio:** Viernes, 7 de agosto de 2026 (~11:00 PM)
* **Objetivo:** Crear un juego casual/arcade móvil inspirado en el clásico *Adventure Island* de NES/Nintendo, adaptándolo a mecánicas modernas, controles simples y monetización híbrida óptima para el portafolio de la LLC.

---

## 1. Visión General del Juego
Un juego de plataformas auto-runner de desplazamiento lateral (u orientación vertical en móvil) de ritmo ágil, donde la supervivencia depende de recolectar comida constantemente y esquivar o derrotar obstáculos y enemigos mediante mecánicas satisfactorias y un flujo constante de dopamina visual.

---

## 2. Conceptos Clave & Mecánicas Propuestas

### A. Control de Un Solo Dedo (One-Hand Friendly)
* **Movimiento:** El personaje corre automáticamente de izquierda a derecha (o de abajo hacia arriba si es vertical).
* **Acciones:**
  * **Toque simple (Tap):** Saltar. Mantener presionado permite planear brevemente flotando con una hoja tropical.
  * **Deslizamiento (Swipe) o Toque Doble:** Lanzar el arma actual.
  * *Alternativa:* Disparo automático a enemigos en rango visual (como en *Save the Astronaut* o *Archero*) para que el jugador se concentre al 100% en el plataformeo y la comida.

### B. Barra de Energía y "Fiebre de Frutas" (Juice Rush)
* **Consumo continuo:** La barra de energía actúa como reloj y vida a la vez. Baja constantemente y se recarga recogiendo piñas, plátanos, manzanas y uvas flotantes.
* **Modo Fiebre:** Al llenar una barra secundaria recogiendo frutas consecutivas sin fallar, se activa el modo invencible:
  * El fondo cambia a colores vibrantes/psicodélicos.
  * Suena música synthwave tropical acelerada.
  * Se activa un súper imán que atrae todos los ítems y destruye enemigos al contacto.

### C. Huevos Sorpresa (Power-ups & Vehículos)
* Romper huevos gigantes en el camino otorga mejoras temporales:
  * **Hacha de Piedra / Boomerang de Fuego:** Armas para despejar el camino.
  * **La Patineta:** Aumenta la velocidad drásticamente, permite saltos dobles y sirve como escudo de un solo impacto.
  * **Mascotas / Monturas:** Un mini dinosaurio volador o un escarabajo de fuego que cambia las físicas de movimiento por tiempo limitado.

### D. Obstáculos Clásicos
* **La Piedra Gris:** El clásico obstáculo que no te mata de inmediato, sino que te hace tropezar, perder velocidad y te resta un segmento importante de energía (dando una animación cómica del personaje perdiendo el equilibrio).
* **Enemigos:** Caracoles, serpientes de fuego y cuervos molestos.

### E. Monetización Híbrida ("Efecto Ficha")
* Al morir por falta de energía o golpe definitivo, aparece un menú de Game Over rápido:
  * **Botón de Revivir:** Viendo un anuncio premiado (Rewarded Ad) o usando una gema/moneda del juego.
  * **Efecto de reingreso:** El personaje cae en una patineta dorada brillante con un escudo de invencibilidad de 3 segundos para reengancharse rápido con el gameplay.

---

## 3. Próximos Pasos (Para la siguiente sesión)
1. **Definir la orientación definitiva:** ¿Horizontal clásica (2D Side-scroller) o Vertical moderna (Portrait Auto-runner)?
2. **Definir la pila tecnológica:** Estructura en HTML, Javascript con Canvas (o motor ligero como Phaser/Vite) y CSS nativo, empaquetado a Android usando Capacitor.
3. **Estructura inicial del proyecto:** Crear los archivos base (`index.html`, `style.css`, `game.js`).
4. **Diseño de Arte y Audio:** Planificar la paleta de colores vibrantes y la música chiptune pegajosa.

---

*¡Descansa! Nos vemos en la próxima sesión para empezar a dar forma a esta aventura tropical.* 🏝️🍍
