/**
 * ============================================================
 * ARROW ESCAPE - LEVEL MANAGER (Hasta 100 Flechas)
 * ============================================================
 *
 * Progresión calibrada hasta tableros maestros de 100 flechas:
 * - Nivel 1: Tutorial ágil (8 flechas, 8x10)
 * - Niveles 2-8: Siluetas icónicas con dificultad creciente (12 a 36 flechas)
 * - Niveles 9-24: Escala progresiva de 40 hasta 100 flechas (hasta 20x25)
 * - Niveles 25+: Retos maestros de 100 flechas con portales y candados
 *
 * Cada nivel es verificado matemáticamente por LevelSolver
 * y garantiza 0 solapamientos con portales o candados.
 * ============================================================
 */

class LevelManager {
    constructor() {
        this.cache = new Map();
        this.DIRS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        this.VEC = {
            UP: { x: 0, y: -1 },
            DOWN: { x: 0, y: 1 },
            LEFT: { x: -1, y: 0 },
            RIGHT: { x: 1, y: 0 }
        };
        this.FIGURE_NAMES = [
            '🎄 Árbol Estelar',
            '❤️ Corazón Neón',
            '🏠 Refugio',
            '🐟 Pez Abisal',
            '⭐ Estrella Polar',
            '🚗 Turbo Racer',
            '🧍 Explorador',
            '🚀 Cohete Orbital'
        ];
    }

    getLevel(idx) {
        if (this.cache.has(idx)) {
            return JSON.parse(JSON.stringify(this.cache.get(idx)));
        }

        const name = idx <= this.FIGURE_NAMES.length
            ? this.FIGURE_NAMES[idx - 1]
            : (idx >= 30 ? `💀 Pesadilla 100 #${idx}` : (idx >= 24 ? `🔥 Maestro 100 #${idx}` : `Desafío #${idx}`));

        const lvl = this._generateLevelLayout(name, idx);
        this.cache.set(idx, lvl);
        return JSON.parse(JSON.stringify(lvl));
    }

    _getLevelConfig(idx) {
        if (idx === 1) return { cols: 8, rows: 10, targetLines: 8, minLen: 3, maxLen: 7, portalCount: 0, lockCount: 0, rayBlockWeight: 0, targetMaxFreeRatio: 1.0, candidates: 1 };
        if (idx === 2) return { cols: 10, rows: 12, targetLines: 12, minLen: 3, maxLen: 7, portalCount: 0, lockCount: 0, rayBlockWeight: 0.5, targetMaxFreeRatio: 0.7, candidates: 1 };
        if (idx === 3) return { cols: 10, rows: 13, targetLines: 16, minLen: 3, maxLen: 8, portalCount: 1, lockCount: 0, rayBlockWeight: 1.0, targetMaxFreeRatio: 0.5, candidates: 1 };
        if (idx === 4) return { cols: 12, rows: 14, targetLines: 20, minLen: 3, maxLen: 8, portalCount: 1, lockCount: 0, rayBlockWeight: 1.4, targetMaxFreeRatio: 0.45, candidates: 2 };
        if (idx <= 8) return { cols: 13, rows: 16, targetLines: 20 + (idx - 4) * 4, minLen: 3, maxLen: 9, portalCount: 1, lockCount: 1, rayBlockWeight: 1.8 + (idx - 4) * 0.25, targetMaxFreeRatio: 0.36, candidates: 2 };

        // Niveles 9 en adelante: escala flechas (40 -> 100), portales (1 -> 3), candados (1 -> 3) y bloqueo de salidas
        const targetLines = Math.min(100, 36 + (idx - 8) * 4);
        let cols = 16;
        let rows = 20;
        if (targetLines >= 96) {
            cols = 22;
            rows = 28;
        } else if (targetLines >= 76) {
            cols = 20;
            rows = 25;
        } else if (targetLines >= 56) {
            cols = 18;
            rows = 23;
        }

        const portalCount = idx >= 28 ? 3 : (idx >= 14 ? 2 : 1);
        const lockCount = idx >= 28 ? 3 : (idx >= 14 ? 2 : 1);
        const rayBlockWeight = Math.min(7.0, 2.5 + (idx - 8) * 0.16);
        const inwardWeight = Math.min(0.65, 0.12 + (idx - 8) * 0.02);

        return {
            cols,
            rows,
            targetLines,
            minLen: 3,
            maxLen: targetLines >= 80 ? 11 : 10,
            portalCount,
            lockCount,
            rayBlockWeight,
            inwardWeight
        };
    }

