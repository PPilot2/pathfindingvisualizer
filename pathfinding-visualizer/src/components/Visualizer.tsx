"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

export type NodeType = {
  row: number;
  col: number;
  isStart: boolean;
  isTarget: boolean;
  isWall: boolean;
  distance: number;
  f?: number;
  g?: number;
  h?: number;
  visited: boolean;
  previous: NodeType | null;
  isPath?: boolean;
};

const DEFAULT_ROWS = 20;
const DEFAULT_COLS = 40;
const START_POS = { row: 10, col: 8 };
const TARGET_POS = { row: 10, col: 30 };

function createNode(
  row: number,
  col: number,
  start = false,
  target = false
): NodeType {
  return {
    row,
    col,
    isStart: start,
    isTarget: target,
    isWall: false,
    distance: Infinity,
    visited: false,
    previous: null,
  };
}

function createGrid(
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  startPos = START_POS,
  targetPos = TARGET_POS
) {
  const grid: NodeType[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: NodeType[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(
        createNode(
          r,
          c,
          r === startPos.row && c === startPos.col,
          r === targetPos.row && c === targetPos.col
        )
      );
    }
    grid.push(row);
  }
  return grid;
}

const cloneGrid = (grid: NodeType[][]) =>
  grid.map((row) => row.map((n) => ({ ...n })));

const neighbors = (grid: NodeType[][], node: NodeType) => {
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  const result: NodeType[] = [];
  for (const [dr, dc] of dirs) {
    const r = node.row + dr,
      c = node.col + dc;
    if (r >= 0 && c >= 0 && r < grid.length && c < grid[0].length)
      result.push(grid[r][c]);
  }
  return result;
};
// Breadth-First Search (BFS)
function bfs(grid: NodeType[][], start: NodeType, target: NodeType) {
  const visitedOrder: NodeType[] = [];
  const gridClone = cloneGrid(grid);
  const startNode = gridClone[start.row][start.col];
  const targetNode = gridClone[target.row][target.col];
  const queue: NodeType[] = [startNode];
  startNode.visited = true;

  while (queue.length) {
    const node = queue.shift()!;
    visitedOrder.push(node);
    if (node.row === targetNode.row && node.col === targetNode.col) break;

    for (const nbr of neighbors(gridClone, node)) {
      if (!nbr.visited && !nbr.isWall) {
        nbr.visited = true;
        nbr.previous = node;
        queue.push(nbr);
      }
    }
  }

  const path: NodeType[] = [];
  let cur: NodeType | null = gridClone[targetNode.row][targetNode.col];
  while (cur) {
    path.unshift(cur);
    cur = cur.previous;
  }

  return { visitedOrder, path };
}

// Depth-First Search (DFS)
function dfs(grid: NodeType[][], start: NodeType, target: NodeType) {
  const visitedOrder: NodeType[] = [];
  const gridClone = cloneGrid(grid);
  const startNode = gridClone[start.row][start.col];
  const targetNode = gridClone[target.row][target.col];
  const stack: NodeType[] = [startNode];

  while (stack.length) {
    const node = stack.pop()!;
    if (node.visited || node.isWall) continue;
    node.visited = true;
    visitedOrder.push(node);
    if (node.row === targetNode.row && node.col === targetNode.col) break;

    for (const nbr of neighbors(gridClone, node)) {
      if (!nbr.visited && !nbr.isWall) {
        nbr.previous = node;
        stack.push(nbr);
      }
    }
  }

  const path: NodeType[] = [];
  let cur: NodeType | null = gridClone[targetNode.row][targetNode.col];
  while (cur) {
    path.unshift(cur);
    cur = cur.previous;
  }

  return { visitedOrder, path };
}

