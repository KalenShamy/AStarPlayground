let rows = 12;
    let cols = 25;

    let grid: {setting, gCost, hCost, fCost, looked}[][];

    let start;
    let end;

    function resetGrid() {
        grid = Array(Number(cols)).fill(0).map(() => Array(Number(rows)).fill(0).map(() => ({"setting": 0})));
        start = undefined;
        end = undefined;
    }

    function randomizeGrid() {
        resetGrid();
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (Math.random() < 0.5) {
                    grid[i][j].setting = 1;
                }
            }
        }
    }

    function removeExtras() {
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                grid[i][j].looked = undefined;
                grid[i][j].gCost = undefined;
                grid[i][j].hCost = undefined;
                grid[i][j].fCost = undefined;
                grid[i][j].setting === 4 ? grid[i][j].setting = 0 : null;
            }
        }
        if (start) {
            grid[start[0]][start[1]].setting = 2;
        }
        if (end) {
            grid[end[0]][end[1]].setting = 3;
        }
    }

    function toggleCell(col, row) {
        removeExtras();
        if (grid[col][row].setting === 3 || (grid[col][row].setting === 2 && end) || (grid[col][row].setting === 1 && start && end)) {
            if (grid[col][row].setting === 3) {
                // if was end, clear variable
                end = undefined;
            } else if (grid[col][row].setting === 2) {
                // if was start, clear variable
                start = undefined;
            }
            grid[col][row].setting = 0;
        } else if (grid[col][row].setting === 0) {
            // if was empty, make obstacle
            grid[col][row].setting = 1;
        } else if (grid[col][row].setting === 1 && !start) {
            // if was an obstacle, make start
            grid[col][row].setting = 2;
            start = [col, row];
        } else if ((grid[col][row].setting === 2 || (grid[col][row].setting === 1 && start)) && !end) {
            // if was start or obstacle (and start existed), make end
            if (grid[col][row].setting === 2) {
                // if was start, clear variable
                start = undefined;
            }
            grid[col][row].setting = 3;
            end = [col, row];
        }
    }

    function getNeighbors(col, row) {
        const neighbors = [];
        if (col > 0 && grid[col - 1][row].setting !== 1) {
            neighbors.push([col - 1, row, false]);
        }
        if (col < cols - 1 && grid[col + 1][row].setting !== 1) {
            neighbors.push([col + 1, row, false]);
        }
        if (row > 0 && grid[col][row - 1].setting !== 1) {
            neighbors.push([col, row - 1, false]);
        }
        if (row < rows - 1 && grid[col][row + 1].setting !== 1) {
            neighbors.push([col, row + 1, false]);
        }
        if (col > 0 && row > 0 && grid[col - 1][row - 1].setting !== 1) {
            neighbors.push([col - 1, row - 1, true]);
        }
        if (col < cols - 1 && row > 0 && grid[col + 1][row - 1].setting !== 1) {
            neighbors.push([col + 1, row - 1, true]);
        }
        if (col > 0 && row < rows - 1 && grid[col - 1][row + 1].setting !== 1) {
            neighbors.push([col - 1, row + 1, true]);
        }
        if (col < cols - 1 && row < rows - 1 && grid[col + 1][row + 1].setting !== 1) {
            neighbors.push([col + 1, row + 1, true]);
        }
        for (let i = 0; i < neighbors.length; i++) {
            if (grid[neighbors[i][0]][neighbors[i][1]].setting === 2 || grid[neighbors[i][0]][neighbors[i][1]].setting === 3) {
                continue;
            }
            if (grid[neighbors[i][0]][neighbors[i][1]].looked === "Closed") {
                continue;
            }
            grid[neighbors[i][0]][neighbors[i][1]].looked = "Open";
        }
        return neighbors;
    }

    function getDistance(col, row) {
        return 14 * Math.min(Math.abs(col - end[0]), Math.abs(row - end[1])) + 10 * Math.abs(Math.abs(col - end[0]) - Math.abs(row - end[1]));
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function findPath() {
        removeExtras();
        if (start && end) {
            let openSet = [start];
            let closedSet = [];
            let cameFrom = {};

            grid[start[0]][start[1]].gCost = 0;
            grid[start[0]][start[1]].hCost = getDistance(start[0], start[1]);
            grid[start[0]][start[1]].fCost = grid[start[0]][start[1]].gCost + grid[start[0]][start[1]].hCost;

            while (openSet.length > 0) {
                let lowestIndex = 0;
                for (let i = openSet.length-1; i > 0; i--) {
                    if (grid[openSet[i][0]][openSet[i][1]].fCost < grid[openSet[lowestIndex][0]][openSet[lowestIndex][1]].fCost) {
                        lowestIndex = i;
                    }
                }
                let current = openSet[lowestIndex];

                if (current[0] === end[0] && current[1] === end[1]) {
                    // found path
                    let path = [current];
                    while (cameFrom[current.join(",")]) {
                        current = cameFrom[current.join(",")];
                        path.push(current);
                    }
                    path.reverse();
                    for (let i = 0; i < path.length; i++) {
                        grid[path[i][0]][path[i][1]].setting = 4;
                    }
                    break;
                }

                openSet.splice(lowestIndex, 1);
                closedSet.push(current);
                if (grid[current[0]][current[1]].setting != 2) {
                    grid[current[0]][current[1]].looked = "Closed";
                }

                const neighbors = getNeighbors(current[0], current[1]);
                await sleep(20);
                for (let i = 0; i < neighbors.length; i++) {
                    const neighbor = neighbors[i];

                    if (closedSet.find((e) => e[0] === neighbor[0] && e[1] === neighbor[1])) {
                        continue;
                    }

                    const tempGCost = grid[current[0]][current[1]].gCost + ((!neighbor[2] && 10) || 14);
                    if (openSet.find((e) => e[0] === neighbor[0] && e[1] === neighbor[1])) {
                        if (tempGCost >= grid[neighbor[0]][neighbor[1]].gCost) {
                            continue;
                        }
                    } else {
                        openSet.push(neighbor);
                    }

                    cameFrom[neighbor.join(",")] = current;
                    grid[neighbor[0]][neighbor[1]].gCost = tempGCost;
                    grid[neighbor[0]][neighbor[1]].hCost = getDistance(neighbor[0], neighbor[1]);
                    grid[neighbor[0]][neighbor[1]].fCost = grid[neighbor[0]][neighbor[1]].gCost + grid[neighbor[0]][neighbor[1]].hCost;
                }
            }
        }
    }

    resetGrid();