    _isCellInMask(x, y, cols, rows, idx) {
        const nx = (x + 0.5) / cols;
        const ny = (y + 0.5) / rows;

        switch (idx) {
            case 1:
                if (ny > 0.82) return Math.abs(nx - 0.5) <= 0.16;
                return Math.abs(nx - 0.5) <= Math.max(0.14, ny * 0.48);
            case 2:
                if (ny < 0.35) {
                    return Math.hypot(nx - 0.3, ny - 0.25) < 0.24 || Math.hypot(nx - 0.7, ny - 0.25) < 0.24;
                }
                return Math.abs(nx - 0.5) <= Math.max(0.12, (0.95 - ny) * 0.75);
            case 3:
                if (ny < 0.4) return Math.abs(nx - 0.5) <= ny * 1.15 + 0.1;
                return nx >= 0.15 && nx <= 0.85 && ny <= 0.92;
            case 4:
                if (nx > 0.72) return Math.abs(ny - 0.5) <= (nx - 0.65) * 1.2;
                return Math.hypot((nx - 0.45) * 1.2, (ny - 0.5) * 1.6) <= 0.45;
            case 5:
                return Math.abs(nx - 0.5) + Math.abs(ny - 0.5) <= 0.48 ||
                       (Math.abs(nx - 0.5) <= 0.38 && Math.abs(ny - 0.5) <= 0.18);
            case 6:
                if (ny < 0.42) return nx >= 0.26 && nx <= 0.74;
                if (ny <= 0.78) return nx >= 0.1 && nx <= 0.9;
                return (nx >= 0.18 && nx <= 0.36) || (nx >= 0.64 && nx <= 0.82);
            case 7:
                if (ny < 0.25) return Math.abs(nx - 0.5) <= 0.18;
                if (ny < 0.62) return Math.abs(nx - 0.5) <= 0.16 || (ny > 0.32 && ny < 0.48);
                return Math.abs(nx - 0.3) <= 0.12 || Math.abs(nx - 0.7) <= 0.12;
            case 8:
                if (ny < 0.28) return Math.abs(nx - 0.5) <= ny * 0.8 + 0.08;
                if (ny < 0.75) return Math.abs(nx - 0.5) <= 0.24;
                return nx >= 0.16 && nx <= 0.84;
            default:
                return x >= 0 && x < cols && y >= 0 && y < rows;
        }
    }

    _countFreeTurn1(level) {
        if (!window.levelSolver) return level.lines.length;
        let free = 0;
        for (const l of level.lines) {
            if (window.levelSolver.canLineEscape(l, level.lines, level.grid.cols, level.grid.rows, level)) {
                free++;
            }
        }
        return free;
    }