// Dijkstra
function dijkstra(grid: NodeType[][], start: NodeType, target: NodeType) {
  const visitedOrder: NodeType[] = [];
  const gridClone = cloneGrid(grid);
  const startNode = gridClone[start.row][start.col];
  const targetNode = gridClone[target.row][target.col];
  startNode.distance = 0;
  const unvisited = gridClone.flat();

  while (unvisited.length) {
    unvisited.sort((a, b) => a.distance - b.distance);
    const node = unvisited.shift()!;
    if (node.isWall) continue;
    if (node.distance === Infinity) break;
    node.visited = true;
    visitedOrder.push(node);
    if (node.row === targetNode.row && node.col === targetNode.col) break;

    for (const nbr of neighbors(gridClone, node)) {
      if (nbr.visited || nbr.isWall) continue;
      const newDist = node.distance + 1;
      if (newDist < nbr.distance) {
        nbr.distance = newDist;
        nbr.previous = node;
      }
    }
  }

  const path: NodeType[] = [];
  let cur: NodeType | null = gridClone[targetNode.row][targetNode.col];
  while (cur) {
    path.unshift(cur);
    cur = cur.previous;
  }
  return { visitedOrder, path };
}

// A*
const heuristic = (a: NodeType, b: NodeType) =>
  Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

function aStar(grid: NodeType[][], start: NodeType, target: NodeType) {
  const visitedOrder: NodeType[] = [];
  const gridClone = cloneGrid(grid);
  const startNode = gridClone[start.row][start.col];
  const targetNode = gridClone[target.row][target.col];

  const openSet: NodeType[] = [startNode];
  startNode.g = 0;
  startNode.h = heuristic(startNode, targetNode);
  startNode.f = startNode.h;

  while (openSet.length) {
    openSet.sort((a, b) => (a.f || Infinity) - (b.f || Infinity));
    const current = openSet.shift()!;
    if (current.isWall) continue;
    current.visited = true;
    visitedOrder.push(current);

    if (current.row === targetNode.row && current.col === targetNode.col) break;

    for (const nbr of neighbors(gridClone, current)) {
      if (nbr.isWall) continue;
      const tempG = (current.g || 0) + 1;
      if (tempG < (nbr.g ?? Infinity)) {
        nbr.previous = current;
        nbr.g = tempG;
        nbr.h = heuristic(nbr, targetNode);
        nbr.f = nbr.g + nbr.h;
        if (!openSet.includes(nbr)) openSet.push(nbr);
      }
    }
  }

  const path: NodeType[] = [];
  let cur: NodeType | null = gridClone[targetNode.row][targetNode.col];
  while (cur) {
    path.unshift(cur);
    cur = cur.previous;
  }
  return { visitedOrder, path };
}

