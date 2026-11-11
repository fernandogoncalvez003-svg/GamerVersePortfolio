class LevelSolver {
    /**
     * Checks if a specific line can escape the grid without colliding with any other active line.
     */
    canLineEscape(targetLine, activeLines, gridCols, gridRows, levelData = {}) {
        if (!targetLine || targetLine.cleared) return false;

        const head = targetLine.nodes[targetLine.nodes.length - 1];
        const dirMap = {
            'UP': { dx: 0, dy: -1 },
            'DOWN': { dx: 0, dy: 1 },
            'LEFT': { dx: -1, dy: 0 },
            'RIGHT': { dx: 1, dy: 0 }
        };

        const vector = dirMap[targetLine.dir];
        if (!vector) return false;

        let curX = head.x + vector.dx;
        let curY = head.y + vector.dy;

        // Build occupancy map of all other active lines
        const occupied = new Set();
        activeLines.forEach(line => {
            if (line.id !== targetLine.id && !line.cleared) {
                line.nodes.forEach(node => {
                    occupied.add(`${node.x},${node.y}`);
                });
            }
        });

        // Key / Lock logic: if the key line is still active, locks behave as solid blockages
        const keyLineId = levelData.keyLineId;
        const locks = levelData.locks || [];
        const keyActive = keyLineId !== undefined && keyLineId !== null && activeLines.some(l => l.id === keyLineId && !l.cleared);
        
        if (keyActive && locks.length > 0) {
            locks.forEach(lock => {
                occupied.add(`${lock.x},${lock.y}`);
            });
        }

        const portals = levelData.portals || [];
        const visitedPortals = new Set(); // Prevent infinite cycles
        let steps = 0;

        // Trace raycast out of grid
        while (curX >= 0 && curX < gridCols && curY >= 0 && curY < gridRows) {
            if (++steps > gridCols * gridRows) return false;
            // Portal Teleportation logic
            if (portals.length > 0) {
                const coordKey = `${curX},${curY}`;
                if (!visitedPortals.has(coordKey)) {
                    for (const portal of portals) {
                        if (portal.a.x === curX && portal.a.y === curY) {
                            visitedPortals.add(coordKey);
                            visitedPortals.add(`${portal.b.x},${portal.b.y}`);
                            if (occupied.has(`${portal.b.x},${portal.b.y}`)) {
                                return false;
                            }
                            curX = portal.b.x;
                            curY = portal.b.y;
                            break;
                        } else if (portal.b.x === curX && portal.b.y === curY) {
                            visitedPortals.add(coordKey);
                            visitedPortals.add(`${portal.a.x},${portal.a.y}`);
                            if (occupied.has(`${portal.a.x},${portal.a.y}`)) {
                                return false;
                            }
                            curX = portal.a.x;
                            curY = portal.a.y;
                            break;
                        }
                    }
                }
            }

            if (occupied.has(`${curX},${curY}`)) {
                return false; // Blocked by another line or lock
            }

            curX += vector.dx;
            curY += vector.dy;
        }

        return true; // Reached outside grid safely!
    }

    /**
     * Finds the next line ID that can escape (used for Hints).
     */
    findNextHintLine(lines, gridCols, gridRows, levelData = {}) {
        const activeLines = lines.filter(l => !l.cleared);
        for (const line of activeLines) {
            if (this.canLineEscape(line, activeLines, gridCols, gridRows, levelData)) {
                return line.id;
            }
        }
        return null;
    }

    /**
     * Finds a sequence of correct moves up to count.
     */
    findHintSequence(lines, gridCols, gridRows, count, levelData = {}) {
        const activeLines = JSON.parse(JSON.stringify(lines));
        activeLines.forEach(l => l.cleared = false);
        
        const seq = [];
        let progress = true;
        while (progress && seq.length < count) {
            progress = false;
            for (let i = 0; i < activeLines.length; i++) {
                const line = activeLines[i];
                if (!line.cleared && this.canLineEscape(line, activeLines, gridCols, gridRows, levelData)) {
                    line.cleared = true;
                    seq.push(line.id);
                    progress = true;
                    break;
                }
            }
        }
        return seq;
    }

    /**
     * Verifies if a complete level configuration can be 100% solved.
     */
    solveLevel(levelData) {
        const gridCols = levelData.grid.cols;
        const gridRows = levelData.grid.rows;
        
        // Deep clone lines
        let activeLines = JSON.parse(JSON.stringify(levelData.lines));
        activeLines.forEach(l => l.cleared = false);

        let progress = true;
        while (progress) {
            progress = false;
            for (let i = 0; i < activeLines.length; i++) {
                const line = activeLines[i];
                if (!line.cleared && this.canLineEscape(line, activeLines, gridCols, gridRows, levelData)) {
                    line.cleared = true;
                    progress = true;
                    break; // Restart scan after removing a line
                }
            }
        }

        const remaining = activeLines.filter(l => !l.cleared).length;
        const isSolvable = remaining === 0;

        return {
            solvable: isSolvable,
            remainingCount: remaining,
            totalCount: activeLines.length
        };
    }
}

window.levelSolver = new LevelSolver();