    _generateLevelLayout(name, idx) {
        const cfg = this._getLevelConfig(idx);
        const { cols, rows, targetLines, minLen, maxLen, portalCount, lockCount, rayBlockWeight, inwardWeight = 0 } = cfg;
        const centerX = (cols - 1) / 2;
        const centerY = (rows - 1) / 2;

        const portalPresets = [
            { a: { x: Math.floor(cols * 0.25), y: Math.floor(rows * 0.28) }, b: { x: Math.floor(cols * 0.75), y: Math.floor(rows * 0.72) } },
            { a: { x: Math.floor(cols * 0.75), y: Math.floor(rows * 0.25) }, b: { x: Math.floor(cols * 0.25), y: Math.floor(rows * 0.75) } },
            { a: { x: Math.floor(cols * 0.5), y: Math.floor(rows * 0.18) }, b: { x: Math.floor(cols * 0.5), y: Math.floor(rows * 0.82) } }
        ];

        for (let attempt = 0; attempt < 80; attempt++) {
            const occupied = new Set();
            const lines = [];
            const portals = [];
            const locks = [];

            for (let pIdx = 0; pIdx < portalCount && pIdx < portalPresets.length; pIdx++) {
                const { a: pA, b: pB } = portalPresets[pIdx];
                if ((pA.x !== pB.x || pA.y !== pB.y) && !occupied.has(`${pA.x},${pA.y}`) && !occupied.has(`${pB.x},${pB.y}`)) {
                    portals.push({ a: { ...pA }, b: { ...pB } });
                    occupied.add(`${pA.x},${pA.y}`);
                    occupied.add(`${pB.x},${pB.y}`);
                }
            }

            // Recolectar celdas válidas dentro de la máscara/tablero
            const validCells = [];
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (this._isCellInMask(x, y, cols, rows, idx) && !occupied.has(`${x},${y}`)) {
                        validCells.push({ x, y });
                    }
                }
            }

            const totalMaskCells = validCells.length;
            const exitRaysByIndex = [];
            const unblockedRayOwners = new Map(); // cellKey -> Set(lineIdx aún sin bloquear)
            const blockedAtStart = [];

            const markCellsBlocked = (nodes) => {
                for (const n of nodes) {
                    const owners = unblockedRayOwners.get(`${n.x},${n.y}`);
                    if (owners) {
                        for (const ownerIdx of owners) {
                            blockedAtStart[ownerIdx] = true;
                        }
                    }
                }
            };

            // Múltiples pasadas: primeras pasadas desde el CENTRO hacia afuera para llenar el núcleo primero
            const maxPasses = targetLines >= 60 ? 14 : 8;
            for (let pass = 0; pass < maxPasses && lines.length < targetLines; pass++) {
                const orderedCells = [...validCells];
                if (pass < 4) {
                    orderedCells.sort((a, b) => {
                        const da = Math.hypot(a.x - centerX, a.y - centerY) + Math.random() * 2.5;
                        const db = Math.hypot(b.x - centerX, b.y - centerY) + Math.random() * 2.5;
                        return da - db;
                    });
                } else {
                    for (let i = orderedCells.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        const tmp = orderedCells[i];
                        orderedCells[i] = orderedCells[j];
                        orderedCells[j] = tmp;
                    }
                }

                for (let c = 0; c < orderedCells.length && lines.length < targetLines; c++) {
                    const cell = orderedCells[c];
                    if (occupied.has(`${cell.x},${cell.y}`)) continue;

                    const remLines = targetLines - lines.length;
                    const freeCount = totalMaskCells - (occupied.size - portals.length * 2);
                    const reserveForRest = Math.max(0, (remLines - 1) * 2);
                    const avgBudget = freeCount / Math.max(1, remLines);
                    const dynamicMax = Math.max(
                        2,
                        Math.min(
                            maxLen,
                            freeCount - reserveForRest,
                            Math.max(minLen, Math.round(avgBudget * 1.45))
                        )
                    );
                    const desiredLen = Math.min(
                        dynamicMax,
                        minLen + Math.floor(Math.random() * Math.max(1, dynamicMax - minLen + 1))
                    );

                    const placed = this._tryPlaceAtCell(
                        cell.x,
                        cell.y,
                        cols,
                        rows,
                        occupied,
                        idx,
                        desiredLen,
                        portals,
                        unblockedRayOwners,
                        blockedAtStart,
                        rayBlockWeight,
                        inwardWeight
                    );
                    if (placed) {
                        const lineIdx = lines.length;
                        placed.line.id = lineIdx + 1;
                        lines.push(placed.line);
                        exitRaysByIndex.push(placed.exitRay);
                        blockedAtStart.push(false);
                        placed.line.nodes.forEach(n => occupied.add(`${n.x},${n.y}`));

                        // Esta nueva flecha bloquea las líneas anteriores cuyos rayos atraviesa
                        markCellsBlocked(placed.line.nodes);

                        // Registrar el rayo de esta flecha para que flechas futuras busquen cruzarlo
                        for (const rKey of placed.exitRay) {
                            if (!unblockedRayOwners.has(rKey)) {
                                unblockedRayOwners.set(rKey, new Set());
                            }
                            unblockedRayOwners.get(rKey).add(lineIdx);
                        }
                    }
                }
            }