export function animate(
  visited: NodeType[],
  path: NodeType[],
  onVisit: (n: NodeType, index: number) => void,
  onPath: (n: NodeType) => void,
  speed = 10,
  timeoutsRef?: React.MutableRefObject<number[]>
) {
  if (timeoutsRef) {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  visited.forEach((n, i) => {
    const t = window.setTimeout(() => onVisit(n, i), i * speed);
    timeoutsRef?.current.push(t);
  });

  path.forEach((n, i) => {
    const t = window.setTimeout(() => onPath(n), (visited.length + i) * speed);
    timeoutsRef?.current.push(t);
  });
}

export default function Visualizer() {
  const [grid, setGrid] = useState(() => createGrid());
  const [placing, setPlacing] = useState<"wall" | "start" | "target">("wall");
  const [activeButton, setActiveButton] = useState<
    "wall" | "start" | "target" | "dijkstra" | "astar" | "bfs" | "dfs" | null
  >("wall");
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(15);
  const [start, setStart] = useState(START_POS);
  const [target, setTarget] = useState(TARGET_POS);
  const timeoutsRef = useRef<number[]>([]);
  const soundThrottle = Math.max(1, Math.floor(speed / 10));

  const blockSound =
    typeof Audio !== "undefined" ? new Audio("/blockplace.mp3") : null;

  // AudioContext reference
  // Ref for single AudioContext instance
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ref for sound toggle
  const soundEnabledRef = useRef(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Lazily create or resume the AudioContext
  function getAudioCtx() {
    if (!audioCtxRef.current && typeof AudioContext !== "undefined") {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current?.state === "suspended") {
      // Resume only in response to user gesture
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }

  function playBeep(frequency = 400, duration = 50, volume = 0.08) {
    if (!soundEnabledRef.current) return;

    const audioCtx = getAudioCtx();
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }

  const modeRef = useRef(placing);
  const runningRef = useRef(running);
  useEffect(() => {
    modeRef.current = placing;
  }, [placing]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const handleMouseDown = (r: number, c: number) => {
    if (runningRef.current) return;
    setIsMouseDown(true);
    setGrid((g) => {
      const copy = cloneGrid(g);
      const node = copy[r][c];
      if (modeRef.current === "wall") node.isWall = !node.isWall;
      else if (modeRef.current === "start") {
        copy[start.row][start.col].isStart = false;
        node.isStart = true;
        setStart({ row: r, col: c });
      } else {
        copy[target.row][target.col].isTarget = false;
        node.isTarget = true;
        setTarget({ row: r, col: c });
      }
      return copy;
    });
  };
  const fullReset = useCallback(() => {
    setStart(START_POS);
    setTarget(TARGET_POS);
    setGrid(createGrid(DEFAULT_ROWS, DEFAULT_COLS, START_POS, TARGET_POS));
  }, []);

  const handleMouseEnter = (r: number, c: number) => {
    if (!isMouseDown || runningRef.current || modeRef.current !== "wall")
      return;
    setGrid((g) => {
      const copy = cloneGrid(g);
      copy[r][c].isWall = true;
      return copy;
    });
  };

  const handleMouseUp = () => setIsMouseDown(false);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setRunning(false);
    setGrid(createGrid(DEFAULT_ROWS, DEFAULT_COLS, start, target));
  }, [start, target]);

  const clearPaths = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setRunning(false);

    setGrid((prev) =>
      cloneGrid(prev).map((row) =>
        row.map((n) => ({
          ...n,
          visited: false,
          isPath: false,
          previous: null,
          distance: Infinity,
          f: undefined,
          g: undefined,
          h: undefined,
        }))
      )
    );
  }, []);

  const randomMaze = useCallback(() => {
  clearPaths(); 

  setGrid((g) =>
    cloneGrid(g).map((row) =>
      row.map((n) => ({
        ...n,
        isWall: !n.isStart && !n.isTarget && Math.random() < 0.25,
      }))
    )
  );
}, [clearPaths]);


  const runAlgorithm = useCallback(
    (type: "dijkstra" | "astar" | "bfs" | "dfs") => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      setRunning(false);
      setElapsedTime(null);
      setGrid((prev) => {
        const base = cloneGrid(prev).map((row) =>
          row.map((n) => ({
            ...n,
            visited: false,
            isPath: false,
            previous: null,
            distance: Infinity,
            f: undefined,
            g: undefined,
            h: undefined,
          }))
        );

        const startNode = base[start.row][start.col];
        const targetNode = base[target.row][target.col];

        let result;
        if (type === "dijkstra") result = dijkstra(base, startNode, targetNode);
        else if (type === "astar") result = aStar(base, startNode, targetNode);
        else if (type === "bfs") result = bfs(base, startNode, targetNode);
        else result = dfs(base, startNode, targetNode);

        const visit = (n: NodeType, index: number) =>
          setGrid((prev) => {
            const c = cloneGrid(prev);
            const node = c[n.row][n.col];
            if (!node.isStart && !node.isTarget && !node.isWall) {
              node.visited = true;
              if (index % soundThrottle === 0) {
                playBeep(400, 30);
              }
            }
            return c;
          });

        const path = (n: NodeType) =>
          setGrid((prev) => {
            const c = cloneGrid(prev);
            const node = c[n.row][n.col];
            if (!node.isStart && !node.isTarget) {
              node.isPath = true;
              if (Math.random() < 0.5) playBeep(600, 30);
            }
            return c;
          });

        const delay = 70 - speed;
        const startTime = performance.now();
        animate(
          result.visitedOrder,
          result.path,
          (n, i) => visit(n, i),
          (n) => path(n),
          delay,
          timeoutsRef
        );

        setRunning(true);
        setTimeout(() => {
          setRunning(false);
          const endTime = performance.now();
          setElapsedTime(endTime - startTime);
        }, (result.visitedOrder.length + result.path.length) * delay + 50);

        return base;
      });

      setActiveButton(type);
    },
    [start, target, speed]
  );

  const cellClass = (n: NodeType) => {
    const base = "w-6 h-6 md:w-8 md:h-8 border border-gray-200";
    if (n.isStart) return base + " bg-green-500";
    if (n.isTarget) return base + " bg-red-500";
    if (n.isPath) return base + " bg-yellow-400";
    if (n.isWall) return base + " bg-gray-800";
    if (n.visited) return base + " bg-blue-300";
    return base + " bg-white";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold mt-4 text-black">
        Pathfinding Visualizer
      </h1>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => {
            setPlacing("wall");
            setActiveButton("wall");
          }}
          className={`px-3 py-1 rounded ${
            activeButton === "wall" ? "bg-sky-700 text-white" : "bg-sky-500"
          }`}
        >
          Walls
        </button>

        <button
          onClick={() => {
            setPlacing("start");
            setActiveButton("start");
          }}
          className={`px-3 py-1 rounded ${
            activeButton === "start"
              ? "bg-green-700 text-white"
              : "bg-green-500"
          }`}
        >
          Start
        </button>

        <button
          onClick={() => {
            setPlacing("target");
            setActiveButton("target");
          }}
          className={`px-3 py-1 rounded ${
            activeButton === "target" ? "bg-red-700 text-white" : "bg-red-500"
          }`}
        >
          Target
        </button>

        <button
          disabled={running}
          onClick={() => {
            runAlgorithm("dijkstra");
            setActiveButton("dijkstra");
          }}
          className={`px-3 py-1 rounded ${
            activeButton === "dijkstra"
              ? "bg-indigo-700 text-white"
              : "bg-indigo-500"
          }`}
        >
          Dijkstra
        </button>

        <button
          disabled={running}
          onClick={() => {
            runAlgorithm("astar");
            setActiveButton("astar");
          }}
          className={`px-3 py-1 rounded ${
            activeButton === "astar"
              ? "bg-amber-700 text-white"
              : "bg-amber-500"
          }`}
        >
          A*
        </button>

        <button
          disabled={running}
          onClick={() => {
            runAlgorithm("bfs");
            setActiveButton("bfs");
          }}
          className={`px-3 py-1 rounded ${
            activeButton === "bfs" ? "bg-teal-700 text-white" : "bg-teal-500"
          }`}
        >
          BFS
        </button>

        <button
          disabled={running}
          onClick={() => {
            runAlgorithm("dfs");
            setActiveButton("dfs");
          }}
          className={`px-3 py-1 rounded ${
            activeButton === "dfs" ? "bg-pink-700 text-white" : "bg-pink-500"
          }`}
        >
          DFS
        </button>

        <button
          onClick={clearPaths}
          className="px-3 py-1 rounded bg-yellow-600"
        >
          Clear Paths
        </button>
        <button
          onClick={clearAll}
          className="px-3 py-1 rounded bg-red-600 hover:bg-red-900"
        >
          Reset
        </button>
        <button onClick={randomMaze} className="px-3 py-1 rounded bg-blue-500">
          Random Maze
        </button>
        <label className="flex items-center gap-2">
          <span className="text-black">Speed</span>
          <input
            type="range"
            min={10}
            max={60}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </label>
        <button
          onClick={() => setSoundEnabled((prev) => !prev)}
          className={`px-3 py-1 rounded ${
            soundEnabled ? "bg-green-700 text-white" : "bg-gray-500 text-white"
          }`}
        >
          {soundEnabled ? "Sound On" : "Sound Off"}
        </button>

        {elapsedTime !== null && (
          <div className="mt-2 text-sm text-gray-700">
            Time to target: {(elapsedTime / 1000).toFixed(3)} s
          </div>
        )}
      </div>

      <div
        className="mt-4 grid select-none"
        style={{
          gridTemplateColumns: `repeat(${DEFAULT_COLS}, minmax(0, 1fr))`,
        }}
        onMouseLeave={handleMouseUp}
      >
        {grid.map((row, r) =>
          row.map((n, c) => (
            <div
              key={`${r}-${c}`}
              className={cellClass(n)}
              onMouseDown={() => handleMouseDown(r, c)}
              onMouseEnter={() => handleMouseEnter(r, c)}
              onMouseUp={handleMouseUp}
            />
          ))
        )}
      </div>
    </div>
  );
}
