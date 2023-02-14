<script lang="ts">
	import Checkbox from "../lib/components/Checkbox.svelte";

    let help = false;

    let rows = 6;
    let cols = 6;

    let temp_cols = cols;
    let temp_rows = rows;

    let grid: {setting: number, gCost?: number, hCost?:  number, fCost?:  number, looked?: string, from?: string}[][];

    let start: [number, number] | undefined;
    let end: [number, number] | undefined;

    let diagonals = true;

    function resizeGrid() {
        if (parseInt(temp_rows) != temp_rows || parseInt(temp_cols) != temp_cols) {
            return;
        }
        rows = temp_rows;
        cols = temp_cols;
        resetGrid();
    }

    function resetGrid() {
        if (pathRunning) {
            breakPath = true;
        }
        grid = Array(Number(cols)).fill(0).map(() => Array(Number(rows)).fill(0).map(() => ({"setting": 0})));
        start = undefined;
        end = undefined;
    }

    function randomizeGrid() {
        resetGrid();
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (Math.random() < ((diagonals && 0.5) || 0.3)) {
                    grid[i][j].setting = 1;
                }
            }
        }
    }

    let breakPath = false;
    let pathRunning = false;

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
        if (pathRunning) {
            breakPath = true;
        }
    }

    function toggleCell(col: number, row: number) {
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

    function getNeighbors(col: number, row: number) {
        const neighbors: [number, number, boolean][] = [];
        const adjacentBoxes: [number, number, boolean][] = [
            [col - 1, row, false],
            [col + 1, row, false],
            [col, row - 1, false],
            [col, row + 1, false]
        ];
        const diagonalBoxes: [number, number, boolean][] = [
            [col - 1, row - 1, true],
            [col + 1, row - 1, true],
            [col - 1, row + 1, true],
            [col + 1, row + 1, true]
        ];

        for (let i = 0; i < adjacentBoxes.length; i++) {
            const box = adjacentBoxes[i];
            if (grid[box[0]] && grid[box[0]][box[1]] && grid[box[0]][box[1]].setting !== 1) {
                neighbors.push(box);
            }
        }

        if (diagonals) {
            for (let i = 0; i < diagonalBoxes.length; i++) {
                const box = diagonalBoxes[i];
                if (grid[box[0]] && grid[box[0]][box[1]] && grid[box[0]][box[1]].setting !== 1) {
                    neighbors.push(box);
                }
            }
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

    function getDistance(col: number, row: number) {
        if (diagonals) {
            return 14 * Math.min(Math.abs(col - end[0]), Math.abs(row - end[1])) + 10 * Math.abs(Math.abs(col - end[0]) - Math.abs(row - end[1]));
        } else {
            return 10 * (Math.abs(col - end[0]) + Math.abs(row - end[1]));
        }
    }

    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function findPath() {
        if (pathRunning) {
            return;
        }
        removeExtras();
        pathRunning = true;
        if (start && end) {
            let openSet: [number, number][] = [start];
            let closedSet: [number, number][] = [];
            let cameFrom: {[key: string]: [number, number]} = {};

            grid[start[0]][start[1]].gCost = 0;
            grid[start[0]][start[1]].hCost = getDistance(start[0], start[1]);
            grid[start[0]][start[1]].fCost = grid[start[0]][start[1]].gCost + grid[start[0]][start[1]].hCost;

            while (openSet.length > 0 && !Boolean(await sleep(20)) && !breakPath) {
                let lowestIndex = 0;
                let closestIndex = undefined;
                for (let i = openSet.length-1; i > 0; i--) {
                    if (grid[openSet[i][0]][openSet[i][1]].fCost < grid[openSet[lowestIndex][0]][openSet[lowestIndex][1]].fCost) {
                        lowestIndex = i;
                        closestIndex = undefined;
                    }
                    if ((!closestIndex || grid[openSet[i][0]][openSet[i][1]].hCost < grid[openSet[closestIndex][0]][openSet[closestIndex][1]].hCost) && grid[openSet[i][0]][openSet[i][1]].fCost === grid[openSet[lowestIndex][0]][openSet[lowestIndex][1]].fCost) {
                        closestIndex = i;
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
                        openSet.push([neighbor[0], neighbor[1]]);
                    }

                    if (grid[neighbor[0]][neighbor[1]].fCost != undefined) {
                        if (tempGCost + getDistance(neighbor[0], neighbor[1]) >= grid[neighbor[0]][neighbor[1]].fCost) {
                            continue;
                        }
                    }
                    cameFrom[[neighbor[0], neighbor[1]].join(",")] = current;
                    grid[neighbor[0]][neighbor[1]].gCost = tempGCost;
                    grid[neighbor[0]][neighbor[1]].hCost = getDistance(neighbor[0], neighbor[1]);
                    grid[neighbor[0]][neighbor[1]].fCost = grid[neighbor[0]][neighbor[1]].gCost + grid[neighbor[0]][neighbor[1]].hCost;
                    grid[neighbor[0]][neighbor[1]].from = current.join(",");
                }
            }
        }
        pathRunning = false;
        breakPath = false;
    }

    resetGrid();
</script>

<input type="text" id="cols" bind:value={temp_cols} on:input={resizeGrid}>
x
<input type="text" id="rows" bind:value={temp_rows} on:input={resizeGrid}>
&nbsp;
<button on:click={findPath}>Shortest Path</button>
<button on:click={removeExtras}>Clear Extras</button>
<button on:click={resetGrid}>Clear Grid</button>
<button on:click={randomizeGrid}>Randomize Grid</button>
<Checkbox bind:checked={diagonals}>Diagonals</Checkbox>
<button class="helpButton" on:click={() => help = true}>?</button>

{#if help}
    <div class="helpPopup">
        <div class="popupContents">
            <h1>
                Help
                <button class="helpButton" style="position:absolute;top:0;right:0;" on:click={() => help = false}>X</button>
            </h1>
            <p>Click on or drag over a cell to toggle it between empty, wall, start, and end blocks.</p>
            <p>Click <button>Shortest Path</button> to find the shortest path between the start and end.</p>
            <p>Click <button>Clear Extras</button> to clear the path and the cell values.</p>
            <p>Click <button>Clear Grid</button> to clear the grid.</p>
            <p>Click <button>Randomize Grid</button> to randomize the grid.</p>
            <p>Click <Checkbox checked={false}>Diagonals</Checkbox> to toggle whether or not diagonals can be traversed.</p>
            <p>Click <button class="helpButton">?</button> to toggle this help popup.</p>
            <p>Click <button class="helpButton">X</button> to close this popup.</p>
        </div>
    </div>
{/if}

<div class="grid">
    {#each Array(Number(cols)).fill(0) as _, col}
        <div class="col">
            {#each Array(Number(rows)).fill(0) as _, row}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="row setting{grid[col][row].setting} {grid[col][row].looked && 'looked'}{grid[col][row].looked}" draggable="true" on:dragstart={event => {event.dataTransfer.dropEffect = "link"; event.dataTransfer?.setDragImage(document.createElement("span"), 0, 0)}} on:click={() => {toggleCell(col, row)}} on:dragenter={() => {toggleCell(col, row)}}>
                    {(grid[col][row].setting === 2 && "S") || ""}
                    {(grid[col][row].setting === 3 && "E") || ""}
                    {grid[col][row].fCost || ""}
                    {#if grid[col][row].fCost}
                        <span class="tooltip">Is: {col},{row}<br>From: {grid[col][row].from}<br>G Cost: {grid[col][row].gCost}<br>H Cost: {grid[col][row].hCost}</span>
                    {/if}
                </div>
            {/each}
        </div>
    {/each}
</div>