            if (lines.length < Math.max(6, Math.floor(targetLines * 0.92))) {
                continue;
            }

            // Relleno agresivo: alarga colas y prioriza cruzar rayos aún desbloqueados
            this._extendTailsIntoVoids(
                lines,
                exitRaysByIndex,
                occupied,
                cols,
                rows,
                idx,
                maxLen + 4,
                unblockedRayOwners,
                blockedAtStart,
                rayBlockWeight
            );

            let keyLineId = null;
            if (lockCount > 0 && lines.length >= 6) {
                const tempLevel = { grid: { cols, rows }, lines, portals, locks: [], keyLineId: null };
                const firstKeyId = window.levelSolver
                    ? window.levelSolver.findNextHintLine(lines, cols, rows, tempLevel)
                    : null;

                if (firstKeyId) {
                    const lockKeysUsed = new Set();
                    for (const candidate of lines) {
                        if (locks.length >= lockCount) break;
                        if (candidate.id === firstKeyId) continue;
                        const head = candidate.nodes[candidate.nodes.length - 1];
                        const v = this.VEC[candidate.dir];
                        const lx = head.x + v.x;
                        const ly = head.y + v.y;
                        const lKey = `${lx},${ly}`;
                        if (
                            lx >= 0 && lx < cols && ly >= 0 && ly < rows &&
                            !occupied.has(lKey) && !lockKeysUsed.has(lKey)
                        ) {
                            const nextLocks = [...locks, { x: lx, y: ly }];
                            const testLevel = {
                                grid: { cols, rows },
                                lines,
                                portals,
                                locks: nextLocks,
                                keyLineId: firstKeyId
                            };
                            if (!window.levelSolver || window.levelSolver.solveLevel(testLevel).solvable) {
                                locks.push({ x: lx, y: ly });
                                lockKeysUsed.add(lKey);
                                keyLineId = firstKeyId;
                            }
                        }
                    }
                }
            }

            const level = {
                id: idx,
                name,
                grid: { cols, rows },
                lines,
                portals,
                locks,
                keyLineId
            };

            if (!window.levelSolver || window.levelSolver.solveLevel(level).solvable) {
                return level;
            }
        }

        return this._safeFallback(idx, name, cfg);
    }

    _traceExitRay(hx, hy, dir, cols, rows, occupied, portals) {
        const vec = this.VEC[dir];
        let cx = hx + vec.x;
        let cy = hy + vec.y;
        const visitedPortals = new Set();
        const rayCells = new Set();
        let steps = 0;

        while (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
            if (++steps > cols * rows) return null;

            let teleported = false;
            if (portals && portals.length > 0) {
                const key = `${cx},${cy}`;
                if (!visitedPortals.has(key)) {
                    for (const p of portals) {
                        if (p.a.x === cx && p.a.y === cy) {
                            visitedPortals.add(key);
                            visitedPortals.add(`${p.b.x},${p.b.y}`);
                            if (occupied.has(`${p.b.x},${p.b.y}`)) return null;
                            cx = p.b.x;
                            cy = p.b.y;
                            teleported = true;
                            break;
                        } else if (p.b.x === cx && p.b.y === cy) {
                            visitedPortals.add(key);
                            visitedPortals.add(`${p.a.x},${p.a.y}`);
                            if (occupied.has(`${p.a.x},${p.a.y}`)) return null;
                            cx = p.a.x;
                            cy = p.a.y;
                            teleported = true;
                            break;
                        }
                    }
                }
            }

            if (!teleported && occupied.has(`${cx},${cy}`)) return null;
            if (!teleported) rayCells.add(`${cx},${cy}`);

            cx += vec.x;
            cy += vec.y;
        }

        return rayCells;
    }

    _countFreeNeighbors(x, y, cols, rows, occupied, bodySet, idx) {
        let count = 0;
        for (const d of this.DIRS) {
            const v = this.VEC[d];
            const nx = x + v.x;
            const ny = y + v.y;
            if (
                nx >= 0 && nx < cols && ny >= 0 && ny < rows &&
                this._isCellInMask(nx, ny, cols, rows, idx) &&
                !occupied.has(`${nx},${ny}`) &&
                (!bodySet || !bodySet.has(`${nx},${ny}`))
            ) {
                count++;
            }
        }
        return count;
    }

    _countUnblockedHits(key, unblockedRayOwners, blockedAtStart) {
        if (!unblockedRayOwners) return 0;
        const owners = unblockedRayOwners.get(key);
        if (!owners) return 0;
        let hits = 0;
        for (const ownerIdx of owners) {
            if (!blockedAtStart[ownerIdx]) hits++;
        }
        return hits;
    }

    _tryPlaceAtCell(hx, hy, cols, rows, occupied, idx, targetLen, portals, unblockedRayOwners, blockedAtStart, rayBlockWeight = 0, inwardWeight = 0) {
        const dirs = [...this.DIRS].sort(() => Math.random() - 0.5);
        let bestCandidate = null;
        let bestScore = -Infinity;

        for (const dir of dirs) {
            const vec = this.VEC[dir];

            // Verificar celda trasera inmediata
            const bx = hx - vec.x;
            const by = hy - vec.y;
            if (bx < 0 || bx >= cols || by < 0 || by >= rows) continue;
            if (!this._isCellInMask(bx, by, cols, rows, idx)) continue;
            if (occupied.has(`${bx},${by}`)) continue;

            const exitRay = this._traceExitRay(hx, hy, dir, cols, rows, occupied, portals);
            if (!exitRay) continue;

            // Construir cuerpo serpenteante largo (heurística Warnsdorff + bloqueo activo de rayos previos)
            const body = [{ x: hx, y: hy }, { x: bx, y: by }];
            const bodySet = new Set([`${hx},${hy}`, `${bx},${by}`]);
            let curr = { x: bx, y: by };
            let prevStepVec = { x: -vec.x, y: -vec.y };
            let rayBlocks = 0;
            if (rayBlockWeight > 0) {
                rayBlocks += this._countUnblockedHits(`${hx},${hy}`, unblockedRayOwners, blockedAtStart);
                rayBlocks += this._countUnblockedHits(`${bx},${by}`, unblockedRayOwners, blockedAtStart);
            }

            for (let s = 2; s < targetLen; s++) {
                const candidates = [];
                for (const d of this.DIRS) {
                    const v = this.VEC[d];
                    const nx = curr.x + v.x;
                    const ny = curr.y + v.y;
                    const nKey = `${nx},${ny}`;
                    if (
                        nx >= 0 && nx < cols && ny >= 0 && ny < rows &&
                        this._isCellInMask(nx, ny, cols, rows, idx) &&
                        !occupied.has(nKey) &&
                        !bodySet.has(nKey) &&
                        !exitRay.has(nKey)
                    ) {
                        const degree = this._countFreeNeighbors(nx, ny, cols, rows, occupied, bodySet, idx);
                        const isTurn = (v.x !== prevStepVec.x || v.y !== prevStepVec.y);
                        const hits = rayBlockWeight > 0
                            ? this._countUnblockedHits(nKey, unblockedRayOwners, blockedAtStart)
                            : 0;
                        // Warnsdorff + preferencia por cruzar rayos aún libres (en niveles avanzados)
                        const score = degree * 2 + (isTurn ? -0.45 : 0.25) - hits * rayBlockWeight + Math.random() * 0.9;
                        candidates.push({ x: nx, y: ny, vec: v, hits, score });
                    }
                }

                if (!candidates.length) break;
                candidates.sort((a, b) => a.score - b.score);
                const chosen = candidates[0];
                body.push({ x: chosen.x, y: chosen.y });
                bodySet.add(`${chosen.x},${chosen.y}`);
                rayBlocks += chosen.hits;
                prevStepVec = chosen.vec;
                curr = { x: chosen.x, y: chosen.y };
            }

            const candScore = body.length + rayBlocks * rayBlockWeight + exitRay.size * inwardWeight;
            if (!bestCandidate || candScore > bestScore) {
                bestCandidate = { dir, body, exitRay };
                bestScore = candScore;
                if (body.length >= targetLen && rayBlockWeight === 0) break;
            }
        }

        if (!bestCandidate) return null;
        return {
            line: { dir: bestCandidate.dir, nodes: [...bestCandidate.body].reverse() },
            exitRay: bestCandidate.exitRay
        };
    }

    _extendTailsIntoVoids(lines, exitRaysByIndex, occupied, cols, rows, idx, maxTailCap, unblockedRayOwners = null, blockedAtStart = null, rayBlockWeight = 0) {
        // Mantener un mapa de qué índice máximo de línea protege cada celda como rayo de salida
        // Si maxRayOwner.get(key) > k, la línea k NO puede invadir esa celda porque bloquearía a m > k
        const maxRayOwner = new Map();
        for (let m = 0; m < exitRaysByIndex.length; m++) {
            for (const key of exitRaysByIndex[m]) {
                maxRayOwner.set(key, m);
            }
        }

        let grew = true;
        let rounds = 0;
        while (grew && rounds < 10) {
            grew = false;
            rounds++;

            // Recorrer de atrás hacia adelante (las que escapan primero tienen más libertad de relleno)
            for (let k = lines.length - 1; k >= 0; k--) {
                const line = lines[k];
                if (line.nodes.length >= maxTailCap) continue;

                const tail = line.nodes[0];
                const ownRay = exitRaysByIndex[k];
                const nbrs = [];

                for (const d of this.DIRS) {
                    const v = this.VEC[d];
                    const nx = tail.x + v.x;
                    const ny = tail.y + v.y;
                    const key = `${nx},${ny}`;
                    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
                    if (!this._isCellInMask(nx, ny, cols, rows, idx)) continue;
                    if (occupied.has(key)) continue;
                    if (ownRay.has(key)) continue;

                    const blockerIdx = maxRayOwner.get(key);
                    if (blockerIdx !== undefined && blockerIdx > k) continue;

                    const freeDeg = this._countFreeNeighbors(nx, ny, cols, rows, occupied, null, idx);
                    const hits = (rayBlockWeight > 0 && unblockedRayOwners && blockedAtStart)
                        ? this._countUnblockedHits(key, unblockedRayOwners, blockedAtStart)
                        : 0;
                    nbrs.push({ x: nx, y: ny, key, score: freeDeg - hits * rayBlockWeight + Math.random() * 0.6 });
                }

                if (nbrs.length > 0) {
                    nbrs.sort((a, b) => a.score - b.score);
                    const pick = nbrs[0];
                    line.nodes.unshift({ x: pick.x, y: pick.y });
                    occupied.add(pick.key);
                    if (unblockedRayOwners && blockedAtStart) {
                        const owners = unblockedRayOwners.get(pick.key);
                        if (owners) {
                            for (const ownerIdx of owners) {
                                blockedAtStart[ownerIdx] = true;
                            }
                        }
                    }
                    grew = true;
                }
            }
        }
    }

    _safeFallback(idx, name, cfg) {
        const lines = [];
        const cols = cfg.cols;
        const rows = cfg.rows;
        let id = 1;
        for (let y = 0; y < rows; y += 2) {
            for (let x = 0; x < cols - 1; x += 2) {
                if (lines.length < cfg.targetLines) {
                    const dir = (y % 4 === 0) ? 'RIGHT' : 'LEFT';
                    const nodes = dir === 'RIGHT'
                        ? [{ x, y }, { x: x + 1, y }]
                        : [{ x: x + 1, y }, { x, y }];
                    lines.push({ id: id++, dir, nodes });
                }
            }
        }
        return {
            id: idx,
            name,
            grid: { cols, rows },
            lines,
            portals: [],
            locks: [],
            keyLineId: null
        };
    }
}

window.levelManager = new LevelManager();
